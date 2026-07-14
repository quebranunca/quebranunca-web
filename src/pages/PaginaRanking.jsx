import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FaChevronDown,
  FaChevronRight,
  FaFilter,
  FaFutbol,
  FaTimes,
  FaUser,
  FaUserFriends,
  FaUsers
} from 'react-icons/fa';
import { competicoesServico } from '../services/competicoesServico';
import { gruposServico } from '../services/gruposServico';
import { rankingServico } from '../services/rankingServico';
import { AppHero } from '../components/AppHero';
import { CompartilharRankingBotao } from '../components/ranking/CompartilharRankingBotao';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { useNavegacaoPerfilAtleta } from '../hooks/useNavegacaoPerfilAtleta';
import { extrairMensagemErro } from '../utils/erros';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import { obterRotaDetalhePartida } from '../utils/partidaRotas';

const ABAS_RANKING = [
  { valor: 'geral', rotulo: 'Geral' },
  { valor: 'grupos', rotulo: 'Grupos' },
  { valor: 'competicoes', rotulo: 'Competições' },
  { valor: 'regiao', rotulo: 'Região' }
];

const VISOES_RANKING = [
  {
    valor: 'atletas',
    rotulo: 'Atletas',
    descricao: 'Ranking individual',
    Icone: FaUser,
    disponivel: true
  },
  {
    valor: 'duplas',
    rotulo: 'Duplas',
    descricao: 'Ranking de duplas',
    Icone: FaUserFriends,
    disponivel: true
  },
  {
    valor: 'grupos',
    rotulo: 'Grupos',
    descricao: 'Comunidades',
    Icone: FaUsers,
    disponivel: true
  }
];

const ABAS_RANKING_ENTIDADES = ABAS_RANKING.filter((aba) => ['geral', 'grupos'].includes(aba.valor));

const PERIODOS_RANKING = [
  { valor: '', rotulo: 'Todos os períodos' },
  { valor: '30d', rotulo: 'Últimos 30 dias' },
  { valor: '90d', rotulo: 'Últimos 90 dias' },
  { valor: 'ano', rotulo: 'Ano atual' }
];

const TIPOS_COMPETICAO = {
  grupo: 3
};

const generos = {
  1: 'Masculino',
  2: 'Feminino',
  3: 'Misto'
};

function normalizarRanking(lista, tipoConsulta) {
  const grupos = (lista || [])
    .map((grupo) => ({
      ...grupo,
      chave: `${tipoConsulta}-${grupo.categoriaId}-${grupo.competicaoId}`,
      atletas: (grupo.atletas || []).map((atleta) => ({
        ...atleta,
        pontos: Number(atleta.pontos || 0),
        pontosPendentes: Number(atleta.pontosPendentes || 0),
        partidas: atleta.partidas || []
      }))
    }));

  if (tipoConsulta !== 'competicoes') {
    return grupos;
  }

  return grupos.sort((a, b) => {
    const ordemCompeticao = a.nomeCompeticao.localeCompare(b.nomeCompeticao, 'pt-BR');
    if (ordemCompeticao !== 0) {
      return ordemCompeticao;
    }

    if ((a.genero ?? 0) !== (b.genero ?? 0)) {
      return (a.genero ?? 0) - (b.genero ?? 0);
    }

    return a.nomeCategoria.localeCompare(b.nomeCategoria, 'pt-BR');
  });
}

function formatarPontuacao(valor) {
  const numero = Number(valor || 0);
  if (Number.isInteger(numero)) {
    return String(numero);
  }

  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function obterStatusVisual(item) {
  if (item.possuiUsuarioVinculado && !item.cadastroPendente) {
    return { texto: 'Ativo', classe: 'ativo' };
  }

  if (item.temEmail) {
    return { texto: 'Pendente', classe: 'pendente' };
  }

  return { texto: 'Sem conta', classe: 'sem-conta' };
}

function formatarRegiaoAtleta(item) {
  const partes = [item.estado, item.cidade, item.bairro].filter(Boolean);
  return partes.length > 0 ? partes.join(' / ') : '';
}

function obterResumoFiltro({
  abaRanking,
  grupoSelecionado,
  competicaoSelecionada,
  categoriaSelecionada,
  estadoRegiao,
  cidadeRegiao,
  bairroRegiao
}) {
  if (abaRanking === 'grupos') {
    return grupoSelecionado?.nome || 'Selecione um grupo';
  }

  if (abaRanking === 'competicoes') {
    return [competicaoSelecionada?.nome, categoriaSelecionada?.nome].filter(Boolean).join(' • ') || 'Selecione uma competição';
  }

  if (abaRanking === 'regiao') {
    return [estadoRegiao, cidadeRegiao, bairroRegiao].filter(Boolean).join(' / ') || 'Brasil';
  }

  return 'Todos os atletas';
}

function obterRotuloEscopo(visaoRanking, abaRanking, resumoFiltro) {
  if (abaRanking !== 'geral') {
    return resumoFiltro;
  }

  switch (visaoRanking) {
    case 'duplas':
      return 'Todas as duplas';
    case 'grupos':
      return 'Todos os grupos';
    default:
      return 'Todos os atletas';
  }
}

function obterCabecalhoSecao(grupo, abaRanking) {
  if (abaRanking === 'geral') {
    return {
      label: 'Ranking geral',
      titulo: 'Atletas'
    };
  }

  if (abaRanking === 'grupos') {
    return {
      label: grupo.nomeCompeticao || 'Grupo',
      titulo: 'Ranking do grupo'
    };
  }

  if (abaRanking === 'regiao') {
    return {
      label: 'Ranking por região',
      titulo: grupo.nomeCategoria || 'Atletas'
    };
  }

  return {
    label: grupo.nomeCompeticao || 'Competição',
    titulo: grupo.nomeCategoria || 'Categoria'
  };
}

function ordenarTop3(top3) {
  if (top3.length >= 3) {
    return [top3[1], top3[0], top3[2]].filter(Boolean);
  }

  return top3;
}

function normalizarPaginaRanking(resposta) {
  if (Array.isArray(resposta)) {
    return { itens: resposta, total: resposta.length };
  }

  return {
    itens: resposta?.itens || [],
    total: resposta?.total ?? resposta?.itens?.length ?? 0
  };
}

function formatarPercentual(valor) {
  const numero = Number(valor || 0);
  return `${numero.toLocaleString('pt-BR', {
    minimumFractionDigits: numero % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  })}%`;
}

function formatarDataCurta(valor) {
  if (!valor) {
    return 'Sem jogos';
  }

  return new Date(valor).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
}

function obterNomeResumoAtleta(atleta) {
  return obterNomeExibicaoAtleta({
    nomeAtleta: atleta?.nome,
    apelidoAtleta: atleta?.apelido,
    fotoPerfilUrl: atleta?.fotoPerfilUrl
  }) || atleta?.nome || 'Atleta';
}

function montarNomeDuplaRanking(item) {
  return [item?.atleta1, item?.atleta2].map(obterNomeResumoAtleta).join(' / ');
}

export function PaginaRanking() {
  const { token } = useAutenticacao();
  const { navegarParaPerfilAtleta } = useNavegacaoPerfilAtleta();
  const [params, setParams] = useSearchParams();
  const [grupos, setGrupos] = useState([]);
  const [competicoes, setCompeticoes] = useState([]);
  const [regioes, setRegioes] = useState({ estados: [], cidades: [], bairros: [] });
  const [visaoRanking, setVisaoRanking] = useState('atletas');
  const [abaRanking, setAbaRanking] = useState('geral');
  const [grupoId, setGrupoId] = useState('');
  const [competicaoId, setCompeticaoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [estadoRegiao, setEstadoRegiao] = useState('');
  const [cidadeRegiao, setCidadeRegiao] = useState('');
  const [bairroRegiao, setBairroRegiao] = useState('');
  const [ranking, setRanking] = useState([]);
  const [rankingEntidade, setRankingEntidade] = useState([]);
  const [totalEntidade, setTotalEntidade] = useState(0);
  const [periodoRanking, setPeriodoRanking] = useState('');
  const [detalheRanking, setDetalheRanking] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [carregandoBase, setCarregandoBase] = useState(true);
  const [baseInicializada, setBaseInicializada] = useState(false);
  const [carregandoRanking, setCarregandoRanking] = useState(false);
  const [erro, setErro] = useState('');

  const grupoSelecionado = useMemo(
    () => grupos.find((grupo) => grupo.id === grupoId) || null,
    [grupoId, grupos]
  );
  const competicaoSelecionada = useMemo(
    () => competicoes.find((competicao) => competicao.id === competicaoId) || null,
    [competicaoId, competicoes]
  );
  const cidadesRegiao = useMemo(() => {
    return (regioes.cidades || [])
      .filter((cidade) => !estadoRegiao || cidade.estado === estadoRegiao)
      .map((cidade) => cidade.cidade)
      .filter((cidade, indice, lista) => lista.indexOf(cidade) === indice)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [estadoRegiao, regioes.cidades]);
  const bairrosRegiao = useMemo(() => {
    return (regioes.bairros || [])
      .filter((bairro) => !estadoRegiao || bairro.estado === estadoRegiao)
      .filter((bairro) => !cidadeRegiao || bairro.cidade === cidadeRegiao)
      .map((bairro) => bairro.bairro)
      .filter((bairro, indice, lista) => lista.indexOf(bairro) === indice)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [cidadeRegiao, estadoRegiao, regioes.bairros]);
  const categoriasRanking = useMemo(() => {
    if (abaRanking !== 'competicoes') {
      return [];
    }

    return ranking
      .map((grupo) => ({
        id: grupo.categoriaId,
        nome: grupo.nomeCategoria,
        genero: grupo.genero
      }))
      .filter((categoria, indice, lista) => (
        categoria.id && lista.findIndex((item) => item.id === categoria.id) === indice
      ))
      .sort((a, b) => {
        if ((a.genero ?? 0) !== (b.genero ?? 0)) {
          return (a.genero ?? 0) - (b.genero ?? 0);
        }

        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [abaRanking, ranking]);
  const categoriaSelecionada = useMemo(
    () => categoriasRanking.find((categoria) => categoria.id === categoriaId) || null,
    [categoriaId, categoriasRanking]
  );
  const rankingFiltrado = useMemo(() => {
    if (!categoriaId) {
      return ranking;
    }

    return ranking.filter((grupo) => grupo.categoriaId === categoriaId);
  }, [ranking, categoriaId]);
  const rankingComAtletas = useMemo(
    () => rankingFiltrado.filter((grupo) => (grupo.atletas || []).length > 0),
    [rankingFiltrado]
  );
  const rankingEntidadeFiltrado = useMemo(() => rankingEntidade, [rankingEntidade]);
  const resumoFiltro = obterResumoFiltro({
    abaRanking,
    grupoSelecionado,
    competicaoSelecionada,
    categoriaSelecionada,
    estadoRegiao,
    cidadeRegiao,
    bairroRegiao
  });
  const visaoAtual = VISOES_RANKING.find((visao) => visao.valor === visaoRanking) || VISOES_RANKING[0];
  const filtroPrincipal = obterRotuloEscopo(visaoRanking, abaRanking, resumoFiltro);
  const autenticado = Boolean(token);
  const opcoesContexto = visaoRanking === 'atletas' ? ABAS_RANKING : ABAS_RANKING_ENTIDADES;
  const rankingCompartilhavel = visaoRanking === 'atletas' ? rankingComAtletas : [];

  useEffect(() => {
    carregarBase();
  }, []);

  useEffect(() => {
    if (!baseInicializada) {
      return;
    }

    if (abaRanking === 'grupos' && !grupoId) {
      setRanking([]);
      setRankingEntidade([]);
      return;
    }

    if (visaoRanking === 'atletas' && abaRanking === 'competicoes' && !competicaoId) {
      setRanking([]);
      return;
    }

    carregarRanking();
  }, [baseInicializada, visaoRanking, abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, periodoRanking]);

  useEffect(() => {
    if (!categoriaId || categoriasRanking.length === 0) {
      return;
    }

    const categoriaExiste = categoriasRanking.some((categoria) => categoria.id === categoriaId);
    if (!categoriaExiste) {
      selecionarCategoria('');
    }
  }, [categoriaId, categoriasRanking]);

  async function carregarBase() {
    setCarregandoBase(true);
    setBaseInicializada(false);
    setErro('');

    try {
      const [listaCompeticoes, listaGrupos, filtroRegioes] = await Promise.all([
        competicoesServico.listar(),
        gruposServico.listar(),
        rankingServico.listarRegioesDisponiveis()
      ]);
      const competicoesCampeonato = listaCompeticoes.filter((competicao) => Number(competicao.tipo) !== TIPOS_COMPETICAO.grupo);
      const tipoUrl = normalizarTipoUrl(params.get('tipo'));
      const grupoUrl = params.get('grupoId') || '';
      const competicaoUrl = params.get('competicaoId') || '';
      const estadoUrl = params.get('estado') || '';
      const cidadeUrl = params.get('cidade') || '';
      const bairroUrl = params.get('bairro') || '';

      const abaInicial = tipoUrl ||
        (grupoUrl ? 'grupos' : competicaoUrl ? 'competicoes' : 'geral');
      const grupoInicial = grupoUrl && listaGrupos.some((grupo) => grupo.id === grupoUrl)
        ? grupoUrl
        : listaGrupos[0]?.id || '';
      const competicaoInicial = competicaoUrl && competicoesCampeonato.some((competicao) => competicao.id === competicaoUrl)
        ? competicaoUrl
        : competicoesCampeonato[0]?.id || '';

      setGrupos(listaGrupos);
      setCompeticoes(competicoesCampeonato);
      setRegioes({
        estados: filtroRegioes?.estados || [],
        cidades: filtroRegioes?.cidades || [],
        bairros: filtroRegioes?.bairros || []
      });
      setAbaRanking(abaInicial);
      setGrupoId(grupoInicial);
      setCompeticaoId(competicaoInicial);
      setCategoriaId(params.get('categoriaId') || '');
      setEstadoRegiao(estadoUrl);
      setCidadeRegiao(cidadeUrl);
      setBairroRegiao(bairroUrl);
      atualizarParametros(abaInicial, grupoInicial, competicaoInicial, estadoUrl, cidadeUrl, bairroUrl, params.get('categoriaId') || '');
      setBaseInicializada(true);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoBase(false);
    }
  }

  async function carregarRanking() {
    setCarregandoRanking(true);
    setErro('');

    try {
      if (visaoRanking === 'duplas') {
        const resposta = await rankingServico.listarDuplas({
          grupoId: abaRanking === 'grupos' ? grupoId : '',
          periodo: periodoRanking,
          pagina: 1,
          tamanhoPagina: 50
        });
        const pagina = normalizarPaginaRanking(resposta);
        setRankingEntidade(pagina.itens);
        setTotalEntidade(pagina.total);
        setRanking([]);
        atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, categoriaId);
        return;
      }

      if (visaoRanking === 'grupos') {
        const resposta = await rankingServico.listarGruposRanking({
          grupoId: abaRanking === 'grupos' ? grupoId : '',
          periodo: periodoRanking,
          pagina: 1,
          tamanhoPagina: 50
        });
        const pagina = normalizarPaginaRanking(resposta);
        setRankingEntidade(pagina.itens);
        setTotalEntidade(pagina.total);
        setRanking([]);
        atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, categoriaId);
        return;
      }

      let lista = [];
      if (abaRanking === 'geral') {
        lista = await rankingServico.listarAtletasGeral();
      } else if (abaRanking === 'grupos') {
        lista = await rankingServico.listarAtletasPorGrupo(grupoId);
      } else if (abaRanking === 'regiao') {
        lista = await rankingServico.listarAtletasPorRegiao({
          estado: estadoRegiao,
          cidade: cidadeRegiao,
          bairro: bairroRegiao
        });
      } else {
        lista = await rankingServico.listarAtletasPorCompeticao(competicaoId);
      }

      setRanking(normalizarRanking(lista, abaRanking));
      setRankingEntidade([]);
      setTotalEntidade(0);
      atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, categoriaId);
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setRanking([]);
      setRankingEntidade([]);
      setTotalEntidade(0);
    } finally {
      setCarregandoRanking(false);
    }
  }

  function atualizarParametros(
    aba,
    novoGrupoId,
    novaCompeticaoId,
    novoEstadoRegiao = '',
    novaCidadeRegiao = '',
    novoBairroRegiao = '',
    novaCategoriaId = ''
  ) {
    const proximos = { tipo: aba };
    if (aba === 'grupos' && novoGrupoId) {
      proximos.grupoId = novoGrupoId;
    }
    if (aba === 'competicoes' && novaCompeticaoId) {
      proximos.competicaoId = novaCompeticaoId;
    }
    if (aba === 'competicoes' && novaCategoriaId) {
      proximos.categoriaId = novaCategoriaId;
    }
    if (aba === 'regiao') {
      if (novoEstadoRegiao) proximos.estado = novoEstadoRegiao;
      if (novaCidadeRegiao) proximos.cidade = novaCidadeRegiao;
      if (novoBairroRegiao) proximos.bairro = novoBairroRegiao;
    }

    setParams(proximos);
  }

  function selecionarVisao(valor) {
    setVisaoRanking(valor);
    setDetalheRanking(null);
    if (valor !== 'atletas' && !ABAS_RANKING_ENTIDADES.some((aba) => aba.valor === abaRanking)) {
      setAbaRanking('geral');
      atualizarParametros('geral', grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, '');
    }
    setFiltrosAbertos(false);
  }

  function selecionarAba(valor) {
    setAbaRanking(valor);
    setCategoriaId('');
    setDetalheRanking(null);
    setFiltrosAbertos(false);
    atualizarParametros(valor, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, '');
  }

  function selecionarPeriodo(valor) {
    setPeriodoRanking(valor);
    setDetalheRanking(null);
  }

  function selecionarGrupo(valor) {
    setGrupoId(valor);
    atualizarParametros(abaRanking, valor, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, categoriaId);
  }

  function selecionarCompeticao(valor) {
    setCompeticaoId(valor);
    setCategoriaId('');
    atualizarParametros(abaRanking, grupoId, valor, estadoRegiao, cidadeRegiao, bairroRegiao, '');
  }

  function selecionarEstadoRegiao(valor) {
    setEstadoRegiao(valor);
    setCidadeRegiao('');
    setBairroRegiao('');
    atualizarParametros(abaRanking, grupoId, competicaoId, valor, '', '', categoriaId);
  }

  function selecionarCidadeRegiao(valor) {
    setCidadeRegiao(valor);
    setBairroRegiao('');
    atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, valor, '', categoriaId);
  }

  function selecionarBairroRegiao(valor) {
    setBairroRegiao(valor);
    atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, valor, categoriaId);
  }

  function selecionarCategoria(valor) {
    setCategoriaId(valor);
    atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, valor);
  }

  function limparFiltrosAvancados() {
    setCategoriaId('');

    if (abaRanking === 'regiao') {
      setEstadoRegiao('');
      setCidadeRegiao('');
      setBairroRegiao('');
      atualizarParametros(abaRanking, grupoId, competicaoId, '', '', '', '');
      return;
    }

    atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, '');
  }

  function aplicarFiltrosAvancados() {
    setFiltrosAbertos(false);
  }

  function abrirAtleta(item, grupo) {
    navegarParaPerfilAtleta(item, {
      state: {
        atletaRanking: item,
        grupoRanking: grupo
      }
    });
  }

  async function abrirDupla(item) {
    setCarregandoDetalhe(true);
    setErro('');
    try {
      const detalhe = await rankingServico.obterDupla(item.id, {
        grupoId: abaRanking === 'grupos' ? grupoId : '',
        periodo: periodoRanking
      });
      setDetalheRanking({ tipo: 'dupla', dados: detalhe });
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  async function abrirGrupo(item) {
    setCarregandoDetalhe(true);
    setErro('');
    try {
      const detalhe = await rankingServico.obterGrupoRanking(item.grupoId, {
        periodo: periodoRanking
      });
      setDetalheRanking({ tipo: 'grupo', dados: detalhe });
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  return (
    <section className="pagina pagina-ranking ranking-app">
      <AppHero
        title="Rankings"
        subtitle="Veja sua evolução e a da comunidade."
        actions={
          <CompartilharRankingBotao
            contexto={resumoFiltro}
            titulo="Ranking QuebraNunca"
            ranking={rankingCompartilhavel}
          />
        }
        autenticado={autenticado}
        showAccountActions={autenticado}
        variant="page"
      />

      <nav className="ranking-visao-tabs" aria-label="Visões do ranking">
        {VISOES_RANKING.map(({ valor, rotulo, descricao, Icone, disponivel }) => (
          <button
            key={valor}
            type="button"
            className={visaoRanking === valor ? 'ativo' : ''}
            onClick={() => selecionarVisao(valor)}
            aria-pressed={visaoRanking === valor}
          >
            <Icone aria-hidden="true" />
            <span>{rotulo}</span>
            <small>{disponivel ? descricao : 'Em breve'}</small>
          </button>
        ))}
      </nav>

      <section className="ranking-filtros-shell">
        <div className="ranking-contexto-linha">
          <label className="ranking-contexto-seletor">
            <span className="sr-only">Contexto do ranking</span>
            <FaFutbol aria-hidden="true" />
            <select
              aria-label="Contexto do ranking"
              value={abaRanking}
              onChange={(evento) => selecionarAba(evento.target.value)}
            >
              {opcoesContexto.map((aba) => (
                <option key={aba.valor} value={aba.valor}>{aba.rotulo}</option>
              ))}
            </select>
            <FaChevronDown className="ranking-contexto-seta" aria-hidden="true" />
          </label>
          <button
            type="button"
            className="botao-secundario botao-compacto"
            onClick={() => setFiltrosAbertos(true)}
            aria-expanded={filtrosAbertos}
            aria-label={`Abrir filtros do ranking: ${filtroPrincipal}`}
          >
            <FaFilter aria-hidden="true" /> Filtros
          </button>
        </div>

        {filtrosAbertos && (
          <div className="ranking-filtros-backdrop" onClick={() => setFiltrosAbertos(false)}>
            <section
              className="ranking-filtros ranking-filtros-painel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ranking-filtros-titulo"
              onClick={(evento) => evento.stopPropagation()}
            >
              <div className="ranking-filtros-topo">
                <div>
                  <span>{visaoAtual.rotulo}</span>
                  <h2 id="ranking-filtros-titulo">Filtros</h2>
                </div>
                <button
                  type="button"
                  className="botao-terciario botao-compacto"
                  onClick={() => setFiltrosAbertos(false)}
                  aria-label="Fechar filtros"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>

              {abaRanking === 'grupos' && (
                <label>
                  Grupo
                  <select value={grupoId} onChange={(evento) => selecionarGrupo(evento.target.value)}>
                    <option value="">Selecione</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
                    ))}
                  </select>
                </label>
              )}

              {abaRanking === 'competicoes' && (
                <>
                  <label>
                    Competição
                    <select value={competicaoId} onChange={(evento) => selecionarCompeticao(evento.target.value)}>
                      <option value="">Selecione</option>
                      {competicoes.map((competicao) => (
                        <option key={competicao.id} value={competicao.id}>{competicao.nome}</option>
                      ))}
                    </select>
                  </label>

                  {categoriasRanking.length > 0 && (
                    <label>
                      Categoria
                      <select value={categoriaId} onChange={(evento) => selecionarCategoria(evento.target.value)}>
                        <option value="">Todas as categorias</option>
                        {categoriasRanking.map((categoria) => (
                          <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}

              {abaRanking === 'regiao' && (
                <div className="ranking-regiao-grid">
                  <label>
                    Estado
                    <select value={estadoRegiao} onChange={(evento) => selecionarEstadoRegiao(evento.target.value)}>
                      <option value="">Todos</option>
                      {(regioes.estados || []).map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Cidade
                    <select value={cidadeRegiao} onChange={(evento) => selecionarCidadeRegiao(evento.target.value)}>
                      <option value="">Todas</option>
                      {cidadesRegiao.map((cidade) => (
                        <option key={cidade} value={cidade}>{cidade}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Bairro
                    <select value={bairroRegiao} onChange={(evento) => selecionarBairroRegiao(evento.target.value)}>
                      <option value="">Todos</option>
                      {bairrosRegiao.map((bairro) => (
                        <option key={bairro} value={bairro}>{bairro}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {abaRanking === 'geral' && (
                <p className="texto-ajuda">Ranking consolidado de todas as partidas registradas.</p>
              )}

              <label>
                Período
                <select value={periodoRanking} onChange={(evento) => selecionarPeriodo(evento.target.value)}>
                  {PERIODOS_RANKING.map((periodo) => (
                    <option key={periodo.valor || 'todos'} value={periodo.valor}>{periodo.rotulo}</option>
                  ))}
                </select>
              </label>

              <div className="ranking-filtros-acoes">
                <button type="button" className="botao-secundario" onClick={limparFiltrosAvancados}>
                  Limpar filtros
                </button>
                <button type="button" className="botao-primario" onClick={aplicarFiltrosAvancados}>
                  Aplicar filtros
                </button>
              </div>
            </section>
          </div>
        )}
      </section>

      {erro && <p className="texto-erro">{erro}</p>}

      {carregandoBase || carregandoRanking ? (
        <div className="ranking-estado">Carregando ranking...</div>
      ) : visaoRanking === 'atletas' && rankingComAtletas.length === 0 ? (
        <div className="ranking-estado">Nenhuma pontuação encontrada para o filtro selecionado.</div>
      ) : visaoRanking === 'atletas' ? (
        <div className="ranking-secoes">
          {rankingComAtletas.map((grupo) => (
            <RankingSecao
              key={grupo.chave}
              grupo={grupo}
              abaRanking={abaRanking}
              abrirAtleta={abrirAtleta}
            />
          ))}
        </div>
      ) : rankingEntidadeFiltrado.length === 0 ? (
        <div className="ranking-estado">Nenhuma pontuação encontrada para o filtro selecionado.</div>
      ) : (
        <div className="ranking-secoes">
          {visaoRanking === 'duplas' ? (
            <RankingDuplasSecao
              itens={rankingEntidadeFiltrado}
              total={totalEntidade}
              abrirDupla={abrirDupla}
            />
          ) : (
            <RankingGruposSecao
              itens={rankingEntidadeFiltrado}
              total={totalEntidade}
              abrirGrupo={abrirGrupo}
            />
          )}
        </div>
      )}

      {carregandoDetalhe && <div className="ranking-estado">Carregando detalhes...</div>}

      {detalheRanking && (
        <RankingDetalheModal
          detalhe={detalheRanking}
          onClose={() => setDetalheRanking(null)}
        />
      )}
    </section>
  );
}

function RankingSecao({ grupo, abaRanking, abrirAtleta }) {
  const top3 = grupo.atletas.slice(0, 3);
  const restante = grupo.atletas.slice(3);
  const cabecalho = obterCabecalhoSecao(grupo, abaRanking);

  return (
    <section className="ranking-secao">
      <div className="ranking-secao-titulo">
        <div>
          <span>{cabecalho.label}</span>
          <h3>{cabecalho.titulo}</h3>
        </div>
        {grupo.genero && <small>{generos[grupo.genero] || 'Categoria'}</small>}
      </div>

      {top3.length > 0 && (
        <section className="ranking-destaques" aria-label="Top 3 do ranking">
          <div className="ranking-subsecao-titulo">
            <span>Destaques</span>
          </div>

          <div className={`ranking-podio-premium quantidade-${top3.length}`}>
            {ordenarTop3(top3).map((item) => (
              <AtletaPodioCard
                key={item.atletaId}
                item={item}
                destaque={item.posicao === 1}
                onClick={() => abrirAtleta(item, grupo)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="ranking-completo" aria-label="Ranking completo">
        <div className="ranking-subsecao-titulo">
          <span>Ranking completo</span>
          <small>{grupo.atletas.length} atletas</small>
        </div>

        {restante.length > 0 ? (
          <div className="ranking-lista-compacta">
            {restante.map((item) => (
              <AtletaRankingLinha
                key={item.atletaId}
                item={item}
                exibirRegiao={abaRanking === 'regiao'}
                onClick={() => abrirAtleta(item, grupo)}
              />
            ))}
          </div>
        ) : (
          <p className="ranking-lista-vazia">Os atletas disponíveis já aparecem nos destaques.</p>
        )}
      </section>
    </section>
  );
}

function RankingDuplasSecao({ itens, total, abrirDupla }) {
  return (
    <section className="ranking-secao ranking-entidade-secao">
      <div className="ranking-secao-titulo">
        <div>
          <span>Ranking de duplas</span>
          <h3>Duplas</h3>
        </div>
        <small>{total} duplas</small>
      </div>

      <div className="ranking-lista-compacta">
        {itens.map((item) => (
          <DuplaRankingLinha
            key={item.id}
            item={item}
            onClick={() => abrirDupla(item)}
          />
        ))}
      </div>
    </section>
  );
}

function RankingGruposSecao({ itens, total, abrirGrupo }) {
  return (
    <section className="ranking-secao ranking-entidade-secao">
      <div className="ranking-secao-titulo">
        <div>
          <span>Ranking de grupos</span>
          <h3>Grupos</h3>
        </div>
        <small>{total} grupos</small>
      </div>

      <div className="ranking-lista-compacta">
        {itens.map((item) => (
          <GrupoRankingLinha
            key={item.grupoId}
            item={item}
            onClick={() => abrirGrupo(item)}
          />
        ))}
      </div>
    </section>
  );
}

function DuplaRankingLinha({ item, onClick }) {
  const sequencia = item.sequenciaAtual?.texto || 'Sem sequência';

  return (
    <button
      type="button"
      className="ranking-linha-compacta ranking-linha-dupla"
      onClick={onClick}
      aria-label={`Abrir detalhes da dupla ${montarNomeDuplaRanking(item)}`}
    >
      <span className="ranking-linha-posicao">#{item.posicao}</span>
      <span className="ranking-avatar-dupla" aria-hidden="true">
        <AvatarUsuario
          nome={obterNomeResumoAtleta(item.atleta1)}
          fotoPerfilUrl={item.atleta1?.fotoPerfilUrl}
          tamanho="sm"
          className="ranking-avatar"
        />
        <AvatarUsuario
          nome={obterNomeResumoAtleta(item.atleta2)}
          fotoPerfilUrl={item.atleta2?.fotoPerfilUrl}
          tamanho="sm"
          className="ranking-avatar"
        />
      </span>
      <span className="ranking-linha-info">
        <strong>{montarNomeDuplaRanking(item)}</strong>
        <small>{formatarPercentual(item.aproveitamento)} aproveitamento • {item.vitorias}V • {item.derrotas}D</small>
        <small>{sequencia} • último jogo {formatarDataCurta(item.ultimoJogo)}</small>
        {item.grupoPrincipal && <small>{item.grupoPrincipal}</small>}
      </span>
      <span className="ranking-linha-pontos">
        <strong>{formatarPontuacao(item.pontosRanking)}</strong>
        <small>pts</small>
      </span>
      <FaChevronRight className="ranking-linha-seta" aria-hidden="true" />
    </button>
  );
}

function GrupoRankingLinha({ item, onClick }) {
  return (
    <button
      type="button"
      className="ranking-linha-compacta ranking-linha-grupo"
      onClick={onClick}
      aria-label={`Abrir detalhes do grupo ${item.nome}`}
    >
      <span className="ranking-linha-posicao">#{item.posicao}</span>
      <AvatarUsuario
        nome={item.nome}
        fotoPerfilUrl={item.fotoUrl}
        tamanho="md"
        className="ranking-avatar"
      />
      <span className="ranking-linha-info">
        <strong>{item.nome}</strong>
        {item.cidade && <span className="ranking-status-dot ativo">{item.cidade}</span>}
        <small>{item.quantidadePartidas} partidas • {item.quantidadeAtletas} atletas • {item.atletasAtivos} ativos</small>
        <small>Última partida {formatarDataCurta(item.ultimaPartida)}</small>
      </span>
      <span className="ranking-linha-pontos">
        <strong>{formatarPontuacao(item.pontuacaoRanking)}</strong>
        <small>pts</small>
      </span>
      <FaChevronRight className="ranking-linha-seta" aria-hidden="true" />
    </button>
  );
}

function RankingDetalheModal({ detalhe, onClose }) {
  return (
    <div className="ranking-filtros-backdrop" onClick={onClose}>
      <section
        className="ranking-detalhe-painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ranking-detalhe-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="ranking-filtros-topo">
          <div>
            <span>{detalhe.tipo === 'dupla' ? 'Detalhe da dupla' : 'Detalhe do grupo'}</span>
            <h2 id="ranking-detalhe-titulo">
              {detalhe.tipo === 'dupla'
                ? montarNomeDuplaRanking(detalhe.dados?.resumo)
                : detalhe.dados?.nome}
            </h2>
          </div>
          <button
            type="button"
            className="botao-terciario botao-compacto"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        {detalhe.tipo === 'dupla' ? (
          <DetalheDupla dados={detalhe.dados} />
        ) : (
          <DetalheGrupo dados={detalhe.dados} />
        )}
      </section>
    </div>
  );
}

function DetalheDupla({ dados }) {
  const resumo = dados?.resumo || {};

  return (
    <div className="ranking-detalhe-conteudo">
      <div className="ranking-detalhe-avatar-dupla">
        <AvatarUsuario nome={obterNomeResumoAtleta(resumo.atleta1)} fotoPerfilUrl={resumo.atleta1?.fotoPerfilUrl} tamanho="lg" />
        <AvatarUsuario nome={obterNomeResumoAtleta(resumo.atleta2)} fotoPerfilUrl={resumo.atleta2?.fotoPerfilUrl} tamanho="lg" />
      </div>
      <div className="ranking-detalhe-metricas">
        <RankingMetrica rotulo="Posição" valor={`#${resumo.posicao || '-'}`} />
        <RankingMetrica rotulo="Pontuação" valor={formatarPontuacao(resumo.pontosRanking)} />
        <RankingMetrica rotulo="Jogos" valor={resumo.jogos || 0} />
        <RankingMetrica rotulo="Vitórias" valor={resumo.vitorias || 0} />
        <RankingMetrica rotulo="Derrotas" valor={resumo.derrotas || 0} />
        <RankingMetrica rotulo="Aproveitamento" valor={formatarPercentual(resumo.aproveitamento)} />
        <RankingMetrica rotulo="Sequência" valor={resumo.sequenciaAtual?.texto || 'Sem jogos'} />
        <RankingMetrica rotulo="Saldo" valor={resumo.saldo ?? 'Sem placar'} />
      </div>

      <RankingDetalheLista titulo="Últimos jogos" itens={dados?.ultimosJogos} renderItem={renderizarJogoDupla} />
      <RankingDetalheLista titulo="Principais adversários" itens={dados?.principaisAdversarios} renderItem={renderizarAdversarioDupla} />
      <RankingDetalheLista titulo="Grupos onde jogou" itens={dados?.grupos} renderItem={renderizarGrupoDupla} />
    </div>
  );
}

function DetalheGrupo({ dados }) {
  return (
    <div className="ranking-detalhe-conteudo">
      <div className="ranking-detalhe-grupo-topo">
        <AvatarUsuario nome={dados?.nome} fotoPerfilUrl={dados?.fotoUrl} tamanho="lg" />
        <div>
          <strong>{dados?.nome}</strong>
          <small>{dados?.cidade || 'Comunidade QuebraNunca'} • {dados?.publico ? 'Público' : 'Privado'}</small>
          {dados?.administrador && <small>Admin: {dados.administrador}</small>}
        </div>
      </div>
      {dados?.descricao && <p className="ranking-detalhe-descricao">{dados.descricao}</p>}

      <div className="ranking-detalhe-metricas">
        <RankingMetrica rotulo="Pontuação" valor={formatarPontuacao(dados?.pontuacaoRanking)} />
        <RankingMetrica rotulo="Partidas" valor={dados?.quantidadePartidas || 0} />
        <RankingMetrica rotulo="Atletas" valor={dados?.quantidadeAtletas || 0} />
        <RankingMetrica rotulo="Ativos" valor={dados?.atletasAtivos || 0} />
      </div>

      <button
        type="button"
        className="botao-secundario botao-compacto ranking-detalhe-compartilhar"
        onClick={() => compartilharGrupoRanking(dados)}
      >
        Compartilhar
      </button>

      <RankingDetalheLista titulo="Últimos jogos" itens={dados?.ultimosJogos} renderItem={renderizarJogoGrupo} />
      <RankingDetalheLista titulo="Top atletas" itens={dados?.topAtletas} renderItem={renderizarTopAtletaGrupo} />
      <RankingDetalheLista titulo="Top duplas" itens={dados?.topDuplas} renderItem={renderizarTopDuplaGrupo} />
      <RankingDetalheLista titulo="Evolução mensal" itens={dados?.evolucaoMensal} renderItem={renderizarEvolucaoGrupo} />
    </div>
  );
}

function RankingMetrica({ rotulo, valor }) {
  return (
    <div className="ranking-detalhe-metrica">
      <strong>{valor}</strong>
      <span>{rotulo}</span>
    </div>
  );
}

function RankingDetalhePartidaLink({ item, children }) {
  const partidaId = item?.partidaId || item?.id;

  if (!partidaId) {
    return <>{children}</>;
  }

  return (
    <Link
      to={obterRotaDetalhePartida(partidaId)}
      className="ranking-detalhe-link"
      aria-label="Abrir detalhes da partida"
    >
      <span>{children}</span>
      <FaChevronRight aria-hidden="true" />
    </Link>
  );
}

function RankingDetalheLista({ titulo, itens = [], renderItem }) {
  return (
    <section className="ranking-detalhe-lista">
      <div className="ranking-subsecao-titulo">
        <span>{titulo}</span>
      </div>
      {(itens || []).length > 0 ? (
        <div>
          {itens.map((item, indice) => (
            <div key={item.partidaId || item.id || item.grupoId || `${titulo}-${indice}`} className="ranking-detalhe-item">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="ranking-lista-vazia">Sem dados suficientes para este bloco.</p>
      )}
    </section>
  );
}

function renderizarJogoDupla(item) {
  return (
    <RankingDetalhePartidaLink item={item}>
      <strong>{item.contexto}</strong>
      <small>{item.resultado} • {item.possuiPlacar ? item.placar : 'sem placar'} • {formatarDataCurta(item.dataPartida)}</small>
      <small>vs {item.duplaAdversaria}</small>
    </RankingDetalhePartidaLink>
  );
}

function renderizarAdversarioDupla(item) {
  return (
    <>
      <strong>{item.nome}</strong>
      <small>{item.jogos} jogos • {item.vitorias}V • {item.derrotas}D • {formatarPercentual(item.aproveitamento)}</small>
    </>
  );
}

function renderizarGrupoDupla(item) {
  return (
    <>
      <strong>{item.nome}</strong>
      <small>{item.jogos} jogos • {item.vitorias}V • {formatarPercentual(item.aproveitamento)}</small>
    </>
  );
}

function renderizarJogoGrupo(item) {
  return (
    <RankingDetalhePartidaLink item={item}>
      <strong>{item.duplaA} x {item.duplaB}</strong>
      <small>{item.resultado} • {item.possuiPlacar ? item.placar : 'sem placar'} • {formatarDataCurta(item.dataPartida)}</small>
    </RankingDetalhePartidaLink>
  );
}

function renderizarTopAtletaGrupo(item) {
  return (
    <>
      <strong>#{item.posicao} {obterNomeExibicaoAtleta(item)}</strong>
      <small>{formatarPontuacao(item.pontos)} pts • {item.vitorias}V • {item.jogos} jogos</small>
    </>
  );
}

function renderizarTopDuplaGrupo(item) {
  return (
    <>
      <strong>#{item.posicao} {montarNomeDuplaRanking(item)}</strong>
      <small>{formatarPontuacao(item.pontosRanking)} pts • {item.vitorias}V • {item.jogos} jogos</small>
    </>
  );
}

function renderizarEvolucaoGrupo(item) {
  return (
    <>
      <strong>{String(item.mes).padStart(2, '0')}/{item.ano}</strong>
      <small>{item.partidas} partidas • {item.atletasAtivos} ativos • {formatarPontuacao(item.pontuacaoRanking)} pts</small>
    </>
  );
}

async function compartilharGrupoRanking(dados) {
  if (!dados) {
    return;
  }

  const texto = `${dados.nome} no Ranking QuebraNunca: ${formatarPontuacao(dados.pontuacaoRanking)} pts, ${dados.quantidadePartidas || 0} partidas e ${dados.atletasAtivos || 0} atletas ativos.`;
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Ranking ${dados.nome}`,
        text: texto
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
    }
  } catch {
    // Compartilhamento e clipboard dependem do navegador; a tela segue utilizavel se forem bloqueados.
  }
}

function AtletaPodioCard({ item, destaque, onClick }) {
  const status = obterStatusVisual(item);

  return (
    <button
      type="button"
      className={`ranking-podio-card ${destaque ? 'destaque' : ''}`}
      onClick={onClick}
      aria-label={`Abrir dashboard de ${obterNomeExibicaoAtleta(item)}`}
    >
      <span className="ranking-posicao-premium">{item.posicao}º</span>
      <AvatarAtleta item={item} destaque={destaque} />
      <strong>{obterNomeExibicaoAtleta(item)}</strong>
      <span className={`ranking-status-dot ${status.classe}`}>{status.texto}</span>
      <div className="ranking-podio-pontos">
        <strong>{formatarPontuacao(item.pontos)}</strong>
        <span>pts</span>
      </div>
      <div className="ranking-podio-stats">
        <span>{item.jogos} jogos</span>
        <span>{item.vitorias}V</span>
        <span>{item.derrotas}D</span>
      </div>
    </button>
  );
}

function AtletaRankingLinha({ item, exibirRegiao, onClick }) {
  const status = obterStatusVisual(item);

  return (
    <button
      type="button"
      className="ranking-linha-compacta"
      onClick={onClick}
      aria-label={`Abrir dashboard de ${obterNomeExibicaoAtleta(item)}`}
    >
      <span className="ranking-linha-posicao">#{item.posicao}</span>
      <AvatarAtleta item={item} />
      <span className="ranking-linha-info">
        <strong>{obterNomeExibicaoAtleta(item)}</strong>
        <span className={`ranking-status-dot ${status.classe}`}>{status.texto}</span>
        {exibirRegiao && formatarRegiaoAtleta(item) && <small>{formatarRegiaoAtleta(item)}</small>}
        <small>{item.jogos} jogos • {item.vitorias} vitórias • {item.derrotas} derrotas</small>
      </span>
      <span className="ranking-linha-pontos">
        <strong>{formatarPontuacao(item.pontos)}</strong>
        <small>pts</small>
      </span>
      <FaChevronRight className="ranking-linha-seta" aria-hidden="true" />
    </button>
  );
}

function AvatarAtleta({ item, destaque = false }) {
  return (
    <AvatarUsuario
      nome={obterNomeExibicaoAtleta(item)}
      fotoPerfilUrl={obterFotoPerfilAvatar(item)}
      tamanho={destaque ? 'lg' : 'md'}
      className={`ranking-avatar ${destaque ? 'destaque' : ''}`}
    />
  );
}

function normalizarTipoUrl(tipo) {
  if (tipo === 'competicao') {
    return 'grupos';
  }

  if (ABAS_RANKING.some((aba) => aba.valor === tipo)) {
    return tipo;
  }

  return '';
}
