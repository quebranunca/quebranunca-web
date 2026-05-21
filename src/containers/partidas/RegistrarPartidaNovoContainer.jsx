import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartidaMidiaUploadModal } from '../../components/partidas/PartidaMidiaUploadModal';
import { RegistrarPartidaNovoModal } from '../../components/partidas/RegistrarPartidaNovoModal';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { atletasServico } from '../../services/atletasServico';
import { competicoesServico } from '../../services/competicoesServico';
import { partidasServico } from '../../services/partidasServico';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';
import { ehConfirmacaoDuplicidadePartida, extrairConfirmacaoDuplicidadePartida, extrairMensagemErro } from '../../utils/erros';

const LADOS_ATLETA = {
  direito: 1,
  esquerdo: 2
};

const CAMPOS_ATLETAS = [
  'dupla1.atletaDireita',
  'dupla1.atletaEsquerda',
  'dupla2.atletaDireita',
  'dupla2.atletaEsquerda'
];

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
  }
};

const estadoInicialSelecoes = {
  'dupla1.atletaDireita': null,
  'dupla1.atletaEsquerda': null,
  'dupla2.atletaDireita': null,
  'dupla2.atletaEsquerda': null
};

const etapas = [
  { id: 'registro', titulo: 'Registro', icone: 'users' },
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
  return caminho.split('.').reduce((valor, parte) => valor?.[parte], dados) ?? '';
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
  return String(valor || '').trim().replace(/\s+/g, ' ');
}

function criarAtletaSelecao(atleta) {
  if (!atleta) {
    return null;
  }

  return {
    id: atleta.id,
    nome: atleta.nome,
    apelido: atleta.apelido,
    categoria: atleta.categoria,
    nomeCategoria: atleta.nomeCategoria,
    grupo: atleta.grupo,
    nomeGrupo: atleta.nomeGrupo,
    cidade: atleta.cidade,
    estado: atleta.estado,
    posicaoRanking: atleta.posicaoRanking,
    quantidadeJogos: atleta.quantidadeJogos,
    avatarUrl: atleta.avatarUrl,
    fotoPerfilUrl: atleta.fotoPerfilUrl
  };
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
    avatarUrl: atletaUsuario?.avatarUrl || usuario?.atleta?.avatarUrl
  });
}

function criarDadosComAtletaUsuario(dados, usuario, atletaUsuario) {
  const atletaUsuarioNome = obterAtletaUsuarioNome(usuario, atletaUsuario);
  const campoAtletaUsuario = obterCampoAtletaUsuario(obterAtletaUsuarioLado(usuario, atletaUsuario));

  return atualizarValorCampo(dados, campoAtletaUsuario, atletaUsuarioNome);
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

function criarPayload(dados, selecoes, usuario, atletaUsuario, contextoInicial) {
  const atletaUsuarioId = obterAtletaUsuarioId(usuario, atletaUsuario);
  const campoAtletaUsuario = obterCampoAtletaUsuario(obterAtletaUsuarioLado(usuario, atletaUsuario));
  const dadosComAtletaUsuario = criarDadosComAtletaUsuario(dados, usuario, atletaUsuario);

  return {
    competicaoId: contextoInicial?.competicaoId || null,
    grupoId: contextoInicial?.grupoId || null,
    nomeGrupo: null,
    categoriaCompeticaoId: contextoInicial?.categoriaId || null,
    duplaAId: null,
    duplaBId: null,
    duplaAAtleta1Id: obterAtletaId(selecoes, 'dupla1.atletaDireita', campoAtletaUsuario, atletaUsuarioId),
    duplaAAtleta1Nome: limparTexto(dadosComAtletaUsuario.dupla1.atletaDireita),
    duplaAAtleta2Id: obterAtletaId(selecoes, 'dupla1.atletaEsquerda', campoAtletaUsuario, atletaUsuarioId),
    duplaAAtleta2Nome: limparTexto(dadosComAtletaUsuario.dupla1.atletaEsquerda),
    duplaBAtleta1Id: selecoes['dupla2.atletaDireita']?.id || null,
    duplaBAtleta1Nome: limparTexto(dadosComAtletaUsuario.dupla2.atletaDireita),
    duplaBAtleta2Id: selecoes['dupla2.atletaEsquerda']?.id || null,
    duplaBAtleta2Nome: limparTexto(dadosComAtletaUsuario.dupla2.atletaEsquerda),
    faseCampeonato: null,
    status: 2,
    placarDuplaA: Number(dadosComAtletaUsuario.dupla1.pontos),
    placarDuplaB: Number(dadosComAtletaUsuario.dupla2.pontos),
    dataPartida: new Date().toISOString(),
    observacoes: null
  };
}

function validarAtletas(dados) {
  const nomes = CAMPOS_ATLETAS.map((campo) => limparTexto(obterValorCampo(dados, campo)));

  if (nomes.some((nome) => !nome)) {
    return 'Informe os quatro atletas da partida.';
  }

  const nomesNormalizados = nomes.map((nome) => nome.toLowerCase());
  if (new Set(nomesNormalizados).size !== nomesNormalizados.length) {
    return 'Não é permitido repetir atleta na mesma partida.';
  }

  return '';
}

function validarPlacar(dados) {
  const placarA = Number(dados.dupla1.pontos);
  const placarB = Number(dados.dupla2.pontos);

  if (dados.dupla1.pontos === '' || dados.dupla2.pontos === '') {
    return 'Informe os pontos das duas duplas.';
  }

  if (!Number.isFinite(placarA) || !Number.isFinite(placarB) || placarA < 0 || placarB < 0) {
    return 'Informe pontos numéricos maiores ou iguais a zero.';
  }

  if (placarA === placarB) {
    return 'Não existe empate no futevôlei.';
  }

  return '';
}

function limitarSugestoes(atletas) {
  return (atletas || []).slice(0, 5).map(criarAtletaSelecao);
}

export function RegistrarPartidaNovoContainer({ onFechar, contextoInicial = {} }) {
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();
  const { showNotification } = useNotification();
  const [dados, setDados] = useState(estadoInicial);
  const [selecoes, setSelecoes] = useState(estadoInicialSelecoes);
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [duplicidade, setDuplicidade] = useState(null);
  const [payloadPendente, setPayloadPendente] = useState(null);
  const [atletaUsuario, setAtletaUsuario] = useState(usuario?.atleta || null);
  const [carregandoAtletaUsuario, setCarregandoAtletaUsuario] = useState(false);
  const [sugestoes, setSugestoes] = useState({});
  const [campoBuscando, setCampoBuscando] = useState('');
  const [sucesso, setSucesso] = useState(null);
  const [uploadMidiaAberto, setUploadMidiaAberto] = useState(false);
  const cacheBuscaRef = useRef(new Map());
  const buscaTimersRef = useRef({});

  const atletaUsuarioNome = obterAtletaUsuarioNome(usuario, atletaUsuario);
  const etapaAtual = etapas[indiceEtapa];
  const revisando = etapaAtual.id === 'revisao';
  const carregando = salvando || carregandoAtletaUsuario;

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
    data: new Date(),
    contexto: contextoInicial
  }), [dados, contextoInicial]);

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
  }, [usuario, atletaUsuario]);

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
    setDados((anterior) => atualizarValorCampo(anterior, campo, proximoValor));

    if (CAMPOS_ATLETAS.includes(campo)) {
      setSelecoes((anterior) => ({ ...anterior, [campo]: null }));
      buscarSugestoes(campo, proximoValor);
    }
  }

  function buscarSugestoes(campo, valor) {
    const termo = limparTexto(valor);
    clearTimeout(buscaTimersRef.current[campo]);

    if (termo.length < 2) {
      setSugestoes((anterior) => ({ ...anterior, [campo]: [] }));
      return;
    }

    buscaTimersRef.current[campo] = setTimeout(async () => {
      const competicaoId = contextoInicial?.competicaoId;
      const chaveCache = `${competicaoId || 'geral'}:${termo.toLowerCase()}`;

      if (cacheBuscaRef.current.has(chaveCache)) {
        setSugestoes((anterior) => ({ ...anterior, [campo]: cacheBuscaRef.current.get(chaveCache) }));
        return;
      }

      try {
        setCampoBuscando(campo);
        const resposta = competicaoId && termo.length >= 3
          ? await competicoesServico.buscarSugestoesAtletas(competicaoId, termo)
          : await atletasServico.buscar(termo);
        const lista = limitarSugestoes(resposta);
        cacheBuscaRef.current.set(chaveCache, lista);
        setSugestoes((anterior) => ({ ...anterior, [campo]: lista }));
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
    setErro('');
    setDuplicidade(null);
    setPayloadPendente(null);
    setDados((anterior) => atualizarValorCampo(anterior, campo, atleta.nome));
    setSelecoes((anterior) => ({ ...anterior, [campo]: atleta }));
    setSugestoes((anterior) => ({ ...anterior, [campo]: [] }));
    avancarAposSelecao(campo);
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

  function revisar() {
    const erroValidacao = validarAtletas(dados) || validarPlacar(dados);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro('');
    setIndiceEtapa(1);
  }

  async function salvarPartida(payload) {
    try {
      setSalvando(true);
      const partidaCriada = await partidasServico.criar(payload);
      setSucesso({
        partida: partidaCriada,
        resumo: {
          ...resumo,
          salvoEm: new Date()
        }
      });
      setPayloadPendente(null);
      setDuplicidade(null);
    } catch (falha) {
      if (!payload?.confirmarDuplicidade && ehConfirmacaoDuplicidadePartida(falha)) {
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
    if (carregandoAtletaUsuario) {
      setErro('Aguarde a identificação do atleta logado para salvar a partida.');
      return;
    }

    if (!obterAtletaUsuarioId(usuario, atletaUsuario)) {
      setErro('Seu usuário precisa estar vinculado a um atleta para registrar a partida neste fluxo.');
      return;
    }

    if (!limparTexto(atletaUsuarioNome)) {
      setErro('Não foi possível identificar o atleta logado para registrar a partida.');
      return;
    }

    const erroValidacao = validarAtletas(dados) || validarPlacar(dados);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const payload = {
      ...criarPayload(dados, selecoes, usuario, atletaUsuario, contextoInicial),
      confirmarDuplicidade
    };

    await salvarPartida(payload);
  }

  function confirmarEtapa(evento) {
    evento.preventDefault();

    if (revisando) {
      registrarPartida();
      return;
    }

    revisar();
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
      }
    };

    setDados(dadosRevanche);
    setSucesso(null);
    setErro('');
    setIndiceEtapa(0);
  }

  function registrarNovaPartida() {
    setDados(criarDadosComAtletaUsuario(estadoInicial, usuario, atletaUsuario));
    setSelecoes(criarSelecoesComAtletaUsuario(usuario, atletaUsuario));
    setSucesso(null);
    setErro('');
    setIndiceEtapa(0);
  }

  function verPartida() {
    onFechar?.();
    navegar('/minhas-partidas-registradas');
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
    <>
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
        campoBuscando={campoBuscando}
        erro={erro}
        salvando={carregando}
        revisando={revisando}
        duplicidade={duplicidade}
        onAlterarCampo={alterarCampo}
        onSelecionarAtleta={selecionarAtleta}
        onConfirmarEtapa={confirmarEtapa}
        onVoltar={voltar}
        onRevisar={revisar}
        onCancelarDuplicidade={cancelarDuplicidade}
        onConfirmarDuplicidade={confirmarDuplicidade}
        onFechar={onFechar}
        onAdicionarMidia={() => setUploadMidiaAberto(true)}
        onVerPartida={verPartida}
        onRegistrarRevanche={registrarRevanche}
        onRegistrarNovaPartida={registrarNovaPartida}
      />

      <PartidaMidiaUploadModal
        aberto={uploadMidiaAberto}
        partidaId={sucesso?.partida?.id}
        onFechar={() => setUploadMidiaAberto(false)}
        onConcluido={concluirUploadMidia}
      />
    </>
  );
}
