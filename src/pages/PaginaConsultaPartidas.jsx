import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gruposServico } from '../services/gruposServico';
import { partidasServico } from '../services/partidasServico';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import { ehAdministrador } from '../utils/perfis';
import { PlacarDupla } from '../components/partidas/PlacarDupla';

function obterGrupoPartida(partida) {
  return partida?.nomeGrupo || 'Grupo';
}

export function PaginaConsultaPartidas() {
  const { usuario } = useAutenticacao();
  const administradorLogado = ehAdministrador(usuario);

  const [params, setParams] = useSearchParams();

  const [grupos, setGrupos] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [grupoId, setGrupoId] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [excluindoPartidaIds, setExcluindoPartidaIds] = useState({});

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
    if (!administradorLogado || !partida?.id) {
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
                      atletas={
                        partida.nomeDuplaA
                          ? partida.nomeDuplaA.split('/').map((nome) => nome.trim())
                          : []
                      }
                      placar={partida.placarDuplaA}
                      vencedor={
                        partida.nomeDuplaVencedora === partida.nomeDuplaA
                          ? 'Vitória'
                          : 'Derrota'
                      }
                    />

                    <PlacarDupla
                      label="Dupla B"
                      atletas={
                        partida.nomeDuplaB
                          ? partida.nomeDuplaB.split('/').map((nome) => nome.trim())
                          : []
                      }
                      placar={partida.placarDuplaB}
                      vencedor={
                        partida.nomeDuplaVencedora === partida.nomeDuplaB
                          ? 'Vitória'
                          : 'Derrota'
                      }
                    />
                  </div>

                  {administradorLogado && (
                    <div className="acoes-item">
                      <button
                        type="button"
                        className="botao-perigo botao-compacto"
                        onClick={() => removerPartida(partida)}
                        disabled={excluindoPartida}
                      >
                        {excluindoPartida ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  )}
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
    </section>
  );
}