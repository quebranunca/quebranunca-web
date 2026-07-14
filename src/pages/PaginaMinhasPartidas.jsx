import { useEffect, useMemo, useState } from 'react';
import {
  FaBan,
  FaCheckCircle,
  FaEdit,
  FaExclamationTriangle,
  FaGamepad,
  FaHourglassHalf,
  FaSortAmountDown,
  FaTimes,
  FaTrashAlt,
  FaTrophy
} from 'react-icons/fa';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppHero } from '../components/AppHero';
import { CompartilharPartidaBotao } from '../components/partidas/CompartilharPartidaBotao';
import { EditarPartidaRegistradaModal } from '../components/partidas/EditarPartidaRegistradaModal';
import { PartidaCardPremium } from '../components/partidas/PartidaCardPremium';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { partidasServico } from '../services/partidasServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { formatarNomeDupla } from '../utils/atletaUtils';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHoraCurta } from '../utils/formatacao';
import { podeEditarPartida, podeExcluirPartida } from '../utils/permissoesPartida';
import { obterRotaDetalhePartida } from '../utils/partidaRotas';
import { scrollFocusedInputIntoView } from '../utils/tecladoMobile';
import {
  atletaEstaNaDuplaA,
  atletaEstaNaDuplaB,
  obterAtletasPartida,
  obterNomeGrupoPartidaExibicao,
  obterNomeStatusAprovacao,
  ordenarPartidasRecentes,
  STATUS_APROVACAO_PARTIDA,
  STATUS_PARTIDA
} from '../utils/partidas';

const FILTROS_PRINCIPAIS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'participei', rotulo: 'Participei' },
  { id: 'registradas', rotulo: 'Registradas' },
  { id: 'pendentes', rotulo: 'Pendentes' },
  { id: 'canceladas', rotulo: 'Canceladas' }
];

const FILTROS_ATLETA = [
  { id: 'vitorias', rotulo: 'Vitórias' },
  { id: 'derrotas', rotulo: 'Derrotas' }
];

const TIPOS_PENDENCIA = {
  aprovarPartida: 1,
  completarContato: 2,
  responderCancelamentoPartida: 4
};

const STATUS_PENDENCIA = {
  pendente: 1,
  aguardandoCadastro: 4
};

const MOTIVOS_CANCELAMENTO_PARTIDA = [
  { valor: 1, rotulo: 'Partida duplicada' },
  { valor: 2, rotulo: 'Jogo não aconteceu' },
  { valor: 3, rotulo: 'Atletas incorretos' },
  { valor: 4, rotulo: 'Resultado incorreto' },
  { valor: 5, rotulo: 'Grupo incorreto' },
  { valor: 6, rotulo: 'Outro motivo' }
];

const MOTIVO_OUTRO = 6;

const STATUS_SOLICITACAO_CANCELAMENTO = {
  pendente: 1,
  aprovada: 2,
  recusada: 3,
  canceladaPeloSolicitante: 4
};

function normalizarFiltro(valor) {
  const filtro = String(valor || '').trim().toLowerCase();

  if (['registradas', 'registradas-por-mim', 'minhas-registradas'].includes(filtro)) {
    return 'registradas';
  }

  if (['participei', 'participadas', 'meus-jogos'].includes(filtro)) {
    return 'participei';
  }

  if (['pendentes', 'pendencias', 'pendências'].includes(filtro)) {
    return 'pendentes';
  }

  if (['canceladas', 'cancelada'].includes(filtro)) {
    return 'canceladas';
  }

  if (['vitorias', 'vitórias'].includes(filtro)) {
    return 'vitorias';
  }

  if (['derrotas'].includes(filtro)) {
    return 'derrotas';
  }

  return 'todas';
}

function formatarAtletasPlacar(atletas) {
  return formatarNomeDupla(atletas, 'A definir');
}

function atletaParticipou(partida, atletaLogadoId) {
  return Boolean(atletaLogadoId) && (
    atletaEstaNaDuplaA(partida, atletaLogadoId) ||
    atletaEstaNaDuplaB(partida, atletaLogadoId)
  );
}

function duplaAVenceu(partida) {
  return Boolean(partida?.duplaAId && partida?.duplaVencedoraId === partida.duplaAId) ||
    Number(partida?.duplaVencedora) === 1;
}

function duplaBVenceu(partida) {
  return Boolean(partida?.duplaBId && partida?.duplaVencedoraId === partida.duplaBId) ||
    Number(partida?.duplaVencedora) === 2;
}

function partidaTemVencedora(partida) {
  return duplaAVenceu(partida) || duplaBVenceu(partida) || Boolean(partida?.duplaVencedoraId);
}

function atletaVenceuPartida(partida, atletaLogadoId) {
  const estaNaDuplaA = atletaEstaNaDuplaA(partida, atletaLogadoId);
  const estaNaDuplaB = atletaEstaNaDuplaB(partida, atletaLogadoId);

  return (estaNaDuplaA && duplaAVenceu(partida)) ||
    (estaNaDuplaB && duplaBVenceu(partida));
}

function obterResultadoParticipacao(partida, atletaLogadoId) {
  if (!atletaParticipou(partida, atletaLogadoId) || !partidaTemVencedora(partida)) {
    return { texto: '', classe: 'neutro' };
  }

  return atletaVenceuPartida(partida, atletaLogadoId)
    ? { texto: 'Vitória', classe: 'vitoria' }
    : { texto: 'Derrota', classe: 'derrota' };
}

function obterPontosPartidaAtleta(partida, atletaLogadoId) {
  if (!atletaVenceuPartida(partida, atletaLogadoId)) {
    return 0;
  }

  if (Number(partida.statusAprovacao) === STATUS_APROVACAO_PARTIDA.contestada) {
    return 0;
  }

  return Number(partida.pontosRankingVitoria || 0);
}

function obterPontosPendentesPartidaAtleta(partida, atletaLogadoId) {
  if (!atletaVenceuPartida(partida, atletaLogadoId)) {
    return 0;
  }

  const statusAprovacao = Number(partida.statusAprovacao);
  const possuiBonusPendente = statusAprovacao === STATUS_APROVACAO_PARTIDA.pendente ||
    statusAprovacao === STATUS_APROVACAO_PARTIDA.pendenteDeVinculos;

  return possuiBonusPendente ? Number(partida.pesoRankingCategoria || 1) : 0;
}

function formatarPontuacao(valor) {
  const numero = Number(valor || 0);

  return Number.isInteger(numero)
    ? String(numero)
    : numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
}

function placarFoiInformado(valor) {
  return valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor));
}

function partidaTemPlacar(partida) {
  return Number(partida?.status) === STATUS_PARTIDA.encerrada &&
    placarFoiInformado(partida?.placarDuplaA) &&
    placarFoiInformado(partida?.placarDuplaB);
}

function obterPlacar(partida, dupla) {
  if (!partidaTemPlacar(partida)) {
    return null;
  }

  return dupla === 'A' ? partida.placarDuplaA : partida.placarDuplaB;
}

function obterContextoPartida(partida) {
  return obterNomeGrupoPartidaExibicao(partida?.nomeGrupo);
}

function pendenciaAindaVisivel(item) {
  if (!item) {
    return false;
  }

  if (item.tipo !== TIPOS_PENDENCIA.completarContato) {
    return item.status === STATUS_PENDENCIA.pendente;
  }

  if (item.status === STATUS_PENDENCIA.aguardandoCadastro) {
    return true;
  }

  return item.status === STATUS_PENDENCIA.pendente && !item.atletaPossuiUsuarioVinculado;
}

function pendenciaExigeAcao(item) {
  return item?.status === STATUS_PENDENCIA.pendente;
}

function criarPartidaAPartirPendencia(item) {
  if (!item?.partidaId) {
    return null;
  }

  return {
    id: item.partidaId,
    nomeGrupo: item.nomeGrupo,
    status: item.statusPartida,
    statusAprovacao: item.statusAprovacaoPartida,
    nomeDuplaA: item.nomeDuplaA,
    nomeDuplaAAtleta1: item.nomeDuplaAAtleta1,
    nomeDuplaAAtleta2: item.nomeDuplaAAtleta2,
    nomeDuplaB: item.nomeDuplaB,
    nomeDuplaBAtleta1: item.nomeDuplaBAtleta1,
    nomeDuplaBAtleta2: item.nomeDuplaBAtleta2,
    placarDuplaA: item.placarDuplaA,
    placarDuplaB: item.placarDuplaB,
    criadoPorUsuarioId: item.criadoPorUsuarioId,
    nomeCriadoPorUsuario: item.nomeCriadoPorUsuario,
    grupoId: item.grupoId,
    dataPartida: item.dataPartida,
    dataCriacao: item.dataCriacao,
    quantidadeAtletasPendentes: item.tipo === TIPOS_PENDENCIA.completarContato ? 1 : 0,
    atletasPendentes: item.nomeAtleta
      ? [{
        atletaId: item.atletaId,
        nomeAtleta: item.nomeAtleta,
        email: item.emailAtleta,
        statusPendencia: item.status === STATUS_PENDENCIA.aguardandoCadastro
          ? 'AguardandoCadastro'
          : 'Pendente'
      }]
      : []
  };
}

function mesclarDadosPartida(atual, nova) {
  const resultado = { ...atual };

  Object.entries(nova || {}).forEach(([chave, valor]) => {
    if (chave.startsWith('__')) {
      return;
    }

    if (valor !== null && valor !== undefined && valor !== '') {
      resultado[chave] = valor;
      return;
    }

    if (!(chave in resultado)) {
      resultado[chave] = valor;
    }
  });

  return resultado;
}

function adicionarPartidaAoMapa(mapa, partida, flags = {}) {
  if (!partida?.id) {
    return;
  }

  const atual = mapa.get(partida.id) || {};
  mapa.set(partida.id, {
    ...mesclarDadosPartida(atual, partida),
    __participei: Boolean(atual.__participei || flags.participei),
    __registradaPorMim: Boolean(atual.__registradaPorMim || flags.registradaPorMim),
    __pendenciaAcionavel: Boolean(atual.__pendenciaAcionavel || flags.pendenciaAcionavel),
    __pendencias: [
      ...(atual.__pendencias || []),
      ...(flags.pendencias || [])
    ]
  });
}

function combinarPartidas({ participadas, registradas, pendencias, atletaLogadoId, usuarioId }) {
  const mapa = new Map();
  const pendenciasVisiveis = (pendencias || []).filter(pendenciaAindaVisivel);
  const pendenciasPorPartida = new Map();

  pendenciasVisiveis.forEach((pendencia) => {
    if (!pendencia.partidaId) {
      return;
    }

    const lista = pendenciasPorPartida.get(pendencia.partidaId) || [];
    lista.push(pendencia);
    pendenciasPorPartida.set(pendencia.partidaId, lista);
  });

  (participadas || []).forEach((partida) => {
    adicionarPartidaAoMapa(mapa, partida, {
      participei: true,
      registradaPorMim: partida.criadoPorUsuarioId === usuarioId
    });
  });

  (registradas || []).forEach((partida) => {
    adicionarPartidaAoMapa(mapa, partida, {
      participei: atletaParticipou(partida, atletaLogadoId),
      registradaPorMim: true
    });
  });

  pendenciasVisiveis.forEach((pendencia) => {
    const partida = criarPartidaAPartirPendencia(pendencia);

    if (!partida) {
      return;
    }

    adicionarPartidaAoMapa(mapa, partida, {
      participei: atletaParticipou(partida, atletaLogadoId),
      registradaPorMim: partida.criadoPorUsuarioId === usuarioId,
      pendenciaAcionavel: pendenciaExigeAcao(pendencia),
      pendencias: [pendencia]
    });
  });

  return Array.from(mapa.values()).map((partida) => {
    const pendenciasDaPartida = pendenciasPorPartida.get(partida.id) || partida.__pendencias || [];
    return {
      ...partida,
      __participei: Boolean(partida.__participei || atletaParticipou(partida, atletaLogadoId)),
      __registradaPorMim: Boolean(partida.__registradaPorMim || partida.criadoPorUsuarioId === usuarioId),
      __pendenciaAcionavel: Boolean(partida.__pendenciaAcionavel || pendenciasDaPartida.some(pendenciaExigeAcao)),
      __pendencias: pendenciasDaPartida
    };
  });
}

function partidaEstaPendente(partida) {
  if (partidaEstaCancelada(partida)) {
    return false;
  }

  const statusAprovacao = Number(partida.statusAprovacao);

  return partidaTemCancelamentoPendente(partida) ||
    Boolean(partida.__pendenciaAcionavel) ||
    statusAprovacao === STATUS_APROVACAO_PARTIDA.pendente ||
    statusAprovacao === STATUS_APROVACAO_PARTIDA.pendenteDeVinculos ||
    Number(partida.quantidadeAtletasPendentes || 0) > 0 ||
    Number(partida.status) !== STATUS_PARTIDA.encerrada;
}

function partidaPassaFiltro(partida, filtro, atletaLogadoId) {
  if (filtro === 'canceladas') {
    return partidaEstaCancelada(partida);
  }

  if (partidaEstaCancelada(partida)) {
    return false;
  }

  if (filtro === 'todas') {
    return true;
  }

  if (filtro === 'participei') {
    return partida.__participei;
  }

  if (filtro === 'registradas') {
    return partida.__registradaPorMim;
  }

  if (filtro === 'pendentes') {
    return partidaEstaPendente(partida);
  }

  const resultado = obterResultadoParticipacao(partida, atletaLogadoId);

  if (filtro === 'vitorias') {
    return resultado.texto === 'Vitória';
  }

  if (filtro === 'derrotas') {
    return resultado.texto === 'Derrota';
  }

  return true;
}

function ordenarPartidas(partidas, ordem) {
  const recentes = ordenarPartidasRecentes(partidas);

  if (ordem === 'antigas') {
    return recentes.reverse();
  }

  if (ordem === 'pendentes') {
    return [...recentes].sort((a, b) => {
      const pendenciaA = partidaEstaPendente(a) ? 1 : 0;
      const pendenciaB = partidaEstaPendente(b) ? 1 : 0;
      return pendenciaB - pendenciaA;
    });
  }

  return recentes;
}

function obterMensagemVazia(filtro) {
  switch (filtro) {
    case 'participei':
      return {
        titulo: 'Você ainda não participou de partidas registradas.',
        texto: '',
        exibirCta: true
      };
    case 'registradas':
      return {
        titulo: 'Você ainda não registrou partidas.',
        texto: '',
        exibirCta: true
      };
    case 'pendentes':
      return {
        titulo: 'Nenhuma pendência encontrada.',
        texto: '',
        exibirCta: false
      };
    case 'canceladas':
      return {
        titulo: 'Nenhuma partida cancelada.',
        texto: 'Partidas canceladas aparecerão aqui para consulta e auditoria.',
        exibirCta: false
      };
    default:
      return {
        titulo: 'Nenhuma partida encontrada.',
        texto: 'Que tal registrar uma agora?',
        exibirCta: true
      };
  }
}

function obterChipsPartida(partida, filtroAtivo, atletaLogadoId) {
  const chips = [];
  const resultado = obterResultadoParticipacao(partida, atletaLogadoId);
  const statusAprovacao = Number(partida.statusAprovacao);
  const possuiPendencia = partidaEstaPendente(partida);
  const adicionarChip = (chip) => {
    if (chips.some((item) => item.texto === chip.texto)) {
      return;
    }

    chips.push(chip);
  };

  if (partidaEstaCancelada(partida)) {
    adicionarChip({ texto: 'Partida cancelada', classe: 'derrota' });
    adicionarChip({ texto: 'Histórico', classe: 'neutro' });
    return chips;
  }

  if (partidaTemCancelamentoPendente(partida)) {
    adicionarChip({ texto: 'Cancelamento pendente', classe: 'pendente' });
  }

  if (possuiPendencia) {
    adicionarChip({ texto: 'Pendente', classe: 'pendente' });
  }

  adicionarChip({
    texto: Number(partida.status) === STATUS_PARTIDA.encerrada ? 'Encerrada' : 'Pendente',
    classe: Number(partida.status) === STATUS_PARTIDA.encerrada ? 'validado' : 'pendente'
  });

  adicionarChip({
    texto: partidaTemPlacar(partida) ? 'Com placar' : 'Sem placar',
    classe: 'neutro'
  });

  if (chips.length < 3 && statusAprovacao === STATUS_APROVACAO_PARTIDA.contestada) {
    adicionarChip({ texto: 'Contestada', classe: 'derrota' });
  }

  if (chips.length < 3 && resultado.texto && filtroAtivo !== 'registradas') {
    adicionarChip({ texto: resultado.texto, classe: resultado.classe });
  }

  if (chips.length < 3 && partida.__registradaPorMim && filtroAtivo === 'todas') {
    adicionarChip({ texto: 'Registrada', classe: 'neutro' });
  }

  if (chips.length < 3 && partida.__participei && filtroAtivo === 'todas') {
    adicionarChip({ texto: 'Participei', classe: 'neutro' });
  }

  return chips.slice(0, 3);
}

function obterTextoPendencias(partida) {
  const nomesPendentes = Array.isArray(partida.atletasPendentes)
    ? partida.atletasPendentes
      .map((atleta) => atleta?.nomeAtleta || atleta?.nome)
      .filter(Boolean)
    : [];

  if (nomesPendentes.length > 0) {
    return `Vínculo pendente: ${nomesPendentes.join(', ')}`;
  }

  const quantidade = Number(partida.quantidadeAtletasPendentes || 0);

  if (quantidade > 0) {
    return `${quantidade} ${quantidade === 1 ? 'vínculo pendente' : 'vínculos pendentes'}`;
  }

  if (partida.__pendenciaAcionavel) {
    return 'Partida com pendência acionável.';
  }

  return '';
}

function obterTipoPartida(partida) {
  return partidaTemPlacar(partida) ? 'Com placar' : 'Sem placar';
}

function formatarSimNao(valor) {
  return valor ? 'Sim' : 'Não';
}

function obterIdPartida(partida) {
  return partida?.id || partida?.partidaId || '';
}

function partidaEstaCancelada(partida) {
  return Boolean(partida?.cancelada);
}

function partidaTemCancelamentoPendente(partida) {
  return Boolean(partida?.cancelamentoPendente);
}

function obterSolicitacaoCancelamento(partida) {
  return partida?.solicitacaoCancelamento || null;
}

function obterMotivoCancelamentoTexto(solicitacao) {
  if (solicitacao?.motivoTexto) {
    return solicitacao.motivoTexto;
  }

  return MOTIVOS_CANCELAMENTO_PARTIDA.find((motivo) => motivo.valor === Number(solicitacao?.motivo))?.rotulo || 'Motivo não informado';
}

function obterStatusSolicitacaoTexto(status) {
  switch (Number(status)) {
    case STATUS_SOLICITACAO_CANCELAMENTO.aprovada:
      return 'Aprovada';
    case STATUS_SOLICITACAO_CANCELAMENTO.recusada:
      return 'Recusada';
    case STATUS_SOLICITACAO_CANCELAMENTO.canceladaPeloSolicitante:
      return 'Cancelada pelo solicitante';
    default:
      return 'Pendente';
  }
}

function obterStatusPendenciaCancelamentoTexto(status) {
  switch (Number(status)) {
    case STATUS_PENDENCIA.pendente:
      return 'Aguardando resposta';
    default:
      return 'Encerrada';
  }
}

function conflitoDeEstado(error) {
  return error?.response?.status === 409;
}

function obterMensagemConflito(error) {
  return extrairMensagemErro(error) || 'Os dados foram atualizados por outro usuário. A página será recarregada.';
}

export function PaginaMinhasPartidas() {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const atletaLogadoId = usuario?.atletaId;
  const usuarioId = usuario?.id;
  const [partidas, setPartidas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState(() => normalizarFiltro(searchParams.get('filtro')));
  const [ordem, setOrdem] = useState('recentes');
  const [partidaDetalhe, setPartidaDetalhe] = useState(null);
  const [partidaEmEdicao, setPartidaEmEdicao] = useState(null);
  const [partidaEmExclusao, setPartidaEmExclusao] = useState(null);
  const [erroExclusao, setErroExclusao] = useState('');
  const [partidaEmSolicitacaoCancelamento, setPartidaEmSolicitacaoCancelamento] = useState(null);
  const [partidaSolicitacaoDetalhe, setPartidaSolicitacaoDetalhe] = useState(null);
  const [confirmacaoCancelamento, setConfirmacaoCancelamento] = useState(null);
  const [erroCancelamento, setErroCancelamento] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindoPartidaId, setExcluindoPartidaId] = useState('');
  const [processandoCancelamento, setProcessandoCancelamento] = useState('');

  useEffect(() => {
    setFiltroAtivo(normalizarFiltro(searchParams.get('filtro')));
  }, [searchParams]);

  useEffect(() => {
    const partidaId = searchParams.get('partidaId');
    if (!partidaId || partidas.length === 0) {
      return;
    }

    const partida = partidas.find((item) => obterIdPartida(item) === partidaId);
    if (partida && obterIdPartida(partidaDetalhe) !== partidaId) {
      setPartidaDetalhe(partida);
    }
  }, [partidaDetalhe, partidas, searchParams]);

  async function carregarPartidas({ manterCarregando = true } = {}) {
    if (manterCarregando) {
      setCarregando(true);
    }
    setErro('');

    const resultadoParticipadas = atletaLogadoId
      ? partidasServico.listarMinhas()
      : Promise.resolve([]);

    const resultados = await Promise.allSettled([
      resultadoParticipadas,
      partidasServico.listarRegistradasPorMim(),
      pendenciasServico.listar()
    ]);

    const [participadasResultado, registradasResultado, pendenciasResultado] = resultados;
    const participadas = participadasResultado.status === 'fulfilled' ? participadasResultado.value || [] : [];
    const registradas = registradasResultado.status === 'fulfilled' ? registradasResultado.value || [] : [];
    const pendencias = pendenciasResultado.status === 'fulfilled' ? pendenciasResultado.value || [] : [];

    let listaFinal = [];

    if (participadasResultado.status === 'rejected' && registradasResultado.status === 'rejected') {
      setErro(extrairMensagemErro(participadasResultado.reason || registradasResultado.reason));
      setPartidas([]);
    } else {
      const erroParcial = [participadasResultado, registradasResultado]
        .find((resultado) => resultado.status === 'rejected');

      if (erroParcial) {
        setErro(extrairMensagemErro(erroParcial.reason));
      }

      const listaCombinada = ordenarPartidasRecentes(combinarPartidas({
        participadas,
        registradas,
        pendencias,
        atletaLogadoId,
        usuarioId
      }));
      listaFinal = listaCombinada;
      setPartidas(listaFinal);
    }

    if (manterCarregando) {
      setCarregando(false);
    }

    return listaFinal;
  }

  useEffect(() => {
    carregarPartidas();
  }, [atletaLogadoId, usuarioId]);

  function abrirEdicao(partida) {
    setErroEdicao('');
    setPartidaDetalhe(null);
    setPartidaEmEdicao(partida);
  }

  function fecharEdicao() {
    if (!salvandoEdicao) {
      setErroEdicao('');
      setPartidaEmEdicao(null);
    }
  }

  function abrirConfirmacaoExclusao(partida) {
    setErroExclusao('');
    setPartidaEmExclusao(partida);
  }

  function fecharConfirmacaoExclusao() {
    if (excluindoPartidaId) {
      return;
    }

    setErroExclusao('');
    setPartidaEmExclusao(null);
  }

  async function atualizarPartidasAposAcao(partidaId) {
    const listaAtualizada = await carregarPartidas({ manterCarregando: false });
    const partidaAtualizada = listaAtualizada.find((item) => obterIdPartida(item) === partidaId) || null;

    setPartidaDetalhe((atual) => (obterIdPartida(atual) === partidaId ? partidaAtualizada : atual));
    setPartidaSolicitacaoDetalhe((atual) => (obterIdPartida(atual) === partidaId ? partidaAtualizada : atual));

    return partidaAtualizada;
  }

  function abrirSolicitacaoCancelamento(partida) {
    setErroCancelamento('');
    setPartidaEmSolicitacaoCancelamento(partida);
  }

  function fecharSolicitacaoCancelamento() {
    if (processandoCancelamento) {
      return;
    }

    setErroCancelamento('');
    setPartidaEmSolicitacaoCancelamento(null);
  }

  function abrirDetalheSolicitacaoCancelamento(partida) {
    setErroCancelamento('');
    setPartidaSolicitacaoDetalhe(partida);
  }

  function fecharDetalheSolicitacaoCancelamento() {
    if (processandoCancelamento) {
      return;
    }

    setErroCancelamento('');
    setPartidaSolicitacaoDetalhe(null);
  }

  function abrirConfirmacaoAcaoCancelamento(tipo, partida) {
    setErroCancelamento('');
    setConfirmacaoCancelamento({ tipo, partida });
  }

  function fecharConfirmacaoAcaoCancelamento() {
    if (processandoCancelamento) {
      return;
    }

    setErroCancelamento('');
    setConfirmacaoCancelamento(null);
  }

  async function enviarSolicitacaoCancelamento(payload) {
    const partidaId = obterIdPartida(partidaEmSolicitacaoCancelamento);

    if (!partidaId || processandoCancelamento) {
      return;
    }

    setErroCancelamento('');
    setProcessandoCancelamento(`solicitar-${partidaId}`);

    try {
      await partidasServico.solicitarCancelamentoPartida(partidaId, payload);
      setPartidaEmSolicitacaoCancelamento(null);
      const partidaAtualizada = await atualizarPartidasAposAcao(partidaId);
      showNotification({
        type: 'success',
        title: 'Solicitação enviada!',
        message: 'Os atletas da dupla adversária foram notificados e já podem responder.'
      });
      if (partidaAtualizada) {
        setPartidaSolicitacaoDetalhe(partidaAtualizada);
      }
    } catch (error) {
      const mensagem = conflitoDeEstado(error)
        ? obterMensagemConflito(error)
        : extrairMensagemErro(error);
      setErroCancelamento(mensagem);
      showNotification({
        type: 'error',
        title: 'Não foi possível solicitar cancelamento',
        message: mensagem
      });
      if (conflitoDeEstado(error)) {
        await atualizarPartidasAposAcao(partidaId);
      }
    } finally {
      setProcessandoCancelamento('');
    }
  }

  async function confirmarAcaoCancelamento() {
    const partida = confirmacaoCancelamento?.partida;
    const solicitacao = obterSolicitacaoCancelamento(partida);
    const partidaId = obterIdPartida(partida);
    const solicitacaoId = solicitacao?.id;
    const tipo = confirmacaoCancelamento?.tipo;

    if (!partidaId || !solicitacaoId || !tipo || processandoCancelamento) {
      return;
    }

    setErroCancelamento('');
    setProcessandoCancelamento(`${tipo}-${partidaId}`);

    try {
      if (tipo === 'aprovar') {
        await partidasServico.aprovarCancelamentoPartida(partidaId, solicitacaoId);
      } else if (tipo === 'recusar') {
        await partidasServico.recusarCancelamentoPartida(partidaId, solicitacaoId);
      } else {
        await partidasServico.cancelarSolicitacaoCancelamento(partidaId, solicitacaoId);
      }

      setConfirmacaoCancelamento(null);
      setPartidaSolicitacaoDetalhe(null);
      await atualizarPartidasAposAcao(partidaId);

      const mensagens = {
        aprovar: 'Partida cancelada com sucesso.',
        recusar: 'Solicitação de cancelamento recusada.',
        cancelarSolicitacao: 'Solicitação de cancelamento cancelada.'
      };

      showNotification({
        type: 'success',
        title: mensagens[tipo]
      });
    } catch (error) {
      const mensagem = conflitoDeEstado(error)
        ? obterMensagemConflito(error)
        : extrairMensagemErro(error);
      setErroCancelamento(mensagem);
      showNotification({
        type: 'error',
        title: 'Não foi possível concluir a ação',
        message: mensagem
      });
      if (conflitoDeEstado(error)) {
        await atualizarPartidasAposAcao(partidaId);
      }
    } finally {
      setProcessandoCancelamento('');
    }
  }

  async function confirmarExclusaoPartida(motivo) {
    const partidaId = obterIdPartida(partidaEmExclusao);

    if (!partidaId || excluindoPartidaId) {
      return;
    }

    setErroExclusao('');
    setExcluindoPartidaId(partidaId);

    try {
      await partidasServico.excluirPartidaDefinitivamente(partidaId, motivo);
      await carregarPartidas({ manterCarregando: false });
      setPartidaDetalhe((atual) => (obterIdPartida(atual) === partidaId ? null : atual));
      setPartidaEmExclusao(null);
      showNotification({
        type: 'success',
        title: 'Partida excluída definitivamente.'
      });
      navigate('/minhas-partidas', { replace: true });
    } catch (error) {
      const mensagem = extrairMensagemErro(error) || 'Não foi possível excluir a partida. Tente novamente.';
      setErroExclusao(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao excluir partida',
        message: mensagem
      });
    } finally {
      setExcluindoPartidaId('');
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
      await carregarPartidas({ manterCarregando: false });
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

  const filtrosDisponiveis = useMemo(() => (
    atletaLogadoId ? [...FILTROS_PRINCIPAIS, ...FILTROS_ATLETA] : FILTROS_PRINCIPAIS
  ), [atletaLogadoId]);

  const resumo = useMemo(() => {
    return partidas
      .filter((partida) => partida.__participei && !partidaEstaCancelada(partida))
      .reduce((acumulado, partida) => {
        const resultado = obterResultadoParticipacao(partida, atletaLogadoId);
        return {
          jogos: acumulado.jogos + 1,
          vitorias: acumulado.vitorias + (resultado.texto === 'Vitória' ? 1 : 0),
          derrotas: acumulado.derrotas + (resultado.texto === 'Derrota' ? 1 : 0),
          pontos: acumulado.pontos + obterPontosPartidaAtleta(partida, atletaLogadoId),
          pontosPendentes: acumulado.pontosPendentes + obterPontosPendentesPartidaAtleta(partida, atletaLogadoId)
        };
      }, { jogos: 0, vitorias: 0, derrotas: 0, pontos: 0, pontosPendentes: 0 });
  }, [atletaLogadoId, partidas]);

  const aproveitamento = resumo.jogos > 0
    ? Math.round((resumo.vitorias / resumo.jogos) * 100)
    : 0;

  const partidasFiltradas = useMemo(() => {
    return ordenarPartidas(
      partidas.filter((partida) => partidaPassaFiltro(partida, filtroAtivo, atletaLogadoId)),
      ordem
    );
  }, [atletaLogadoId, filtroAtivo, ordem, partidas]);

  return (
    <section className="pagina minhas-partidas-pagina">
      <AppHero
        title="Histórico"
        subtitle="Todas as suas partidas em um só lugar."
        badge="Partidas, resultados e pendências"
        autenticado={Boolean(usuario)}
        variant="page"
      />

      {atletaLogadoId && (
        <article className="minhas-partidas-resumo-premium">
          <div className="minhas-partidas-resumo-topo">
            <div>
              <span>Resumo</span>
              <strong>{formatarPontuacao(resumo.pontos)} pts</strong>
              {resumo.pontosPendentes > 0 && (
                <small>Pendente +{formatarPontuacao(resumo.pontosPendentes)}</small>
              )}
            </div>
            <FaTrophy aria-hidden="true" />
          </div>

          <div className="minhas-partidas-metricas">
            <ResumoMetrica rotulo="Jogos" valor={resumo.jogos} />
            <ResumoMetrica rotulo="Vitórias" valor={resumo.vitorias} />
            <ResumoMetrica rotulo="Derrotas" valor={resumo.derrotas} />
            <ResumoMetrica rotulo="Aprov." rotuloCompleto="Aproveitamento" valor={`${aproveitamento}%`} />
          </div>
        </article>
      )}

      <section className="minhas-partidas-controles" aria-label="Filtros das partidas">
        <div className="minhas-partidas-filtros">
          {filtrosDisponiveis.map((filtro) => (
            <button
              key={filtro.id}
              type="button"
              className={filtroAtivo === filtro.id ? 'ativo' : ''}
              onClick={() => setFiltroAtivo(filtro.id)}
            >
              {filtro.rotulo}
            </button>
          ))}
        </div>

        <label className="minhas-partidas-ordenacao">
          <FaSortAmountDown aria-hidden="true" />
          <select value={ordem} onChange={(evento) => setOrdem(evento.target.value)}>
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="pendentes">Pendentes primeiro</option>
          </select>
        </label>
      </section>

      {erro && <p className="texto-erro">{erro}</p>}

      {carregando ? (
        <article className="minhas-partidas-estado">
          <span className="minhas-partidas-loading" />
          <strong>Carregando suas partidas...</strong>
        </article>
      ) : partidas.length === 0 ? (
        <EstadoVazio filtro={filtroAtivo} />
      ) : partidasFiltradas.length === 0 ? (
        <EstadoVazio filtro={filtroAtivo} />
      ) : (
        <div className="minhas-partidas-lista-premium">
          {partidasFiltradas.map((partida) => (
            <CardMinhaPartida
              key={partida.id}
              partida={partida}
              atletaLogadoId={atletaLogadoId}
              filtroAtivo={filtroAtivo}
              onDetalhes={() => setPartidaDetalhe(partida)}
              onEditar={podeEditarPartida(partida, usuario) ? () => abrirEdicao(partida) : null}
              onSolicitarCancelamento={() => abrirSolicitacaoCancelamento(partida)}
              onVerSolicitacao={() => abrirDetalheSolicitacaoCancelamento(partida)}
              onAprovarCancelamento={() => abrirConfirmacaoAcaoCancelamento('aprovar', partida)}
              onRecusarCancelamento={() => abrirConfirmacaoAcaoCancelamento('recusar', partida)}
              onCancelarSolicitacao={() => abrirConfirmacaoAcaoCancelamento('cancelarSolicitacao', partida)}
              onExcluirDefinitivamente={() => abrirConfirmacaoExclusao(partida)}
            />
          ))}
        </div>
      )}

      {partidaDetalhe && (
        <DetalhesPartidaModal
          partida={partidaDetalhe}
          atletaLogadoId={atletaLogadoId}
          onFechar={() => setPartidaDetalhe(null)}
          onEditar={podeEditarPartida(partidaDetalhe, usuario) ? () => abrirEdicao(partidaDetalhe) : null}
          onExcluir={podeExcluirPartida(partidaDetalhe, usuario) ? () => abrirConfirmacaoExclusao(partidaDetalhe) : null}
          onSolicitarCancelamento={() => abrirSolicitacaoCancelamento(partidaDetalhe)}
          onVerSolicitacao={() => abrirDetalheSolicitacaoCancelamento(partidaDetalhe)}
          onAprovarCancelamento={() => abrirConfirmacaoAcaoCancelamento('aprovar', partidaDetalhe)}
          onRecusarCancelamento={() => abrirConfirmacaoAcaoCancelamento('recusar', partidaDetalhe)}
          onCancelarSolicitacao={() => abrirConfirmacaoAcaoCancelamento('cancelarSolicitacao', partidaDetalhe)}
          excluindo={excluindoPartidaId === obterIdPartida(partidaDetalhe)}
        />
      )}

      {partidaEmSolicitacaoCancelamento && (
        <SolicitarCancelamentoPartidaModal
          erro={erroCancelamento}
          enviando={processandoCancelamento === `solicitar-${obterIdPartida(partidaEmSolicitacaoCancelamento)}`}
          onCancelar={fecharSolicitacaoCancelamento}
          onEnviar={enviarSolicitacaoCancelamento}
        />
      )}

      {partidaSolicitacaoDetalhe && (
        <SolicitacaoCancelamentoDetalheModal
          partida={partidaSolicitacaoDetalhe}
          erro={erroCancelamento}
          processando={Boolean(processandoCancelamento)}
          onFechar={fecharDetalheSolicitacaoCancelamento}
          onAprovar={() => abrirConfirmacaoAcaoCancelamento('aprovar', partidaSolicitacaoDetalhe)}
          onRecusar={() => abrirConfirmacaoAcaoCancelamento('recusar', partidaSolicitacaoDetalhe)}
          onCancelarSolicitacao={() => abrirConfirmacaoAcaoCancelamento('cancelarSolicitacao', partidaSolicitacaoDetalhe)}
        />
      )}

      {confirmacaoCancelamento && (
        <ConfirmarAcaoCancelamentoModal
          tipo={confirmacaoCancelamento.tipo}
          erro={erroCancelamento}
          processando={Boolean(processandoCancelamento)}
          onCancelar={fecharConfirmacaoAcaoCancelamento}
          onConfirmar={confirmarAcaoCancelamento}
        />
      )}

      {partidaEmExclusao && (
        <ConfirmarExclusaoPartidaModal
          erro={erroExclusao}
          excluindo={excluindoPartidaId === obterIdPartida(partidaEmExclusao)}
          onCancelar={fecharConfirmacaoExclusao}
          onConfirmar={confirmarExclusaoPartida}
        />
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

function ResumoMetrica({ rotulo, valor, rotuloCompleto }) {
  return (
    <div>
      <span title={rotuloCompleto || rotulo} aria-label={rotuloCompleto || rotulo}>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function EstadoVazio({ filtro }) {
  const estado = obterMensagemVazia(filtro);

  return (
    <article className="minhas-partidas-estado minhas-partidas-vazio">
      <FaGamepad aria-hidden="true" />
      <div>
        <strong>{estado.titulo}</strong>
        {estado.texto && <p>{estado.texto}</p>}
      </div>
      {estado.exibirCta && (
        <Link to="/partidas/registrar" className="botao-secundario botao-compacto">
          Registrar partida
        </Link>
      )}
    </article>
  );
}

function CardMinhaPartida({
  partida,
  atletaLogadoId,
  filtroAtivo,
  onDetalhes,
  onEditar,
  onSolicitarCancelamento,
  onVerSolicitacao,
  onAprovarCancelamento,
  onRecusarCancelamento,
  onCancelarSolicitacao,
  onExcluirDefinitivamente
}) {
  const atletas = obterAtletasPartida(partida, atletaLogadoId);
  const minhaDuplaEhA = atletaEstaNaDuplaA(partida, atletaLogadoId);
  const minhaDuplaEhB = atletaEstaNaDuplaB(partida, atletaLogadoId);
  const temPlacar = partidaTemPlacar(partida);
  const pendenciasTexto = obterTextoPendencias(partida);
  const cancelada = partidaEstaCancelada(partida);
  const cancelamentoPendente = partidaTemCancelamentoPendente(partida);
  const podeCompartilhar = Number(partida.status) === STATUS_PARTIDA.encerrada && partida.id && !cancelada && !cancelamentoPendente;
  const podeResolverPendencias = partida.__pendenciaAcionavel && !cancelada && !cancelamentoPendente;
  const podeSolicitarCancelamento = Boolean(partida.podeSolicitarCancelamento) && !cancelada && !cancelamentoPendente;
  const podeExcluirDefinitivamente = Boolean(partida.podeExcluirDefinitivamente);
  const exibirAcoesCancelamentoPendente = cancelamentoPendente && !cancelada;

  return (
    <PartidaCardPremium
      className={`${cancelada ? 'minhas-partidas-card-cancelada' : ''} ${cancelamentoPendente ? 'minhas-partidas-card-cancelamento-pendente' : ''}`.trim()}
      contexto={obterContextoPartida(partida)}
      dataPartida={partida.dataPartida || partida.dataCriacao}
      badges={obterChipsPartida(partida, filtroAtivo, atletaLogadoId)}
      avisoPendencias={pendenciasTexto}
      duplaA={{
        label: minhaDuplaEhA ? 'Sua dupla' : '',
        atletas: formatarAtletasPlacar(atletas.duplaA),
        atleta1Id: partida.duplaAAtleta1Id,
        atleta2Id: partida.duplaAAtleta2Id,
        placar: obterPlacar(partida, 'A'),
        mostrarPlacar: temPlacar,
        destaque: minhaDuplaEhA,
        vencedora: duplaAVenceu(partida)
      }}
      duplaB={{
        label: minhaDuplaEhB ? 'Sua dupla' : '',
        atletas: formatarAtletasPlacar(atletas.duplaB),
        atleta1Id: partida.duplaBAtleta1Id,
        atleta2Id: partida.duplaBAtleta2Id,
        placar: obterPlacar(partida, 'B'),
        mostrarPlacar: temPlacar,
        destaque: minhaDuplaEhB,
        vencedora: duplaBVenceu(partida)
      }}
      statusCancelamento={
        <>
          {cancelamentoPendente && !cancelada && (
            <CancelamentoPendenteBloco
              partida={partida}
              compacto
              onVerSolicitacao={onVerSolicitacao}
              onAprovar={onAprovarCancelamento}
              onRecusar={onRecusarCancelamento}
              onCancelarSolicitacao={onCancelarSolicitacao}
            />
          )}
          {cancelada && (
            <PartidaCanceladaBloco partida={partida} compacto />
          )}
        </>
      }
      acaoPrincipal={podeResolverPendencias && (
        <Link to="/app/pendencias" className="botao-primario botao-compacto minhas-partidas-acao-principal">
          <FaExclamationTriangle aria-hidden="true" />
          Resolver
        </Link>
      )}
      acaoCompartilhar={
        <>
          {onEditar && !cancelada && !cancelamentoPendente && (
            <button
              type="button"
              className="botao-secundario botao-compacto botao-editar-partida-discreto"
              onClick={onEditar}
              aria-label="Editar partida"
              title="Editar partida"
            >
              <FaEdit aria-hidden="true" />
              Editar
            </button>
          )}
          {podeCompartilhar && (
            <CompartilharPartidaBotao
              partidaId={partida.id}
              registradoPor={partida.nomeCriadoPorUsuario}
            />
          )}
          {podeSolicitarCancelamento && (
            <button
              type="button"
              className="botao-terciario botao-compacto minhas-partidas-acao-cancelamento"
              onClick={onSolicitarCancelamento}
            >
              <FaBan aria-hidden="true" />
              Solicitar cancelamento
            </button>
          )}
          {exibirAcoesCancelamentoPendente && (
            <button
              type="button"
              className="botao-secundario botao-compacto minhas-partidas-acao-ver-solicitacao"
              onClick={onVerSolicitacao}
            >
              Ver solicitação
            </button>
          )}
          {cancelada && podeExcluirDefinitivamente && (
            <button
              type="button"
              className="botao-perigo botao-compacto minhas-partidas-acao-cancelamento"
              onClick={onExcluirDefinitivamente}
            >
              <FaTrashAlt aria-hidden="true" />
              Excluir definitivamente
            </button>
          )}
        </>
      }
      detalhesHref={obterRotaDetalhePartida(partida)}
      onDetalhes={onDetalhes}
      detalhesDesabilitado={!partida.id}
    />
  );
}

function CancelamentoPendenteBloco({
  partida,
  compacto = false,
  onVerSolicitacao,
  onAprovar,
  onRecusar,
  onCancelarSolicitacao
}) {
  const solicitacao = obterSolicitacaoCancelamento(partida);

  return (
    <section className={`minhas-partidas-cancelamento-bloco ${compacto ? 'compacto' : ''}`} aria-label="Cancelamento pendente">
      <div>
        <span className="minhas-partidas-cancelamento-badge pendente">
          <FaHourglassHalf aria-hidden="true" />
          Cancelamento pendente
        </span>
        <strong>Aguardando aprovação da dupla adversária.</strong>
        {solicitacao && <p>Motivo: {obterMotivoCancelamentoTexto(solicitacao)}</p>}
      </div>
      <div className="minhas-partidas-cancelamento-acoes">
        {onVerSolicitacao && (
          <button type="button" className="botao-secundario botao-compacto" onClick={onVerSolicitacao}>
            Ver solicitação
          </button>
        )}
        {partida?.podeCancelarSolicitacao && onCancelarSolicitacao && (
          <button type="button" className="botao-terciario botao-compacto" onClick={onCancelarSolicitacao}>
            Cancelar solicitação
          </button>
        )}
        {partida?.podeResponderCancelamento && onRecusar && (
          <button type="button" className="botao-terciario botao-compacto minhas-partidas-botao-recusa" onClick={onRecusar}>
            Recusar
          </button>
        )}
        {partida?.podeResponderCancelamento && onAprovar && (
          <button type="button" className="botao-secundario botao-compacto minhas-partidas-botao-aprovar" onClick={onAprovar}>
            Aprovar cancelamento
          </button>
        )}
      </div>
    </section>
  );
}

function PartidaCanceladaBloco({ partida, compacto = false }) {
  const solicitacao = obterSolicitacaoCancelamento(partida);

  return (
    <section className={`minhas-partidas-cancelamento-bloco cancelada ${compacto ? 'compacto' : ''}`} aria-label="Partida cancelada">
      <div>
        <span className="minhas-partidas-cancelamento-badge cancelada">
          <FaBan aria-hidden="true" />
          Partida cancelada
        </span>
        <strong>Esta partida não conta mais para rankings, scouts e benefícios.</strong>
        {solicitacao && <p>Motivo: {obterMotivoCancelamentoTexto(solicitacao)}</p>}
        {partida?.canceladaEm && <p>Cancelada em: {formatarDataHoraCurta(partida.canceladaEm)}</p>}
      </div>
    </section>
  );
}

function DetalhesPartidaModal({
  partida,
  atletaLogadoId,
  onFechar,
  onEditar,
  onExcluir,
  onSolicitarCancelamento,
  onVerSolicitacao,
  onAprovarCancelamento,
  onRecusarCancelamento,
  onCancelarSolicitacao,
  excluindo = false
}) {
  const atletas = obterAtletasPartida(partida, atletaLogadoId);
  const resultado = obterResultadoParticipacao(partida, atletaLogadoId);
  const contexto = obterContextoPartida(partida);
  const pendenciasTexto = obterTextoPendencias(partida);
  const cancelada = partidaEstaCancelada(partida);
  const cancelamentoPendente = partidaTemCancelamentoPendente(partida);
  const podeResolverPendencias = partida.__pendenciaAcionavel && !cancelada && !cancelamentoPendente;
  const podeCompartilhar = Number(partida.status) === STATUS_PARTIDA.encerrada && partida.id && !cancelada && !cancelamentoPendente;
  const podeSolicitarCancelamento = Boolean(partida.podeSolicitarCancelamento) && !cancelada && !cancelamentoPendente;

  return (
    <div className="modal-backdrop minhas-partidas-detalhe-backdrop" role="presentation" onClick={onFechar}>
      <article className="modal-conteudo minhas-partidas-modal" role="dialog" aria-modal="true" aria-label="Detalhes da partida" onClick={(evento) => evento.stopPropagation()}>
        <div className="minhas-partidas-modal-cabecalho">
          <div>
            <span>Detalhes da partida</span>
            <h3>{contexto}</h3>
            <p>{partida.dataPartida || partida.dataCriacao ? formatarDataHoraCurta(partida.dataPartida || partida.dataCriacao) : 'Data a definir'}</p>
          </div>
          <button type="button" className="minhas-partidas-modal-fechar" onClick={onFechar} aria-label="Fechar detalhes da partida">
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="minhas-partidas-modal-corpo">
          <div className="minhas-partidas-badges minhas-partidas-modal-badges">
            {obterChipsPartida(partida, 'todas', atletaLogadoId).map((badge, indice) => (
              <span key={`${badge.texto}-${indice}`} className={`minhas-partidas-badge ${badge.classe || 'neutro'}`}>
                {badge.texto}
              </span>
            ))}
          </div>

          {cancelamentoPendente && !cancelada && (
            <CancelamentoPendenteBloco
              partida={partida}
              onVerSolicitacao={onVerSolicitacao}
              onAprovar={onAprovarCancelamento}
              onRecusar={onRecusarCancelamento}
              onCancelarSolicitacao={onCancelarSolicitacao}
            />
          )}

          {cancelada && <PartidaCanceladaBloco partida={partida} />}

          <div className="minhas-partidas-placar-premium">
            <PartidaCardPremium.LinhaPlacar
              label="Dupla 1"
              atletas={formatarAtletasPlacar(atletas.duplaA)}
              placar={obterPlacar(partida, 'A')}
              mostrarPlacar={partidaTemPlacar(partida)}
              destaque={atletaEstaNaDuplaA(partida, atletaLogadoId)}
              vencedora={duplaAVenceu(partida)}
              atleta1Id={partida.duplaAAtleta1Id}
              atleta2Id={partida.duplaAAtleta2Id}
            />
            <PartidaCardPremium.LinhaPlacar
              label="Dupla 2"
              atletas={formatarAtletasPlacar(atletas.duplaB)}
              placar={obterPlacar(partida, 'B')}
              mostrarPlacar={partidaTemPlacar(partida)}
              destaque={atletaEstaNaDuplaB(partida, atletaLogadoId)}
              vencedora={duplaBVenceu(partida)}
              atleta1Id={partida.duplaBAtleta1Id}
              atleta2Id={partida.duplaBAtleta2Id}
            />
          </div>

          {pendenciasTexto && (
            <p className="minhas-partidas-pendencias-aviso">{pendenciasTexto}</p>
          )}

          <div className="minhas-partidas-modal-grid">
            <ResumoMetrica rotulo="Registrada por" valor={partida.nomeCriadoPorUsuario || 'Usuário QN'} />
            <ResumoMetrica rotulo="Grupo" valor={contexto} />
            <ResumoMetrica rotulo="Tipo" valor={obterTipoPartida(partida)} />
            <ResumoMetrica rotulo="Status" valor={obterNomeStatusAprovacao(partida.statusAprovacao)} />
            <ResumoMetrica rotulo="Participei" valor={formatarSimNao(partida.__participei)} />
            <ResumoMetrica rotulo="Registrada por mim" valor={formatarSimNao(partida.__registradaPorMim)} />
            <ResumoMetrica rotulo="Resultado" valor={resultado.texto || 'Não aplicável'} />
            <ResumoMetrica rotulo="Pendências" valor={partida.quantidadeAtletasPendentes || 0} />
          </div>

          {partida.observacoes && <p className="minhas-partidas-observacoes">{partida.observacoes}</p>}
        </div>

        <div className="minhas-partidas-modal-acoes">
          {podeResolverPendencias && (
            <Link to="/app/pendencias" className="botao-primario">
              Resolver pendências
            </Link>
          )}
          {onEditar && (
            <button type="button" className="botao-secundario" onClick={onEditar}>
              <FaEdit aria-hidden="true" />
              Editar
            </button>
          )}
          {podeCompartilhar && (
            <CompartilharPartidaBotao
              partidaId={partida.id}
              className="botao-secundario botao-compartilhar-partida"
              registradoPor={partida.nomeCriadoPorUsuario}
            />
          )}
          {podeSolicitarCancelamento && (
            <button type="button" className="botao-terciario minhas-partidas-modal-solicitar-cancelamento" onClick={onSolicitarCancelamento}>
              <FaBan aria-hidden="true" />
              Solicitar cancelamento
            </button>
          )}
          {onExcluir && (
            <button
              type="button"
              className="botao-perigo minhas-partidas-modal-excluir"
              onClick={onExcluir}
              disabled={excluindo}
            >
              <FaTrashAlt aria-hidden="true" />
              {excluindo ? 'Excluindo...' : 'Excluir partida'}
            </button>
          )}
          <button type="button" className="botao-terciario" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </article>
    </div>
  );
}

function SolicitarCancelamentoPartidaModal({ erro, enviando, onCancelar, onEnviar }) {
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erroValidacao, setErroValidacao] = useState('');
  const motivoNumerico = Number(motivo);
  const observacaoLimpa = observacao.trim();
  const observacaoObrigatoria = motivoNumerico === MOTIVO_OUTRO;
  const observacaoValida = !observacaoObrigatoria || observacaoLimpa.length > 0;
  const motivoValido = MOTIVOS_CANCELAMENTO_PARTIDA.some((item) => item.valor === motivoNumerico);
  const podeEnviar = motivoValido && observacaoValida && !enviando && observacao.length <= 200;

  function enviar(evento) {
    evento.preventDefault();

    if (!motivoValido) {
      setErroValidacao('Informe o motivo do cancelamento.');
      return;
    }

    if (!observacaoValida) {
      setErroValidacao('Descreva o motivo do cancelamento.');
      return;
    }

    if (observacao.length > 200) {
      setErroValidacao('A observação deve ter no máximo 200 caracteres.');
      return;
    }

    setErroValidacao('');
    onEnviar({
      motivo: motivoNumerico,
      observacao: observacaoLimpa || null
    });
  }

  return (
    <div className="modal-backdrop minhas-partidas-confirmacao-backdrop" role="presentation" onClick={enviando ? undefined : onCancelar}>
      <form
        className="modal-conteudo minhas-partidas-confirmacao-modal minhas-partidas-cancelamento-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="solicitar-cancelamento-titulo"
        onSubmit={enviar}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="minhas-partidas-confirmacao-icone alerta" aria-hidden="true">
          <FaBan />
        </div>

        <div className="minhas-partidas-confirmacao-texto">
          <span>Solicitação de cancelamento</span>
          <h3 id="solicitar-cancelamento-titulo">Solicitar cancelamento</h3>
          <p>Sua solicitação será enviada para a dupla adversária.</p>
          <p>A partida só será cancelada após a aprovação de pelo menos um atleta do outro time.</p>
        </div>

        <label className="minhas-partidas-campo">
          Motivo do cancelamento
          <select value={motivo} onChange={(evento) => setMotivo(evento.target.value)} disabled={enviando}>
            <option value="">Selecione</option>
            {MOTIVOS_CANCELAMENTO_PARTIDA.map((item) => (
              <option key={item.valor} value={item.valor}>{item.rotulo}</option>
            ))}
          </select>
        </label>

        <label className="minhas-partidas-campo">
          Observação
          <textarea
            value={observacao}
            onChange={(evento) => setObservacao(evento.target.value)}
            onFocus={scrollFocusedInputIntoView}
            placeholder="Conte mais detalhes sobre o motivo..."
            maxLength={220}
            disabled={enviando}
          />
          <small>{observacao.length}/200</small>
        </label>

        {(erroValidacao || erro) && <p className="texto-erro minhas-partidas-confirmacao-erro">{erroValidacao || erro}</p>}

        <div className="minhas-partidas-confirmacao-acoes">
          <button type="button" className="botao-terciario" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="botao-primario" disabled={!podeEnviar}>
            {enviando ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SolicitacaoCancelamentoDetalheModal({
  partida,
  erro,
  processando,
  onFechar,
  onAprovar,
  onRecusar,
  onCancelarSolicitacao
}) {
  const solicitacao = obterSolicitacaoCancelamento(partida);
  const pendencias = Array.isArray(solicitacao?.pendencias) ? solicitacao.pendencias : [];

  return (
    <div className="modal-backdrop minhas-partidas-detalhe-backdrop" role="presentation" onClick={processando ? undefined : onFechar}>
      <article
        className="modal-conteudo minhas-partidas-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Solicitação de cancelamento"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="minhas-partidas-modal-cabecalho">
          <div>
            <span>Solicitação de cancelamento</span>
            <h3>{obterContextoPartida(partida)}</h3>
            <p>{solicitacao?.solicitadaEm ? formatarDataHoraCurta(solicitacao.solicitadaEm) : 'Data a definir'}</p>
          </div>
          <button type="button" className="minhas-partidas-modal-fechar" onClick={onFechar} aria-label="Fechar solicitação" disabled={processando}>
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="minhas-partidas-modal-corpo">
          <div className="minhas-partidas-cancelamento-detalhe">
            <span className="minhas-partidas-cancelamento-badge pendente">
              {obterStatusSolicitacaoTexto(solicitacao?.status)}
            </span>
            <dl>
              <div>
                <dt>Solicitada por</dt>
                <dd>{solicitacao?.nomeSolicitante || 'Usuário QN'}</dd>
              </div>
              <div>
                <dt>Motivo</dt>
                <dd>{obterMotivoCancelamentoTexto(solicitacao)}</dd>
              </div>
              {solicitacao?.observacao && (
                <div>
                  <dt>Observação</dt>
                  <dd>{solicitacao.observacao}</dd>
                </div>
              )}
              {solicitacao?.nomeRespondente && (
                <div>
                  <dt>Respondida por</dt>
                  <dd>{solicitacao.nomeRespondente}</dd>
                </div>
              )}
              {solicitacao?.respondidaEm && (
                <div>
                  <dt>Resposta em</dt>
                  <dd>{formatarDataHoraCurta(solicitacao.respondidaEm)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="minhas-partidas-cancelamento-impacto">
            Ao aprovar, esta partida deixará de contar nos rankings, scouts e benefícios. Os QN relacionados serão estornados.
          </div>

          {pendencias.length > 0 && (
            <div className="minhas-partidas-cancelamento-pendencias">
              <strong>Dupla adversária</strong>
              {pendencias.map((pendencia) => (
                <span key={pendencia.pendenciaId}>
                  {pendencia.nomeAtleta || 'Atleta'} · {obterStatusPendenciaCancelamentoTexto(pendencia.status)}
                </span>
              ))}
            </div>
          )}

          {erro && <p className="texto-erro minhas-partidas-confirmacao-erro">{erro}</p>}
        </div>

        <div className="minhas-partidas-modal-acoes">
          {partida?.podeCancelarSolicitacao && (
            <button type="button" className="botao-terciario" onClick={onCancelarSolicitacao} disabled={processando}>
              Cancelar solicitação
            </button>
          )}
          {partida?.podeResponderCancelamento && (
            <>
              <button type="button" className="botao-perigo" onClick={onRecusar} disabled={processando}>
                Recusar
              </button>
              <button type="button" className="botao-secundario minhas-partidas-botao-aprovar" onClick={onAprovar} disabled={processando}>
                Aprovar cancelamento
              </button>
            </>
          )}
          <button type="button" className="botao-terciario" onClick={onFechar} disabled={processando}>
            Fechar
          </button>
        </div>
      </article>
    </div>
  );
}

function ConfirmarAcaoCancelamentoModal({ tipo, erro, processando, onCancelar, onConfirmar }) {
  const configuracao = {
    aprovar: {
      tag: 'Aprovação',
      titulo: 'Aprovar cancelamento?',
      texto: 'Após a aprovação, esta partida deixará de contar nos rankings, scouts e benefícios. Os QN conquistados por causa dela serão estornados.',
      botao: 'Aprovar cancelamento',
      classe: 'botao-secundario minhas-partidas-botao-aprovar',
      icone: <FaCheckCircle />
    },
    recusar: {
      tag: 'Recusa',
      titulo: 'Recusar cancelamento?',
      texto: 'A solicitação será encerrada e a partida continuará válida normalmente.',
      botao: 'Recusar solicitação',
      classe: 'botao-perigo',
      icone: <FaTimes />
    },
    cancelarSolicitacao: {
      tag: 'Cancelar solicitação',
      titulo: 'Cancelar solicitação?',
      texto: 'A partida continuará válida e a dupla adversária não precisará mais responder.',
      botao: 'Cancelar solicitação',
      classe: 'botao-terciario',
      icone: <FaBan />
    }
  }[tipo] || {};

  return (
    <div className="modal-backdrop minhas-partidas-confirmacao-backdrop" role="presentation" onClick={processando ? undefined : onCancelar}>
      <article
        className="modal-conteudo minhas-partidas-confirmacao-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-acao-cancelamento-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="minhas-partidas-confirmacao-icone alerta" aria-hidden="true">
          {configuracao.icone}
        </div>

        <div className="minhas-partidas-confirmacao-texto">
          <span>{configuracao.tag}</span>
          <h3 id="confirmar-acao-cancelamento-titulo">{configuracao.titulo}</h3>
          <p>{configuracao.texto}</p>
        </div>

        {erro && <p className="texto-erro minhas-partidas-confirmacao-erro">{erro}</p>}

        <div className="minhas-partidas-confirmacao-acoes">
          <button type="button" className="botao-terciario" onClick={onCancelar} disabled={processando}>
            Voltar
          </button>
          <button type="button" className={configuracao.classe} onClick={onConfirmar} disabled={processando}>
            {processando ? 'Processando...' : configuracao.botao}
          </button>
        </div>
      </article>
    </div>
  );
}

function ConfirmarExclusaoPartidaModal({ erro, excluindo, onCancelar, onConfirmar }) {
  const [motivo, setMotivo] = useState('');
  const motivoValido = motivo.trim().length > 0 && motivo.trim().length <= 200;

  return (
    <div
      className="modal-backdrop minhas-partidas-confirmacao-backdrop"
      role="presentation"
      onClick={excluindo ? undefined : onCancelar}
    >
      <article
        className="modal-conteudo minhas-partidas-confirmacao-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-exclusao-partida-titulo"
        aria-describedby="confirmar-exclusao-partida-descricao confirmar-exclusao-partida-pergunta"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="minhas-partidas-confirmacao-icone" aria-hidden="true">
          <FaTrashAlt />
        </div>

        <div className="minhas-partidas-confirmacao-texto">
          <span>Ação destrutiva</span>
          <h3 id="confirmar-exclusao-partida-titulo">Excluir definitivamente?</h3>
          <p id="confirmar-exclusao-partida-descricao">
            Esta ação removerá a partida das consultas normais e não poderá ser desfeita pela interface.
          </p>
          <p id="confirmar-exclusao-partida-pergunta">
            O histórico administrativo mínimo será preservado.
          </p>
        </div>

        <label className="minhas-partidas-campo">
          Motivo da exclusão
          <textarea
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            onFocus={scrollFocusedInputIntoView}
            placeholder="Informe por que esta partida será excluída..."
            disabled={excluindo}
            maxLength={220}
          />
          <small>{motivo.length}/200</small>
        </label>

        {erro && <p className="texto-erro minhas-partidas-confirmacao-erro">{erro}</p>}

        <div className="minhas-partidas-confirmacao-acoes">
          <button type="button" className="botao-terciario" onClick={onCancelar} disabled={excluindo}>
            Voltar
          </button>
          <button type="button" className="botao-perigo" onClick={() => onConfirmar(motivo.trim())} disabled={excluindo || !motivoValido}>
            <FaTrashAlt aria-hidden="true" />
            {excluindo ? 'Excluindo...' : 'Excluir definitivamente'}
          </button>
        </div>
      </article>
    </div>
  );
}
