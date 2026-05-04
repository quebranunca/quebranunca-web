import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HomeBannerRotativo,
  HomeDestaqueRanking,
  HomeHeroVisitante,
  HomePendencias,
  HomeProximosCampeonatos,
  HomeRankingsRealizados,
  HomeResumoUsuario
} from '../components/home';
import { GrupoResumoCard } from '../components/grupos/GrupoResumoCard';
import bannerHomeConvite from '../assets/banner-home-convite.svg';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { categoriasServico } from '../services/categoriasServico';
import { competicoesServico } from '../services/competicoesServico';
import { gruposServico } from '../services/gruposServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { partidasServico } from '../services/partidasServico';
import { rankingServico } from '../services/rankingServico';
import { usuariosServico } from '../services/usuariosServico';
import { criarPendenciasPerfil } from '../utils/pendenciasPerfil';
import { HomeRankingLiga } from '../components/HomeRankingLiga';
import { ordenarPartidasRecentes } from '../utils/partidas';
import bannerLoja from '../assets/banner-loja.png';

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

function registrarFalhaHome(contexto, erro) {
  console.error(`Erro ao carregar ${contexto} na Home.`, erro);
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
  const location = useLocation();
  const [competicoes, setCompeticoes] = useState([]);
  const [categoriasPorCompeticao, setCategoriasPorCompeticao] = useState({});
  const [rankingGeral, setRankingGeral] = useState([]);
  const [pendenciasUsuario, setPendenciasUsuario] = useState([]);
  const [atletaPerfil, setAtletaPerfil] = useState(null);
  const [resumoUsuario, setResumoUsuario] = useState(null);
  const [ultimoJogoUsuario, setUltimoJogoUsuario] = useState(null);
  const [resumoGrupoUsuario, setResumoGrupoUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoUsuario, setCarregandoUsuario] = useState(false);
  const [erroResumoUsuario, setErroResumoUsuario] = useState(false);
  const [erroUltimoJogoUsuario, setErroUltimoJogoUsuario] = useState(false);
  const [erroResumoGrupoUsuario, setErroResumoGrupoUsuario] = useState(false);

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
  const slidesBannerVisitante = useMemo(
    () => [
      {
        id: 'hero-atual',
        tipo: 'componente',
        render: () => (
        <article>
          <HomeHeroVisitante resumoPlataforma={resumoPlataforma} />
        </article>
        )
      },
      {
        id: 'loja-quebranunca',
        tipo: 'imagem',
        src: bannerLoja,
        alt: 'Conheça a loja QuebraNunca Futevôlei',
        url: 'https://www.quebranunca.com.br'
      }
    ],
    [resumoPlataforma]
  );
  const pendenciasPerfil = useMemo(
    () => criarPendenciasPerfil({ estadoAcesso, usuario, atletaDetalhe: atletaPerfil }),
    [atletaPerfil, estadoAcesso, usuario]
  );
  const totalPendenciasHome = pendenciasUsuario.length + pendenciasPerfil.length;
  const nomeAtleta = atletaPerfil?.nome || usuario?.atleta?.nome || '';

  useEffect(() => {
    let ativo = true;

    async function carregarDadosPublicos() {
      setCarregando(true);

      try {
        const [resultadoCompeticoes, resultadoGrupos, resultadoRanking] = await Promise.allSettled([
          competicoesServico.listarVisiveis(),
          token ? gruposServico.listar() : Promise.resolve([]),
          rankingServico.listarAtletasGeral()
        ]);

        if (!ativo) {
          return;
        }

        if (resultadoCompeticoes.status === 'fulfilled') {
          const listaGrupos = resultadoGrupos.status === 'fulfilled'
            ? resultadoGrupos.value.map((grupo) => ({ ...grupo, tipo: TIPO_GRUPO }))
            : [];
          if (resultadoGrupos.status === 'rejected') {
            registrarFalhaHome('grupos', resultadoGrupos.reason);
          }

          const listaCompeticoes = [...resultadoCompeticoes.value, ...listaGrupos];
          setCompeticoes(listaCompeticoes);

          const categoriasCampeonatos = await obterCategoriasCampeonatosExibidos(listaCompeticoes);
          if (!ativo) {
            return;
          }

          setCategoriasPorCompeticao(categoriasCampeonatos);
        } else {
          registrarFalhaHome('competições', resultadoCompeticoes.reason);
          setCompeticoes([]);
          setCategoriasPorCompeticao({});
        }

        if (resultadoRanking.status === 'fulfilled') {
          setRankingGeral(resultadoRanking.value);
        } else {
          registrarFalhaHome('ranking geral', resultadoRanking.reason);
          setRankingGeral([]);
        }
      } catch (erro) {
        registrarFalhaHome('dados públicos', erro);
        setCompeticoes([]);
        setCategoriasPorCompeticao({});
        setRankingGeral([]);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDadosPublicos();

    return () => {
      ativo = false;
    };
  }, [hoje, token]);

  useEffect(() => {
    let ativo = true;

    async function carregarDadosUsuario() {
      if (!token) {
        setPendenciasUsuario([]);
        setAtletaPerfil(null);
        setResumoUsuario(null);
        setUltimoJogoUsuario(null);
        setResumoGrupoUsuario(null);
        setCarregandoUsuario(false);
        setErroResumoUsuario(false);
        setErroUltimoJogoUsuario(false);
        setErroResumoGrupoUsuario(false);
        return;
      }

      setCarregandoUsuario(true);
      setErroResumoUsuario(false);
      setErroUltimoJogoUsuario(false);
      setErroResumoGrupoUsuario(false);

      const [resultadoPendencias, resultadoAtleta, resultadoResumo, resultadoPartidas, resultadoResumoGrupo] = await Promise.allSettled([
        pendenciasServico.listar(),
        usuario?.atletaId ? atletasServico.obterMeu() : Promise.resolve(null),
        usuariosServico.obterResumo(),
        usuario?.atletaId ? partidasServico.listarMinhas() : Promise.resolve([]),
        gruposServico.obterResumoUsuario()
      ]);

      if (!ativo) {
        return;
      }

      if (resultadoPendencias.status === 'fulfilled') {
        setPendenciasUsuario((resultadoPendencias.value || []).filter(pendenciaAindaVisivel));
      } else {
        registrarFalhaHome('pendências do usuário', resultadoPendencias.reason);
        setPendenciasUsuario([]);
      }

      if (resultadoAtleta.status === 'fulfilled') {
        setAtletaPerfil(resultadoAtleta.value);
      } else {
        registrarFalhaHome('atleta do usuário', resultadoAtleta.reason);
        setAtletaPerfil(null);
      }

      if (resultadoResumo.status === 'fulfilled') {
        setResumoUsuario(resultadoResumo.value || null);
      } else {
        registrarFalhaHome('resumo do usuário', resultadoResumo.reason);
        setResumoUsuario(null);
        setErroResumoUsuario(true);
      }

      if (resultadoPartidas.status === 'fulfilled') {
        const partidasOrdenadas = ordenarPartidasRecentes(resultadoPartidas.value || []);
        setUltimoJogoUsuario(partidasOrdenadas[0] || null);
      } else {
        registrarFalhaHome('último jogo do usuário', resultadoPartidas.reason);
        setUltimoJogoUsuario(null);
        setErroUltimoJogoUsuario(true);
      }

      if (resultadoResumoGrupo.status === 'fulfilled') {
        setResumoGrupoUsuario(resultadoResumoGrupo.value || null);
      } else {
        registrarFalhaHome('resumo de grupo do usuário', resultadoResumoGrupo.reason);
        setResumoGrupoUsuario(null);
        setErroResumoGrupoUsuario(true);
      }

      setCarregandoUsuario(false);
    }

    carregarDadosUsuario().catch((erro) => {
      if (ativo) {
        registrarFalhaHome('dados do usuário', erro);
        setPendenciasUsuario([]);
        setAtletaPerfil(null);
        setResumoUsuario(null);
        setUltimoJogoUsuario(null);
        setResumoGrupoUsuario(null);
        setCarregandoUsuario(false);
        setErroResumoUsuario(true);
        setErroUltimoJogoUsuario(true);
        setErroResumoGrupoUsuario(true);
      }
    });

    return () => {
      ativo = false;
    };
  }, [location.key, token, usuario?.atletaId]);

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

  return (
    <section className="pagina pagina-home">
      {!token && <HomeBannerRotativo slides={slidesBannerVisitante} />}

      {token && (
        <HomeResumoUsuario
          nomeAtleta={nomeAtleta}
          atletaId={usuario?.atletaId}
          resumoUsuario={resumoUsuario}
          ultimoJogoUsuario={ultimoJogoUsuario}
          carregandoResumo={carregandoUsuario}
          resumoGrupo={resumoGrupoUsuario}
          erroResumo={erroResumoUsuario}
          erroUltimoJogoUsuario={erroUltimoJogoUsuario}
        />
      )}

      {carregando ? (
        <p>Carregando informações públicas...</p>
      ) : (
        <>
          <HomeRankingLiga />
          <HomeProximosCampeonatos
            campeonatos={proximosCampeonatos}
            categoriasPorCompeticao={categoriasPorCompeticao}
          />          
        </>
      )}
    </section>
  );
}
