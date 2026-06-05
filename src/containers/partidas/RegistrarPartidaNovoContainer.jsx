import { useEffect, useMemo, useRef, useState } from 'react';
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
import { ehConfirmacaoDuplicidadePartida, extrairConfirmacaoDuplicidadePartida, extrairMensagemErro } from '../../utils/erros';
import { ehAdministrador, ehOrganizador } from '../../utils/perfis';

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
  },
  resultado: {
    modo: 'PlacarDetalhado',
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
  { id: 'dupla1', titulo: 'Dupla 1', icone: 'users' },
  { id: 'dupla2', titulo: 'Dupla 2', icone: 'users' },
  { id: 'placar', titulo: 'Placar', icone: 'score' },
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
    totalPartidas: atleta.totalPartidas,
    avatarUrl: atleta.avatarUrl,
    fotoPerfilUrl: atleta.fotoPerfilUrl,
    origemSugestao: atleta.origemSugestao
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
    avatarUrl: atletaUsuario?.avatarUrl || usuario?.atleta?.avatarUrl,
    fotoPerfilUrl: atletaUsuario?.fotoPerfilUrl || usuario?.atleta?.fotoPerfilUrl || usuario?.fotoPerfilUrl
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

function deveFixarAtletaUsuario(usuario, contextoInicial) {
  return !contextoInicial?.grupoId && !ehAdministrador(usuario) && !ehOrganizador(usuario);
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

function validarDupla(dados, prefixo, rotulo) {
  const atleta1 = limparTexto(dados[prefixo].atletaDireita);
  const atleta2 = limparTexto(dados[prefixo].atletaEsquerda);

  if (!atleta1 || !atleta2) {
    return `Informe os dois atletas da ${rotulo}.`;
  }

  if (atleta1.toLowerCase() === atleta2.toLowerCase()) {
    return `Não é permitido repetir atleta na ${rotulo}.`;
  }

  return '';
}

function validarEtapaAtual(idEtapa, dados, regraPartida) {
  if (idEtapa === 'dupla1') {
    return validarDupla(dados, 'dupla1', 'Dupla 1');
  }

  if (idEtapa === 'dupla2') {
    return validarDupla(dados, 'dupla2', 'Dupla 2') || validarAtletas(dados);
  }

  if (idEtapa === 'placar') {
    return validarPlacar(dados, regraPartida);
  }

  if (idEtapa === 'revisao') {
    return validarAtletas(dados) || validarPlacar(dados, regraPartida);
  }

  return '';
}

function obterNumeroRegra(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function validarPlacar(dados, regraPartida = null) {
  if (dados.resultado?.modo === 'ApenasResultado') {
    return dados.resultado.duplaVencedora ? '' : 'Informe qual dupla venceu a partida.';
  }

  const placarA = Number(dados.dupla1.pontos);
  const placarB = Number(dados.dupla2.pontos);
  const pontosMinimos = obterNumeroRegra(regraPartida?.pontosMinimosPartida);
  const diferencaMinima = obterNumeroRegra(regraPartida?.diferencaMinimaPartida);
  const permiteEmpate = regraPartida?.permiteEmpate === true;

  if (dados.dupla1.pontos === '' || dados.dupla2.pontos === '') {
    return 'Informe os pontos das duas duplas.';
  }

  if (!Number.isFinite(placarA) || !Number.isFinite(placarB) || placarA < 0 || placarB < 0) {
    return 'Informe pontos numéricos maiores ou iguais a zero.';
  }

  if (!permiteEmpate && placarA === placarB) {
    return 'Não existe empate no futevôlei.';
  }

  if (pontosMinimos !== null && Math.max(placarA, placarB) < pontosMinimos) {
    return `A dupla vencedora precisa atingir pelo menos ${pontosMinimos} pontos.`;
  }

  if (diferencaMinima !== null && Math.abs(placarA - placarB) < diferencaMinima) {
    return `A diferença mínima precisa ser de ${diferencaMinima} pontos.`;
  }

  return '';
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
  return (atletas || []).slice(0, 5).map(criarAtletaSelecao);
}

function limitarSugestoesGrupo(atletas, grupo) {
  return (atletas || []).slice(0, 5).map((atleta) => criarAtletaSelecao({
    id: atleta.id,
    nome: atleta.nome,
    apelido: atleta.apelido,
    nomeGrupo: grupo?.nome || 'Grupo',
    origemSugestao: 'grupo'
  }));
}

function limitarSugestoesExternas(atletas, idsIgnorados) {
  return (atletas || [])
    .filter((atleta) => atleta?.id && !idsIgnorados.has(atleta.id))
    .slice(0, 5)
    .map((atleta) => ({
      ...criarAtletaSelecao(atleta),
      origemSugestao: 'externo'
    }));
}

function obterGrupoId(grupo) {
  return grupo?.id || grupo?.grupoId || null;
}

function normalizarNomeSugestao(valor) {
  return limparTexto(valor).toLowerCase();
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
  const [sugestoesPartida, setSugestoesPartida] = useState({
    parceirosFrequentes: [],
    rivaisFrequentes: []
  });
  const [campoBuscando, setCampoBuscando] = useState('');
  const [sucesso, setSucesso] = useState(null);
  const [uploadMidiaAberto, setUploadMidiaAberto] = useState(false);
  const [contextoPartida, setContextoPartida] = useState(contextoInicial);
  const [grupoContexto, setGrupoContexto] = useState(null);
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
  const revisando = etapaAtual.id === 'revisao';
  const fixarAtletaUsuario = deveFixarAtletaUsuario(usuario, contextoPartida);
  const carregando = salvando || (fixarAtletaUsuario && carregandoAtletaUsuario);
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

    function filtrar(lista, { removerAtletaUsuario = false } = {}) {
      return (lista || [])
        .filter((atleta) => atleta?.id)
        .filter((atleta) => !idsSelecionados.has(atleta.id))
        .filter((atleta) => !nomesSelecionados.has(normalizarNomeSugestao(atleta.nome)))
        .filter((atleta) => !removerAtletaUsuario || atleta.id !== atletaUsuarioId)
        .map((atleta) => criarAtletaSelecao({
          id: atleta.id,
          nome: atleta.nome,
          quantidadeJogos: atleta.totalPartidas,
          totalPartidas: atleta.totalPartidas,
          origemSugestao: 'frequente'
        }));
    }

    const campoParceiro = campoAtletaUsuario === 'dupla1.atletaDireita'
      ? 'dupla1.atletaEsquerda'
      : 'dupla1.atletaDireita';
    const campoRivalDireita = 'dupla2.atletaDireita';
    const campoRivalEsquerda = 'dupla2.atletaEsquerda';
    const parceiroDisponivel = fixarAtletaUsuario && !selecoes[campoParceiro]?.id;
    const rivaisDisponiveis = filtrar(sugestoesPartida.rivaisFrequentes, { removerAtletaUsuario: true });

    return {
      [campoParceiro]: parceiroDisponivel
        ? {
            titulo: 'Parceiros frequentes',
            atletas: filtrar(sugestoesPartida.parceirosFrequentes, { removerAtletaUsuario: true })
          }
        : null,
      [campoRivalDireita]: !selecoes[campoRivalDireita]?.id
        ? {
            titulo: 'Rivais frequentes',
            atletas: rivaisDisponiveis
          }
        : null,
      [campoRivalEsquerda]: !selecoes[campoRivalEsquerda]?.id
        ? {
            titulo: 'Rivais frequentes',
            atletas: rivaisDisponiveis
          }
        : null
    };
  }, [dados, selecoes, sugestoesPartida, fixarAtletaUsuario, campoAtletaUsuario, atletaUsuarioId]);

  useEffect(() => {
    setContextoPartida(contextoInicial);
  }, [contextoInicial?.competicaoId, contextoInicial?.grupoId, contextoInicial?.categoriaId]);

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
        setCarregandoGrupo(false);
        return;
      }

      try {
        setCarregandoGrupo(true);
        const [grupo, atletas] = await Promise.all([
          gruposServico.obterPorId(grupoId),
          grupoAtletasServico.listarPorGrupo(grupoId).catch(() => [])
        ]);

        if (!cancelado) {
          setGrupoContexto(normalizarGrupoContexto(grupo, atletas?.length));
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
  }, [contextoPartida?.grupoId]);

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
    if (!deveFixarAtletaUsuario(usuario, contextoPartida)) {
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
    setDados((anterior) => atualizarValorCampo(anterior, campo, proximoValor));

    if (CAMPOS_ATLETAS.includes(campo)) {
      setSelecoes((anterior) => ({ ...anterior, [campo]: null }));
      buscarSugestoes(campo, proximoValor);
    }
  }

  function buscarSugestoes(campo, valor) {
    const termo = limparTexto(valor);
    clearTimeout(buscaTimersRef.current[campo]);
    const grupoId = contextoPartida?.grupoId;
    const minimoCaracteres = grupoId ? 3 : 2;

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

      if (cacheBuscaRef.current.has(chaveCache)) {
        setSugestoes((anterior) => ({ ...anterior, [campo]: cacheBuscaRef.current.get(chaveCache) }));
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
    const erroValidacao = validarAtletas(dados) || validarPlacar(dados, regraPartida);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro('');
    setIndiceEtapa(etapas.findIndex((etapa) => etapa.id === 'revisao'));
  }

  async function salvarPartida(payload) {
    try {
      setSalvando(true);
      await partidasServico.criar(payload);
      showNotification({
        type: 'success',
        title: 'Partida registrada',
        message: 'Resultado salvo no histórico QuebraNunca.'
      });
      setPayloadPendente(null);
      setDuplicidade(null);
      onFechar?.();
      navegar('/app', { replace: true });
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
    const fixarAtletaUsuario = deveFixarAtletaUsuario(usuario, contextoPartida);

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

    const erroValidacao = validarAtletas(dados) || validarPlacar(dados, regraPartida);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const payload = {
      ...criarPayload(dados, selecoes, usuario, atletaUsuario, contextoPartida),
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

    const erroValidacao = validarEtapaAtual(etapaAtual.id, dados, regraPartida);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro('');
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
    setIndiceEtapa(etapas.findIndex((etapa) => etapa.id === 'placar'));
  }

  function registrarNovaPartida() {
    if (deveFixarAtletaUsuario(usuario, contextoPartida)) {
      setDados(criarDadosComAtletaUsuario(estadoInicial, usuario, atletaUsuario));
      setSelecoes(criarSelecoesComAtletaUsuario(usuario, atletaUsuario));
    } else {
      setDados(estadoInicial);
      setSelecoes(estadoInicialSelecoes);
    }

    setSucesso(null);
    setErro('');
    setIndiceEtapa(0);
  }

  function verPartida() {
    onFechar?.();
    navegar('/minhas-partidas-registradas');
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
        sugestoesRapidas={sugestoesRapidas}
        campoBuscando={campoBuscando}
        erro={erro}
        salvando={carregando}
        revisando={revisando}
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
        onConfirmarEtapa={confirmarEtapa}
        onVoltar={voltar}
        onRevisar={revisar}
        onCancelarDuplicidade={cancelarDuplicidade}
        onConfirmarDuplicidade={confirmarDuplicidade}
        onFechar={onFechar}
        onAdicionarMidia={() => setUploadMidiaAberto(true)}
        onVerPartida={verPartida}
        onAbrirGrupo={abrirGrupo}
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
