import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { atletasServico } from '../services/atletasServico';
import { categoriasServico } from '../services/categoriasServico';
import { competicoesServico } from '../services/competicoesServico';
import { duplasServico } from '../services/duplasServico';
import { grupoAtletasServico } from '../services/grupoAtletasServico';
import { inscricoesCampeonatoServico } from '../services/inscricoesCampeonatoServico';
import { partidasServico } from '../services/partidasServico';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { extrairMensagemErro } from '../utils/erros';
import { ehAtleta, ehGestorCompeticao, PERFIS_USUARIO } from '../utils/perfis';

const TIPOS_COMPETICAO = {
  campeonato: 1,
  evento: 2,
  grupo: 3,
  partidasAvulsas: 4
};

const LADOS_ATLETA = {
  direito: 1,
  esquerdo: 2
};

const NOME_COMPETICAO_PARTIDAS_AVULSAS = 'Partidas avulsas';
const STATUS_INSCRICAO_ATIVA = 1;

const opcoesStatusPartida = [
  { valor: '1', rotulo: 'Agendada' },
  { valor: '2', rotulo: 'Encerrada' }
];

const opcoesFaseCampeonato = [
  'Fase classificatória',
  'Fase de grupos',
  'Oitavas de final',
  'Quartas de final',
  'Semifinal',
  'Final',
  'Final de reset',
  'Disputa de 3º lugar',
  'Chave dos vencedores',
  'Chave principal',
  'Chave dos perdedores'
];

function obterDataHoraAtualInput() {
  const agora = new Date();
  const timezoneOffset = agora.getTimezoneOffset() * 60000;
  return new Date(agora.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function criarEstadoInicial() {
  return {
    nomeGrupo: '',
    categoriaCompeticaoId: '',
    modoCadastro: 'atletas',
    duplaAId: '',
    duplaBId: '',
    duplaAAtleta1Id: '',
    duplaAAtleta1Nome: '',
    duplaAAtleta2Id: '',
    duplaAAtleta2Nome: '',
    duplaBAtleta1Id: '',
    duplaBAtleta1Nome: '',
    duplaBAtleta2Id: '',
    duplaBAtleta2Nome: '',
    faseCampeonato: '',
    status: '2',
    placarDuplaA: '',
    placarDuplaB: '',
    dataPartida: obterDataHoraAtualInput(),
    observacoes: ''
  };
}

function obterTipoCompeticao(competicao) {
  return Number(competicao?.tipo || 0);
}

function ehCompeticaoPartidasAvulsas(competicao) {
  const tipo = obterTipoCompeticao(competicao);
  const nome = (competicao?.nome || '').trim().toLowerCase();

  return tipo === TIPOS_COMPETICAO.partidasAvulsas ||
    (tipo === TIPOS_COMPETICAO.grupo && nome === NOME_COMPETICAO_PARTIDAS_AVULSAS.toLowerCase());
}

function ehCompeticaoGrupo(competicao) {
  return obterTipoCompeticao(competicao) === TIPOS_COMPETICAO.grupo && !ehCompeticaoPartidasAvulsas(competicao);
}

function ehCompeticaoComInscricoes(competicao) {
  const tipo = obterTipoCompeticao(competicao);
  return tipo === TIPOS_COMPETICAO.campeonato || tipo === TIPOS_COMPETICAO.evento;
}

function paraIsoUtc(dataLocal) {
  return dataLocal ? new Date(dataLocal).toISOString() : null;
}

function normalizarNome(valor) {
  return (valor || '').trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

function buscarSugestoesAtleta(atletas, termo, atletaSelecionadoId, idsBloqueados = []) {
  if (!termo.trim() || atletaSelecionadoId) {
    return [];
  }

  const termos = normalizarNome(termo).split(' ').filter(Boolean);
  const idsBloqueadosSet = new Set(idsBloqueados.filter(Boolean));

  return atletas
    .filter((atleta) => !atleta.cadastroPendente)
    .filter((atleta) => !idsBloqueadosSet.has(atleta.id))
    .filter((atleta) => {
      const nome = normalizarNome(atleta.nome);
      const apelido = normalizarNome(atleta.apelido || '');
      return termos.every((parte) => nome.includes(parte) || apelido.includes(parte));
    })
    .slice(0, 6);
}

function formatarNomeDupla(dupla) {
  return `${dupla.nome} (${dupla.nomeAtleta1} / ${dupla.nomeAtleta2})`;
}

function obterCampoBaseAtletaUsuarioPrimeiraDupla(lado) {
  return Number(lado) === LADOS_ATLETA.esquerdo ? 'duplaAAtleta2' : 'duplaAAtleta1';
}

function obterCamposAtletaUsuarioPrimeiraDupla(atletaId, atletaNome, atletaLado) {
  if (!atletaId || !atletaNome) {
    return {};
  }

  const campoBase = obterCampoBaseAtletaUsuarioPrimeiraDupla(atletaLado);
  return {
    [`${campoBase}Id`]: atletaId,
    [`${campoBase}Nome`]: atletaNome
  };
}

function mapearInscricaoParaDupla(inscricao) {
  return {
    id: inscricao.duplaId,
    nome: inscricao.nomeDupla,
    nomeAtleta1: inscricao.nomeAtleta1,
    nomeAtleta2: inscricao.nomeAtleta2
  };
}

function mapearGrupoAtletaParaAtleta(item) {
  return {
    id: item.atletaId,
    nome: item.nomeAtleta,
    apelido: item.apelidoAtleta,
    cadastroPendente: item.cadastroPendente
  };
}

export function PaginaRegistrarPartidas() {
  const { usuario } = useAutenticacao();
  const [params, setParams] = useSearchParams();
  const navegar = useNavigate();
  const usuarioAtleta = ehAtleta(usuario);
  const atletaUsuarioId = usuario?.atletaId || '';
  const atletaUsuarioNome = usuario?.atleta?.nome || usuario?.nome || '';
  const atletaUsuarioLado = Number(usuario?.atleta?.lado || LADOS_ATLETA.direito);
  const campoBaseAtletaUsuarioPrimeiraDupla = obterCampoBaseAtletaUsuarioPrimeiraDupla(atletaUsuarioLado);

  const [competicoes, setCompeticoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [duplasGerais, setDuplasGerais] = useState([]);
  const [duplasInscritas, setDuplasInscritas] = useState([]);
  const [grupoAtletas, setGrupoAtletas] = useState([]);
  const [formulario, setFormulario] = useState(() => criarEstadoInicial());
  const [competicaoId, setCompeticaoId] = useState('');
  const [sugestoesAtletas, setSugestoesAtletas] = useState({
    duplaAAtleta1: [],
    duplaAAtleta2: [],
    duplaBAtleta1: [],
    duplaBAtleta2: []
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [feedbackPendencias, setFeedbackPendencias] = useState([]);

  const competicoesDisponiveis = useMemo(() => {
    const lista = competicoes.filter((competicao) => !ehCompeticaoPartidasAvulsas(competicao));

    if (!usuarioAtleta) {
      return lista;
    }

    return lista.filter(
      (competicao) => ehCompeticaoGrupo(competicao) && competicao.usuarioOrganizadorId === usuario?.id
    );
  }, [competicoes, usuarioAtleta, usuario?.id]);

  const competicaoSelecionada = competicoesDisponiveis.find((competicao) => competicao.id === competicaoId) || null;
  const categoriaSelecionada = categorias.find((categoria) => categoria.id === formulario.categoriaCompeticaoId) || null;
  const grupoSelecionado = ehCompeticaoGrupo(competicaoSelecionada);
  const contextoGrupo = grupoSelecionado || !competicaoSelecionada;
  const competicaoComInscricoes = ehCompeticaoComInscricoes(competicaoSelecionada);
  const administradorLogado = Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  const organizadorDaCompeticaoSelecionada =
    Number(usuario?.perfil) === PERFIS_USUARIO.organizador &&
    competicaoSelecionada?.usuarioOrganizadorId === usuario?.id;
  const usuarioPodeRegistrar = ehGestorCompeticao(usuario) || usuarioAtleta;
  const podeRegistrarNaCompeticao = competicaoSelecionada
    ? grupoSelecionado
      ? ehGestorCompeticao(usuario) || competicaoSelecionada.usuarioOrganizadorId === usuario?.id
      : administradorLogado || organizadorDaCompeticaoSelecionada
    : usuarioPodeRegistrar;
  const tabelaJogosAprovada = Boolean(categoriaSelecionada?.tabelaJogosAprovada);
  const usandoCadastroPorAtletas = !competicaoSelecionada || grupoSelecionado || formulario.modoCadastro === 'atletas';
  const podeLancarResultado = grupoSelecionado || !competicaoComInscricoes || tabelaJogosAprovada;
  const statusEfetivo = competicaoComInscricoes && !tabelaJogosAprovada
    ? 1
    : grupoSelecionado
      ? 2
      : podeLancarResultado && formulario.placarDuplaA !== '' && formulario.placarDuplaB !== ''
        ? 2
        : Number(formulario.status);
  const exibirCamposPlacar = podeLancarResultado;
  const placaresParciais =
    (formulario.placarDuplaA !== '' || formulario.placarDuplaB !== '') &&
    !(formulario.placarDuplaA !== '' && formulario.placarDuplaB !== '');
  const duplasDisponiveis = competicaoComInscricoes ? duplasInscritas : duplasGerais;
  const opcoesDuplaA = duplasDisponiveis.filter((dupla) => dupla.id !== formulario.duplaBId);
  const opcoesDuplaB = duplasDisponiveis.filter((dupla) => dupla.id !== formulario.duplaAId);
  const atletasBaseCadastroAssistido = grupoSelecionado ? grupoAtletas.map(mapearGrupoAtletaParaAtleta) : [];
  const bloquearCampoAtletaUsuarioGrupo = contextoGrupo && usuarioAtleta && Boolean(atletaUsuarioId);
  const podeSalvar = !salvando && podeRegistrarNaCompeticao && !(contextoGrupo && usuarioAtleta && !atletaUsuarioId);

  useEffect(() => {
    carregarBase();
  }, []);

  useEffect(() => {
    if (!competicaoId) {
      setCategorias([]);
      setGrupoAtletas([]);
      setDuplasInscritas([]);
      return;
    }

    carregarDadosCompeticao(competicaoId);
  }, [competicaoId]);

  useEffect(() => {
    if (!competicaoComInscricoes || !formulario.categoriaCompeticaoId) {
      setDuplasInscritas([]);
      return;
    }

    carregarDuplasInscritas(competicaoId, formulario.categoriaCompeticaoId);
  }, [competicaoComInscricoes, competicaoId, formulario.categoriaCompeticaoId]);

  useEffect(() => {
    if (grupoSelecionado) {
      atualizarCampo('modoCadastro', 'atletas');
      atualizarCampo('status', '2');
      return;
    }

    if (competicaoComInscricoes && duplasInscritas.length > 0) {
      atualizarCampo('modoCadastro', 'duplas');
    }
  }, [competicaoComInscricoes, duplasInscritas.length, grupoSelecionado]);

  useEffect(() => {
    if (!usandoCadastroPorAtletas || !atletaUsuarioId || !contextoGrupo) {
      return;
    }

    setFormulario((anterior) => ({
      ...anterior,
      ...obterCamposAtletaUsuarioPrimeiraDupla(atletaUsuarioId, atletaUsuarioNome, atletaUsuarioLado)
    }));
  }, [atletaUsuarioId, atletaUsuarioLado, atletaUsuarioNome, contextoGrupo, usandoCadastroPorAtletas]);

  useEffect(() => {
    if (!usandoCadastroPorAtletas) {
      setSugestoesAtletas({
        duplaAAtleta1: [],
        duplaAAtleta2: [],
        duplaBAtleta1: [],
        duplaBAtleta2: []
      });
      return;
    }

    const campos = [
      {
        chave: 'duplaAAtleta1',
        id: formulario.duplaAAtleta1Id,
        nome: formulario.duplaAAtleta1Nome,
        idsBloqueados: [formulario.duplaAAtleta2Id, formulario.duplaBAtleta1Id, formulario.duplaBAtleta2Id],
        bloqueado: bloquearCampoAtletaUsuarioGrupo && campoBaseAtletaUsuarioPrimeiraDupla === 'duplaAAtleta1'
      },
      {
        chave: 'duplaAAtleta2',
        id: formulario.duplaAAtleta2Id,
        nome: formulario.duplaAAtleta2Nome,
        idsBloqueados: [formulario.duplaAAtleta1Id, formulario.duplaBAtleta1Id, formulario.duplaBAtleta2Id],
        bloqueado: bloquearCampoAtletaUsuarioGrupo && campoBaseAtletaUsuarioPrimeiraDupla === 'duplaAAtleta2'
      },
      {
        chave: 'duplaBAtleta1',
        id: formulario.duplaBAtleta1Id,
        nome: formulario.duplaBAtleta1Nome,
        idsBloqueados: [formulario.duplaAAtleta1Id, formulario.duplaAAtleta2Id, formulario.duplaBAtleta2Id]
      },
      {
        chave: 'duplaBAtleta2',
        id: formulario.duplaBAtleta2Id,
        nome: formulario.duplaBAtleta2Nome,
        idsBloqueados: [formulario.duplaAAtleta1Id, formulario.duplaAAtleta2Id, formulario.duplaBAtleta1Id]
      }
    ];

    const timeout = setTimeout(async () => {
      const proximasSugestoes = {
        duplaAAtleta1: [],
        duplaAAtleta2: [],
        duplaBAtleta1: [],
        duplaBAtleta2: []
      };

      await Promise.all(campos.map(async (campo) => {
        if (campo.bloqueado) {
          return;
        }

        const termo = (campo.nome || '').trim();
        const sugestoesLocais = !competicaoId || termo.length >= 3
          ? buscarSugestoesAtleta(
              atletasBaseCadastroAssistido,
              campo.nome || '',
              campo.id,
              campo.idsBloqueados
            )
          : [];

        let sugestoesRemotas = [];
        if (termo && !campo.id) {
          try {
            sugestoesRemotas = competicaoId
              ? termo.length >= 3
                ? await competicoesServico.buscarSugestoesAtletas(competicaoId, termo)
                : []
              : await atletasServico.buscar(termo);
          } catch {
            sugestoesRemotas = [];
          }
        }

        const mapa = new Map();
        [...sugestoesLocais, ...sugestoesRemotas]
          .filter((atleta) => !atleta.cadastroPendente)
          .filter((atleta) => !campo.idsBloqueados.includes(atleta.id))
          .forEach((atleta) => {
            if (!mapa.has(atleta.id)) {
              mapa.set(atleta.id, atleta);
            }
          });

        proximasSugestoes[campo.chave] = Array.from(mapa.values()).slice(0, 6);
      }));

      setSugestoesAtletas(proximasSugestoes);
    }, 250);

    return () => clearTimeout(timeout);
  }, [
    atletasBaseCadastroAssistido,
    bloquearCampoAtletaUsuarioGrupo,
    campoBaseAtletaUsuarioPrimeiraDupla,
    formulario.duplaAAtleta1Id,
    formulario.duplaAAtleta1Nome,
    formulario.duplaAAtleta2Id,
    formulario.duplaAAtleta2Nome,
    formulario.duplaBAtleta1Id,
    formulario.duplaBAtleta1Nome,
    formulario.duplaBAtleta2Id,
    formulario.duplaBAtleta2Nome,
    competicaoId,
    usandoCadastroPorAtletas
  ]);

  async function carregarBase() {
    setCarregando(true);
    setErro('');

    try {
      const [listaCompeticoes, listaDuplas] = await Promise.all([
        competicoesServico.listar(),
        usuarioAtleta
          ? Promise.resolve([])
          : duplasServico.listar({
              somenteInscritasMinhasCompeticoes: Number(usuario?.perfil) === PERFIS_USUARIO.organizador
            })
      ]);

      setCompeticoes(listaCompeticoes);
      setDuplasGerais(listaDuplas);

      const competicaoUrl = params.get('competicaoId');
      const categoriaUrl = params.get('categoriaId');
      const competicaoValida = listaCompeticoes.find((competicao) => competicao.id === competicaoUrl);

      if (competicaoValida && !ehCompeticaoPartidasAvulsas(competicaoValida)) {
        setCompeticaoId(competicaoValida.id);
      }

      if (categoriaUrl) {
        setFormulario((anterior) => ({
          ...anterior,
          categoriaCompeticaoId: categoriaUrl
        }));
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDadosCompeticao(idCompeticao) {
    setErro('');

    try {
      const competicao = competicoes.find((item) => item.id === idCompeticao);
      const [listaCategorias, listaGrupoAtletas] = await Promise.all([
        ehCompeticaoGrupo(competicao) ? Promise.resolve([]) : categoriasServico.listarPorCompeticao(idCompeticao),
        ehCompeticaoGrupo(competicao) ? grupoAtletasServico.listarPorCompeticao(idCompeticao) : Promise.resolve([])
      ]);

      setCategorias(listaCategorias);
      setGrupoAtletas(listaGrupoAtletas);
      setFormulario((anterior) => {
        const categoriaValida = listaCategorias.some((categoria) => categoria.id === anterior.categoriaCompeticaoId);
        return {
          ...anterior,
          categoriaCompeticaoId: categoriaValida ? anterior.categoriaCompeticaoId : listaCategorias[0]?.id || '',
          duplaAId: '',
          duplaBId: '',
          status: ehCompeticaoGrupo(competicao) ? '2' : anterior.status
        };
      });
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setCategorias([]);
      setGrupoAtletas([]);
    }
  }

  async function carregarDuplasInscritas(idCompeticao, categoriaId) {
    try {
      const inscricoes = await inscricoesCampeonatoServico.listarPorCampeonato(idCompeticao, categoriaId);
      setDuplasInscritas(
        (inscricoes || [])
          .filter((inscricao) => Number(inscricao.status) === STATUS_INSCRICAO_ATIVA)
          .map(mapearInscricaoParaDupla)
      );
    } catch {
      setDuplasInscritas([]);
    }
  }

  function atualizarParametrosUrl(proximoCompeticaoId, proximaCategoriaId = formulario.categoriaCompeticaoId) {
    const proximos = {};
    if (proximoCompeticaoId) {
      proximos.competicaoId = proximoCompeticaoId;
    }
    if (proximaCategoriaId) {
      proximos.categoriaId = proximaCategoriaId;
    }
    setParams(proximos, { replace: true });
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => {
      const proximo = { ...anterior, [campo]: valor };

      if (campo === 'categoriaCompeticaoId' || campo === 'modoCadastro') {
        proximo.duplaAId = '';
        proximo.duplaBId = '';
      }

      if (campo === 'status' && Number(valor) === 1) {
        proximo.placarDuplaA = '';
        proximo.placarDuplaB = '';
      }

      return proximo;
    });

    if (campo === 'categoriaCompeticaoId') {
      atualizarParametrosUrl(competicaoId, valor);
    }
  }

  function selecionarCompeticao(idCompeticao) {
    setCompeticaoId(idCompeticao);
    setMensagem('');
    setFeedbackPendencias([]);
    setFormulario((anterior) => ({
      ...criarEstadoInicial(),
      modoCadastro: anterior.modoCadastro,
      duplaAAtleta1Id: anterior.duplaAAtleta1Id,
      duplaAAtleta1Nome: anterior.duplaAAtleta1Nome,
      duplaAAtleta2Id: anterior.duplaAAtleta2Id,
      duplaAAtleta2Nome: anterior.duplaAAtleta2Nome,
      dataPartida: anterior.dataPartida,
      status: '2'
    }));
    atualizarParametrosUrl(idCompeticao, '');
  }

  function atualizarAtleta(campoBase, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [`${campoBase}Id`]: '',
      [`${campoBase}Nome`]: valor
    }));
  }

  function selecionarAtleta(campoBase, atleta) {
    setFormulario((anterior) => ({
      ...anterior,
      [`${campoBase}Id`]: atleta.id,
      [`${campoBase}Nome`]: atleta.nome
    }));
  }

  function renderizarSugestoesAtleta(campoBase) {
    const sugestoes = sugestoesAtletas[campoBase];
    if (!sugestoes?.length) {
      return null;
    }

    return (
      <div className="lista-sugestoes secao-dupla-partida-info">
        {sugestoes.map((atleta) => (
          <button
            key={atleta.id}
            type="button"
            className="item-sugestao"
            onClick={() => selecionarAtleta(campoBase, atleta)}
          >
            {atleta.nome}
            {atleta.apelido ? ` (${atleta.apelido})` : ''}
          </button>
        ))}
      </div>
    );
  }

  function limparFormularioAposSalvar() {
    setFormulario((anterior) => ({
      ...criarEstadoInicial(),
      nomeGrupo: anterior.nomeGrupo,
      categoriaCompeticaoId: anterior.categoriaCompeticaoId,
      modoCadastro: anterior.modoCadastro,
        status: contextoGrupo ? '2' : anterior.status,
      ...(
        usandoCadastroPorAtletas && contextoGrupo && atletaUsuarioId
          ? obterCamposAtletaUsuarioPrimeiraDupla(atletaUsuarioId, atletaUsuarioNome, atletaUsuarioLado)
          : {}
      )
    }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro('');
    setMensagem('');
    setFeedbackPendencias([]);

    if (!podeRegistrarNaCompeticao) {
      setErro('Você não possui permissão para registrar partidas nesta competição.');
      return;
    }

    if (competicaoSelecionada && !grupoSelecionado && !formulario.categoriaCompeticaoId) {
      setErro('Selecione a categoria antes de salvar a partida.');
      return;
    }

    if (placaresParciais) {
      setErro('Informe os pontos das duas duplas para encerrar a partida.');
      return;
    }

    setSalvando(true);

    const dados = {
      competicaoId: competicaoSelecionada?.id || null,
      nomeGrupo: competicaoSelecionada ? null : formulario.nomeGrupo.trim() || null,
      categoriaCompeticaoId: formulario.categoriaCompeticaoId || null,
      duplaAId: usandoCadastroPorAtletas ? null : formulario.duplaAId || null,
      duplaBId: usandoCadastroPorAtletas ? null : formulario.duplaBId || null,
      duplaAAtleta1Id: usandoCadastroPorAtletas ? formulario.duplaAAtleta1Id || null : null,
      duplaAAtleta1Nome: usandoCadastroPorAtletas ? formulario.duplaAAtleta1Nome.trim() || null : null,
      duplaAAtleta2Id: usandoCadastroPorAtletas ? formulario.duplaAAtleta2Id || null : null,
      duplaAAtleta2Nome: usandoCadastroPorAtletas ? formulario.duplaAAtleta2Nome.trim() || null : null,
      duplaBAtleta1Id: usandoCadastroPorAtletas ? formulario.duplaBAtleta1Id || null : null,
      duplaBAtleta1Nome: usandoCadastroPorAtletas ? formulario.duplaBAtleta1Nome.trim() || null : null,
      duplaBAtleta2Id: usandoCadastroPorAtletas ? formulario.duplaBAtleta2Id || null : null,
      duplaBAtleta2Nome: usandoCadastroPorAtletas ? formulario.duplaBAtleta2Nome.trim() || null : null,
      faseCampeonato: obterTipoCompeticao(competicaoSelecionada) === TIPOS_COMPETICAO.campeonato
        ? formulario.faseCampeonato || null
        : null,
      status: statusEfetivo,
      placarDuplaA: statusEfetivo === 2 && podeLancarResultado ? Number(formulario.placarDuplaA) : null,
      placarDuplaB: statusEfetivo === 2 && podeLancarResultado ? Number(formulario.placarDuplaB) : null,
      dataPartida: paraIsoUtc(formulario.dataPartida),
      observacoes: formulario.observacoes || null
    };

    try {
      const partidaSalva = await partidasServico.criar(dados);
      const pendenciasSemContato = (partidaSalva?.atletasPendentes || []).filter((item) => !item.temEmail);
      setMensagem(
        pendenciasSemContato.length > 0
          ? 'Partida registrada com sucesso. Existem atletas pendentes sem e-mail para completar depois.'
          : 'Partida registrada com sucesso.'
      );
      setFeedbackPendencias(pendenciasSemContato);
      limparFormularioAposSalvar();
      navegar('/');
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  function renderizarCampoAtleta(campoBase, rotulo, bloqueado = false) {
    return (
      <>
        <label>
          {rotulo}
          <input
            type="text"
            value={formulario[`${campoBase}Nome`]}
            onChange={(evento) => atualizarAtleta(campoBase, evento.target.value)}
            disabled={bloqueado}
            readOnly={bloqueado}
            placeholder="Nome completo"
            required
          />
        </label>
        {!bloqueado && renderizarSugestoesAtleta(campoBase)}
      </>
    );
  }

  return (
    <section className="pagina">
      <div className="cabecalho-pagina">
        <div className="cabecalho-pagina-voltar">
          <BotaoVoltar />
        </div>
        <h2>Registrar Partidas</h2>
        <p>Informe o contexto, as duplas e o resultado para enviar o registro da partida.</p>
      </div>

      {carregando ? (
        <p>Carregando dados para registro...</p>
      ) : (
        <form className="formulario-grid formulario-partida" onSubmit={aoSubmeter}>
          <div className="campo-largo formulario-partida-cabecalho">
            <h3>Nova partida</h3>
            <p></p>
          </div>

          <label>
            Competição
            <select value={competicaoId} onChange={(evento) => selecionarCompeticao(evento.target.value)}>
              <option value="">Partida avulsa / novo grupo</option>
              {competicoesDisponiveis.map((competicao) => (
                <option key={competicao.id} value={competicao.id}>
                  {competicao.nome}
                </option>
              ))}
            </select>
          </label>

          {!competicaoId && (
            <label className="campo-largo">
              Nome do grupo (opcional)
              <input
                type="text"
                value={formulario.nomeGrupo}
                onChange={(evento) => atualizarCampo('nomeGrupo', evento.target.value)}
                placeholder="Ex.: Grupo da Praia de domingo"
              />
            </label>
          )}

          {competicaoId && !grupoSelecionado && categorias.length > 0 && (
            <label>
              Categoria
              <select
                value={formulario.categoriaCompeticaoId}
                onChange={(evento) => atualizarCampo('categoriaCompeticaoId', evento.target.value)}
                required
              >
                <option value="">Selecione</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          {competicaoComInscricoes && (
            <div className="campo-largo acoes-item acoes-item-compactas">
              <button
                type="button"
                className={`${formulario.modoCadastro === 'duplas' ? 'botao-primario' : 'botao-terciario'} botao-compacto`}
                onClick={() => atualizarCampo('modoCadastro', 'duplas')}
                disabled={duplasInscritas.length === 0}
              >
                Usar duplas inscritas
              </button>
              <button
                type="button"
                className={`${formulario.modoCadastro === 'atletas' ? 'botao-primario' : 'botao-terciario'} botao-compacto`}
                onClick={() => atualizarCampo('modoCadastro', 'atletas')}
              >
                Informar atletas
              </button>
            </div>
          )}

          {usandoCadastroPorAtletas ? (
            <>
              <section className="campo-largo secao-dupla-partida">
                <div className="secao-dupla-partida-cabecalho">
                  <strong>Dupla 1</strong>
                </div>
                <div className="secao-dupla-partida-grid">
                  {renderizarCampoAtleta(
                    'duplaAAtleta1',
                    'Jogador Direito',
                    bloquearCampoAtletaUsuarioGrupo && campoBaseAtletaUsuarioPrimeiraDupla === 'duplaAAtleta1'
                  )}
                  {renderizarCampoAtleta(
                    'duplaAAtleta2',
                    'Jogador Esquerdo',
                    bloquearCampoAtletaUsuarioGrupo && campoBaseAtletaUsuarioPrimeiraDupla === 'duplaAAtleta2'
                  )}
                  {exibirCamposPlacar && (
                    <label>
                      Pontos
                      <input
                        type="number"
                        min={0}
                        value={formulario.placarDuplaA}
                        onChange={(evento) => atualizarCampo('placarDuplaA', evento.target.value)}
                      />
                    </label>
                  )}
                </div>
              </section>

              <section className="campo-largo secao-dupla-partida">
                <div className="secao-dupla-partida-cabecalho">
                  <strong>Dupla 2</strong>
                </div>
                <div className="secao-dupla-partida-grid">
                  {renderizarCampoAtleta('duplaBAtleta1', 'Jogador Direito')}
                  {renderizarCampoAtleta('duplaBAtleta2', 'Jogador Esquerdo')}
                  {exibirCamposPlacar && (
                    <label>
                      Pontos
                      <input
                        type="number"
                        min={0}
                        value={formulario.placarDuplaB}
                        onChange={(evento) => atualizarCampo('placarDuplaB', evento.target.value)}
                      />
                    </label>
                  )}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="campo-largo secao-dupla-partida">
                <div className="secao-dupla-partida-cabecalho">
                  <strong>Dupla 1</strong>
                </div>
                <div className="secao-dupla-partida-grid">
                  <label>
                    Dupla 1
                    <select
                      value={formulario.duplaAId}
                      onChange={(evento) => atualizarCampo('duplaAId', evento.target.value)}
                      disabled={!formulario.categoriaCompeticaoId && competicaoComInscricoes}
                      required
                    >
                      <option value="">Selecione</option>
                      {opcoesDuplaA.map((dupla) => (
                        <option key={dupla.id} value={dupla.id}>
                          {formatarNomeDupla(dupla)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {exibirCamposPlacar && (
                    <label>
                      Pontos
                      <input
                        type="number"
                        min={0}
                        value={formulario.placarDuplaA}
                        onChange={(evento) => atualizarCampo('placarDuplaA', evento.target.value)}
                      />
                    </label>
                  )}
                </div>
              </section>

              <section className="campo-largo secao-dupla-partida">
                <div className="secao-dupla-partida-cabecalho">
                  <strong>Dupla 2</strong>
                </div>
                <div className="secao-dupla-partida-grid">
                  <label>
                    Dupla 2
                    <select
                      value={formulario.duplaBId}
                      onChange={(evento) => atualizarCampo('duplaBId', evento.target.value)}
                      disabled={!formulario.categoriaCompeticaoId && competicaoComInscricoes}
                      required
                    >
                      <option value="">Selecione</option>
                      {opcoesDuplaB.map((dupla) => (
                        <option key={dupla.id} value={dupla.id}>
                          {formatarNomeDupla(dupla)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {exibirCamposPlacar && (
                    <label>
                      Pontos
                      <input
                        type="number"
                        min={0}
                        value={formulario.placarDuplaB}
                        onChange={(evento) => atualizarCampo('placarDuplaB', evento.target.value)}
                      />
                    </label>
                  )}
                </div>
              </section>
            </>
          )}

          {competicaoComInscricoes && !tabelaJogosAprovada && (
            <p className="campo-largo texto-ajuda">
              A categoria ainda não possui tabela aprovada; a partida será registrada como agendada.
            </p>
          )}

          {obterTipoCompeticao(competicaoSelecionada) === TIPOS_COMPETICAO.campeonato && (
            <label>
              Fase
              <select
                value={formulario.faseCampeonato}
                onChange={(evento) => atualizarCampo('faseCampeonato', evento.target.value)}
              >
                <option value="">Selecione</option>
                {opcoesFaseCampeonato.map((fase) => (
                  <option key={fase} value={fase}>
                    {fase}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Data da partida
            <input
              type="datetime-local"
              value={formulario.dataPartida}
              onChange={(evento) => atualizarCampo('dataPartida', evento.target.value)}
            />
          </label>

          {erro && <p className="texto-erro campo-largo">{erro}</p>}
          {mensagem && <p className="texto-sucesso campo-largo">{mensagem}</p>}
          {feedbackPendencias.length > 0 && (
            <div className="campo-largo texto-ajuda">
              {feedbackPendencias.map((pendencia) => (
                <p key={pendencia.atletaId}>{pendencia.nomeAtleta}: contato pendente.</p>
              ))}
            </div>
          )}

          <div className="acoes-formulario">
            <button type="submit" className="botao-primario botao-compacto" disabled={!podeSalvar}>
              {salvando ? 'Salvando...' : 'Registrar partida'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
