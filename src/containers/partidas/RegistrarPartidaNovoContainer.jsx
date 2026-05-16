import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmarDuplicidadePartidaModal } from '../../components/partidas/ConfirmarDuplicidadePartidaModal';
import { RegistrarPartidaNovoModal } from '../../components/partidas/RegistrarPartidaNovoModal';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { atletasServico } from '../../services/atletasServico';
import { partidasServico } from '../../services/partidasServico';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';
import { extrairMensagemErro } from '../../utils/erros';
import { criarPayloadVerificacaoDuplicidadePartida } from '../../utils/partidas';

const LADOS_ATLETA = {
  direito: 1,
  esquerdo: 2
};

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

function obterCampoAtletaUsuario(lado) {
  return Number(lado) === LADOS_ATLETA.esquerdo ? 'dupla1.atletaEsquerda' : 'dupla1.atletaDireita';
}

function obterCampoParceiroUsuario(lado) {
  return Number(lado) === LADOS_ATLETA.esquerdo ? 'dupla1.atletaDireita' : 'dupla1.atletaEsquerda';
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

function obterEtapas(atletaUsuarioNome, atletaUsuarioLado) {
  return [
    {
      campo: obterCampoParceiroUsuario(atletaUsuarioLado),
      titulo: 'Sua dupla',
      descricao: atletaUsuarioNome ? `Você entra automaticamente como ${atletaUsuarioNome}.` : '',
      rotulo: 'Atleta da sua dupla',
      placeholder: 'Nome ou apelido do seu parceiro'
    },
    {
      campo: 'dupla1.pontos',
      titulo: 'Sua dupla',
      rotulo: 'Placar',
      tipo: 'numero',
      placeholder: 'Pontos da sua dupla'
    },
    {
      campo: 'dupla2.atletaDireita',
      titulo: 'Dupla adversária',
      rotulo: '1° Atleta',
      placeholder: 'Nome/Apelido do primeiro adversário'
    },
    {
      campo: 'dupla2.atletaEsquerda',
      titulo: 'Dupla adversária',
      rotulo: '2° Atleta',
      placeholder: 'Nome/Apelido do segundo adversário'
    },
    {
      campo: 'dupla2.pontos',
      titulo: '',
      rotulo: '',
      tipo: 'numero',
      placeholder: 'Pontos da dupla adversária'
    }
  ];
}

function obterValorCampo(dados, caminho) {
  return caminho.split('.').reduce((valor, parte) => valor?.[parte], dados) ?? '';
}

function atualizarValorCampo(dados, caminho, valor) {
  const partes = caminho.split('.');

  if (partes.length === 1) {
    return {
      ...dados,
      [caminho]: valor
    };
  }

  const [grupo, campo] = partes;

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

function validarCampo(etapa, dados) {
  const valor = obterValorCampo(dados, etapa.campo);

  if (!limparTexto(valor)) {
    return 'Preencha este campo para continuar.';
  }

  if (etapa.tipo === 'numero') {
    const numero = Number(valor);

    if (!Number.isFinite(numero) || numero < 0) {
      return 'Informe pontos numéricos maiores ou iguais a zero.';
    }
  }

  return '';
}

function validarPartidaCompleta(dados, etapas) {
  for (const etapa of etapas) {
    const erro = validarCampo(etapa, dados);

    if (erro) {
      return erro;
    }
  }

  return '';
}

function criarDadosComAtletaUsuario(dados, usuario, atletaUsuario) {
  const atletaUsuarioNome = obterAtletaUsuarioNome(usuario, atletaUsuario);
  const atletaUsuarioLado = obterAtletaUsuarioLado(usuario, atletaUsuario);
  const campoAtletaUsuario = obterCampoAtletaUsuario(atletaUsuarioLado);

  return atualizarValorCampo(dados, campoAtletaUsuario, atletaUsuarioNome);
}

function criarPayload(dados, usuario, atletaUsuario) {
  const atletaUsuarioId = obterAtletaUsuarioId(usuario, atletaUsuario);
  const atletaUsuarioLado = obterAtletaUsuarioLado(usuario, atletaUsuario);
  const usuarioNaEsquerda = atletaUsuarioLado === LADOS_ATLETA.esquerdo;
  const dadosComAtletaUsuario = criarDadosComAtletaUsuario(dados, usuario, atletaUsuario);

  return {
    competicaoId: null,
    grupoId: null,
    nomeGrupo: null,
    categoriaCompeticaoId: null,
    duplaAId: null,
    duplaBId: null,
    duplaAAtleta1Id: usuarioNaEsquerda ? null : atletaUsuarioId,
    duplaAAtleta1Nome: limparTexto(dadosComAtletaUsuario.dupla1.atletaDireita),
    duplaAAtleta2Id: usuarioNaEsquerda ? atletaUsuarioId : null,
    duplaAAtleta2Nome: limparTexto(dadosComAtletaUsuario.dupla1.atletaEsquerda),
    duplaBAtleta1Id: null,
    duplaBAtleta1Nome: limparTexto(dadosComAtletaUsuario.dupla2.atletaDireita),
    duplaBAtleta2Id: null,
    duplaBAtleta2Nome: limparTexto(dadosComAtletaUsuario.dupla2.atletaEsquerda),
    faseCampeonato: null,
    status: 2,
    placarDuplaA: Number(dadosComAtletaUsuario.dupla1.pontos),
    placarDuplaB: Number(dadosComAtletaUsuario.dupla2.pontos),
    dataPartida: new Date().toISOString(),
    observacoes: null
  };
}

export function RegistrarPartidaNovoContainer({ onFechar }) {
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();
  const { showNotification } = useNotification();
  const [dados, setDados] = useState(estadoInicial);
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [duplicidade, setDuplicidade] = useState(null);
  const [payloadPendente, setPayloadPendente] = useState(null);
  const [atletaUsuario, setAtletaUsuario] = useState(usuario?.atleta || null);
  const [carregandoAtletaUsuario, setCarregandoAtletaUsuario] = useState(false);

  const atletaUsuarioNome = obterAtletaUsuarioNome(usuario, atletaUsuario);
  const atletaUsuarioLado = obterAtletaUsuarioLado(usuario, atletaUsuario);
  const etapas = obterEtapas(atletaUsuarioNome, atletaUsuarioLado);
  const etapaAtual = etapas[indiceEtapa];
  const etapaFinal = indiceEtapa === etapas.length - 1;

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

  function alterarCampo(campo, valor) {
    setErro('');

    setDados((anterior) => atualizarValorCampo(anterior, campo, valor));
  }

  function voltar() {
    setErro('');
    setIndiceEtapa((atual) => Math.max(0, atual - 1));
  }

  async function salvarPartida(payload) {
    setSalvando(true);

    try {
      await partidasServico.criar(payload);
      onFechar();
      showNotification({
        type: 'success',
        title: 'Jogo salvo',
        message: 'A partida foi registrada com sucesso.'
      });
      navegar('/minhas-partidas-registradas');
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
    } finally {
      setSalvando(false);
      setPayloadPendente(null);
      setDuplicidade(null);
    }
  }

  async function registrarPartida({ permitirDuplicidade = false } = {}) {
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

    const erroValidacao = validarPartidaCompleta(dados, etapas);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const payload = {
      ...criarPayload(dados, usuario, atletaUsuario),
      permitirDuplicidade
    };

    try {
      setSalvando(true);

      if (!permitirDuplicidade) {
        const verificacao = await partidasServico.verificarDuplicidade(criarPayloadVerificacaoDuplicidadePartida(payload));

        if (verificacao?.existeDuplicidade) {
          setDuplicidade(verificacao);
          setPayloadPendente(payload);
          return;
        }
      }

      await salvarPartida(payload);
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
    } finally {
      if (!duplicidade) {
        setSalvando(false);
      }
    }
  }

  function cancelarDuplicidade() {
    setDuplicidade(null);
    setPayloadPendente(null);
    setSalvando(false);
  }

  function confirmarDuplicidade() {
    if (payloadPendente) {
      salvarPartida({ ...payloadPendente, permitirDuplicidade: true });
    }
  }

  function confirmarEtapa(evento) {
    evento.preventDefault();
    setErro('');

    const erroValidacao = validarCampo(etapaAtual, dados);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    if (etapaFinal) {
      registrarPartida();
      return;
    }

    setIndiceEtapa((atual) => Math.min(etapas.length - 1, atual + 1));
  }

  return (
    <>
      <RegistrarPartidaNovoModal
        aberto
        etapa={{ ...etapaAtual, indice: indiceEtapa }}
        totalEtapas={etapas.length}
        dados={dados}
        erro={erro}
        salvando={salvando || carregandoAtletaUsuario}
        etapaFinal={etapaFinal}
        onAlterarCampo={alterarCampo}
        onConfirmarEtapa={confirmarEtapa}
        onVoltar={voltar}
        onFechar={onFechar}
      />

      {duplicidade && (
        <ConfirmarDuplicidadePartidaModal
          mensagem={`${duplicidade.mensagem || 'Já existe uma partida registrada hoje com os mesmos atletas e o mesmo placar.'} Deseja salvar mesmo assim?`}
          salvando={salvando}
          onCancelar={cancelarDuplicidade}
          onConfirmar={confirmarDuplicidade}
        />
      )}
    </>
  );
}
