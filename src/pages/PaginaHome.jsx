import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { categoriasServico } from '../services/categoriasServico';
import { competicoesServico } from '../services/competicoesServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { rankingServico } from '../services/rankingServico';
import { nomeEstadoAcesso } from '../utils/acesso';
import { formatarData } from '../utils/formatacao';
import { obterLinkHttp } from '../utils/links';
import { criarPendenciasPerfil } from '../utils/pendenciasPerfil';
import { nomePerfil } from '../utils/perfis';

const TIPO_CAMPEONATO = 1;
const TIPO_GRUPO = 3;
const NOME_COMPETICAO_PARTIDAS_AVULSAS = 'Partidas avulsas';
const TIPO_PENDENCIA_COMPLETAR_CONTATO = 2;
const STATUS_PENDENCIA_PENDENTE = 1;

function obterTimestamp(data, fallback = Number.MAX_SAFE_INTEGER) {
  if (!data) {
    return fallback;
  }

  const timestamp = new Date(data).getTime();
  return Number.isNaN(timestamp) ? fallback : timestamp;
}

function ordenarPorInicio(a, b) {
  return obterTimestamp(a.dataInicio) - obterTimestamp(b.dataInicio) || a.nome.localeCompare(b.nome, 'pt-BR');
}

function ordenarPorFimDesc(a, b) {
  return obterTimestamp(b.dataFim, 0) - obterTimestamp(a.dataFim, 0) || a.nome.localeCompare(b.nome, 'pt-BR');
}

function ehCompeticaoPartidasAvulsas(competicao) {
  return Number(competicao?.tipo) === TIPO_GRUPO &&
    (competicao?.nome || '').trim().toLowerCase() === NOME_COMPETICAO_PARTIDAS_AVULSAS.toLowerCase();
}

function ehCompeticaoGrupo(competicao) {
  return Number(competicao?.tipo) === TIPO_GRUPO && !ehCompeticaoPartidasAvulsas(competicao);
}

function pendenciaAindaVisivel(item) {
  if (!item || item.status !== STATUS_PENDENCIA_PENDENTE) {
    return false;
  }

  if (item.tipo !== TIPO_PENDENCIA_COMPLETAR_CONTATO) {
    return true;
  }

  return !item.emailAtleta && !item.atletaPossuiUsuarioVinculado;
}

function selecionarTopRanking(ranking) {
  const grupos = ranking || [];
  const primeiroGrupoComAtletas = grupos.find((grupo) => (grupo.atletas || []).length > 0);

  if (!primeiroGrupoComAtletas) {
    return {
      titulo: 'Ranking geral',
      atletas: []
    };
  }

  return {
    titulo: primeiroGrupoComAtletas.nomeCompeticao || primeiroGrupoComAtletas.nomeCategoria || 'Ranking geral',
    atletas: [...(primeiroGrupoComAtletas.atletas || [])]
      .sort((a, b) => (a.posicao || 0) - (b.posicao || 0))
      .slice(0, 3)
  };
}

function obterNomeLocal(competicao) {
  return competicao?.nomeLocal ||
    competicao?.localNome ||
    competicao?.local?.nome ||
    (competicao?.localId ? 'Local cadastrado' : '');
}

function montarResumoPlataforma(competicoes, ranking) {
  const atletas = new Set();
  const jogos = new Set();
  const totalGruposLista = (competicoes || []).filter(ehCompeticaoGrupo).length;

  (ranking || []).forEach((grupo) => {
    (grupo.atletas || []).forEach((atleta) => {
      if (atleta.atletaId) {
        atletas.add(atleta.atletaId);
      }

      (atleta.partidas || []).forEach((partida) => {
        if (partida.partidaId) {
          jogos.add(partida.partidaId);
        }
      });
    });
  });

  return {
    atletas: atletas.size,
    jogos: jogos.size,
    grupos: totalGruposLista
  };
}

export function PaginaHome() {
  const { token, usuario, estadoAcesso } = useAutenticacao();
  const [competicoes, setCompeticoes] = useState([]);
  const [categoriasPorCompeticao, setCategoriasPorCompeticao] = useState({});
  const [rankingGeral, setRankingGeral] = useState([]);
  const [pendenciasUsuario, setPendenciasUsuario] = useState([]);
  const [atletaPerfil, setAtletaPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const hoje = useMemo(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data.getTime();
  }, []);

  const campeonatos = useMemo(
    () => competicoes.filter((competicao) => Number(competicao.tipo) === TIPO_CAMPEONATO),
    [competicoes]
  );

  const proximosCampeonatos = useMemo(
    () => campeonatos
      .filter((competicao) => obterTimestamp(competicao.dataFim, obterTimestamp(competicao.dataInicio)) >= hoje)
      .sort(ordenarPorInicio)
      .slice(0, 3),
    [campeonatos, hoje]
  );

  const campeonatosRealizados = useMemo(
    () => campeonatos
      .filter((competicao) => competicao.dataFim && obterTimestamp(competicao.dataFim, 0) < hoje)
      .sort(ordenarPorFimDesc)
      .slice(0, 4),
    [campeonatos, hoje]
  );

  const destaqueRanking = useMemo(() => selecionarTopRanking(rankingGeral), [rankingGeral]);
  const resumoPlataforma = useMemo(
    () => montarResumoPlataforma(competicoes, rankingGeral),
    [competicoes, rankingGeral]
  );
  const pendenciasPerfil = useMemo(
    () => criarPendenciasPerfil({ estadoAcesso, usuario, atletaDetalhe: atletaPerfil }),
    [atletaPerfil, estadoAcesso, usuario]
  );
  const totalPendenciasHome = pendenciasUsuario.length + pendenciasPerfil.length;

  useEffect(() => {
    let ativo = true;

    async function carregarDadosPublicos() {
      setCarregando(true);

      const [resultadoCompeticoes, resultadoRanking] = await Promise.allSettled([
        competicoesServico.listar(),
        rankingServico.listarAtletasGeral()
      ]);

      if (!ativo) {
        return;
      }

      if (resultadoCompeticoes.status === 'fulfilled') {
        const listaCompeticoes = resultadoCompeticoes.value;
        setCompeticoes(listaCompeticoes);

        const categoriasCampeonatos = await obterCategoriasCampeonatosExibidos(listaCompeticoes);
        if (!ativo) {
          return;
        }

        setCategoriasPorCompeticao(categoriasCampeonatos);
      } else {
        setCompeticoes([]);
        setCategoriasPorCompeticao({});
      }

      if (resultadoRanking.status === 'fulfilled') {
        setRankingGeral(resultadoRanking.value);
      } else {
        setRankingGeral([]);
      }

      setCarregando(false);
    }

    carregarDadosPublicos();

    return () => {
      ativo = false;
    };
  }, [hoje]);

  useEffect(() => {
    let ativo = true;

    async function carregarDadosUsuario() {
      if (!token) {
        setPendenciasUsuario([]);
        setAtletaPerfil(null);
        return;
      }

      const [resultadoPendencias, resultadoAtleta] = await Promise.allSettled([
        pendenciasServico.listar(),
        usuario?.atletaId ? atletasServico.obterMeu() : Promise.resolve(null)
      ]);

      if (!ativo) {
        return;
      }

      if (resultadoPendencias.status === 'fulfilled') {
        setPendenciasUsuario((resultadoPendencias.value || []).filter(pendenciaAindaVisivel));
      } else {
        setPendenciasUsuario([]);
      }

      if (resultadoAtleta.status === 'fulfilled') {
        setAtletaPerfil(resultadoAtleta.value);
      } else {
        setAtletaPerfil(null);
      }
    }

    carregarDadosUsuario();

    return () => {
      ativo = false;
    };
  }, [token, usuario?.atletaId]);

  async function obterCategoriasCampeonatosExibidos(listaCompeticoes) {
    const campeonatosHome = (listaCompeticoes || [])
      .filter((competicao) => Number(competicao.tipo) === TIPO_CAMPEONATO)
      .filter((competicao) => obterTimestamp(competicao.dataFim, obterTimestamp(competicao.dataInicio)) >= hoje)
      .sort(ordenarPorInicio)
      .slice(0, 3);

    if (campeonatosHome.length === 0) {
      return {};
    }

    const resultados = await Promise.allSettled(
      campeonatosHome.map(async (competicao) => ({
        competicaoId: competicao.id,
        categorias: await categoriasServico.listarPorCompeticao(competicao.id)
      }))
    );

    const mapa = {};
    resultados.forEach((resultado) => {
      if (resultado.status === 'fulfilled') {
        mapa[resultado.value.competicaoId] = resultado.value.categorias || [];
      }
    });

    return mapa;
  }

  function renderizarCategoriasCampeonato(competicao) {
    const categorias = categoriasPorCompeticao[competicao.id] || [];
    const linkInscricao = obterLinkHttp(competicao.link);
    const inscricoesAbertas = Boolean(competicao.inscricoesAbertas);

    if (categorias.length === 0) {
      return null;
    }

    return (
      <div className="home-card-categorias" aria-label={`Categorias de ${competicao.nome}`}>
        {categorias.map((categoria) => (
          <div key={categoria.id} className="home-card-categoria-item">
            <span>{categoria.nome}</span>
            {!inscricoesAbertas ? (
              <button
                type="button"
                className="botao-secundario botao-compacto home-card-categoria-acao"
                disabled
                title="As inscrições deste campeonato estão fechadas."
              >
                Inscrever dupla
              </button>
            ) : linkInscricao ? (
              <a
                href={linkInscricao}
                target="_blank"
                rel="noopener noreferrer"
                className="botao-secundario botao-compacto home-card-categoria-acao"
              >
                Inscrever dupla
              </a>
            ) : (
              <Link
                to={`/inscricoes?campeonatoId=${competicao.id}&categoriaId=${categoria.id}`}
                className="botao-secundario botao-compacto home-card-categoria-acao"
              >
                Inscrever dupla
              </Link>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderizarCardUsuarioLogado() {
    if (!token) {
      return null;
    }

    const nomeAtleta = atletaPerfil?.nome || usuario?.atleta?.nome || '';
    const rotaPendenciaPrincipal = pendenciasUsuario.length > 0 ? '/app/pendencias' : '/app/perfil';
    const statusAcesso = estadoAcesso ? nomeEstadoAcesso(estadoAcesso) : 'Ativo';

    return (
      <article className="cartao-lista home-usuario-card">
        <div className="home-usuario-card-conteudo">
          <div className="home-usuario-identidade">
            <h3>{usuario?.nome ? `Olá, ${usuario.nome}` : 'Bem-vindo'}</h3>
            <p>{nomePerfil(usuario?.perfil)}</p>
          </div>

          <div className="home-usuario-infos">
            <div className="home-usuario-info-item">
              <span>Perfil</span>
              <strong>{nomePerfil(usuario?.perfil)}</strong>
            </div>
            <div className="home-usuario-info-item">
              <span>Nome</span>
              <strong>{nomeAtleta || 'Não vinculado'}</strong>
            </div>
            <div className="home-usuario-info-item">
              <span>Pendências</span>
              <strong>{totalPendenciasHome}</strong>
            </div>
          </div>
        </div>
       
        <div className="acoes-item home-usuario-acoes">
          <Link to="/app/perfil" className="botao-secundario botao-compacto">
            Meu perfil
          </Link>
          {totalPendenciasHome > 0 && (
            <Link to={rotaPendenciaPrincipal} className="botao-primario">
              {pendenciasUsuario.length > 0 ? 'Ver pendências' : 'Completar perfil'}
            </Link>
          )}
        </div>
      </article>
    );
  }

  function renderizarCardCampeonato(competicao, acao) {
    const nomeLocal = obterNomeLocal(competicao);

    return (
      <article key={competicao.id} className="cartao-lista home-card-campeonato">
        <div className="home-card-topo">
          <div className="home-card-topo-resumo">
            <span className={`tag-status ${competicao.inscricoesAbertas ? 'tag-status-sucesso' : 'tag-status-alerta'}`}>
              {competicao.inscricoesAbertas ? 'Inscrições abertas' : 'Inscrições fechadas'}
            </span>           
          </div>
        </div>
        <h3>{competicao.nome}</h3>
        {competicao.descricao && <p>{competicao.descricao}</p>} 
        <div className="home-card-detalhes">
          <span>Início: {formatarData(competicao.dataInicio)}</span>
          <span>Fim: {formatarData(competicao.dataFim)}</span>
          <span>Local: {nomeLocal || 'A definir'}</span>
        </div>
        {renderizarCategoriasCampeonato(competicao)}
        {acao}
      </article>
    );
  }

  function renderizarCardHome() {
    if (!token) {
      return (
        <article className="cartao home-hero">
          <div className="home-hero-conteudo">
            <span className="home-eyebrow">Plataforma Futevôlei</span>
            <h2>Registre seus jogos, crie o grupo e monte seu ranking.</h2>
            <p>
              Acompanhe os próximos campeonatos, entre nas inscrições abertas e consulte os rankings dos torneios já realizados.
            </p>
            <div className="home-hero-acoes">
              <Link to="/partidas/registrar" className="botao-primario home-botao">
                Registrar partida
              </Link>
              <Link to="/ranking" className="botao-secundario home-botao">
                Ver rankings
              </Link>            
            </div>
          </div>
          <div className="home-hero-resumo" aria-label="Resumo da plataforma">
            <div>
              <span>{resumoPlataforma.atletas}</span>
              <small>Atletas</small>
            </div>
            <div>
              <span>{resumoPlataforma.jogos}</span>
              <small>Jogos</small>
            </div>
            <div>
              <span>{resumoPlataforma.grupos}</span>
              <small>Grupos</small>
            </div>
          </div>
        </article>
      );
    }

    const nomeAtleta = atletaPerfil?.nome || usuario?.atleta?.nome || '';
    const rotaPendenciaPrincipal = pendenciasUsuario.length > 0 ? '/app/pendencias' : '/app/perfil';
    const statusAcesso = estadoAcesso ? nomeEstadoAcesso(estadoAcesso) : 'Ativo';

    return (
      <article className="cartao home-hero">
        <div className="home-hero-conteudo">
          <h3>Registre seus jogos, crie o grupo e monte seu ranking.</h3>
          <div className="home-hero-resumo" aria-label="Resumo da plataforma">
            <div>
              <span>{resumoPlataforma.atletas}</span>
              <small>Atletas</small>
            </div>
            <div>
              <span>{resumoPlataforma.jogos}</span>
              <small>Jogos</small>
            </div>
            <div>
              <span>{resumoPlataforma.grupos}</span>
              <small>Grupos</small>
            </div>
          </div>
          <div className="home-hero-acoes">
            <Link to="/partidas/registrar" className="botao-primario home-botao">
              Registrar partida
            </Link>
            <Link to="/ranking" className="botao-secundario home-botao">
              Ver rankings
            </Link>            
          </div>
        </div>        
      </article>
    );
  }

  return (
    <section className="pagina pagina-home">
      {renderizarCardUsuarioLogado()}

      {renderizarCardHome()}     

      {carregando ? (
        <p>Carregando informações públicas...</p>
      ) : (
        <>
          {token && totalPendenciasHome > 0 && (
            <section className="home-secao">
              <article className="cartao-lista">
                <div className="linha-entre">
                  <div>
                    <h3>Pendências</h3>
                    <p>
                      {totalPendenciasHome === 1
                        ? 'Você tem 1 pendência aguardando ação.'
                        : `Você tem ${totalPendenciasHome} pendências aguardando ação.`}
                    </p>
                  </div>
                  <span className="tag-status tag-status-alerta">Ação necessária</span>
                </div>
                {pendenciasPerfil.length > 0 && (
                  <div className="home-usuario-pendencias">
                    {pendenciasPerfil.map((pendencia) => (
                      <span key={pendencia.id} className="tag-status tag-status-alerta">
                        {pendencia.titulo}
                      </span>
                    ))}
                  </div>
                )}
                <div className="acoes-item">
                  <Link to={pendenciasUsuario.length > 0 ? '/app/pendencias' : '/app/perfil'} className="botao-primario">
                    {pendenciasUsuario.length > 0 ? 'Ver pendências' : 'Completar perfil'}
                  </Link>
                </div>
              </article>
            </section>
          )}

          <section className="home-secao">
            <div className="home-secao-cabecalho">
              <div>
                <h3>Próximos campeonatos</h3>
                <p>Eventos programados ou em andamento.</p>
              </div>             
            </div>

            <div className="grade-cartoes home-grade">
              {proximosCampeonatos.map((competicao) => renderizarCardCampeonato(
                competicao                
              ))}
              {proximosCampeonatos.length === 0 && (
                <article className="cartao-lista">
                  <h3>Nenhum campeonato próximo</h3>
                  <p>Assim que houver campeonato cadastrado, ele aparecerá aqui.</p>
                </article>
              )}
            </div>
          </section>

          <section className="home-grid-duas-colunas">
            <div className="home-secao">
              <div className="home-secao-cabecalho">
                <div>
                  <h3>Destaque do ranking</h3>
                  <p>{destaqueRanking.titulo}</p>
                </div>
                <Link to="/ranking" className="link-acao">Ranking completo</Link>
              </div>

              <div className="cartao-lista home-ranking-card">
                {destaqueRanking.atletas.length > 0 ? (
                  destaqueRanking.atletas.map((atleta) => (
                    <div key={atleta.atletaId} className="home-ranking-linha">
                      <span>{atleta.posicao}º</span>
                      <strong>{atleta.nomeAtleta}</strong>
                      <small>{atleta.pontos} pts</small>
                    </div>
                  ))
                ) : (
                  <p>Nenhuma pontuação publicada ainda.</p>
                )}
              </div>
            </div>
          </section>

          <section className="home-secao">
            <div className="home-secao-cabecalho">
              <div>
                <h3>Rankings de campeonatos realizados</h3>
                <p>Consulte a classificação dos campeonatos encerrados.</p>
              </div>
              <Link to="/ranking?tipo=competicao" className="link-acao">Ver todos</Link>
            </div>

            <div className="grade-cartoes home-grade">
              {campeonatosRealizados.map((competicao) => (
                <Link
                  key={competicao.id}
                  to={`/ranking?tipo=competicao&competicaoId=${competicao.id}`}
                  className="cartao-lista home-lista-link home-ranking-link"
                >
                  <strong>{competicao.nome}</strong>
                  <span>Encerrado em {formatarData(competicao.dataFim)}</span>
                  <small>Ver ranking do campeonato</small>
                </Link>
              ))}
              {campeonatosRealizados.length === 0 && (
                <article className="cartao-lista">
                  <p>Nenhum campeonato realizado com ranking disponível ainda.</p>
                </article>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
