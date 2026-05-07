import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { categoriasServico } from '../services/categoriasServico';
import { competicoesServico } from '../services/competicoesServico';
import { formatosCampeonatoServico } from '../services/formatosCampeonatoServico';
import { inscricoesCampeonatoServico } from '../services/inscricoesCampeonatoServico';
import { ligasServico } from '../services/ligasServico';
import { locaisServico } from '../services/locaisServico';
import { regrasCompeticaoServico } from '../services/regrasCompeticaoServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { extrairMensagemErro } from '../utils/erros';
import { formatarData, paraInputData } from '../utils/formatacao';
import { abrirLinkExterno, obterLinkHttp } from '../utils/links';
import { ehAtleta, ehGestorCompeticao, PERFIS_USUARIO } from '../utils/perfis';
import { rolarParaElemento, rolarParaTopo } from '../utils/rolagem';
import { obterNomeExibicaoDupla, obterNomeExibicaoDuplaCampos } from '../utils/atletaUtils';

function obterDataAtualInput() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

const TIPOS_COMPETICAO = {
  campeonato: 1,
  evento: 2,
  grupo: 3,
  partidasAvulsas: 4
};

const NOME_COMPETICAO_PARTIDAS_AVULSAS = 'Partidas avulsas';

function ehCompeticaoPartidasAvulsas(competicao) {
  const tipoCompeticao = Number(competicao?.tipo || 0);
  const nomeCompeticao = (competicao?.nome || '').trim().toLowerCase();

  return tipoCompeticao === TIPOS_COMPETICAO.partidasAvulsas
    || (tipoCompeticao === TIPOS_COMPETICAO.grupo && nomeCompeticao === NOME_COMPETICAO_PARTIDAS_AVULSAS.toLowerCase());
}

function criarEstadoInicialCompeticao() {
  return {
    nome: '',
    tipo: String(TIPOS_COMPETICAO.campeonato),
    descricao: '',
    link: '',
    dataInicio: '',
    dataFim: '',
    ligaId: '',
    localId: '',
    formatoCampeonatoId: '',
    regraCompeticaoId: '',
    inscricoesAbertas: true,
    possuiFinalReset: true
  };
}

const opcoesGenero = [
  { valor: 1, rotulo: 'Masculino' },
  { valor: 2, rotulo: 'Feminino' },
  { valor: 3, rotulo: 'Misto' }
];

const opcoesNivel = [
  { valor: 1, rotulo: 'Estreante' },
  { valor: 2, rotulo: 'Iniciante' },
  { valor: 3, rotulo: 'Intermediário' },
  { valor: 4, rotulo: 'Amador' },
  { valor: 5, rotulo: 'Profissional' },
  { valor: 6, rotulo: 'Livre' }
];

const filtrosIniciais = {
  competicaoId: '',
  categoria: ''
};

export function PaginaCompeticoes() {
  const { token, usuario, estadoAcesso } = useAutenticacao();

  const gestorCompeticao = ehGestorCompeticao(usuario);
  const usuarioAtleta = ehAtleta(usuario);
  const usuarioAdministrador = Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  const usuarioAtivo = estadoAcesso === ESTADOS_ACESSO.ativo;
  const podeCriarCompeticao = usuarioAtivo && (gestorCompeticao || usuarioAtleta);

  const [competicoes, setCompeticoes] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [locais, setLocais] = useState([]);
  const [formatosCampeonato, setFormatosCampeonato] = useState([]);
  const [regras, setRegras] = useState([]);
  const [regrasDisponiveis, setRegrasDisponiveis] = useState(true);
  const [formulario, setFormulario] = useState(() => criarEstadoInicialCompeticao());
  const [formularioCompeticaoAberto, setFormularioCompeticaoAberto] = useState(false);
  const [deveRolarParaFormularioCompeticao, setDeveRolarParaFormularioCompeticao] = useState(false);
  const [competicaoEdicaoId, setCompeticaoEdicaoId] = useState(null);
  const [categoriasFormulario, setCategoriasFormulario] = useState([]);
  const [carregandoCategoriasFormulario, setCarregandoCategoriasFormulario] = useState(false);
  const [categoriasPorCompeticao, setCategoriasPorCompeticao] = useState({});
  const [carregandoCategoriasCompeticoes, setCarregandoCategoriasCompeticoes] = useState(false);
  const [quantidadeInscricoesPorCategoria, setQuantidadeInscricoesPorCategoria] = useState({});
  const [categoriaInscricoesAbertaId, setCategoriaInscricoesAbertaId] = useState(null);
  const [inscricoesCategoria, setInscricoesCategoria] = useState([]);
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [carregandoInscricoesCategoria, setCarregandoInscricoesCategoria] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sorteandoCategoriaId, setSorteandoCategoriaId] = useState(null);

  const formularioCompeticaoRef = useRef(null);
  const navegar = useNavigate();

  const filtroAtivo = Boolean(filtros.competicaoId || filtros.categoria);

  const campeonatosDisponiveis = useMemo(() => {
    return competicoes.filter((competicao) => Number(competicao.tipo) === TIPOS_COMPETICAO.campeonato);
  }, [competicoes]);

  const categoriasDaCompeticaoSelecionada = filtros.competicaoId
    ? categoriasPorCompeticao[filtros.competicaoId] || []
    : [];

  const categoriasVisiveisPorCompeticao = useMemo(() => {
    if (!filtros.categoria) {
      return categoriasPorCompeticao;
    }

    return Object.fromEntries(
      Object.entries(categoriasPorCompeticao).map(([competicaoId, categorias]) => [
        competicaoId,
        categorias.filter((categoria) => categoria.id === filtros.categoria)
      ])
    );
  }, [categoriasPorCompeticao, filtros.categoria]);

  const competicoesFiltradas = useMemo(() => {
    const competicaoId = filtros.competicaoId;
    const categoriaId = filtros.categoria;

    return competicoes.filter((competicao) => {
      const categoriasCompeticao = categoriasPorCompeticao[competicao.id] || [];

      const correspondeACompeticao = !competicaoId || competicao.id === competicaoId;
      const correspondeACategoria = !categoriaId || categoriasCompeticao.some((categoria) => categoria.id === categoriaId);

      return correspondeACompeticao && correspondeACategoria;
    });
  }, [categoriasPorCompeticao, competicoes, filtros.categoria, filtros.competicaoId]);

  useEffect(() => {
    carregarCompeticoes();
  }, [gestorCompeticao, usuarioAtleta, usuarioAtivo]);

  useEffect(() => {
    if (!competicaoEdicaoId) {
      setCategoriasFormulario([]);
      setCarregandoCategoriasFormulario(false);
      return;
    }

    carregarCategoriasFormulario(competicaoEdicaoId);
  }, [competicaoEdicaoId]);

  useEffect(() => {
    if (!deveRolarParaFormularioCompeticao || !formularioCompeticaoAberto) {
      return;
    }

    rolarParaElemento(formularioCompeticaoRef.current);
    setDeveRolarParaFormularioCompeticao(false);
  }, [deveRolarParaFormularioCompeticao, formularioCompeticaoAberto]);

  function formatoEfetivoDaCompeticaoEhChaveDuplaEliminacao(formatoCampeonatoId) {
    if (!formatoCampeonatoId) {
      return true;
    }

    const formatoSelecionado = formatosCampeonato.find((formato) => formato.id === formatoCampeonatoId);

    return Boolean(
      formatoSelecionado &&
      formatoSelecionado.tipoFormato === 3 &&
      Number(formatoSelecionado.quantidadeDerrotasParaEliminacao) === 2
    );
  }

  function podeGerenciarCompeticao(competicao) {
    if (!usuarioAtivo) {
      return false;
    }

    if (usuarioAdministrador) {
      return true;
    }

    if (Number(usuario?.perfil) === PERFIS_USUARIO.organizador) {
      return competicao.usuarioOrganizadorId === usuario?.id;
    }

    return false;
  }

  function podeSortearJogosCompeticao(competicao) {
    return usuarioAtivo && (
      Number(usuario?.perfil) === PERFIS_USUARIO.administrador ||
      (Number(usuario?.perfil) === PERFIS_USUARIO.organizador && competicao.usuarioOrganizadorId === usuario?.id)
    );
  }

  function categoriaEhChaveDuplaEliminacao(categoria) {
    const formatoEfetivoId = categoria.formatoCampeonatoEfetivoId || categoria.formatoCampeonatoId || '';
    const formato = formatosCampeonato.find((item) => item.id === formatoEfetivoId);

    return Boolean(
      formato &&
      Number(formato.tipoFormato) === 3 &&
      Number(formato.quantidadeDerrotasParaEliminacao) === 2
    );
  }

  function inscricoesFechadasParaGerarChaveamento(competicao, categoria) {
    return Boolean(categoria.inscricoesEncerradas || !competicao.inscricoesAbertas);
  }

  function atualizarFiltro(campo, valor) {
    setFiltros((anteriores) => {
      const proximos = { ...anteriores, [campo]: valor };

      if (campo === 'competicaoId') {
        proximos.categoria = '';
      }

      return proximos;
    });
  }

  function limparFiltros() {
    setFiltros(filtrosIniciais);
  }

  async function carregarCompeticoes() {
    setCarregando(true);
    setErro('');
    setAviso('');

    try {
      const avisos = [];
      const listaCompeticoes = await competicoesServico.listarVisiveis();

      const campeonatosVisiveis = listaCompeticoes
        .filter((competicao) => !ehCompeticaoPartidasAvulsas(competicao))
        .filter((competicao) => Number(competicao.tipo) === TIPOS_COMPETICAO.campeonato);

      setCompeticoes(campeonatosVisiveis);
      await carregarCategoriasCompeticoes(campeonatosVisiveis);

      if (gestorCompeticao && usuarioAtivo) {
        try {
          const listaFormatos = await formatosCampeonatoServico.listar();
          setFormatosCampeonato(listaFormatos.filter((formato) => formato.ativo));
        } catch (error) {
          setFormatosCampeonato([]);
          avisos.push(`Não foi possível carregar os formatos de competição: ${extrairMensagemErro(error)}`);
        }
      } else {
        setFormatosCampeonato([]);
      }

      if (!gestorCompeticao || !usuarioAtivo) {
        setLigas([]);
        setLocais([]);
        setRegras([]);
        setRegrasDisponiveis(false);
        setAviso(avisos.join(' '));
        return;
      }

      const [listaLigas, listaLocais] = await Promise.all([
        ligasServico.listar(),
        locaisServico.listar()
      ]);

      setLigas(listaLigas);
      setLocais(listaLocais);

      try {
        const listaRegras = await regrasCompeticaoServico.listar();
        setRegras(listaRegras);
        setRegrasDisponiveis(true);
      } catch (error) {
        setRegras([]);
        setRegrasDisponiveis(false);

        if (error?.response?.status === 404) {
          avisos.push('O cadastro de regras não está disponível nesta API. As competições continuam usando a regra padrão.');
        } else {
          avisos.push(`Não foi possível carregar as regras de competição: ${extrairMensagemErro(error)}`);
        }
      }

      setAviso(avisos.join(' '));
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function carregarCategoriasCompeticoes(listaCompeticoes) {
    if (listaCompeticoes.length === 0) {
      setCategoriasPorCompeticao({});
      setQuantidadeInscricoesPorCategoria({});
      setCarregandoCategoriasCompeticoes(false);
      return;
    }

    setCarregandoCategoriasCompeticoes(true);

    try {
      const categoriasCarregadas = await Promise.all(
        listaCompeticoes.map(async (competicao) => {
          const categorias = await categoriasServico.listarPorCompeticao(competicao.id);
          return [competicao.id, categorias];
        })
      );

      const categoriasMap = Object.fromEntries(categoriasCarregadas);
      setCategoriasPorCompeticao(categoriasMap);

      const contagensInscricoes = await Promise.all(
        listaCompeticoes.flatMap((competicao) => (
          (categoriasMap[competicao.id] || []).map(async (categoria) => {
            const inscricoes = await inscricoesCampeonatoServico.listarPorCampeonato(competicao.id, categoria.id);
            return [categoria.id, inscricoes.length];
          })
        ))
      );

      setQuantidadeInscricoesPorCategoria(Object.fromEntries(contagensInscricoes));
    } catch (error) {
      setCategoriasPorCompeticao({});
      setQuantidadeInscricoesPorCategoria({});
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoCategoriasCompeticoes(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => {
      const proximo = { ...anterior, [campo]: valor };

      if (
        campo === 'formatoCampeonatoId' &&
        !formatoEfetivoDaCompeticaoEhChaveDuplaEliminacao(valor)
      ) {
        proximo.possuiFinalReset = false;
      }

      return proximo;
    });
  }

  async function carregarCategoriasFormulario(competicaoId) {
    setCarregandoCategoriasFormulario(true);

    try {
      const lista = await categoriasServico.listarPorCompeticao(competicaoId);
      setCategoriasFormulario(lista);
    } catch (error) {
      setCategoriasFormulario([]);
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoCategoriasFormulario(false);
    }
  }

  function iniciarEdicao(competicao) {
    setFormularioCompeticaoAberto(true);
    setDeveRolarParaFormularioCompeticao(true);
    setCompeticaoEdicaoId(competicao.id);

    setFormulario({
      nome: competicao.nome,
      tipo: String(TIPOS_COMPETICAO.campeonato),
      descricao: competicao.descricao || '',
      link: competicao.link || '',
      dataInicio: paraInputData(competicao.dataInicio),
      dataFim: paraInputData(competicao.dataFim),
      ligaId: competicao.ligaId || '',
      localId: competicao.localId || '',
      formatoCampeonatoId: competicao.formatoCampeonatoId || '',
      regraCompeticaoId: competicao.regraCompeticaoId || '',
      inscricoesAbertas: Boolean(competicao.inscricoesAbertas),
      possuiFinalReset: Boolean(competicao.possuiFinalReset)
    });
  }

  function cancelarEdicao() {
    setFormularioCompeticaoAberto(false);
    setDeveRolarParaFormularioCompeticao(false);
    setCompeticaoEdicaoId(null);
    setCategoriasFormulario([]);
    setCarregandoCategoriasFormulario(false);
    setFormulario(criarEstadoInicialCompeticao());
  }

  function abrirFormularioCompeticao() {
    setCompeticaoEdicaoId(null);
    setCategoriasFormulario([]);
    setCarregandoCategoriasFormulario(false);
    setFormulario(criarEstadoInicialCompeticao());
    setFormularioCompeticaoAberto(true);
    setDeveRolarParaFormularioCompeticao(true);
  }

  async function alternarInscricoesCategoria(competicaoId, categoriaId) {
    if (categoriaInscricoesAbertaId === categoriaId) {
      setCategoriaInscricoesAbertaId(null);
      setInscricoesCategoria([]);
      return;
    }

    setErro('');
    setCarregandoInscricoesCategoria(true);

    try {
      const lista = await inscricoesCampeonatoServico.listarPorCampeonato(competicaoId, categoriaId);
      setCategoriaInscricoesAbertaId(categoriaId);
      setInscricoesCategoria(lista);
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setCategoriaInscricoesAbertaId(null);
      setInscricoesCategoria([]);
    } finally {
      setCarregandoInscricoesCategoria(false);
    }
  }

  async function removerCategoria(id) {
    if (!window.confirm('Deseja remover esta categoria?')) {
      return;
    }

    try {
      await categoriasServico.remover(id);
      await carregarCategoriasCompeticoes(competicoes);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    }
  }

  async function sortearJogosCategoria(competicao, categoria, substituirTabelaExistente = false) {
    setErro('');
    setAviso('');
    setSorteandoCategoriaId(categoria.id);

    try {
      const resultado = await categoriasServico.gerarTabelaPartidas(categoria.id, {
        substituirTabelaExistente
      });

      setAviso(resultado.resumo);
      navegar(`/partidas/campeonato?competicaoId=${competicao.id}&categoriaId=${categoria.id}&aba=chaveamento`);
    } catch (error) {
      const mensagemErro = extrairMensagemErro(error);

      if (!substituirTabelaExistente && mensagemErro.toLowerCase().includes('substituição')) {
        const confirmar = window.confirm(
          'Esta categoria já possui uma tabela de jogos gerada. Deseja substituir os confrontos agendados?'
        );

        if (confirmar) {
          await sortearJogosCategoria(competicao, categoria, true);
          return;
        }
      }

      setErro(mensagemErro);
    } finally {
      setSorteandoCategoriaId(null);
    }
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro('');
    setSalvando(true);

    const dados = {
      nome: formulario.nome,
      tipo: TIPOS_COMPETICAO.campeonato,
      descricao: formulario.descricao || null,
      link: formulario.link || null,
      dataInicio: formulario.dataInicio,
      dataFim: formulario.dataFim || null,
      ligaId: formulario.ligaId || null,
      localId: formulario.localId || null,
      formatoCampeonatoId: formulario.formatoCampeonatoId || null,
      regraCompeticaoId: formulario.regraCompeticaoId || null,
      inscricoesAbertas: formulario.inscricoesAbertas,
      possuiFinalReset: formulario.possuiFinalReset
    };

    try {
      if (competicaoEdicaoId) {
        await competicoesServico.atualizar(competicaoEdicaoId, dados);
      } else {
        await competicoesServico.criar(dados);
      }

      cancelarEdicao();
      await carregarCompeticoes();
      setFormularioCompeticaoAberto(false);
      rolarParaTopo();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  function abrirInscricao(competicao, categoria) {
    if (abrirLinkExterno(competicao.link)) {
      return;
    }

    navegar(`/inscricoes?campeonatoId=${competicao.id}&categoriaId=${categoria.id}`);
  }

  async function removerCompeticao(id) {
    if (!window.confirm('Deseja remover este campeonato?')) {
      return;
    }

    try {
      await competicoesServico.remover(id);
      await carregarCompeticoes();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    }
  }

  return (
    <section className="pagina">
      {!formularioCompeticaoAberto && (
        carregando ? (
          <p>Carregando campeonatos...</p>
        ) : (
          <>
            <section className="formulario-grid filtro-competicoes barra-selecao-fixa">
              <div className="partidas-filtro-cabecalho campo-largo">
                <div>
                  <strong>Filtrar campeonatos</strong>
                </div>
              </div>

              <label>
                Competição
                <select
                  value={filtros.competicaoId}
                  onChange={(evento) => atualizarFiltro('competicaoId', evento.target.value)}
                >
                  <option value="">Todos</option>
                  {campeonatosDisponiveis.map((competicao) => (
                    <option key={competicao.id} value={competicao.id}>
                      {competicao.nome}
                    </option>
                  ))}
                </select>
              </label>

              {filtros.competicaoId && (
                <label>
                  Categoria
                  <select
                    value={filtros.categoria}
                    onChange={(evento) => atualizarFiltro('categoria', evento.target.value)}
                    disabled={categoriasDaCompeticaoSelecionada.length === 0}
                  >
                    <option value="">
                      {categoriasDaCompeticaoSelecionada.length === 0 ? 'Nenhuma categoria cadastrada' : 'Todas'}
                    </option>
                    {categoriasDaCompeticaoSelecionada.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </label>
              )}              
            </section>       

            <div className="lista-cartoes">
              {competicoesFiltradas.map((competicao) => {
                const gerenciavel = podeGerenciarCompeticao(competicao);
                const categoriasCadastradasCompeticao = categoriasPorCompeticao[competicao.id] || [];
                const categoriasCompeticao = categoriasVisiveisPorCompeticao[competicao.id] || [];
                const competicaoSemCategoriasCadastradas = categoriasCadastradasCompeticao.length === 0;

                return (
                  <article key={competicao.id} className="formulario-grid ">
                    <div className="competicao-card-conteudo">
                      <div className="competicao-card-cabecalho">
                        <div className="competicao-card-titulo">                        
                          <h3>{competicao.nome}</h3>
                        </div>

                        <span
                          className={`tag-status ${
                            competicao.inscricoesAbertas ? 'tag-status-sucesso' : 'tag-status-alerta'
                          } competicao-card-status`}
                        >
                          {competicao.inscricoesAbertas ? 'Inscrições abertas' : 'Inscrições fechadas'}
                        </span>
                      </div>

                      <div className="competicao-card-detalhes">
                        <p>Início: {formatarData(competicao.dataInicio)}</p>
                        <p>Fim: {formatarData(competicao.dataFim)}</p>                        
                      </div>
                    </div>                    

                    <div className="campo-largo">
                      {carregandoCategoriasCompeticoes ? (
                        <p>Carregando categorias...</p>
                      ) : (
                        <div className="lista-cartoes">
                          {categoriasCompeticao.map((categoria) => {
                            const ehChaveDuplaEliminacao = categoriaEhChaveDuplaEliminacao(categoria);
                            const quantidadeInscritas = quantidadeInscricoesPorCategoria[categoria.id] ?? 0;
                            const inscricoesFechadas = inscricoesFechadasParaGerarChaveamento(competicao, categoria);

                            return (
                              <article key={categoria.id} className="cartao-lista">
                                <div>
                                  <h3>{categoria.nome}</h3>
                                  <p>Gênero: {opcoesGenero.find((item) => item.valor === categoria.genero)?.rotulo}</p>
                                  <p>Nível: {opcoesNivel.find((item) => item.valor === categoria.nivel)?.rotulo}</p>
                                  <p>Duplas inscritas: {quantidadeInscritas}</p>
                                  <p>Inscrições da categoria: {categoria.inscricoesEncerradas ? 'Encerradas' : 'Abertas'}</p>
                                </div>

                                {gestorCompeticao && (
                                  <div className="acoes-item">
                                    <button
                                      type="button"
                                      className="botao-terciario"
                                      onClick={() => alternarInscricoesCategoria(competicao.id, categoria.id)}
                                    >
                                      {categoriaInscricoesAbertaId === categoria.id
                                        ? 'Ocultar duplas inscritas'
                                        : 'Ver duplas inscritas'}
                                    </button>
                                  </div>
                                )}

                                {(gestorCompeticao || (usuarioAtleta && competicao.inscricoesAbertas)) && (
                                  <div className="acoes-item">
                                    {usuarioAtleta && competicao.inscricoesAbertas && (
                                      <button
                                        type="button"
                                        className="botao-primario"
                                        onClick={() => abrirInscricao(competicao, categoria)}
                                      >
                                        Inscrever-se
                                      </button>
                                    )}

                                    {podeSortearJogosCompeticao(competicao) && quantidadeInscritas >= 4 && (
                                      <button
                                        type="button"
                                        className="botao-primario"
                                        onClick={() => sortearJogosCategoria(competicao, categoria)}
                                        disabled={sorteandoCategoriaId === categoria.id || !inscricoesFechadas}
                                        title={!inscricoesFechadas ? 'Feche as inscrições da competição ou encerre a categoria antes de gerar o chaveamento.' : undefined}
                                      >
                                        {sorteandoCategoriaId === categoria.id
                                          ? 'Gerando...'
                                          : ehChaveDuplaEliminacao
                                            ? 'Gerar chaveamento'
                                            : 'Sortear jogos'}
                                      </button>
                                    )}

                                    {gestorCompeticao && (
                                      <>
                                        <button
                                          type="button"
                                          className="botao-terciario"
                                          onClick={() => navegar(`/partidas/campeonato?competicaoId=${competicao.id}&categoriaId=${categoria.id}&aba=chaveamento`)}
                                        >
                                          {ehChaveDuplaEliminacao ? 'Chaveamento' : 'Ver tabela de jogos'}
                                        </button>

                                        <button
                                          type="button"
                                          className="botao-secundario botao-editar"
                                          onClick={() => navegar(`/categorias?competicaoId=${categoria.competicaoId}&categoriaId=${categoria.id}`)}
                                        >
                                          Editar
                                        </button>

                                        <button
                                          type="button"
                                          className="botao-perigo"
                                          onClick={() => removerCategoria(categoria.id)}
                                        >
                                          Excluir
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}

                                {categoriaInscricoesAbertaId === categoria.id && (
                                  <div className="campo-largo">
                                    <h4>Duplas inscritas</h4>

                                    {carregandoInscricoesCategoria ? (
                                      <p>Carregando duplas inscritas...</p>
                                    ) : inscricoesCategoria.length === 0 ? (
                                      <p>Nenhuma dupla inscrita.</p>
                                    ) : (
                                      <div className="lista-cartoes">
                                        {inscricoesCategoria.map((inscricao) => (
                                          <article key={inscricao.id} className="cartao-lista">
                                            <div>
                                              <h4>{obterNomeExibicaoDupla(inscricao.nomeDupla)}</h4>
                                              <p>
                                                Atletas:{' '}
                                                {obterNomeExibicaoDuplaCampos(
                                                  inscricao.nomeAtleta1,
                                                  inscricao.apelidoAtleta1,
                                                  inscricao.nomeAtleta2,
                                                  inscricao.apelidoAtleta2
                                                )}
                                              </p>
                                              <p>Pagamento: {inscricao.pago ? 'Pago' : 'Pendente'}</p>
                                              {inscricao.observacao && <p>Observação: {inscricao.observacao}</p>}
                                            </div>
                                          </article>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </article>
                            );
                          })}

                          {categoriasCompeticao.length === 0 && (
                            <>
                              {!filtros.categoria && gerenciavel && competicaoSemCategoriasCadastradas && (
                                <div className="acoes-item">
                                  <button
                                    type="button"
                                    className="botao-primario"
                                    onClick={() => navegar(`/categorias?competicaoId=${competicao.id}`)}
                                  >
                                    Cadastrar categorias
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {competicoesFiltradas.length === 0 && (
                <p>
                  {filtroAtivo
                    ? 'Nenhum campeonato corresponde aos filtros informados.'
                    : 'Nenhum campeonato encontrado.'}
                </p>
              )}
            </div>
          </>
        )
      )}

      {formularioCompeticaoAberto && (
        <form ref={formularioCompeticaoRef} className="formulario-grid" onSubmit={aoSubmeter}>
          <div className="partidas-filtro-cabecalho campo-largo">
            <div>
              <strong>{competicaoEdicaoId ? 'Editar campeonato' : 'Novo campeonato'}</strong>
            </div>
          </div>

          {erro && <p className="mensagem-erro campo-largo">{erro}</p>}
          {aviso && <p className="mensagem-aviso campo-largo">{aviso}</p>}

          <label>
            Nome
            <input
              type="text"
              value={formulario.nome}
              onChange={(evento) => atualizarCampo('nome', evento.target.value)}
              required
            />
          </label>

          <label>
            Descrição
            <textarea
              value={formulario.descricao}
              onChange={(evento) => atualizarCampo('descricao', evento.target.value)}
            />
          </label>

          <label>
            Link de inscrição
            <input
              type="text"
              value={formulario.link}
              onChange={(evento) => atualizarCampo('link', evento.target.value)}
            />
          </label>

          <label>
            Data de início
            <input
              type="date"
              value={formulario.dataInicio}
              onChange={(evento) => atualizarCampo('dataInicio', evento.target.value)}
              required
            />
          </label>

          <label>
            Data de fim
            <input
              type="date"
              value={formulario.dataFim}
              onChange={(evento) => atualizarCampo('dataFim', evento.target.value)}
            />
          </label>

          <label>
            Liga
            <select
              value={formulario.ligaId}
              onChange={(evento) => atualizarCampo('ligaId', evento.target.value)}
            >
              <option value="">Sem liga</option>
              {ligas.map((liga) => (
                <option key={liga.id} value={liga.id}>
                  {liga.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Local
            <select
              value={formulario.localId}
              onChange={(evento) => atualizarCampo('localId', evento.target.value)}
            >
              <option value="">Sem local</option>
              {locais.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Formato do campeonato
            <select
              value={formulario.formatoCampeonatoId}
              onChange={(evento) => atualizarCampo('formatoCampeonatoId', evento.target.value)}
            >
              <option value="">Padrão</option>
              {formatosCampeonato.map((formato) => (
                <option key={formato.id} value={formato.id}>
                  {formato.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Regra da competição
            <select
              value={formulario.regraCompeticaoId}
              onChange={(evento) => atualizarCampo('regraCompeticaoId', evento.target.value)}
              disabled={!regrasDisponiveis}
            >
              <option value="">Regra padrão</option>
              {regras.map((regra) => (
                <option key={regra.id} value={regra.id}>
                  {regra.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formulario.inscricoesAbertas}
              onChange={(evento) => atualizarCampo('inscricoesAbertas', evento.target.checked)}
            />
            Inscrições abertas
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formulario.possuiFinalReset}
              onChange={(evento) => atualizarCampo('possuiFinalReset', evento.target.checked)}
              disabled={!formatoEfetivoDaCompeticaoEhChaveDuplaEliminacao(formulario.formatoCampeonatoId)}
            />
            Possui final reset
          </label>

          {competicaoEdicaoId && (
            <div className="campo-largo">
              <h3>Categorias cadastradas</h3>

              {carregandoCategoriasFormulario ? (
                <p>Carregando categorias...</p>
              ) : categoriasFormulario.length === 0 ? (
                <p>Nenhuma categoria cadastrada.</p>
              ) : (
                <div className="lista-cartoes">
                  {categoriasFormulario.map((categoria) => (
                    <article key={categoria.id} className="cartao-lista">
                      <div>
                        <h4>{categoria.nome}</h4>
                        <p>Gênero: {opcoesGenero.find((item) => item.valor === categoria.genero)?.rotulo}</p>
                        <p>Nível: {opcoesNivel.find((item) => item.valor === categoria.nivel)?.rotulo}</p>
                      </div>

                      <div className="acoes-item">
                        <button
                          type="button"
                          className="botao-secundario botao-editar"
                          onClick={() => navegar(`/categorias?competicaoId=${categoria.competicaoId}&categoriaId=${categoria.id}`)}
                        >
                          Editar
                        </button>

                        <button type="button" className="botao-perigo" onClick={() => removerCategoria(categoria.id)}>
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="acoes-item">
                <button
                  type="button"
                  className="botao-primario"
                  onClick={() => navegar(`/categorias?competicaoId=${competicaoEdicaoId}`)}
                >
                  Cadastrar categoria
                </button>
              </div>
            </div>
          )}

          <div className="acoes-item campo-largo">
            <button type="submit" className="botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>

            <button type="button" className="botao-secundario" onClick={cancelarEdicao}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}