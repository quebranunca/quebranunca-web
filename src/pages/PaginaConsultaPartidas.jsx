import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FaChevronRight, FaEdit, FaTrash } from 'react-icons/fa';
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
import { criarNavegacaoEdicaoPartida, normalizarOrigemInterna, obterRotaDetalhePartida } from '../utils/partidaRotas';

function obterGrupoPartida(partida) {
  return partida?.nomeGrupo || 'Grupo';
}

export function PaginaConsultaPartidas() {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const location = useLocation();
  const administradorLogado = ehAdministrador(usuario);

  const [params, setParams] = useSearchParams();

  const [grupos, setGrupos] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [grupoId, setGrupoId] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [excluindoPartidaIds, setExcluindoPartidaIds] = useState({});
  const origemAtual = normalizarOrigemInterna(location);

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
      } else if (administradorLogado) {
        await carregarPartidasAdministracao();
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
      if (administradorLogado) {
        await carregarPartidasAdministracao();
        return;
      }

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

  async function carregarPartidasAdministracao() {
    try {
      setErro('');
      const lista = await partidasServico.listarAdministracao();
      setPartidas(lista);
      setParams({});
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setPartidas([]);
    }
  }

  async function removerPartida(partida) {
    if (!podeRemoverPartida(partida)) {
      return;
    }

    if (!window.confirm('Tem certeza que deseja apagar esta partida? Essa ação pode impactar rankings e estatísticas.')) {
      return;
    }

    setErro('');
    setExcluindoPartidaIds((ids) => ({ ...ids, [partida.id]: true }));

    try {
      await partidasServico.remover(partida.id);
      await carregarPartidasPorGrupo(grupoId);
      showNotification({
        type: 'success',
        title: 'Partida apagada',
        message: 'A partida foi apagada com sucesso.'
      });
    } catch (error) {
      const mensagem = extrairMensagemErro(error);
      setErro(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao apagar partida',
        message: mensagem
      });
    } finally {
      setExcluindoPartidaIds((ids) => {
        const proximosIds = { ...ids };
        delete proximosIds[partida.id];
        return proximosIds;
      });
    }
  }

  function podeRemoverPartida(partida) {
    return Boolean(partida?.id && administradorLogado);
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
            <option value="">{administradorLogado ? 'Todos os grupos' : 'Selecione'}</option>
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
                      atleta1Id={partida.duplaAAtleta1Id}
                      atleta2Id={partida.duplaAAtleta2Id}
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
                      atleta1Id={partida.duplaBAtleta1Id}
                      atleta2Id={partida.duplaBAtleta2Id}
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
                        registradoPor={partida.nomeCriadoPorUsuario}
                      />
                    )}
                    <Link to={obterRotaDetalhePartida(partida)} className="botao-secundario botao-compacto">
                      Detalhes
                      <FaChevronRight aria-hidden="true" />
                    </Link>
                    {podeEditarPartida(partida, usuario) && (
                      <Link
                        {...criarNavegacaoEdicaoPartida({ partida, origem: origemAtual })}
                        className="botao-secundario botao-compacto botao-editar-partida-discreto"
                      >
                        <FaEdit aria-hidden="true" />
                        Editar
                      </Link>
                    )}
                    {podeRemoverPartida(partida) && (
                      <button
                        type="button"
                        className="botao-perigo botao-compacto"
                        onClick={() => removerPartida(partida)}
                        disabled={excluindoPartida}
                      >
                        <FaTrash aria-hidden="true" />
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
                  : administradorLogado
                    ? 'Nenhuma partida cadastrada na plataforma.'
                    : 'Selecione um grupo para consultar as partidas.'}
              </p>
            )}
          </div>
        </section>
      )}

    </section>
  );
}
