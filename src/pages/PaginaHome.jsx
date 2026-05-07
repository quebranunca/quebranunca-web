import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HomeBannerRotativo,
  HomeHeroVisitante,
  HomePendencias,
  HomeProximosCampeonatos,
  HomeRankingsRealizados,
  HomeResumoUsuario
} from '../components/home';
import { GrupoResumoCard } from '../components/grupos/GrupoResumoCard';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { categoriasServico } from '../services/categoriasServico';
import { competicoesServico } from '../services/competicoesServico';
import { gruposServico } from '../services/gruposServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { partidasServico } from '../services/partidasServico';
import { usuariosServico } from '../services/usuariosServico';
import { criarPendenciasPerfil } from '../utils/pendenciasPerfil';
import { HomeRankingLiga } from '../components/HomeRankingLiga';
import { ordenarPartidasRecentes } from '../utils/partidas';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
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

function montarResumoPlataforma(competicoes, resumoPublico) {
  const totalGruposLista = (competicoes || []).filter(ehCompeticaoGrupo).length;
  const totalGrupos = Number.isFinite(Number(resumoPublico?.totalGrupos))
    ? Number(resumoPublico.totalGrupos)
    : totalGruposLista;
  const totalAtletas = Number.isFinite(Number(resumoPublico?.totalAtletas))
    ? Number(resumoPublico.totalAtletas)
    : 0;
  const totalJogos = Number.isFinite(Number(resumoPublico?.totalJogos))
    ? Number(resumoPublico.totalJogos)
    : 0;

  return {
    atletas: totalAtletas,
    jogos: totalJogos,
    grupos: totalGrupos
  };
}

export function PaginaHome() {
  const { token, usuario, estadoAcesso } = useAutenticacao();
  const location = useLocation();
  const [competicoes, setCompeticoes] = useState([]);
  const [categoriasPorCompeticao, setCategoriasPorCompeticao] = useState({});
  const [resumoPublico, setResumoPublico] = useState(null);
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

  const resumoPlataforma = useMemo(
    () => montarResumoPlataforma(competicoes, resumoPublico),
    [competicoes, resumoPublico]
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
        url: 'https://www.quebranunca.com/quebranunca'
      }
    ],
    [resumoPlataforma]
  );
  const pendenciasPerfil = useMemo(
    () => criarPendenciasPerfil({ estadoAcesso, usuario, atletaDetalhe: atletaPerfil }),
    [atletaPerfil, estadoAcesso, usuario]
  );
  const totalPendenciasHome = pendenciasUsuario.length + pendenciasPerfil.length;
  const nomeAtleta = obterNomeExibicaoAtleta(atletaPerfil) || obterNomeExibicaoAtleta(usuario?.atleta);

  useEffect(() => {
    let ativo = true;

    async function carregarDadosPublicos() {
      setCarregando(true);

      try {
        const [
          resultadoCompeticoes,
          resultadoGrupos,
          resultadoResumoPublico
        ] = await Promise.allSettled([
          competicoesServico.listarVisiveis(),
          token ? gruposServico.listar() : Promise.resolve([]),
          competicoesServico.obterResumoPublico()
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

          if (resultadoResumoPublico.status === 'fulfilled') {
            setResumoPublico(resultadoResumoPublico.value || null);
          } else {
            registrarFalhaHome('resumo público', resultadoResumoPublico.reason);
            setResumoPublico(null);
          }

          const categoriasCampeonatos = await obterCategoriasCampeonatosExibidos(listaCompeticoes);
          if (!ativo) {
            return;
          }

          setCategoriasPorCompeticao(categoriasCampeonatos);
        } else {
          registrarFalhaHome('competições', resultadoCompeticoes.reason);
          setCompeticoes([]);
          setCategoriasPorCompeticao({});
          setResumoPublico(null);
        }      
      } catch (erro) {
        registrarFalhaHome('dados públicos', erro);
        setCompeticoes([]);
        setCategoriasPorCompeticao({});
        setResumoPublico(null);
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

      const [resultadoAtleta, resultadoResumo, resultadoPartidas, resultadoResumoGrupo] = await Promise.allSettled([
        usuario?.atletaId ? atletasServico.obterMeu() : Promise.resolve(null),
        usuariosServico.obterResumo(),
        usuario?.atletaId ? partidasServico.listarMinhas() : Promise.resolve([]),
        gruposServico.obterResumoUsuario()
      ]);

      if (!ativo) {
        return;
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
        <div className="home-secoes-publicas">
          <HomeRankingLiga />
          <HomeProximosCampeonatos
            campeonatos={proximosCampeonatos}
            categoriasPorCompeticao={categoriasPorCompeticao}
          />          
        </div>
      )}
    </section>
  );
}
