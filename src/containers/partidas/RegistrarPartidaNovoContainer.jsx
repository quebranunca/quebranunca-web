import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obterImagemGrupoAvatar } from '../../components/grupos/AvatarGrupo';
import { PartidaMidiaUploadModal } from '../../components/partidas/PartidaMidiaUploadModal';
import { RegistrarPartidaNovoModal } from '../../components/partidas/RegistrarPartidaNovoModal';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { atletasServico } from '../../services/atletasServico';
import { competicoesServico } from '../../services/competicoesServico';
import { grupoAtletasServico } from '../../services/grupoAtletasServico';
import { gruposServico } from '../../services/gruposServico';
import { partidasServico } from '../../services/partidasServico';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';
import {
  ehConfirmacaoDuplicidadePartida,
  ehResultadoConfirmacaoDuplicidadePartida,
  extrairConfirmacaoDuplicidadePartida,
  extrairConfirmacaoDuplicidadePartidaResultado,
  extrairMensagemErro
} from '../../utils/erros';
import { ehAdministrador, ehOrganizador } from '../../utils/perfis';
import { obterRotaDetalhePartida } from '../../utils/partidaRotas';
import {
  CAMPOS_ATLETAS_PARTIDA,
  limparTextoRegistro,
  obterValorCampoRegistro,
  validarAtletasConsolidados,
  validarDuplaConsolidada,
  validarResultadoRegistro,
  validarRevisaoPartida
} from '../../utils/registroPartidaWizard';

const LADOS_ATLETA = {
  direito: 1,
  esquerdo: 2
};

const CAMPOS_ATLETAS = CAMPOS_ATLETAS_PARTIDA;

const estadoInicial = {
  dupla1: {
    atletaDireita: '',
    atletaEsquerda: '',
    pontos: ''
  },
  dupla2: {
    atletaDireita: '',
    atletaEsquerda: '',
    pontos: ''
  },
  resultado: {
    modo: '',
    duplaVencedora: ''
  }
};

const estadoInicialSelecoes = {
  'dupla1.atletaDireita': null,
  'dupla1.atletaEsquerda': null,
  'dupla2.atletaDireita': null,
  'dupla2.atletaEsquerda': null
};

const etapas = [
  { id: 'grupo', titulo: 'Grupo', icone: 'group' },
  { id: 'dupla1', titulo: 'Dupla 1', icone: 'players' },
  { id: 'dupla2', titulo: 'Dupla 2', icone: 'players' },
  { id: 'tipo', titulo: 'Tipo', icone: 'score' },
  { id: 'resultado', titulo: 'Resultado', icone: 'score' },
  { id: 'revisao', titulo: 'Revisão', icone: 'summary' }
];

function obterCampoAtletaUsuario(lado) {
  return Number(lado) === LADOS_ATLETA.esquerdo ? 'dupla1.atletaEsquerda' : 'dupla1.atletaDireita';
}

function obterAtletaUsuarioId(usuario, atletaUsuario) {
  return atletaUsuario?.id || usuario?.atleta?.id || usuario?.atletaId || null;
}

function obterAtletaUsuarioNome(usuario, atletaUsuario) {
  return obterNomeExibicaoAtleta(atletaUsuario) || obterNomeExibicaoAtleta(usuario?.atleta) || '';
}

function obterAtletaUsuarioLado(usuario, atletaUsuario) {
  return Number(atletaUsuario?.lado || usuario?.atleta?.lado || LADOS_ATLETA.direito);
}

function obterValorCampo(dados, caminho) {
  return obterValorCampoRegistro(dados, caminho);
}

function atualizarValorCampo(dados, caminho, valor) {
  const [grupo, campo] = caminho.split('.');

  return {
    ...dados,
    [grupo]: {
      ...dados[grupo],
      [campo]: valor
    }
  };
}

function limparTexto(valor) {
  return limparTextoRegistro(valor);
}

function obterAtletaSelecaoId(atleta) {
  return atleta?.id || atleta?.atletaId || atleta?.usuarioAtletaId || null;
}

function obterAtletaSelecaoNome(atleta) {
  return limparTexto(
    atleta?.nome ||
    atleta?.nomeAtleta ||
    atleta?.atletaNome ||
    atleta?.nomeCompleto ||
    atleta?.apelido ||
    atleta?.apelidoAtleta
  );
}

function criarAtletaSelecao(atleta) {
  if (!atleta) {
    return null;
  }

  const id = obterAtletaSelecaoId(atleta);
  const nome = obterAtletaSelecaoNome(atleta);

  if (!id || !nome) {
    return null;
  }

  return {
    id,
    nome,
    apelido: atleta.apelido || atleta.apelidoAtleta,
    categoria: atleta.categoria,
    nomeCategoria: atleta.nomeCategoria,
    grupo: atleta.grupo,
    nomeGrupo: atleta.nomeGrupo,
    cidade: atleta.cidade,
    estado: atleta.estado,
    posicaoRanking: atleta.posicaoRanking,
    quantidadeJogos: atleta.quantidadeJogos,
    totalPartidas: atleta.totalPartidas,
    avatarUrl: atleta.avatarUrl,
    fotoPerfilUrl: atleta.fotoPerfilUrl,
    origemSugestao: atleta.origemSugestao
  };
}

function obterTextoExibicaoSelecaoAtleta(atleta) {
  return obterNomeExibicaoAtleta(atleta) || atleta?.apelido || atleta?.nome || '';
}

function criarSelecaoAtletaUsuario(usuario, atletaUsuario) {
  const id = obterAtletaUsuarioId(usuario, atletaUsuario);
  const nome = obterAtletaUsuarioNome(usuario, atletaUsuario);

  if (!id || !nome) {
    return null;
  }

  return criarAtletaSelecao({
    id,
    nome,
    apelido: atletaUsuario?.apelido || usuario?.atleta?.apelido,
    cidade: atletaUsuario?.cidade || usuario?.atleta?.cidade,
    estado: atletaUsuario?.estado || usuario?.atleta?.estado,
    quantidadeJogos: atletaUsuario?.quantidadeJogos || usuario?.atleta?.quantidadeJogos,
    avatarUrl: atletaUsuario?.avatarUrl || usuario?.atleta?.avatarUrl,
    fotoPerfilUrl: atletaUsuario?.fotoPerfilUrl || usuario?.atleta?.fotoPerfilUrl || usuario?.fotoPerfilUrl
  });
}

function criarDadosComAtletaUsuario(dados, usuario, atletaUsuario) {
  const atletaUsuarioNome = obterAtletaUsuarioNome(usuario, atletaUsuario);
  const campoAtletaUsuario = obterCampoAtletaUsuario(obterAtletaUsuarioLado(usuario, atletaUsuario));

  return atualizarValorCampo(dados, campoAtletaUsuario, atletaUsuarioNome);
}

function limparResultadoDependente(dados) {
  return {
    ...dados,
    dupla1: {
      ...dados.dupla1,
      pontos: ''
    },
    dupla2: {
      ...dados.dupla2,
      pontos: ''
    },
    resultado: {
      ...dados.resultado,
      duplaVencedora: ''
    }
  };
}

function criarSelecoesComAtletaUsuario(usuario, atletaUsuario) {
  const campoAtletaUsuario = obterCampoAtletaUsuario(obterAtletaUsuarioLado(usuario, atletaUsuario));
  return {
    ...estadoInicialSelecoes,
    [campoAtletaUsuario]: criarSelecaoAtletaUsuario(usuario, atletaUsuario)
  };
}

function obterAtletaId(selecoes, campo, campoAtletaUsuario, atletaUsuarioId) {
  if (campo === campoAtletaUsuario) {
    return atletaUsuarioId;
  }

  return selecoes[campo]?.id || null;
}

function deveFixarAtletaUsuario(usuario, contextoInicial, modo = 'criacao') {
  return modo !== 'edicao' && !contextoInicial?.grupoId && !ehAdministrador(usuario) && !ehOrganizador(usuario);
}

function obterAtletaIdPayload(selecoes, campo, campoAtletaUsuario, atletaUsuarioId, fixarAtletaUsuario) {
  return fixarAtletaUsuario
    ? obterAtletaId(selecoes, campo, campoAtletaUsuario, atletaUsuarioId)
    : selecoes[campo]?.id || null;
}

function criarPayload(dados, selecoes, usuario, atletaUsuario, contextoInicial) {
  const fixarAtletaUsuario = deveFixarAtletaUsuario(usuario, contextoInicial);
  const atletaUsuarioId = obterAtletaUsuarioId(usuario, atletaUsuario);
  const campoAtletaUsuario = obterCampoAtletaUsuario(obterAtletaUsuarioLado(usuario, atletaUsuario));
  const dadosPayload = fixarAtletaUsuario
    ? criarDadosComAtletaUsuario(dados, usuario, atletaUsuario)
    : dados;

  return {
    competicaoId: contextoInicial?.competicaoId || null,
    grupoId: contextoInicial?.grupoId || null,
    nomeGrupo: null,
    categoriaCompeticaoId: contextoInicial?.categoriaId || null,
    duplaAId: null,
    duplaBId: null,
    duplaAAtleta1Id: obterAtletaIdPayload(selecoes, 'dupla1.atletaDireita', campoAtletaUsuario, atletaUsuarioId, fixarAtletaUsuario),
    duplaAAtleta1Nome: limparTexto(dadosPayload.dupla1.atletaDireita),
    duplaAAtleta2Id: obterAtletaIdPayload(selecoes, 'dupla1.atletaEsquerda', campoAtletaUsuario, atletaUsuarioId, fixarAtletaUsuario),
    duplaAAtleta2Nome: limparTexto(dadosPayload.dupla1.atletaEsquerda),
    duplaBAtleta1Id: selecoes['dupla2.atletaDireita']?.id || null,
    duplaBAtleta1Nome: limparTexto(dadosPayload.dupla2.atletaDireita),
    duplaBAtleta2Id: selecoes['dupla2.atletaEsquerda']?.id || null,
    duplaBAtleta2Nome: limparTexto(dadosPayload.dupla2.atletaEsquerda),
    faseCampeonato: null,
    status: 2,
    placarDuplaA: dadosPayload.resultado?.modo === 'ApenasResultado' ? null : Number(dadosPayload.dupla1.pontos),
    placarDuplaB: dadosPayload.resultado?.modo === 'ApenasResultado' ? null : Number(dadosPayload.dupla2.pontos),
    duplaVencedora: dadosPayload.resultado?.modo === 'ApenasResultado'
      ? Number(dadosPayload.resultado.duplaVencedora)
      : null,
    tipoRegistroResultado: dadosPayload.resultado?.modo === 'ApenasResultado'
      ? 'ApenasResultado'
      : 'PlacarDetalhado',
    dataPartida: new Date().toISOString(),
    observacoes: null
  };
}

function obterDuplaVencedoraPartida(partida, dados) {
  const duplaVencedora = Number(partida?.duplaVencedora);

  if (duplaVencedora === 1 || duplaVencedora === 2) {
    return String(duplaVencedora);
  }

  const placarA = Number(dados?.dupla1?.pontos);
  const placarB = Number(dados?.dupla2?.pontos);

  if (Number.isFinite(placarA) && Number.isFinite(placarB) && placarA !== placarB) {
    return placarA > placarB ? '1' : '2';
  }

  return '';
}

function criarEstadoEdicaoPartida(partida) {
  if (!partida) {
    return estadoInicial;
  }

  const dados = {
    dupla1: {
      atletaDireita: partida.nomeDuplaAAtleta1 || '',
      atletaEsquerda: partida.nomeDuplaAAtleta2 || '',
      pontos: String(partida.placarDuplaA ?? '')
    },
    dupla2: {
      atletaDireita: partida.nomeDuplaBAtleta1 || '',
      atletaEsquerda: partida.nomeDuplaBAtleta2 || '',
      pontos: String(partida.placarDuplaB ?? '')
    },
    resultado: {
      modo: partida.tipoRegistroResultado === 'ApenasResultado' || partida.placarDuplaA == null || partida.placarDuplaB == null
        ? 'ApenasResultado'
        : 'PlacarDetalhado',
      duplaVencedora: ''
    }
  };

  dados.resultado.duplaVencedora = obterDuplaVencedoraPartida(partida, dados);

  return dados;
}

function criarSelecoesEdicaoPartida(partida) {
  if (!partida) {
    return estadoInicialSelecoes;
  }

  return {
    'dupla1.atletaDireita': criarAtletaSelecao({ id: partida.duplaAAtleta1Id, nome: partida.nomeDuplaAAtleta1 }),
    'dupla1.atletaEsquerda': criarAtletaSelecao({ id: partida.duplaAAtleta2Id, nome: partida.nomeDuplaAAtleta2 }),
    'dupla2.atletaDireita': criarAtletaSelecao({ id: partida.duplaBAtleta1Id, nome: partida.nomeDuplaBAtleta1 }),
    'dupla2.atletaEsquerda': criarAtletaSelecao({ id: partida.duplaBAtleta2Id, nome: partida.nomeDuplaBAtleta2 })
  };
}

function criarContextoEdicaoPartida(partida, contextoInicial = {}) {
  return {
    ...contextoInicial,
    grupoId: partida?.grupoId || null,
    competicaoId: partida?.competicaoId || contextoInicial?.competicaoId || null,
    categoriaId: partida?.categoriaCompeticaoId || contextoInicial?.categoriaId || null
  };
}

function criarGrupoContextoEdicao(partida) {
  if (!partida?.grupoId) {
    return null;
  }

  return normalizarGrupoContexto({
    id: partida.grupoId,
    nome: partida.nomeGrupo || 'Grupo atual',
    quantidadeAtletas: partida.quantidadeAtletasGrupo,
    privacidade: partida.privacidadeGrupo,
    imagemUrl: partida.imagemUrlGrupo
  });
}

function criarPayloadEdicao(partida, dados, selecoes, contextoPartida) {
  const apenasResultado = dados.resultado?.modo === 'ApenasResultado';

  return {
    grupoId: contextoPartida?.grupoId || null,
    duplaAAtleta1Id: selecoes['dupla1.atletaDireita']?.id || null,
    duplaAAtleta1Nome: limparTexto(dados.dupla1.atletaDireita),
    duplaAAtleta2Id: selecoes['dupla1.atletaEsquerda']?.id || null,
    duplaAAtleta2Nome: limparTexto(dados.dupla1.atletaEsquerda),
    duplaBAtleta1Id: selecoes['dupla2.atletaDireita']?.id || null,
    duplaBAtleta1Nome: limparTexto(dados.dupla2.atletaDireita),
    duplaBAtleta2Id: selecoes['dupla2.atletaEsquerda']?.id || null,
    duplaBAtleta2Nome: limparTexto(dados.dupla2.atletaEsquerda),
    placarDuplaA: apenasResultado ? null : Number(dados.dupla1.pontos),
    placarDuplaB: apenasResultado ? null : Number(dados.dupla2.pontos),
    duplaVencedora: apenasResultado
      ? Number(dados.resultado.duplaVencedora)
      : null,
    tipoRegistroResultado: apenasResultado ? 'ApenasResultado' : 'PlacarDetalhado'
  };
}

function validarAtletas(dados, selecoes) {
  return validarAtletasConsolidados(dados, selecoes);
}

function validarDupla(dados, selecoes, prefixo, rotulo) {
  return validarDuplaConsolidada(dados, selecoes, prefixo, rotulo);
}

function validarEtapaAtual(idEtapa, dados, selecoes, regraPartida, contextoPartida = {}, grupo = null) {
  if (idEtapa === 'grupo') {
    return '';
  }

  if (idEtapa === 'dupla1') {
    return validarDupla(dados, selecoes, 'dupla1', 'Dupla 1');
  }

  if (idEtapa === 'dupla2') {
    return validarDupla(dados, selecoes, 'dupla2', 'Dupla 2') || validarAtletas(dados, selecoes);
  }

  if (idEtapa === 'tipo') {
    return validarAtletas(dados, selecoes)
      || (dados.resultado?.modo === 'PlacarDetalhado' || dados.resultado?.modo === 'ApenasResultado'
      ? ''
      : 'Escolha como deseja registrar o resultado.');
  }

  if (idEtapa === 'resultado') {
    return validarAtletas(dados, selecoes) || validarPlacar(dados, regraPartida);
  }

  if (idEtapa === 'revisao') {
    return validarRevisaoPartida({
      dados,
      selecoes,
      regraPartida,
      contexto: contextoPartida,
      grupo
    });
  }

  return '';
}

function validarPlacar(dados, regraPartida = null) {
  return validarResultadoRegistro(dados, regraPartida);
}

function normalizarRegraPartida(competicao) {
  if (!competicao) {
    return null;
  }

  return {
    nome: competicao.nomeRegraCompeticao || 'Regra da competição',
    pontosMinimosPartida: competicao.pontosMinimosPartidaEfetivo,
    diferencaMinimaPartida: competicao.diferencaMinimaPartidaEfetiva,
    permiteEmpate: competicao.permiteEmpateEfetivo
  };
}

function limitarSugestoes(atletas) {
  return (atletas || []).map(criarAtletaSelecao).filter(Boolean).slice(0, 5);
}

function limitarSugestoesGrupo(atletas, grupo, limite = 5) {
  const sugestoesGrupo = (atletas || [])
    .map((atleta) => criarAtletaSelecao({
      ...atleta,
      id: obterAtletaSelecaoId(atleta),
      nome: obterAtletaSelecaoNome(atleta),
      apelido: atleta.apelido || atleta.apelidoAtleta,
      nomeGrupo: atleta.nomeGrupo || grupo?.nome || 'Grupo',
      origemSugestao: 'grupo'
    }))
    .filter(Boolean);

  return Number.isFinite(limite) ? sugestoesGrupo.slice(0, limite) : sugestoesGrupo;
}

function limitarSugestoesExternas(atletas, idsIgnorados) {
  return (atletas || [])
    .map((atleta) => criarAtletaSelecao({
      ...atleta,
      origemSugestao: 'externo'
    }))
    .filter((atleta) => atleta?.id && !idsIgnorados.has(atleta.id))
    .slice(0, 5);
}

function obterGrupoId(grupo) {
  return grupo?.id || grupo?.grupoId || null;
}

function normalizarNomeSugestao(valor) {
  return limparTexto(valor).toLowerCase();
}

function atletaJaSelecionado(selecoes, campoAtual, atletaSelecionado) {
  const id = atletaSelecionado?.id ? String(atletaSelecionado.id) : '';
  const nome = normalizarNomeSugestao(atletaSelecionado?.nome);

  return CAMPOS_ATLETAS.some((campo) => {
    if (campo === campoAtual) {
      return false;
    }

    const selecao = selecoes[campo];
    const selecaoId = selecao?.id ? String(selecao.id) : '';
    const selecaoNome = normalizarNomeSugestao(selecao?.nome);

    return Boolean((id && selecaoId && id === selecaoId) || (nome && selecaoNome && nome === selecaoNome));
  });
}

function normalizarGrupoContexto(grupo, quantidadeAtletas) {
  if (!grupo) {
    return null;
  }

  return {
    ...grupo,
    id: obterGrupoId(grupo),
    nome: grupo.nome || grupo.nomeGrupo || 'Grupo',
    quantidadeAtletas: grupo.quantidadeAtletas ?? grupo.totalAtletas ?? quantidadeAtletas ?? null,
    privacidade: grupo.privacidade || grupo.tipoPrivacidade || 'Privado',
    imagemUrl: obterImagemGrupoAvatar(grupo)
  };
}

class ErroRegistroPartidaBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { temErro: false };
  }

  static getDerivedStateFromError() {
    return { temErro: true };
  }

  componentDidCatch(erro, info) {
    console.error('Erro ao renderizar o fluxo de registro de partida.', erro, info);
  }

  render() {
    if (this.state.temErro) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function FallbackErroRegistroPartida({ onFechar }) {
  return (
    <div className="modal-sobreposicao registrar-partida-novo-sobreposicao" role="presentation">
      <section
        className="modal-conteudo registrar-partida-novo-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="registrar-partida-novo-fallback-titulo"
      >
        <header className="registrar-partida-novo-header">
          <div className="registrar-partida-novo-header-centro">
            <strong id="registrar-partida-novo-fallback-titulo">Registrar partida</strong>
            <span>Falha ao abrir o formulário</span>
          </div>
        </header>

        <div className="registrar-partida-novo-fallback">
          <p className="texto-erro registrar-partida-novo-erro">
            Encontramos um problema inesperado ao abrir o registro de partida.
            Feche esta janela e tente novamente.
          </p>

          <div className="registrar-partida-novo-acoes">
            <button type="button" className="botao-secundario" onClick={onFechar}>
              Fechar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function RegistrarPartidaNovoContainer({
  onFechar,
  contextoInicial = {},
  modo = 'criacao',
  partidaInicial = null,
  onSalvarEdicao = null,
  salvandoExterno = false,
  erroExterno = ''
}) {
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();
  const { showNotification } = useNotification();
  const ehEdicao = modo === 'edicao';
  const [dados, setDados] = useState(() => (ehEdicao ? criarEstadoEdicaoPartida(partidaInicial) : estadoInicial));
  const [selecoes, setSelecoes] = useState(() => (ehEdicao ? criarSelecoesEdicaoPartida(partidaInicial) : estadoInicialSelecoes));
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [duplicidade, setDuplicidade] = useState(null);
  const [payloadPendente, setPayloadPendente] = useState(null);
  const [atletaUsuario, setAtletaUsuario] = useState(usuario?.atleta || null);
  const [carregandoAtletaUsuario, setCarregandoAtletaUsuario] = useState(false);
  const [sugestoes, setSugestoes] = useState({});
  const [sugestoesPartida, setSugestoesPartida] = useState({
    parceirosFrequentes: [],
    rivaisFrequentes: []
  });
  const [campoBuscando, setCampoBuscando] = useState('');
  const [sucesso, setSucesso] = useState(null);
  const [uploadMidiaAberto, setUploadMidiaAberto] = useState(false);
  const [contextoPartida, setContextoPartida] = useState(() => (
    ehEdicao ? criarContextoEdicaoPartida(partidaInicial, contextoInicial) : contextoInicial
  ));
  const [grupoContexto, setGrupoContexto] = useState(() => (ehEdicao ? criarGrupoContextoEdicao(partidaInicial) : null));
  const [atletasGrupo, setAtletasGrupo] = useState([]);
  const [carregandoGrupo, setCarregandoGrupo] = useState(false);
  const [gruposDisponiveis, setGruposDisponiveis] = useState([]);
  const [carregandoGruposDisponiveis, setCarregandoGruposDisponiveis] = useState(false);
  const [erroGruposDisponiveis, setErroGruposDisponiveis] = useState(false);
  const [seletorGrupoAberto, setSeletorGrupoAberto] = useState(false);
  const [regraPartida, setRegraPartida] = useState(null);
  const [carregandoRegraPartida, setCarregandoRegraPartida] = useState(false);
  const [erroRegraPartida, setErroRegraPartida] = useState(false);
  const cacheBuscaRef = useRef(new Map());
  const cacheSugestoesPartidaRef = useRef(new Map());
  const buscaTimersRef = useRef({});

  const atletaUsuarioNome = obterAtletaUsuarioNome(usuario, atletaUsuario);
  const etapaAtual = etapas[indiceEtapa];
  const fixarAtletaUsuario = deveFixarAtletaUsuario(usuario, contextoPartida, modo);
  const carregando = salvando || salvandoExterno || (fixarAtletaUsuario && carregandoAtletaUsuario);
  const atletaUsuarioId = obterAtletaUsuarioId(usuario, atletaUsuario);
  const campoAtletaUsuario = obterCampoAtletaUsuario(obterAtletaUsuarioLado(usuario, atletaUsuario));

  const resumo = useMemo(() => ({
    dupla1: [
      limparTexto(dados.dupla1.atletaDireita),
      limparTexto(dados.dupla1.atletaEsquerda)
    ],
    dupla2: [
      limparTexto(dados.dupla2.atletaDireita),
      limparTexto(dados.dupla2.atletaEsquerda)
    ],
    placar: {
      dupla1: dados.dupla1.pontos,
      dupla2: dados.dupla2.pontos
    },
    tipoRegistroResultado: dados.resultado?.modo || 'PlacarDetalhado',
    duplaVencedora: dados.resultado?.duplaVencedora || '',
    data: new Date(),
    contexto: contextoPartida
  }), [dados, contextoPartida]);

  const sugestoesRapidas = useMemo(() => {
    const idsSelecionados = new Set();
    const nomesSelecionados = new Set();

    CAMPOS_ATLETAS.forEach((campo) => {
      const selecao = selecoes[campo];
      if (selecao?.id) {
        idsSelecionados.add(selecao.id);
      }

      const nome = normalizarNomeSugestao(obterValorCampo(dados, campo));
      if (nome) {
        nomesSelecionados.add(nome);
      }
    });

    function filtrarNormalizadas(lista, { removerAtletaUsuario = false } = {}) {
      return (lista || [])
        .map(criarAtletaSelecao)
        .filter((atleta) => atleta?.id)
        .filter((atleta) => !idsSelecionados.has(atleta.id))
        .filter((atleta) => !nomesSelecionados.has(normalizarNomeSugestao(atleta.nome)))
        .filter((atleta) => !removerAtletaUsuario || atleta.id !== atletaUsuarioId);
    }

    function filtrarFrequentes(lista, { removerAtletaUsuario = false } = {}) {
      return filtrarNormalizadas(
        (lista || []).map((atleta) => ({
          id: atleta.id,
          nome: atleta.nome,
          quantidadeJogos: atleta.totalPartidas,
          totalPartidas: atleta.totalPartidas,
          origemSugestao: 'frequente'
        })),
        { removerAtletaUsuario }
      );
    }

    function combinarSugestoes(...listas) {
      const idsVistos = new Set();
      const nomesVistos = new Set();

      return listas
        .flat()
        .filter((atleta) => {
          const id = atleta?.id || '';
          const nome = normalizarNomeSugestao(atleta?.nome);

          if (!id && !nome) {
            return false;
          }

          if ((id && idsVistos.has(id)) || (nome && nomesVistos.has(nome))) {
            return false;
          }

          if (id) {
            idsVistos.add(id);
          }

          if (nome) {
            nomesVistos.add(nome);
          }

          return true;
        })
        .slice(0, 5);
    }

    function montarSugestoesCampo(campo, titulo, ...listas) {
      if (selecoes[campo]?.id) {
        return null;
      }

      const atletas = combinarSugestoes(...listas);

      return atletas.length > 0 ? { titulo, atletas } : null;
    }

    const campoParceiro = campoAtletaUsuario === 'dupla1.atletaDireita'
      ? 'dupla1.atletaEsquerda'
      : 'dupla1.atletaDireita';
    const campoRivalDireita = 'dupla2.atletaDireita';
    const campoRivalEsquerda = 'dupla2.atletaEsquerda';
    const parceirosDisponiveis = filtrarFrequentes(sugestoesPartida.parceirosFrequentes, { removerAtletaUsuario: true });
    const rivaisDisponiveis = filtrarFrequentes(sugestoesPartida.rivaisFrequentes, { removerAtletaUsuario: true });
    const atletasGrupoDisponiveis = contextoPartida?.grupoId
      ? filtrarNormalizadas(limitarSugestoesGrupo(atletasGrupo, grupoContexto, null), { removerAtletaUsuario: false })
      : [];

    if (contextoPartida?.grupoId) {
      return {
        'dupla1.atletaDireita': montarSugestoesCampo(
          'dupla1.atletaDireita',
          'Atletas do grupo',
          parceirosDisponiveis,
          atletasGrupoDisponiveis
        ),
        'dupla1.atletaEsquerda': montarSugestoesCampo(
          'dupla1.atletaEsquerda',
          'Atletas do grupo',
          parceirosDisponiveis,
          atletasGrupoDisponiveis
        ),
        [campoRivalDireita]: montarSugestoesCampo(
          campoRivalDireita,
          'Atletas do grupo',
          rivaisDisponiveis,
          atletasGrupoDisponiveis
        ),
        [campoRivalEsquerda]: montarSugestoesCampo(
          campoRivalEsquerda,
          'Atletas do grupo',
          rivaisDisponiveis,
          atletasGrupoDisponiveis
        )
      };
    }

    return {
      [campoParceiro]: fixarAtletaUsuario
        ? montarSugestoesCampo(campoParceiro, 'Parceiros frequentes', parceirosDisponiveis)
        : null,
      [campoRivalDireita]: montarSugestoesCampo(campoRivalDireita, 'Rivais frequentes', rivaisDisponiveis),
      [campoRivalEsquerda]: montarSugestoesCampo(campoRivalEsquerda, 'Rivais frequentes', rivaisDisponiveis)
    };
  }, [dados, selecoes, sugestoesPartida, fixarAtletaUsuario, campoAtletaUsuario, atletaUsuarioId, contextoPartida?.grupoId, atletasGrupo, grupoContexto]);

  useEffect(() => {
    if (ehEdicao) {
      setDados(criarEstadoEdicaoPartida(partidaInicial));
      setSelecoes(criarSelecoesEdicaoPartida(partidaInicial));
      setContextoPartida(criarContextoEdicaoPartida(partidaInicial, contextoInicial));
      setGrupoContexto(criarGrupoContextoEdicao(partidaInicial));
      setSucesso(null);
      setErro('');
      setDuplicidade(null);
      setPayloadPendente(null);
      return;
    }

    setContextoPartida(contextoInicial);
  }, [ehEdicao, partidaInicial?.id, contextoInicial?.competicaoId, contextoInicial?.grupoId, contextoInicial?.categoriaId]);

  useEffect(() => {
    let cancelado = false;
    const grupoId = contextoPartida?.grupoId || null;
    const chaveCache = grupoId || 'geral';

    async function carregarSugestoesPartida() {
      if (!usuario?.atletaId) {
        setSugestoesPartida({ parceirosFrequentes: [], rivaisFrequentes: [] });
        return;
      }

      try {
        let dadosSugestoes = cacheSugestoesPartidaRef.current.get(chaveCache);
        if (!dadosSugestoes) {
          dadosSugestoes = atletasServico.obterSugestoesPartida({ grupoId })
            .then((resposta) => ({
              parceirosFrequentes: resposta?.parceirosFrequentes || [],
              rivaisFrequentes: resposta?.rivaisFrequentes || []
            }));
          cacheSugestoesPartidaRef.current.set(chaveCache, dadosSugestoes);
        }

        dadosSugestoes = await dadosSugestoes;
        cacheSugestoesPartidaRef.current.set(chaveCache, dadosSugestoes);
        if (!cancelado) {
          setSugestoesPartida(dadosSugestoes);
        }
      } catch {
        cacheSugestoesPartidaRef.current.delete(chaveCache);
        if (!cancelado) {
          setSugestoesPartida({ parceirosFrequentes: [], rivaisFrequentes: [] });
        }
      }
    }

    carregarSugestoesPartida();

    return () => {
      cancelado = true;
    };
  }, [usuario?.atletaId, contextoPartida?.grupoId]);

  useEffect(() => {
    let cancelado = false;
    const competicaoId = contextoPartida?.competicaoId;

    async function carregarRegraPartida() {
      if (!competicaoId) {
        setRegraPartida(null);
        setCarregandoRegraPartida(false);
        setErroRegraPartida(false);
        return;
      }

      try {
        setCarregandoRegraPartida(true);
        setErroRegraPartida(false);
        const competicao = await competicoesServico.obterPorId(competicaoId);

        if (!cancelado) {
          setRegraPartida(normalizarRegraPartida(competicao));
        }
      } catch {
        if (!cancelado) {
          setRegraPartida(null);
          setErroRegraPartida(true);
        }
      } finally {
        if (!cancelado) {
          setCarregandoRegraPartida(false);
        }
      }
    }

    carregarRegraPartida();

    return () => {
      cancelado = true;
    };
  }, [contextoPartida?.competicaoId]);

  useEffect(() => {
    let cancelado = false;
    const grupoId = contextoPartida?.grupoId;

    async function carregarGrupoContexto() {
      if (!grupoId) {
        setGrupoContexto(null);
        setAtletasGrupo([]);
        setCarregandoGrupo(false);
        return;
      }

      try {
        setCarregandoGrupo(true);
        const [grupo, atletas, dashboardGrupo] = await Promise.all([
          gruposServico.obterPorId(grupoId),
          grupoAtletasServico.listarPorGrupo(grupoId).catch(() => []),
          gruposServico.obterDashboardGrupo(grupoId).catch(() => null)
        ]);

        if (!cancelado) {
          const permissoesGrupo = dashboardGrupo?.grupo || {};

          if (!ehEdicao && permissoesGrupo.podeRegistrarPartida === false) {
            setErro('Você precisa fazer parte deste grupo para registrar partidas nele.');
            setGrupoContexto(null);
            setAtletasGrupo([]);
            setContextoPartida((atual) => ({
              ...atual,
              grupoId: null
            }));
            showNotification({
              type: 'warning',
              title: 'Acesso ao grupo necessário',
              message: 'Você precisa fazer parte deste grupo para registrar partidas nele.'
            });
            return;
          }

          setGrupoContexto(normalizarGrupoContexto({ ...grupo, ...permissoesGrupo }, atletas?.length));
          setAtletasGrupo(atletas || []);
        }
      } catch {
        if (!cancelado) {
          setGrupoContexto({
            id: grupoId,
            nome: 'Grupo selecionado',
            quantidadeAtletas: null,
            privacidade: 'Privado',
            imagemUrl: ''
          });
          setAtletasGrupo([]);
        }
      } finally {
        if (!cancelado) {
          setCarregandoGrupo(false);
        }
      }
    }

    carregarGrupoContexto();

    return () => {
      cancelado = true;
    };
  }, [contextoPartida?.grupoId, ehEdicao]);

  useEffect(() => {
    let cancelado = false;

    async function carregarAtletaUsuario() {
      if (!usuario?.atletaId) {
        setAtletaUsuario(null);
        return;
      }

      if (usuario?.atleta) {
        setAtletaUsuario(usuario.atleta);
        return;
      }

      try {
        setCarregandoAtletaUsuario(true);
        const atleta = await atletasServico.obterMeu();
        if (!cancelado) {
          setAtletaUsuario(atleta);
        }
      } catch {
        if (!cancelado) {
          setAtletaUsuario(null);
        }
      } finally {
        if (!cancelado) {
          setCarregandoAtletaUsuario(false);
        }
      }
    }

    carregarAtletaUsuario();

    return () => {
      cancelado = true;
    };
  }, [usuario?.atletaId, usuario?.atleta]);

  useEffect(() => {
    if (!deveFixarAtletaUsuario(usuario, contextoPartida, modo)) {
      return;
    }

    const atletaUsuarioId = obterAtletaUsuarioId(usuario, atletaUsuario);
    const nome = obterAtletaUsuarioNome(usuario, atletaUsuario);

    if (!atletaUsuarioId || !nome) {
      return;
    }

    const campoAtletaUsuario = obterCampoAtletaUsuario(obterAtletaUsuarioLado(usuario, atletaUsuario));

    setDados((anterior) => {
      const valorAtual = limparTexto(obterValorCampo(anterior, campoAtletaUsuario));
      return valorAtual ? anterior : atualizarValorCampo(anterior, campoAtletaUsuario, nome);
    });

    setSelecoes((anterior) => ({
      ...anterior,
      [campoAtletaUsuario]: anterior[campoAtletaUsuario] || criarSelecaoAtletaUsuario(usuario, atletaUsuario)
    }));
  }, [usuario, atletaUsuario, contextoPartida?.grupoId]);

  useEffect(() => () => {
    Object.values(buscaTimersRef.current).forEach(clearTimeout);
  }, []);

  function alterarCampo(campo, valor) {
    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
    const proximoValor = campo.endsWith('.pontos')
      ? String(valor || '').replace(/\D/g, '').slice(0, 2)
      : valor;
    setDados((anterior) => {
      const atualizado = atualizarValorCampo(anterior, campo, proximoValor);
      return CAMPOS_ATLETAS.includes(campo) ? limparResultadoDependente(atualizado) : atualizado;
    });

    if (CAMPOS_ATLETAS.includes(campo)) {
      setSelecoes((anterior) => ({ ...anterior, [campo]: null }));
      buscarSugestoes(campo, proximoValor);
    }
  }

  function buscarSugestoes(campo, valor) {
    const termo = limparTexto(valor);
    clearTimeout(buscaTimersRef.current[campo]);
    const grupoId = contextoPartida?.grupoId;
    const minimoCaracteres = 2;

    if (termo.length < minimoCaracteres) {
      setSugestoes((anterior) => ({ ...anterior, [campo]: [] }));
      return;
    }

    buscaTimersRef.current[campo] = setTimeout(async () => {
      const competicaoId = contextoPartida?.competicaoId;
      const podeBuscarExternos = ehAdministrador(usuario) || ehOrganizador(usuario);
      const chaveCache = grupoId
        ? `grupo:${grupoId}:${podeBuscarExternos ? 'com-externos' : 'membros'}:${termo.toLowerCase()}`
        : `${competicaoId || 'geral'}:${termo.toLowerCase()}`;

      function filtrarAtletasJaSelecionados(lista) {
        const idsBloqueados = new Set();
        const nomesBloqueados = new Set();

        CAMPOS_ATLETAS.forEach((campoAtleta) => {
          if (campoAtleta === campo) {
            return;
          }

          const selecao = selecoes[campoAtleta];
          if (selecao?.id) {
            idsBloqueados.add(selecao.id);
          }

          const nome = normalizarNomeSugestao(obterValorCampo(dados, campoAtleta));
          if (nome) {
            nomesBloqueados.add(nome);
          }
        });

        return (lista || []).filter((atleta) => {
          const id = atleta?.id || '';
          const nome = normalizarNomeSugestao(atleta?.nome);
          return (!id || !idsBloqueados.has(id)) && (!nome || !nomesBloqueados.has(nome));
        });
      }

      if (cacheBuscaRef.current.has(chaveCache)) {
        setSugestoes((anterior) => ({
          ...anterior,
          [campo]: filtrarAtletasJaSelecionados(cacheBuscaRef.current.get(chaveCache))
        }));
        return;
      }

      try {
        setCampoBuscando(campo);
        let lista = [];

        if (grupoId) {
          const [membrosGrupo, atletasExternos] = await Promise.all([
            grupoAtletasServico.buscar(grupoId, termo).catch(() => []),
            podeBuscarExternos ? atletasServico.buscar(termo).catch(() => []) : Promise.resolve([])
          ]);
          const sugestoesGrupo = limitarSugestoesGrupo(membrosGrupo, grupoContexto);
          const idsGrupo = new Set(sugestoesGrupo.map((atleta) => atleta.id));
          lista = [
            ...sugestoesGrupo,
            ...limitarSugestoesExternas(atletasExternos, idsGrupo)
          ];
        } else {
          const resposta = competicaoId && termo.length >= 3
            ? await competicoesServico.buscarSugestoesAtletas(competicaoId, termo)
            : await atletasServico.buscar(termo);
          lista = limitarSugestoes(resposta);
        }

        cacheBuscaRef.current.set(chaveCache, lista);
        setSugestoes((anterior) => ({ ...anterior, [campo]: filtrarAtletasJaSelecionados(lista) }));
      } catch {
        setSugestoes((anterior) => ({ ...anterior, [campo]: [] }));
      } finally {
        setCampoBuscando((atual) => (atual === campo ? '' : atual));
      }
    }, 300);
  }

  function avancarAposSelecao(campo) {
    if (campo === CAMPOS_ATLETAS[CAMPOS_ATLETAS.length - 1]) {
      setSugestoes({});
    }
  }

  function selecionarAtleta(campo, atleta) {
    const atletaSelecionado = criarAtletaSelecao(atleta);

    if (!atletaSelecionado) {
      setErro('Não foi possível selecionar este atleta. Tente buscar pelo nome novamente.');
      return;
    }

    if (atletaJaSelecionado(selecoes, campo, atletaSelecionado)) {
      setErro('Não é permitido repetir atleta na mesma partida.');
      setDuplicidade(null);
      setPayloadPendente(null);
      return;
    }

    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
    setDados((anterior) => limparResultadoDependente(atualizarValorCampo(
      anterior,
      campo,
      obterTextoExibicaoSelecaoAtleta(atletaSelecionado)
    )));
    setSelecoes((anterior) => ({ ...anterior, [campo]: atletaSelecionado }));
    setSugestoes((anterior) => ({ ...anterior, [campo]: [] }));
    avancarAposSelecao(campo);
  }

  function limparSelecaoAtleta(campo) {
    if (!CAMPOS_ATLETAS.includes(campo)) {
      return;
    }

    clearTimeout(buscaTimersRef.current[campo]);
    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
    setDados((anterior) => limparResultadoDependente(atualizarValorCampo(anterior, campo, '')));
    setSelecoes((anterior) => ({ ...anterior, [campo]: null }));
    setSugestoes((anterior) => ({ ...anterior, [campo]: [] }));
  }

  function voltar() {
    if (salvando) {
      return;
    }

    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
    setIndiceEtapa((atual) => Math.max(0, atual - 1));
  }

  async function salvarPartida(payload) {
    try {
      setSalvando(true);
      const resultado = ehEdicao && onSalvarEdicao
        ? await onSalvarEdicao(payload)
        : await partidasServico.criar(payload);

      if (!ehEdicao && !payload?.confirmarDuplicidade && ehResultadoConfirmacaoDuplicidadePartida(resultado)) {
        setDuplicidade(extrairConfirmacaoDuplicidadePartidaResultado(resultado));
        setPayloadPendente(payload);
        setErro('');
        return;
      }

      const partida = resultado?.partida || resultado;
      if (!ehEdicao) {
        showNotification({
          type: 'success',
          title: 'Partida registrada',
          message: 'Resultado salvo no histórico QuebraNunca.'
        });
      }
      setSucesso({
        partida,
        resumo: {
          ...resumo,
          salvoEm: new Date().toISOString()
        }
      });
      setPayloadPendente(null);
      setDuplicidade(null);
    } catch (falha) {
      if (!ehEdicao && !payload?.confirmarDuplicidade && ehConfirmacaoDuplicidadePartida(falha)) {
        setDuplicidade(extrairConfirmacaoDuplicidadePartida(falha));
        setPayloadPendente(payload);
        setErro('');
        return;
      }

      setErro(extrairMensagemErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  async function registrarPartida({ confirmarDuplicidade = false } = {}) {
    const fixarAtletaUsuario = deveFixarAtletaUsuario(usuario, contextoPartida, modo);

    if (fixarAtletaUsuario && carregandoAtletaUsuario) {
      setErro('Aguarde a identificação do atleta logado para salvar a partida.');
      return;
    }

    if (fixarAtletaUsuario && !obterAtletaUsuarioId(usuario, atletaUsuario)) {
      setErro('Seu usuário precisa estar vinculado a um atleta para registrar a partida neste fluxo.');
      return;
    }

    if (fixarAtletaUsuario && !limparTexto(atletaUsuarioNome)) {
      setErro('Não foi possível identificar o atleta logado para registrar a partida.');
      return;
    }

    const erroValidacao = validarRevisaoPartida({
      dados,
      selecoes,
      regraPartida,
      contexto: contextoPartida,
      grupo: grupoContexto
    });

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const payload = ehEdicao
      ? criarPayloadEdicao(partidaInicial, dados, selecoes, contextoPartida)
      : {
          ...criarPayload(dados, selecoes, usuario, atletaUsuario, contextoPartida),
          confirmarDuplicidade
        };

    await salvarPartida(payload);
  }

  function confirmarEtapa(evento) {
    evento.preventDefault();

    if (ehEdicao || etapaAtual.id === 'revisao') {
      registrarPartida();
      return;
    }

    const erroValidacao = validarEtapaAtual(etapaAtual.id, dados, selecoes, regraPartida, contextoPartida, grupoContexto);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
    setIndiceEtapa((atual) => Math.min(etapas.length - 1, atual + 1));
  }

  function cancelarDuplicidade() {
    setDuplicidade(null);
    setPayloadPendente(null);
    setSalvando(false);
  }

  function confirmarDuplicidade() {
    if (payloadPendente) {
      salvarPartida({ ...payloadPendente, confirmarDuplicidade: true });
    }
  }

  function verPartidaDuplicada() {
    const partidaId = duplicidade?.partidaId || duplicidade?.partida?.id;
    if (!partidaId) {
      return;
    }

    navegar(obterRotaDetalhePartida(partidaId));
    onFechar?.();
  }

  async function carregarGruposParaSelecao() {
    if (gruposDisponiveis.length || carregandoGruposDisponiveis) {
      return;
    }

    try {
      setCarregandoGruposDisponiveis(true);
      setErroGruposDisponiveis(false);
      const grupos = await gruposServico.listarParaSelecao();
      setGruposDisponiveis((grupos || []).map((grupo) => normalizarGrupoContexto(grupo)));
    } catch {
      setGruposDisponiveis([]);
      setErroGruposDisponiveis(true);
    } finally {
      setCarregandoGruposDisponiveis(false);
    }
  }

  async function abrirSeletorGrupo() {
    setSeletorGrupoAberto(true);
    await carregarGruposParaSelecao();
  }

  function selecionarGrupo(grupo) {
    const grupoNormalizado = normalizarGrupoContexto(grupo);
    setContextoPartida((atual) => ({
      ...atual,
      grupoId: obterGrupoId(grupoNormalizado)
    }));
    setGrupoContexto(grupoNormalizado);
    setSeletorGrupoAberto(false);
    cacheBuscaRef.current.clear();
    setSugestoes({});
    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
  }

  function fecharSeletorGrupo() {
    setSeletorGrupoAberto(false);
  }

  function irParaEtapa(idEtapa) {
    const indice = etapas.findIndex((etapa) => etapa.id === idEtapa);
    if (indice < 0 || salvando) {
      return;
    }

    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
    setIndiceEtapa(indice);
  }

  function removerGrupo() {
    setContextoPartida((atual) => ({
      ...atual,
      grupoId: null
    }));
    setGrupoContexto(null);
    setSeletorGrupoAberto(false);
    cacheBuscaRef.current.clear();
    setSugestoes({});
    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
  }

  function registrarRevanche() {
    const dadosRevanche = {
      dupla1: {
        atletaDireita: dados.dupla1.atletaDireita,
        atletaEsquerda: dados.dupla1.atletaEsquerda,
        pontos: ''
      },
      dupla2: {
        atletaDireita: dados.dupla2.atletaDireita,
        atletaEsquerda: dados.dupla2.atletaEsquerda,
        pontos: ''
      },
      resultado: {
        modo: dados.resultado?.modo || 'PlacarDetalhado',
        duplaVencedora: ''
      }
    };

    setDados(dadosRevanche);
    setSucesso(null);
    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
    setSugestoes({});
    setIndiceEtapa(etapas.findIndex((etapa) => etapa.id === 'resultado'));
  }

  function resetarEstadoRegistro({ restaurarContextoInicial = false } = {}) {
    const contextoBase = restaurarContextoInicial && !ehEdicao ? contextoInicial : contextoPartida;

    if (restaurarContextoInicial && !ehEdicao) {
      setContextoPartida(contextoInicial);
      if (!contextoInicial?.grupoId) {
        setGrupoContexto(null);
      }
    }

    if (deveFixarAtletaUsuario(usuario, contextoBase, modo)) {
      setDados(criarDadosComAtletaUsuario(estadoInicial, usuario, atletaUsuario));
      setSelecoes(criarSelecoesComAtletaUsuario(usuario, atletaUsuario));
    } else {
      setDados(estadoInicial);
      setSelecoes(estadoInicialSelecoes);
    }

    setSucesso(null);
    setErro('');
    setSalvando(false);
    setDuplicidade(null);
    setPayloadPendente(null);
    setSugestoes({});
    setCampoBuscando('');
    setUploadMidiaAberto(false);
    setSeletorGrupoAberto(false);
    setErroGruposDisponiveis(false);
    Object.values(buscaTimersRef.current).forEach(clearTimeout);
    buscaTimersRef.current = {};
    cacheBuscaRef.current.clear();
    setIndiceEtapa(0);
  }

  function fecharSucesso() {
    resetarEstadoRegistro({ restaurarContextoInicial: true });
    onFechar?.();
    navegar('/app', { replace: true });
  }

  function abrirGrupo() {
    if (grupoContexto?.id) {
      onFechar?.();
      navegar(`/grupos/${grupoContexto.id}`);
    }
  }

  function concluirUploadMidia(resposta) {
    setSucesso((atual) => atual
      ? {
          ...atual,
          partida: {
            ...atual.partida,
            midiaUrl: resposta?.midiaUrl,
            midiaTipo: resposta?.midiaTipo
          }
        }
      : atual);
    showNotification({
      type: 'success',
      title: 'Mídia adicionada',
      message: 'A mídia da partida já está disponível no feed.'
    });
  }

  return (
    <ErroRegistroPartidaBoundary fallback={<FallbackErroRegistroPartida onFechar={onFechar} />}>
      <RegistrarPartidaNovoModal
        aberto
        etapas={etapas}
        etapaAtual={etapaAtual}
        indiceEtapa={indiceEtapa}
        dados={dados}
        selecoes={selecoes}
        resumo={resumo}
        sucesso={sucesso}
        sugestoes={sugestoes}
        sugestoesRapidas={sugestoesRapidas}
        campoBuscando={campoBuscando}
        erro={erro || erroExterno}
        salvando={carregando}
        duplicidade={duplicidade}
        regraPartida={regraPartida}
        carregandoRegraPartida={carregandoRegraPartida}
        erroRegraPartida={erroRegraPartida}
        grupo={grupoContexto}
        carregandoGrupo={carregandoGrupo}
        gruposDisponiveis={gruposDisponiveis}
        carregandoGruposDisponiveis={carregandoGruposDisponiveis}
        erroGruposDisponiveis={erroGruposDisponiveis}
        seletorGrupoAberto={seletorGrupoAberto}
        onCarregarGrupos={carregarGruposParaSelecao}
        onSelecionarGrupo={abrirSeletorGrupo}
        onEscolherGrupo={selecionarGrupo}
        onRemoverGrupo={removerGrupo}
        onFecharSeletorGrupo={fecharSeletorGrupo}
        onAlterarCampo={alterarCampo}
        onSelecionarAtleta={selecionarAtleta}
        onLimparSelecao={limparSelecaoAtleta}
        onConfirmarEtapa={confirmarEtapa}
        onVoltar={voltar}
        onIrParaEtapa={irParaEtapa}
        onCancelarDuplicidade={cancelarDuplicidade}
        onConfirmarDuplicidade={confirmarDuplicidade}
        onVerPartida={verPartidaDuplicada}
        onFechar={onFechar}
        onFecharSucesso={fecharSucesso}
        onAdicionarMidia={() => setUploadMidiaAberto(true)}
        onAbrirGrupo={abrirGrupo}
        onRegistrarRevanche={registrarRevanche}
        fluxoSimplificado={ehEdicao}
        titulo={ehEdicao ? 'Editar partida' : 'Registrar partida'}
        ariaFechar={ehEdicao ? 'Fechar edição de partida' : 'Fechar registro de partida'}
        rotuloAcaoPrincipal={ehEdicao ? 'Salvar alterações' : 'Registrar partida'}
        rotuloAcaoPrincipalSalvando={ehEdicao ? 'Salvando...' : 'Registrando...'}
        permitirRemoverGrupo={!ehEdicao}
        sucessoEdicao={ehEdicao}
      />

      <PartidaMidiaUploadModal
        aberto={uploadMidiaAberto}
        partidaId={sucesso?.partida?.id}
        onFechar={() => setUploadMidiaAberto(false)}
        onConcluido={concluirUploadMidia}
      />
    </ErroRegistroPartidaBoundary>
  );
}
