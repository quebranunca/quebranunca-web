import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EditarPartidaRegistradaModal } from '../components/partidas/EditarPartidaRegistradaModal';
import { MinhasPartidasRegistradasLista } from '../components/partidas/MinhasPartidasRegistradasLista';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { partidasServico } from '../services/partidasServico';
import { extrairMensagemErro } from '../utils/erros';
import { ordenarPartidasRecentes } from '../utils/partidas';
import { ehAdministrador } from '../utils/perfis';
import '../components/partidas/minhas-partidas-registradas.css';

export function MinhasPartidasRegistradasPagina() {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const administradorLogado = ehAdministrador(usuario);
  const [partidas, setPartidas] = useState([]);
  const [partidaEmEdicao, setPartidaEmEdicao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [partidaParaExcluir, setPartidaParaExcluir] = useState(null);
  const [partidaExcluindoId, setPartidaExcluindoId] = useState(null);
  const [erro, setErro] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');

  useEffect(() => {
    carregarPartidas();
  }, []);

  async function carregarPartidas() {
    setCarregando(true);
    setErro('');

    try {
      const lista = await partidasServico.listarRegistradasPorMim();
      setPartidas(ordenarPartidasRecentes(lista || []));
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
      setPartidas([]);
    } finally {
      setCarregando(false);
    }
  }

  function abrirEdicao(partida) {
    setErroEdicao('');
    setPartidaEmEdicao(partida);
  }

  function fecharEdicao() {
    if (!salvando) {
      setPartidaEmEdicao(null);
      setErroEdicao('');
    }
  }

  async function salvarPartida(dados) {
    if (!partidaEmEdicao) {
      return;
    }

    setSalvando(true);
    setErroEdicao('');

    try {
      const partidaAtualizada = await partidasServico.atualizarBasica(partidaEmEdicao.id, dados);
      await carregarPartidas();
      showNotification({
        type: 'success',
        title: 'Partida atualizada',
        message: 'As alterações foram salvas com sucesso.'
      });
      return partidaAtualizada;
    } catch (falha) {
      const mensagem = extrairMensagemErro(falha);
      setErroEdicao(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao editar partida',
        message: mensagem
      });
      throw falha;
    } finally {
      setSalvando(false);
    }
  }

  function abrirExclusao(partida) {
    if (!administradorLogado) {
      return;
    }

    setPartidaParaExcluir(partida);
  }

  function cancelarExclusao() {
    if (!partidaExcluindoId) {
      setPartidaParaExcluir(null);
    }
  }

  async function confirmarExclusao() {
    if (!partidaParaExcluir) {
      return;
    }

    setPartidaExcluindoId(partidaParaExcluir.id);
    setErro('');

    try {
      await partidasServico.remover(partidaParaExcluir.id);
      await carregarPartidas();
      setPartidaParaExcluir(null);
      showNotification({
        type: 'success',
        title: 'Partida excluída',
        message: 'A partida foi removida com sucesso.'
      });
    } catch (falha) {
      const mensagem = extrairMensagemErro(falha);
      setErro(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao excluir partida',
        message: mensagem
      });
    } finally {
      setPartidaExcluindoId(null);
    }
  }

  return (
    <section className="pagina minhas-partidas-registradas-pagina">
      <div className="cabecalho-pagina minhas-partidas-registradas-cabecalho">
        <div>
          <h2>Minhas partidas registradas</h2>
          <p>Partidas que você cadastrou na plataforma, mesmo quando não participou do jogo.</p>
        </div>

        <Link to="/partidas/registrar" className="botao-primario">
          Registrar partida
        </Link>
      </div>

      {erro && <p className="texto-erro">{erro}</p>}

      {carregando ? (
        <p>Carregando partidas registradas...</p>
      ) : partidas.length === 0 ? (
        <article className="cartao-lista">
          <p>Você ainda não registrou partidas.</p>
          <Link to="/partidas/registrar" className="botao-primario">
            Registrar partida
          </Link>
        </article>
      ) : (
        <MinhasPartidasRegistradasLista
          partidas={partidas}
          onEditar={abrirEdicao}
          onExcluir={abrirExclusao}
          partidaExcluindoId={partidaExcluindoId}
          podeExcluir={administradorLogado}
        />
      )}

      {partidaEmEdicao && (
        <EditarPartidaRegistradaModal
          partida={partidaEmEdicao}
          salvando={salvando}
          erro={erroEdicao}
          onSalvar={salvarPartida}
          onFechar={fecharEdicao}
        />
      )}

      {partidaParaExcluir && (
        <div className="modal-sobreposicao" role="presentation">
          <section
            className="modal-conteudo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="excluir-partida-registrada-titulo"
          >
            <div className="modal-cabecalho">
              <div>
                <h3 id="excluir-partida-registrada-titulo">Deletar partida</h3>
                <p>Tem certeza que deseja apagar esta partida? Essa ação pode impactar rankings e estatísticas.</p>
              </div>
            </div>

            <div className="acoes-formulario">
              <button
                type="button"
                className="botao-secundario"
                onClick={cancelarExclusao}
                disabled={Boolean(partidaExcluindoId)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="botao-perigo"
                onClick={confirmarExclusao}
                disabled={Boolean(partidaExcluindoId)}
              >
                {partidaExcluindoId ? 'Excluindo...' : 'Deletar partida'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
