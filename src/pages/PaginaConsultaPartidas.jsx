import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import { gruposServico } from '../services/gruposServico';
import { partidasServico } from '../services/partidasServico';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { useNotification } from '../contexts/NotificationContext';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import { ehAdministrador } from '../utils/perfis';
import { podeEditarPartida } from '../utils/permissoesPartida';
import { PlacarDupla } from '../components/partidas/PlacarDupla';
import { CompartilharPartidaBotao } from '../components/partidas/CompartilharPartidaBotao';
import { EditarPartidaRegistradaModal } from '../components/partidas/EditarPartidaRegistradaModal';

function obterGrupoPartida(partida) {
  return partida?.nomeGrupo || 'Grupo';
}

export function PaginaConsultaPartidas() {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const administradorLogado = ehAdministrador(usuario);

  const [params, setParams] = useSearchParams();

  const [grupos, setGrupos] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [grupoId, setGrupoId] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [excluindoPartidaIds, setExcluindoPartidaIds] = useState({});
  const [partidaEmEdicao, setPartidaEmEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');

  useEffect(() => {
    carregarBase();
  }, []);

  async function carregarBase() {
    setErro('');
    setCarregando(true);

    try {
      const listaGrupos = await gruposServico.listar();
      setGrupos(listaGrupos);

      const grupoIdUrl = params.get('grupoId');

      if (grupoIdUrl) {
        setGrupoId(grupoIdUrl);
        await carregarPartidasPorGrupo(grupoIdUrl);
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setPartidas([]);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarPartidasPorGrupo(idGrupo) {
    if (!idGrupo) {
      setPartidas([]);
      setParams({});
      return;
    }

    try {
      setErro('');
      const lista = await partidasServico.listarPorGrupo(idGrupo);
      setPartidas(lista);
      setParams({ grupoId: idGrupo });
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setPartidas([]);
    }
  }

  async function removerPartida(partida) {
    if (!podeRemoverPartida(partida)) {
      return;
    }

    if (!window.confirm('Deseja remover esta partida?')) {
      return;
    }

    setErro('');
    setExcluindoPartidaIds((ids) => ({ ...ids, [partida.id]: true }));

    try {
      await partidasServico.remover(partida.id);
      await carregarPartidasPorGrupo(grupoId);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setExcluindoPartidaIds((ids) => {
        const proximosIds = { ...ids };
        delete proximosIds[partida.id];
        return proximosIds;
      });
    }
  }

  function podeRemoverPartida(partida) {
    return Boolean(partida?.id && usuario && (
      administradorLogado || partida.criadoPorUsuarioId === usuario.id
    ));
  }

  function abrirEdicao(partida) {
    setErroEdicao('');
    setPartidaEmEdicao(partida);
  }

  function fecharEdicao() {
    if (!salvandoEdicao) {
      setErroEdicao('');
      setPartidaEmEdicao(null);
    }
  }

  async function salvarEdicao(dados) {
    if (!partidaEmEdicao) {
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao('');

    try {
      const partidaAtualizada = await partidasServico.atualizarBasica(partidaEmEdicao.id, dados);
      await carregarPartidasPorGrupo(grupoId);
      showNotification({
        type: 'success',
        title: 'Partida atualizada',
        message: 'Partida atualizada com sucesso.'
      });
      return partidaAtualizada;
    } catch (error) {
      const mensagem = extrairMensagemErro(error);
      setErroEdicao(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao editar partida',
        message: mensagem
      });
      throw error;
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <section className="pagina">
      <div className="formulario-grid filtro-partidas barra-selecao-fixa">
        <label>
          Grupo
          <select
            value={grupoId}
            onChange={(evento) => {
              const novoGrupoId = evento.target.value;
              setGrupoId(novoGrupoId);
              carregarPartidasPorGrupo(novoGrupoId);
            }}
          >
            <option value="">Selecione</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}

      {carregando ? (
        <p>Carregando partidas...</p>
      ) : (
        <section>
          <div>
            {partidas.map((partida) => {
              const excluindoPartida = Boolean(excluindoPartidaIds[partida.id]);

              return (
                <article
                  key={partida.id}
                  className="cartao-lista competicao-card competicao-card-grupo"
                >
                  <div className="home-ultimo-jogo">
                    <span className="grupo-resumo-rotulo">
                      {obterGrupoPartida(partida)} - (
                      {partida.dataPartida
                        ? formatarDataHora(partida.dataPartida)
                        : 'Data a definir'}
                      )
                    </span>

                    <PlacarDupla
                      label="Dupla A"
                      atletas={partida.nomeDuplaA}
                      placar={partida.placarDuplaA}
                      vencedor={
                        partida.nomeDuplaVencedora === partida.nomeDuplaA
                          ? 'Vitória'
                          : 'Derrota'
                      }
                    />

                    <PlacarDupla
                      label="Dupla B"
                      atletas={partida.nomeDuplaB}
                      placar={partida.placarDuplaB}
                      vencedor={
                        partida.nomeDuplaVencedora === partida.nomeDuplaB
                          ? 'Vitória'
                          : 'Derrota'
                      }
                    />
                  </div>

                  <div className="acoes-item">
                    {partida.status === 2 && (
                      <CompartilharPartidaBotao
                        partidaId={partida.id}
                        url={`/partidas/consulta?grupoId=${partida.grupoId || grupoId}`}
                      />
                    )}
                    {podeEditarPartida(partida, usuario) && (
                      <button
                        type="button"
                        className="botao-secundario botao-compacto botao-editar-partida-discreto"
                        onClick={() => abrirEdicao(partida)}
                      >
                        <FaEdit aria-hidden="true" />
                        Editar
                      </button>
                    )}
                    {podeRemoverPartida(partida) && (
                      <button
                        type="button"
                        className="botao-perigo botao-compacto"
                        onClick={() => removerPartida(partida)}
                        disabled={excluindoPartida}
                      >
                        {excluindoPartida ? 'Excluindo...' : 'Excluir'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {partidas.length === 0 && (
              <p>
                {grupoId
                  ? 'Nenhuma partida cadastrada para este grupo.'
                  : 'Selecione um grupo para consultar as partidas.'}
              </p>
            )}
          </div>
        </section>
      )}

      {partidaEmEdicao && (
        <EditarPartidaRegistradaModal
          partida={partidaEmEdicao}
          salvando={salvandoEdicao}
          erro={erroEdicao}
          onSalvar={salvarEdicao}
          onFechar={fecharEdicao}
        />
      )}
    </section>
  );
}
