import { useEffect, useMemo, useState } from 'react';
import {
  FaArrowRight,
  FaChartLine,
  FaCheckCircle,
  FaCog,
  FaEnvelope,
  FaFire,
  FaGlobeAmericas,
  FaHourglassHalf,
  FaInstagram,
  FaLock,
  FaMapMarkerAlt,
  FaPhone,
  FaRegUser,
  FaSave,
  FaShieldAlt,
  FaSignOutAlt,
  FaTimesCircle,
  FaSyncAlt,
  FaTrashAlt,
  FaTrophy,
  FaUserEdit,
  FaUsers
} from 'react-icons/fa';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { AppHero } from '../components/AppHero';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { FotoPerfilUpload } from '../components/FotoPerfilUpload';
import { arenaService } from '../services/arenaService';
import { atletasServico } from '../services/atletasServico';
import { dashboardServico } from '../services/dashboardServico';
import { privacidadeServico } from '../services/privacidadeServico';
import { usuariosServico } from '../services/usuariosServico';
import { useNotification } from '../contexts/NotificationContext';
import { extrairMensagemErro } from '../utils/erros';
import {
  formatarCpfParaInput,
  formatarData,
  formatarHora,
  formatarTelefoneParaInput,
  limparCpf,
  limparTelefone,
  normalizarDataParaApi,
  paraInputData,
  validarCpf
} from '../utils/formatacao';
import { opcoesNivelAtleta } from '../utils/niveisAtleta';
import { PERFIS_USUARIO } from '../utils/perfis';
import { nomeEstadoAcesso } from '../utils/acesso';
import { buscarCidadesPorEstado, estadosBrasil, normalizarEstadoParaUf } from '../utils/localidadesBrasil';
import { rolarParaTopo } from '../utils/rolagem';
import { scrollFocusedInputIntoView } from '../utils/tecladoMobile';
import {
  STATUS_APROVACAO_PARTIDA,
  atletaEstaNaDuplaA,
  atletaEstaNaDuplaB,
  ehNomeGrupoGeralPartida,
  obterDuplasDoAtleta
} from '../utils/partidas';
import { obterNomeExibicaoAtletaPerfil } from '../utils/atletaUtils';

const estadoInicialAtleta = {
  nome: '',
  apelido: '',
  telefone: '',
  email: '',
  instagram: '',
  cpf: '',
  bairro: '',
  cidade: '',
  estado: '',
  cadastroPendente: false,
  sexo: '',
  nivel: '',
  lado: '3',
  dataNascimento: '',
  peDominante: '',
  tempoPratica: '',
  arenaPrincipalId: '',
  arenaPrincipalNome: '',
  objetivoAtual: ''
};

const estadoInicialMedidas = {
  camiseta: '',
  regata: '',
  short: '',
  sunga: '',
  top: '',
  biquini: ''
};

const camposMedidas = ['camiseta', 'regata', 'short', 'sunga', 'top', 'biquini'];

const abasPerfil = [
  { id: 'resumo', rotulo: 'Resumo', icone: FaChartLine },
  { id: 'perfil', rotulo: 'Perfil', icone: FaRegUser },
  { id: 'contato', rotulo: 'Contato', icone: FaPhone },
  { id: 'privacidade', rotulo: 'Privacidade', icone: FaShieldAlt },
  { id: 'configuracoes', rotulo: 'Configurações', icone: FaCog }
];

const preferenciasPrivacidadeIniciais = {
  perfilPublico: true,
  exibirEmail: false,
  permitirUsoLocalizacao: false,
  permitirUsoImagem: false,
  possuiFotoPerfil: false,
  exclusaoSolicitada: false
};

const mensagemErroAcessoOrganizador =
  'O organizador só pode alterar atletas inscritos em competições vinculadas ao próprio usuário.';
const dataMinimaNascimento = '1900-01-01';

const opcoesSexoAtleta = [
  { valor: 1, rotulo: 'Masculino' },
  { valor: 2, rotulo: 'Feminino' }
];

const opcoesPeDominante = [
  { valor: 1, rotulo: 'Direito' },
  { valor: 2, rotulo: 'Esquerdo' },
  { valor: 3, rotulo: 'Ambidestro' }
];

const opcoesTempoPratica = [
  { valor: 1, rotulo: 'Menos de 1 ano' },
  { valor: 2, rotulo: '1 a 3 anos' },
  { valor: 3, rotulo: '3 a 5 anos' },
  { valor: 4, rotulo: '5 a 10 anos' },
  { valor: 5, rotulo: 'Mais de 10 anos' }
];

const opcoesObjetivoAtual = [
  { valor: 1, rotulo: 'Diversão e lazer' },
  { valor: 2, rotulo: 'Evoluir tecnicamente' },
  { valor: 3, rotulo: 'Jogar mais partidas' },
  { valor: 4, rotulo: 'Disputar campeonatos' },
  { valor: 5, rotulo: 'Melhorar condicionamento físico' }
];

const tamanhosRoupa = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
const tamanhosShort = ['36', '38', '40', '42', '44', '46', '48', '50'];
const ROTULO_RANKING_GERAL = 'Ranking Geral';

function normalizarTextoPerfil(valor) {
  return typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
}

function normalizarResultadoPerfil(valor) {
  return normalizarTextoPerfil(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function valorNumericoValido(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function partidaTemPlacarPerfil(partida) {
  const placarSuaDupla = valorNumericoValido(partida?.placarSuaDupla);
  const placarAdversarios = valorNumericoValido(partida?.placarAdversarios);

  return placarSuaDupla !== null
    && placarAdversarios !== null
    && !(placarSuaDupla === 0 && placarAdversarios === 0);
}

function partidaEstaPendentePerfil(partida) {
  const statusAprovacao = Number(partida?.statusAprovacao);
  const statusTexto = normalizarResultadoPerfil(partida?.status);

  return statusAprovacao === STATUS_APROVACAO_PARTIDA.pendente
    || statusAprovacao === STATUS_APROVACAO_PARTIDA.pendenteDeVinculos
    || statusTexto.includes('pendente');
}

function partidaFoiVitoriaPerfil(partida) {
  const resultado = normalizarResultadoPerfil(partida?.resultado);
  return resultado === 'w'
    || resultado === 'v'
    || resultado.includes('vitoria');
}

function partidaFoiDerrotaPerfil(partida) {
  const resultado = normalizarResultadoPerfil(partida?.resultado);
  return resultado === 'd'
    || resultado.includes('derrota');
}

function partidaFoiEmpatePerfil(partida) {
  const resultado = normalizarResultadoPerfil(partida?.resultado);
  const placarSuaDupla = valorNumericoValido(partida?.placarSuaDupla);
  const placarAdversarios = valorNumericoValido(partida?.placarAdversarios);

  return resultado.includes('empate')
    || (
      placarSuaDupla !== null
      && placarAdversarios !== null
      && placarSuaDupla === placarAdversarios
    );
}

function obterResultadoVisualPerfil(partida) {
  const pendente = partidaEstaPendentePerfil(partida);

  if (partidaFoiEmpatePerfil(partida)) {
    return {
      tipo: 'empate',
      classe: 'empate',
      texto: 'Empate',
      icone: FaCheckCircle,
      venceu: false,
      pendente: false
    };
  }

  if (pendente) {
    return {
      tipo: 'pendente',
      classe: 'pendente',
      texto: partidaFoiVitoriaPerfil(partida) ? 'Vitória pendente' : 'Pendente',
      icone: FaHourglassHalf,
      venceu: partidaFoiVitoriaPerfil(partida),
      pendente: true
    };
  }

  if (partidaFoiVitoriaPerfil(partida)) {
    return {
      tipo: 'vitoria',
      classe: 'vitoria',
      texto: 'Vitória',
      icone: FaTrophy,
      venceu: true,
      pendente: false
    };
  }

  if (partidaFoiDerrotaPerfil(partida)) {
    return {
      tipo: 'derrota',
      classe: 'derrota',
      texto: 'Derrota',
      icone: FaTimesCircle,
      venceu: false,
      pendente: false
    };
  }

  return {
    tipo: 'pendente',
    classe: 'pendente',
    texto: 'Pendente',
    icone: FaHourglassHalf,
    venceu: false,
    pendente: true
  };
}

function obterPontosPartidaPerfil(partida, resultadoVisual) {
  const pontosApi = [
    partida?.pontosQN,
    partida?.pontosQn,
    partida?.pontos,
    partida?.pontuacao,
    partida?.pontosObtidos,
    partida?.pontosGanhos
  ].map(valorNumericoValido).find((valor) => valor !== null);

  if (pontosApi !== undefined) {
    return pontosApi;
  }

  return resultadoVisual.venceu ? 3 : 0;
}

function separarNomesDuplaPerfil(valor) {
  return normalizarTextoPerfil(valor)
    .split(/\s*(?:\/|\+|•|&|,|\be\b)\s*/i)
    .map(normalizarTextoPerfil)
    .filter(Boolean)
    .slice(0, 2);
}

function criarAtletaHistoricoPerfil(item, fallback = 'Atleta') {
  if (typeof item === 'string') {
    return {
      nome: normalizarTextoPerfil(item) || fallback,
      fotoPerfilUrl: ''
    };
  }

  const nome = obterNomeExibicaoAtletaPerfil(item)
    || normalizarTextoPerfil(item?.nome)
    || normalizarTextoPerfil(item?.nomeAtleta)
    || fallback;

  return {
    nome,
    fotoPerfilUrl: obterFotoPerfilAvatar(item)
  };
}

function obterDuplasHistoricoPerfil(partida, atletaLogadoId, atletaLogado) {
  const atletaBase = {
    nome: atletaLogado.nome,
    fotoPerfilUrl: atletaLogado.fotoPerfilUrl
  };

  if (
    atletaLogadoId
    && (atletaEstaNaDuplaA(partida, atletaLogadoId) || atletaEstaNaDuplaB(partida, atletaLogadoId))
  ) {
    const { minhaDupla, duplaAdversaria } = obterDuplasDoAtleta(partida, atletaLogadoId);
    const atletaNaPartida = minhaDupla.find((atleta) => atleta.destaque);
    const parceiro = minhaDupla.find((atleta) => !atleta.destaque);

    return {
      minhaDupla: [
        {
          ...criarAtletaHistoricoPerfil(atletaNaPartida, atletaBase.nome),
          fotoPerfilUrl: atletaBase.fotoPerfilUrl || obterFotoPerfilAvatar(atletaNaPartida)
        },
        criarAtletaHistoricoPerfil(parceiro, partida?.parceiro || 'Parceiro')
      ],
      adversarios: duplaAdversaria.map((atleta, indice) => (
        criarAtletaHistoricoPerfil(atleta, indice === 0 ? 'Adversário' : 'Parceiro')
      ))
    };
  }

  const adversarios = separarNomesDuplaPerfil(partida?.adversarios);

  return {
    minhaDupla: [
      atletaBase,
      criarAtletaHistoricoPerfil(partida?.parceiro, 'Parceiro')
    ],
    adversarios: [
      criarAtletaHistoricoPerfil(adversarios[0], 'Adversário'),
      criarAtletaHistoricoPerfil(adversarios[1], 'Parceiro')
    ]
  };
}

function obterContextoPartidaPerfil(partida) {
  const grupo = normalizarTextoPerfil(partida?.grupo || partida?.grupoNome);

  if (!grupo || ehNomeGrupoGeralPartida(grupo)) {
    return {
      texto: ROTULO_RANKING_GERAL,
      icone: FaGlobeAmericas
    };
  }

  return {
    texto: grupo,
    icone: FaMapMarkerAlt
  };
}

function obterStatusRodapePerfil(partida) {
  const statusAprovacao = Number(partida?.statusAprovacao);

  if (statusAprovacao === STATUS_APROVACAO_PARTIDA.aprovada) {
    return {
      texto: 'Confirmada',
      classe: 'confirmada',
      icone: FaCheckCircle
    };
  }

  if (statusAprovacao === STATUS_APROVACAO_PARTIDA.pendenteDeVinculos) {
    return {
      texto: 'Aguardando adversário',
      classe: 'adversario',
      icone: FaUsers
    };
  }

  return {
    texto: 'Aguardando confirmação',
    classe: 'pendente',
    icone: FaHourglassHalf
  };
}

function obterDataMaximaNascimento() {
  return new Date().toISOString().slice(0, 10);
}

function validarDataNascimento(dataNascimento) {
  if (!dataNascimento) {
    return null;
  }

  const dataNormalizada = dataNascimento.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNormalizada)) {
    return 'Informe uma data de nascimento válida.';
  }

  const [ano, mes, dia] = dataNormalizada.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const dataValida =
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia;

  if (!dataValida) {
    return 'Informe uma data de nascimento válida.';
  }

  if (dataNormalizada < dataMinimaNascimento) {
    return 'Data de nascimento inválida.';
  }

  if (dataNormalizada > obterDataMaximaNascimento()) {
    return 'Data de nascimento não pode ser futura.';
  }

  return null;
}

function criarEstadoInicialAtleta(usuario) {
  return {
    ...estadoInicialAtleta,
    nome: usuario?.nome || '',
    email: usuario?.email || ''
  };
}

function obterRotuloOpcao(opcoes, valor, fallback = 'Não informado') {
  const opcao = opcoes.find((item) => String(item.valor) === String(valor));
  return opcao?.rotulo || fallback;
}

function obterMensagemErroPerfil(error) {
  const mensagem = extrairMensagemErro(error);
  if (mensagem === mensagemErroAcessoOrganizador) {
    return 'Não foi possível atualizar o atleta vinculado por este perfil.';
  }

  return mensagem;
}

function criarResumoAtleta(atleta) {
  if (!atleta) {
    return null;
  }

  return {
    id: atleta.id,
    nome: atleta.nome,
    apelido: atleta.apelido,
    telefone: formatarTelefoneParaInput(atleta.telefone),
    email: atleta.email,
    instagram: atleta.instagram,
    cpf: formatarCpfParaInput(atleta.cpf),
    cadastroPendente: Boolean(atleta.cadastroPendente),
    bairro: atleta.bairro,
    cidade: atleta.cidade,
    estado: atleta.estado,
    nivel: atleta.nivel,
    sexo: atleta.sexo
  };
}

function obterNomeCompletoMeuPerfil(atleta, usuarioBase, perfilUsuario) {
  if (Number(perfilUsuario) === PERFIS_USUARIO.atleta) {
    return atleta?.nome || usuarioBase?.nome || '';
  }

  return atleta?.nome || '';
}

function obterRotuloNivel(valor) {
  const opcao = opcoesNivelAtleta.find((item) => String(item.valor) === String(valor));
  return opcao?.rotulo || 'Nível a definir';
}

function obterRotuloLado(valor) {
  const lados = {
    1: 'Direito',
    2: 'Esquerdo',
    3: 'Ambos'
  };

  return lados[String(valor)] || 'Ambos';
}

function criarEstadoMedidas(medidas) {
  return {
    camiseta: medidas?.camiseta || '',
    regata: medidas?.regata || '',
    short: medidas?.short || '',
    sunga: medidas?.sunga || '',
    top: medidas?.top || '',
    biquini: medidas?.biquini || ''
  };
}

function normalizarMedidasParaSexo(medidas, sexo) {
  return {
    camiseta: medidas.camiseta || null,
    regata: medidas.regata || null,
    short: medidas.short || null,
    sunga: Number(sexo) === 1 ? (medidas.sunga || null) : null,
    top: Number(sexo) === 2 ? (medidas.top || null) : null,
    biquini: Number(sexo) === 2 ? (medidas.biquini || null) : null
  };
}

function normalizarValorMedida(valor) {
  return String(valor || '').trim();
}

function normalizarMedidasParaComparacao(medidas, sexo) {
  const medidasNormalizadas = normalizarMedidasParaSexo(medidas || estadoInicialMedidas, sexo);

  return camposMedidas.reduce((resultado, campo) => ({
    ...resultado,
    [campo]: normalizarValorMedida(medidasNormalizadas[campo])
  }), {});
}

function medidasSaoIguais(medidasAtuais, medidasSalvas, sexo) {
  const atuais = normalizarMedidasParaComparacao(medidasAtuais, sexo);
  const salvas = normalizarMedidasParaComparacao(medidasSalvas, sexo);

  return camposMedidas.every((campo) => atuais[campo] === salvas[campo]);
}

function obterLocalizacaoCompacta(atleta) {
  const partes = [atleta.estado, atleta.cidade, atleta.bairro]
    .map((valor) => String(valor || '').trim())
    .filter(Boolean);

  return partes.length ? partes.join(' • ') : 'Localização a definir';
}

function obterStatusPerfil(usuarioDetalhe, formularioAtleta) {
  if (!usuarioDetalhe?.atletaId) {
    return { rotulo: 'Sem conta esportiva', classe: 'sem-conta' };
  }

  if (formularioAtleta.cadastroPendente) {
    return { rotulo: 'Pendente', classe: 'pendente' };
  }

  return { rotulo: 'Ativo', classe: 'ativo' };
}

function obterMediaPontos(resumo) {
  if (!resumo?.totalPartidas) {
    return '0.0';
  }

  return (Number(resumo.saldoPontos || 0) / Number(resumo.totalPartidas)).toFixed(1);
}

function obterMelhorSequencia(evolucao) {
  if (!Array.isArray(evolucao) || !evolucao.length) {
    return 0;
  }

  return evolucao.reduce((melhor, item) => Math.max(melhor, Number(item.vitorias || 0)), 0);
}

function CampoEdicao({ label, children, largo = false }) {
  return (
    <label className={largo ? 'perfil-campo-edicao perfil-campo-largo' : 'perfil-campo-edicao'}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function InfoItem({ rotulo, valor, icone: Icone }) {
  return (
    <article className="perfil-info-item">
      {Icone && <Icone aria-hidden="true" />}
      <div>
        <span>{rotulo}</span>
        <strong>{valor || 'Não informado'}</strong>
      </div>
    </article>
  );
}

function HistoricoPartidaPerfilCard({
  partida,
  atletaLogadoId,
  nomeAtleta,
  fotoAtleta,
  onAbrir
}) {
  const resultadoVisual = obterResultadoVisualPerfil(partida);
  const ResultadoIcone = resultadoVisual.icone;
  const contexto = obterContextoPartidaPerfil(partida);
  const ContextoIcone = contexto.icone;
  const statusRodape = obterStatusRodapePerfil(partida);
  const StatusIcone = statusRodape.icone;
  const pontos = obterPontosPartidaPerfil(partida, resultadoVisual);
  const pontosTexto = pontos > 0 ? `+${pontos}` : `${pontos}`;
  const temPlacar = partidaTemPlacarPerfil(partida);
  const placarSuaDupla = valorNumericoValido(partida?.placarSuaDupla) ?? 0;
  const placarAdversarios = valorNumericoValido(partida?.placarAdversarios) ?? 0;
  const duplas = obterDuplasHistoricoPerfil(partida, atletaLogadoId, {
    nome: nomeAtleta,
    fotoPerfilUrl: fotoAtleta
  });
  const atletaPrincipal = duplas.minhaDupla[0];
  const parceiro = duplas.minhaDupla[1];
  const adversarioPrincipal = duplas.adversarios[0];
  const adversarioParceiro = duplas.adversarios[1];
  const classePlacarVencedor = resultadoVisual.tipo === 'derrota' ? 'derrota' : 'vitoria';
  const dataTexto = partida?.dataPartida ? formatarData(partida.dataPartida) : 'Data a definir';
  const horaTexto = partida?.dataPartida ? formatarHora(partida.dataPartida) : '';

  return (
    <button
      type="button"
      className={`perfil-partida-item perfil-partida-card ${resultadoVisual.classe}`}
      onClick={onAbrir}
      aria-label={`Abrir detalhes da partida: ${resultadoVisual.texto}`}
    >
      <span className="perfil-partida-borda" aria-hidden="true" />

      <span className="perfil-partida-topo">
        <span className="perfil-partida-contexto">
          <ContextoIcone aria-hidden="true" />
          <span>{contexto.texto}</span>
        </span>

        <time dateTime={partida?.dataPartida || undefined}>
          {dataTexto}{horaTexto && ` • ${horaTexto}`}
        </time>
      </span>

      <span className="perfil-partida-status-linha">
        <span className={`perfil-partida-badge-resultado ${resultadoVisual.classe}`}>
          <ResultadoIcone aria-hidden="true" />
          <span>{resultadoVisual.texto}</span>
        </span>

        <span className={`perfil-partida-pontos ${pontos > 0 ? 'positivo' : 'neutro'}`}>
          <strong>{pontosTexto}</strong>
          <small>QN</small>
        </span>
      </span>

      <span className="perfil-partida-confronto">
        <span className="perfil-partida-dupla minha">
          <span className="perfil-partida-atleta">
            <AvatarUsuario
              nome={atletaPrincipal.nome}
              fotoPerfilUrl={atletaPrincipal.fotoPerfilUrl}
              tamanho="sm"
              alt=""
            />
            <span>
              <strong>{atletaPrincipal.nome}</strong>
              <small>{parceiro.nome}</small>
            </span>
          </span>
        </span>

        <span className="perfil-partida-centro">
          <span className="perfil-partida-vs">VS</span>
          {temPlacar ? (
            <strong className="perfil-partida-placar" aria-label={`Placar ${placarSuaDupla} x ${placarAdversarios}`}>
              <span className={resultadoVisual.venceu ? `vencedor ${classePlacarVencedor}` : ''}>
                {placarSuaDupla}
              </span>
              <em>x</em>
              <span className={resultadoVisual.tipo === 'derrota' ? `vencedor ${classePlacarVencedor}` : ''}>
                {placarAdversarios}
              </span>
            </strong>
          ) : (
            <span className="perfil-partida-sem-placar">Sem placar</span>
          )}
        </span>

        <span className="perfil-partida-dupla adversaria">
          <span className="perfil-partida-atleta">
            <AvatarUsuario
              nome={adversarioPrincipal.nome}
              fotoPerfilUrl={adversarioPrincipal.fotoPerfilUrl}
              tamanho="sm"
              alt=""
            />
            <span>
              <strong>{adversarioPrincipal.nome}</strong>
              <small>{adversarioParceiro.nome}</small>
            </span>
          </span>
        </span>
      </span>

      <span className="perfil-partida-rodape">
        <span className={`perfil-partida-confirmacao ${statusRodape.classe}`}>
          <StatusIcone aria-hidden="true" />
          <span>{statusRodape.texto}</span>
        </span>

        <span className="perfil-partida-detalhes">
          <span>Ver detalhes</span>
          <FaArrowRight aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

export function PaginaMeuPerfil() {
  const {
    usuario,
    atualizarUsuarioLocal,
    recarregarUsuario,
    criarSenha,
    concluirPrimeiroAcesso,
    sair,
    primeiroAcessoPendente,
    estadoAcesso
  } = useAutenticacao();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification, closeNotification } = useNotification();
  const [usuarioDetalhe, setUsuarioDetalhe] = useState(null);
  const [formularioUsuario, setFormularioUsuario] = useState({ nome: '' });
  const [formularioAtleta, setFormularioAtleta] = useState(estadoInicialAtleta);
  const [formularioMedidas, setFormularioMedidas] = useState(estadoInicialMedidas);
  const [medidasSalvas, setMedidasSalvas] = useState(estadoInicialMedidas);
  const [dashboardAtleta, setDashboardAtleta] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [salvandoAtleta, setSalvandoAtleta] = useState(false);
  const [salvandoMedidas, setSalvandoMedidas] = useState(false);
  const [salvandoPrivacidade, setSalvandoPrivacidade] = useState(false);
  const [salvandoSenhaConta, setSalvandoSenhaConta] = useState(false);
  const [senhaConta, setSenhaConta] = useState('');
  const [confirmacaoSenhaConta, setConfirmacaoSenhaConta] = useState('');
  const [excluindoPerfil, setExcluindoPerfil] = useState(false);
  const [preferenciasPrivacidade, setPreferenciasPrivacidade] = useState(preferenciasPrivacidadeIniciais);
  const [cidadesEstado, setCidadesEstado] = useState([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [arenasPerfil, setArenasPerfil] = useState([]);
  const [termoArenaPerfil, setTermoArenaPerfil] = useState('');
  const [carregandoArenasPerfil, setCarregandoArenasPerfil] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const emailUsuarioPerfil = usuarioDetalhe?.email || usuario?.email || '';

  useEffect(() => {
    carregarPerfil();
  }, [usuario?.id]);

  useEffect(() => {
    const abaUrl = searchParams.get('aba');
    if (abasPerfil.some((aba) => aba.id === abaUrl)) {
      setAbaAtiva(abaUrl);
    }

    if (abaUrl === 'perfil' && searchParams.get('editar') === '1') {
      setEditandoPerfil(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!formularioAtleta.estado) {
      setCidadesEstado([]);
      return;
    }

    let ativo = true;
    setCarregandoCidades(true);

    buscarCidadesPorEstado(formularioAtleta.estado)
      .then((cidades) => {
        if (ativo) {
          setCidadesEstado(cidades);
        }
      })
      .catch(() => {
        if (ativo) {
          setCidadesEstado([]);
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregandoCidades(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [formularioAtleta.estado]);

  useEffect(() => {
    const termo = termoArenaPerfil.trim();
    if (termo.length < 2) {
      setArenasPerfil([]);
      return;
    }

    let ativo = true;
    setCarregandoArenasPerfil(true);

    arenaService.listarArenas({ termoBusca: termo })
      .then((lista) => {
        if (ativo) {
          setArenasPerfil(Array.isArray(lista) ? lista.slice(0, 8) : []);
        }
      })
      .catch(() => {
        if (ativo) {
          setArenasPerfil([]);
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregandoArenasPerfil(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [termoArenaPerfil]);

  useEffect(() => {
    setFormularioMedidas((anterior) => normalizarMedidasParaSexo(anterior, formularioAtleta.sexo));
  }, [formularioAtleta.sexo]);

  async function carregarPerfil() {
    setCarregando(true);
    setErro('');
    setMensagem('');
    setDashboardAtleta(null);

    try {
      if (!usuario) {
        setUsuarioDetalhe(null);
        setFormularioAtleta(estadoInicialAtleta);
        setFormularioMedidas(estadoInicialMedidas);
        setMedidasSalvas(estadoInicialMedidas);
        return;
      }

      const dadosUsuario = await recarregarUsuario();
      setFormularioUsuario({ nome: dadosUsuario.nome || '' });

      let proximoUsuarioDetalhe = dadosUsuario;

      if (dadosUsuario.atletaId) {
        const atleta = await atletasServico.obterMeu();
        if (atleta) {
          const medidasAtleta = criarEstadoMedidas(atleta.medidas);
          preencherFormularioAtleta(atleta, dadosUsuario);
          setFormularioMedidas(medidasAtleta);
          setMedidasSalvas(medidasAtleta);
          proximoUsuarioDetalhe = {
            ...dadosUsuario,
            atleta: criarResumoAtleta(atleta)
          };
        } else {
          proximoUsuarioDetalhe = {
            ...dadosUsuario,
            atletaId: null,
            atleta: null
          };

          atualizarUsuarioLocal(proximoUsuarioDetalhe);
          setFormularioAtleta(criarEstadoInicialAtleta(dadosUsuario));
          setFormularioMedidas(estadoInicialMedidas);
          setMedidasSalvas(estadoInicialMedidas);
          setErro('Atleta vinculado não encontrado. Você pode criar novamente seu atleta pelo perfil.');
        }
      } else {
        setFormularioAtleta(criarEstadoInicialAtleta(dadosUsuario));
        setFormularioMedidas(estadoInicialMedidas);
        setMedidasSalvas(estadoInicialMedidas);
      }

      setUsuarioDetalhe(proximoUsuarioDetalhe);
      setEditandoPerfil(false);

      try {
        const preferencias = await privacidadeServico.obterMinhasPreferencias();
        setPreferenciasPrivacidade({
          ...preferenciasPrivacidadeIniciais,
          ...preferencias
        });
      } catch {
        setPreferenciasPrivacidade(preferenciasPrivacidadeIniciais);
      }

      if (proximoUsuarioDetalhe.atletaId) {
        try {
          const dashboard = await dashboardServico.obterDashboardAtleta();
          setDashboardAtleta(dashboard);
        } catch {
          setDashboardAtleta(null);
        }
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
      showNotification({
        type: 'error',
        title: 'Erro ao carregar perfil',
        message: extrairMensagemErro(error)
      });
    } finally {
      setCarregando(false);
    }
  }

  function preencherFormularioAtleta(atleta, usuarioBaseForcado) {
    const usuarioBase = usuarioBaseForcado || usuarioDetalhe || usuario;
    const perfilUsuario = usuarioBase?.perfil;

    setFormularioAtleta({
      nome: obterNomeCompletoMeuPerfil(atleta, usuarioBase, perfilUsuario),
      apelido: atleta.apelido || '',
      telefone: formatarTelefoneParaInput(atleta.telefone),
      email: emailUsuarioPerfil || usuarioBase?.email || '',
      instagram: atleta.instagram || '',
      cpf: formatarCpfParaInput(atleta.cpf),
      bairro: atleta.bairro || '',
      cidade: atleta.cidade || '',
      estado: normalizarEstadoParaUf(atleta.estado || ''),
      cadastroPendente: Boolean(atleta.cadastroPendente),
      sexo: atleta.sexo ? String(atleta.sexo) : '',
      nivel: atleta.nivel ? String(atleta.nivel) : '',
      lado: String(atleta.lado || 3),
      dataNascimento: paraInputData(atleta.dataNascimento),
      peDominante: atleta.peDominante ? String(atleta.peDominante) : '',
      tempoPratica: atleta.tempoPratica ? String(atleta.tempoPratica) : '',
      arenaPrincipalId: atleta.arenaPrincipalId || '',
      arenaPrincipalNome: atleta.arenaPrincipalNome || '',
      objetivoAtual: atleta.objetivoAtual ? String(atleta.objetivoAtual) : ''
    });
    setTermoArenaPerfil(atleta.arenaPrincipalNome || '');
  }

  function atualizarCampoAtleta(campo, valor) {
    if (campo === 'telefone') {
      setFormularioAtleta((anterior) => ({ ...anterior, telefone: formatarTelefoneParaInput(valor) }));
      return;
    }

    if (campo === 'cpf') {
      setFormularioAtleta((anterior) => ({ ...anterior, cpf: formatarCpfParaInput(valor) }));
      return;
    }

    if (campo === 'estado') {
      setFormularioAtleta((anterior) => ({
        ...anterior,
        estado: valor,
        cidade: valor === anterior.estado ? anterior.cidade : ''
      }));
      return;
    }

    setFormularioAtleta((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function atualizarBuscaArenaPrincipal(valor) {
    setTermoArenaPerfil(valor);
    setFormularioAtleta((anterior) => ({
      ...anterior,
      arenaPrincipalNome: valor,
      arenaPrincipalId: valor === anterior.arenaPrincipalNome ? anterior.arenaPrincipalId : ''
    }));
  }

  function selecionarArenaPrincipal(arena) {
    setTermoArenaPerfil(arena?.nome || '');
    setFormularioAtleta((anterior) => ({
      ...anterior,
      arenaPrincipalId: arena?.id || '',
      arenaPrincipalNome: arena?.nome || ''
    }));
    setArenasPerfil([]);
  }

  function limparArenaPrincipal() {
    setTermoArenaPerfil('');
    setArenasPerfil([]);
    setFormularioAtleta((anterior) => ({
      ...anterior,
      arenaPrincipalId: '',
      arenaPrincipalNome: ''
    }));
  }

  function atualizarCampoMedida(campo, valor) {
    setFormularioMedidas((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  }

  async function salvarUsuario(evento) {
    evento.preventDefault();

    if (Number(usuarioDetalhe?.perfil || usuario?.perfil) !== PERFIS_USUARIO.administrador) {
      return;
    }

    setSalvandoUsuario(true);
    setErro('');
    setMensagem('');

    try {
      const usuarioAtualizado = await usuariosServico.atualizarMeu({
        nome: formularioUsuario.nome
      });

      setUsuarioDetalhe((anterior) => ({
        ...(anterior || usuarioAtualizado),
        ...usuarioAtualizado,
        atleta: anterior?.atleta || usuarioAtualizado.atleta || null
      }));
      atualizarUsuarioLocal(usuarioAtualizado);

      if (primeiroAcessoPendente) {
        concluirPrimeiroAcesso();
      }

      showNotification({
        type: 'success',
        title: 'Acesso atualizado',
        message: 'Dados do acesso atualizados com sucesso.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao salvar acesso',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvandoUsuario(false);
    }
  }

  function finalizarPrimeiroAcesso() {
    concluirPrimeiroAcesso();
    setMensagem('Primeiro acesso concluído com sucesso.');
    setErro('');
  }

  async function salvarSenhaConta(evento) {
    evento.preventDefault();
    setErro('');
    setMensagem('');

    if (!senhaConta.trim()) {
      setErro('Informe uma senha.');
      return;
    }

    if (senhaConta !== confirmacaoSenhaConta) {
      setErro('Senha e confirmação devem ser iguais.');
      return;
    }

    setSalvandoSenhaConta(true);
    try {
      await criarSenha({
        senha: senhaConta,
        confirmacaoSenha: confirmacaoSenhaConta
      });
      const usuarioAtual = await recarregarUsuario();
      setUsuarioDetalhe((anterior) => ({
        ...(anterior || usuarioAtual),
        ...usuarioAtual,
        atleta: anterior?.atleta || usuarioAtual.atleta || null
      }));
      setSenhaConta('');
      setConfirmacaoSenhaConta('');
      showNotification({
        type: 'success',
        title: 'Senha criada',
        message: 'Senha criada com sucesso.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Não foi possível criar a senha',
        message: extrairMensagemErro(error)
      });
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvandoSenhaConta(false);
    }
  }

  async function salvarAtleta(evento) {
    evento?.preventDefault();
    const cpfLimpo = limparCpf(formularioAtleta.cpf);
    if (cpfLimpo && !validarCpf(cpfLimpo)) {
      showNotification({
        type: 'warning',
        title: 'CPF inválido',
        message: 'Informe um CPF válido para continuar.'
      });
      return;
    }

    const erroDataNascimento = validarDataNascimento(formularioAtleta.dataNascimento);
    if (erroDataNascimento) {
      showNotification({
        type: 'warning',
        title: 'Data inválida',
        message: erroDataNascimento
      });
      return;
    }

    if (!formularioAtleta.peDominante || !formularioAtleta.tempoPratica || !formularioAtleta.objetivoAtual) {
      showNotification({
        type: 'warning',
        title: 'Perfil esportivo incompleto',
        message: 'Informe pé dominante, tempo de prática e objetivo atual.'
      });
      return;
    }

    if (formularioAtleta.arenaPrincipalNome && !formularioAtleta.arenaPrincipalId) {
      showNotification({
        type: 'warning',
        title: 'Arena principal inválida',
        message: 'Selecione uma arena cadastrada ou limpe o campo.'
      });
      return;
    }

    setSalvandoAtleta(true);
    setErro('');
    setMensagem('');

    const dados = {
      nome: formularioAtleta.nome,
      apelido: formularioAtleta.apelido.trim() || null,
      telefone: limparTelefone(formularioAtleta.telefone) || null,
      email: emailUsuarioPerfil || null,
      instagram: formularioAtleta.instagram.trim() || null,
      cpf: cpfLimpo || null,
      bairro: formularioAtleta.bairro.trim() || null,
      cidade: formularioAtleta.cidade.trim() || null,
      estado: normalizarEstadoParaUf(formularioAtleta.estado.trim()) || null,
      cadastroPendente: Boolean(formularioAtleta.cadastroPendente),
      sexo: formularioAtleta.sexo ? Number(formularioAtleta.sexo) : null,
      nivel: formularioAtleta.nivel ? Number(formularioAtleta.nivel) : null,
      lado: Number(formularioAtleta.lado),
      dataNascimento: normalizarDataParaApi(formularioAtleta.dataNascimento),
      peDominante: Number(formularioAtleta.peDominante),
      tempoPratica: Number(formularioAtleta.tempoPratica),
      arenaPrincipalId: formularioAtleta.arenaPrincipalId || null,
      objetivoAtual: Number(formularioAtleta.objetivoAtual)
    };

    try {
      if (emailUsuarioPerfil) {
        const disponibilidade = await atletasServico.verificarEmail(emailUsuarioPerfil, usuarioDetalhe?.atletaId || null);
        if (!disponibilidade.disponivel) {
          const mensagem = disponibilidade.mensagem || 'Já existe um atleta cadastrado com este e-mail.';
          setErro(mensagem);
          showNotification({
            type: 'error',
            title: 'Erro ao salvar atleta',
            message: mensagem
          });
          return;
        }
      }

      const atletaResposta = await atletasServico.salvarMeu(dados);
      const atleta = {
        ...atletaResposta,
        arenaPrincipalNome: atletaResposta.arenaPrincipalNome || formularioAtleta.arenaPrincipalNome
      };
      const possuiAtletaAnterior = Boolean(usuarioDetalhe?.atletaId);
      const usuarioAtualEhAtleta = Number(usuarioDetalhe?.perfil || usuario?.perfil) === PERFIS_USUARIO.atleta;
      const proximoUsuario = {
        ...(usuarioDetalhe || usuario),
        nome: usuarioAtualEhAtleta ? atleta.nome : (usuarioDetalhe || usuario)?.nome,
        atletaId: atleta.id,
        atleta: criarResumoAtleta(atleta)
      };

      preencherFormularioAtleta(atleta, proximoUsuario);
      setUsuarioDetalhe(proximoUsuario);
      atualizarUsuarioLocal(proximoUsuario);
      setEditandoPerfil(false);
      rolarParaTopo();

      try {
        const dashboard = await dashboardServico.obterDashboardAtleta();
        setDashboardAtleta(dashboard);
      } catch {
        setDashboardAtleta(null);
      }

      if (primeiroAcessoPendente) {
        concluirPrimeiroAcesso();
      }

      showNotification({
        type: 'success',
        title: possuiAtletaAnterior ? 'Atleta atualizado' : 'Atleta criado',
        message: possuiAtletaAnterior
          ? 'Dados do atleta atualizados com sucesso.'
          : 'Atleta criado com sucesso.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao salvar atleta',
        message: obterMensagemErroPerfil(error)
      });
    } finally {
      setSalvandoAtleta(false);
    }
  }

  async function excluirMeuPerfil() {
    setExcluindoPerfil(true);
    setErro('');
    setMensagem('');

    try {
      await privacidadeServico.solicitarExclusao();
      sair();
      sessionStorage.clear();
      showNotification({
        type: 'success',
        title: 'Conta excluída',
        message: 'Sua conta foi excluída com sucesso.',
        autoClose: false,
        onClose: () => navigate('/login', { replace: true })
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Não foi possível excluir a conta',
        message: extrairMensagemErro(error)
      });
    } finally {
      setExcluindoPerfil(false);
    }
  }

  async function salvarMedidas(evento) {
    evento?.preventDefault();
    if (!medidasAlteradas) {
      return;
    }

    if (!possuiAtleta) {
      showNotification({
        type: 'warning',
        title: 'Atleta não criado',
        message: 'Crie seu atleta antes de informar medidas.'
      });
      return;
    }

    setSalvandoMedidas(true);
    try {
      const payload = normalizarMedidasParaSexo(formularioMedidas, formularioAtleta.sexo);
      const medidas = await atletasServico.salvarMinhasMedidas(payload);
      const proximasMedidas = criarEstadoMedidas(medidas);
      setFormularioMedidas(proximasMedidas);
      setMedidasSalvas(proximasMedidas);
      setUsuarioDetalhe((anterior) => anterior
        ? {
            ...anterior,
            atleta: anterior.atleta
              ? { ...anterior.atleta, medidas: proximasMedidas }
              : anterior.atleta
          }
        : anterior);
      showNotification({
        type: 'success',
        title: 'Medidas salvas',
        message: 'Medidas e uniformes atualizados com sucesso.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao salvar medidas',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvandoMedidas(false);
    }
  }

  function confirmarExclusaoMeuPerfil() {
    showNotification({
      type: 'warning',
      title: 'Excluir minha conta?',
      message: 'Essa ação vai desativar sua conta, remover seus dados pessoais e encerrar seu acesso à plataforma. Partidas e históricos compartilhados serão mantidos para preservar os dados dos outros atletas.',
      autoClose: false,
      actions: (
        <>
          <button type="button" className="botao-secundario" onClick={closeNotification}>
            Cancelar
          </button>
          <button
            type="button"
            className="botao-perigo"
            onClick={() => {
              closeNotification();
              excluirMeuPerfil();
            }}
          >
            Sim, excluir minha conta
          </button>
        </>
      )
    });
  }

  function sairDoPerfil() {
    sair();
    navigate('/login', { replace: true });
  }

  function atualizarAplicativo() {
    window.location.reload();
  }

  function atualizarFotoPerfilLocal(fotoPerfilUrlAtualizada) {
    const proximoUsuario = {
      ...(usuarioDetalhe || usuario),
      fotoPerfilUrl: fotoPerfilUrlAtualizada
    };

    setUsuarioDetalhe(proximoUsuario);
    atualizarUsuarioLocal(proximoUsuario);
    setPreferenciasPrivacidade((anterior) => ({
      ...anterior,
      possuiFotoPerfil: true
    }));
  }

  function atualizarPreferenciaPrivacidade(campo, valor) {
    setPreferenciasPrivacidade((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  }

  async function salvarPreferenciasPrivacidade(evento) {
    evento?.preventDefault();
    setSalvandoPrivacidade(true);

    try {
      const preferenciasAtualizadas = await privacidadeServico.atualizarMinhasPreferencias({
        perfilPublico: preferenciasPrivacidade.perfilPublico,
        exibirEmail: preferenciasPrivacidade.exibirEmail,
        permitirUsoLocalizacao: preferenciasPrivacidade.permitirUsoLocalizacao,
        permitirUsoImagem: preferenciasPrivacidade.permitirUsoImagem
      });

      setPreferenciasPrivacidade({
        ...preferenciasPrivacidadeIniciais,
        ...preferenciasAtualizadas
      });
      const proximoUsuarioDetalhe = {
        ...(usuarioDetalhe || usuario),
        perfilPublico: preferenciasAtualizadas.perfilPublico,
        exibirEmail: preferenciasAtualizadas.exibirEmail,
        permitirUsoLocalizacao: preferenciasAtualizadas.permitirUsoLocalizacao,
        permitirUsoImagem: preferenciasAtualizadas.permitirUsoImagem
      };
      setUsuarioDetalhe(proximoUsuarioDetalhe);
      atualizarUsuarioLocal(proximoUsuarioDetalhe);

      showNotification({
        type: 'success',
        title: 'Privacidade atualizada',
        message: 'Suas preferências foram salvas com sucesso.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao salvar privacidade',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvandoPrivacidade(false);
    }
  }

  const usuarioEhAtleta = Number(usuarioDetalhe?.perfil || usuario?.perfil) === PERFIS_USUARIO.atleta;
  const usuarioEhAdministrador = Number(usuarioDetalhe?.perfil || usuario?.perfil) === PERFIS_USUARIO.administrador;
  const possuiAtleta = Boolean(usuarioDetalhe?.atletaId);
  const medidasAlteradas = !medidasSaoIguais(formularioMedidas, medidasSalvas, formularioAtleta.sexo);
  const statusPerfil = obterStatusPerfil(usuarioDetalhe, formularioAtleta);
  const resumoDashboard = dashboardAtleta?.resumo || {};
  const perfilDashboard = dashboardAtleta?.perfil || {};
  const ultimasPartidas = Array.isArray(dashboardAtleta?.ultimasPartidas) ? dashboardAtleta.ultimasPartidas : [];
  const localizacaoCompacta = obterLocalizacaoCompacta(formularioAtleta);
  const nomePerfil = formularioAtleta.nome || usuarioDetalhe?.nome || usuario?.nome || 'Atleta QNF';
  const fotoPerfilUrl = obterFotoPerfilAvatar(usuarioDetalhe) || obterFotoPerfilAvatar(usuario);
  const apelidoPerfil = formularioAtleta.apelido || perfilDashboard.apelido || 'Apelido a definir';
  const aproveitamento = Number(resumoDashboard.aproveitamento ?? perfilDashboard.aproveitamento ?? 0);
  const melhorSequencia = obterMelhorSequencia(dashboardAtleta?.evolucao);
  const pendenciaCriarSenha = Array.isArray(usuarioDetalhe?.pendenciasConta)
    ? usuarioDetalhe.pendenciasConta.find((pendencia) => pendencia?.tipo === 'CriarSenha')
    : null;
  const deveCriarSenhaConta = Boolean(pendenciaCriarSenha) ||
    usuarioDetalhe?.possuiSenha === false ||
    usuarioDetalhe?.senhaCadastrada === false;

  const metricasHero = useMemo(() => ([
    { rotulo: 'Ranking', valor: perfilDashboard.posicaoRanking ? `#${perfilDashboard.posicaoRanking}` : '-' },
    { rotulo: 'Pontos', valor: resumoDashboard.saldoPontos ?? 0 },
    { rotulo: 'Jogos', valor: resumoDashboard.totalPartidas ?? 0 },
    { rotulo: 'Vitórias', valor: resumoDashboard.vitorias ?? 0 },
    { rotulo: 'Derrotas', valor: resumoDashboard.derrotas ?? 0 }
  ]), [
    perfilDashboard.posicaoRanking,
    resumoDashboard.derrotas,
    resumoDashboard.saldoPontos,
    resumoDashboard.totalPartidas,
    resumoDashboard.vitorias
  ]);

  if (carregando) {
    return (
      <section className="pagina perfil-premium">
        <AppHero
          title="Perfil"
          subtitle="Sua identidade na comunidade."
          badge={`Oi, ${(usuario?.nome || usuario?.nomeCompleto || 'Atleta').split(/\s+/)[0]}.`}
          autenticado={Boolean(usuario)}
          showBackButton
          variant="page"
        />
        <div className="perfil-carregando">
          <span className="perfil-avatar-esqueleto" />
          <p>Carregando seu perfil...</p>
        </div>
      </section>
    );
  }

  const textoBotao = possuiAtleta
    ? 'Salvar perfil'
    : (usuarioEhAtleta ? 'Criar meu atleta' : 'Criar e vincular atleta');

  return (
    <section className="pagina perfil-premium">
      <AppHero
        title="Perfil"
        subtitle="Sua identidade na comunidade."
        badge={[nomePerfil, obterRotuloNivel(formularioAtleta.nivel)].filter(Boolean).join(' • ')}
        autenticado={Boolean(usuarioDetalhe || usuario)}
        showBackButton
        actions={
          <button
            type="button"
            className="botao-secundario botao-compacto"
            onClick={() => {
              setAbaAtiva('perfil');
              setEditandoPerfil(true);
            }}
            aria-label="Editar perfil"
            title="Editar perfil"
          >
            <FaUserEdit aria-hidden="true" />
            <span>Editar</span>
          </button>
        }
        variant="page"
      />

      {primeiroAcessoPendente && !usuarioEhAtleta && (
        <article className="perfil-alerta">
          <div>
            <strong>Primeiro acesso</strong>
            <p>Revise seus dados de acesso. O vínculo com atleta é opcional para este perfil.</p>
          </div>
          <button type="button" className="botao-secundario" onClick={finalizarPrimeiroAcesso}>
            Concluir
          </button>
        </article>
      )}

      {deveCriarSenhaConta && (
        <article className="perfil-alerta perfil-alerta-senha">
          <div>
            <strong>Crie sua senha</strong>
            <p>{pendenciaCriarSenha?.mensagem || 'Crie uma senha para continuar acessando sua conta com segurança.'}</p>
          </div>
          <form className="perfil-alerta-senha-form" onSubmit={salvarSenhaConta}>
            <label>
              <span>Senha</span>
              <input
                type="password"
                autoComplete="new-password"
                value={senhaConta}
                onChange={(evento) => setSenhaConta(evento.target.value)}
                onFocus={scrollFocusedInputIntoView}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </label>
            <label>
              <span>Confirmação</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmacaoSenhaConta}
                onChange={(evento) => setConfirmacaoSenhaConta(evento.target.value)}
                onFocus={scrollFocusedInputIntoView}
                placeholder="Digite novamente"
                required
              />
            </label>
            <button type="submit" className="botao-primario" disabled={salvandoSenhaConta}>
              <FaLock aria-hidden="true" />
              {salvandoSenhaConta ? 'Criando...' : 'Criar senha agora'}
            </button>
          </form>
        </article>
      )}

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}

      <article className="perfil-hero">
        <div className="perfil-hero-topo">
          <FotoPerfilUpload
            fotoPerfilUrl={fotoPerfilUrl}
            nome={nomePerfil}
            onFotoAtualizada={atualizarFotoPerfilLocal}
          />

          <div className="perfil-identidade">
            <span className={`perfil-status ${statusPerfil.classe}`}>
              <span aria-hidden="true" />
              {statusPerfil.rotulo}
            </span>
            <h1>{nomePerfil}</h1>
            <p>{apelidoPerfil}</p>
            <small>
              {nomeEstadoAcesso(estadoAcesso)} • {obterRotuloNivel(formularioAtleta.nivel)}
            </small>
          </div>

        </div>

        <div className="perfil-hero-detalhes">
          <span><FaTrophy aria-hidden="true" /> {obterRotuloLado(formularioAtleta.lado)}</span>
          <span><FaMapMarkerAlt aria-hidden="true" /> {localizacaoCompacta}</span>
          <span><FaFire aria-hidden="true" /> {perfilDashboard.textoSequencia || 'Sequência a iniciar'}</span>
        </div>

        <div className="perfil-mini-metricas">
          {metricasHero.map((metrica) => (
            <div key={metrica.rotulo}>
              <span>{metrica.rotulo}</span>
              <strong>{metrica.valor}</strong>
            </div>
          ))}
        </div>
      </article>

      <nav className="perfil-tabs" aria-label="Seções do perfil">
        {abasPerfil.map((aba) => {
          const Icone = aba.icone;
          return (
            <button
              key={aba.id}
              type="button"
              className={abaAtiva === aba.id ? 'ativo' : ''}
              onClick={() => setAbaAtiva(aba.id)}
            >
              <Icone aria-hidden="true" />
              {aba.rotulo}
            </button>
          );
        })}
      </nav>

      <div className="perfil-conteudo-tab">
        {abaAtiva === 'resumo' && (
          <div className="perfil-tab-fade">
            <div className="perfil-secao-titulo">
              <div>
                <span>Desempenho</span>
                <h2>Resumo esportivo</h2>
              </div>
            </div>

            <div className="perfil-desempenho-grid">
              <InfoItem rotulo="Aproveitamento" valor={`${aproveitamento.toFixed(0)}%`} icone={FaChartLine} />
              <InfoItem rotulo="Sequência atual" valor={`${resumoDashboard.sequenciaAtual ?? 0} vitórias`} icone={FaFire} />
              <InfoItem rotulo="Melhor sequência" valor={`${melhorSequencia} vitórias`} icone={FaTrophy} />
              <InfoItem rotulo="Média de pontos" valor={obterMediaPontos(resumoDashboard)} icone={FaChartLine} />
            </div>

            <div className="perfil-secao-titulo compacto">
              <div>
                <span>Últimas partidas</span>
                <h2>Histórico recente</h2>
              </div>
            </div>

            <div className="perfil-partidas-lista">
              {ultimasPartidas.length === 0 && (
                <article className="perfil-vazio">
                  <strong>Nenhuma partida encontrada</strong>
                  <p>Quando houver jogos registrados, eles aparecem aqui de forma compacta.</p>
                </article>
              )}

              {ultimasPartidas.slice(0, 5).map((partida) => (
                <HistoricoPartidaPerfilCard
                  key={partida.id}
                  partida={partida}
                  atletaLogadoId={perfilDashboard.atletaId}
                  nomeAtleta={apelidoPerfil || nomePerfil}
                  fotoAtleta={fotoPerfilUrl}
                  onAbrir={() => navigate('/partidas')}
                />
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'perfil' && (
          <div className="perfil-tab-fade perfil-perfil-stack">
          <form onSubmit={salvarAtleta}>
            <div className="perfil-secao-titulo">
              <div>
                <span>Dados esportivos</span>
                <h2>Perfil do atleta</h2>
              </div>
              {!editandoPerfil && (
                <button type="button" className="botao-secundario compacto" onClick={() => setEditandoPerfil(true)}>
                  Editar perfil
                </button>
              )}
            </div>

            {!editandoPerfil ? (
              <div className="perfil-info-grid">
                <InfoItem rotulo="Nome completo" valor={formularioAtleta.nome} />
                <InfoItem rotulo="Apelido" valor={formularioAtleta.apelido} />
                <InfoItem rotulo="Nascimento" valor={formularioAtleta.dataNascimento ? formatarData(formularioAtleta.dataNascimento) : ''} />
                <InfoItem rotulo="CPF" valor={formularioAtleta.cpf} />
                <InfoItem rotulo="Sexo/gênero" valor={obterRotuloOpcao(opcoesSexoAtleta, formularioAtleta.sexo)} />
                <InfoItem rotulo="Lado preferido" valor={obterRotuloLado(formularioAtleta.lado)} />
                <InfoItem rotulo="Nível" valor={obterRotuloNivel(formularioAtleta.nivel)} />
              </div>
            ) : (
              <div className="perfil-edicao-grid">
                <CampoEdicao label="Nome completo" largo>
                  <input
                    type="text"
                    autoComplete="name"
                    enterKeyHint="next"
                    value={formularioAtleta.nome}
                    onChange={(evento) => atualizarCampoAtleta('nome', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                    required
                  />
                </CampoEdicao>

                <CampoEdicao label="Apelido">
                  <input
                    type="text"
                    autoComplete="nickname"
                    enterKeyHint="next"
                    value={formularioAtleta.apelido}
                    onChange={(evento) => atualizarCampoAtleta('apelido', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  />
                </CampoEdicao>

                <CampoEdicao label="Nascimento">
                  <input
                    type="date"
                    enterKeyHint="next"
                    value={formularioAtleta.dataNascimento}
                    onChange={(evento) => atualizarCampoAtleta('dataNascimento', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                    min={dataMinimaNascimento}
                    max={obterDataMaximaNascimento()}
                  />
                </CampoEdicao>

                <CampoEdicao label="CPF">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    enterKeyHint="next"
                    value={formularioAtleta.cpf}
                    onChange={(evento) => atualizarCampoAtleta('cpf', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  />
                </CampoEdicao>

                <CampoEdicao label="Sexo/gênero">
                  <select
                    value={formularioAtleta.sexo}
                    onChange={(evento) => atualizarCampoAtleta('sexo', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  >
                    <option value="">Selecione</option>
                    {opcoesSexoAtleta.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </select>
                </CampoEdicao>

                <CampoEdicao label="Lado">
                  <select
                    value={formularioAtleta.lado}
                    onChange={(evento) => atualizarCampoAtleta('lado', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  >
                    <option value="1">Direito</option>
                    <option value="2">Esquerdo</option>
                    <option value="3">Ambos</option>
                  </select>
                </CampoEdicao>

                <CampoEdicao label="Nível">
                  <select
                    value={formularioAtleta.nivel}
                    onChange={(evento) => atualizarCampoAtleta('nivel', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  >
                    <option value="">Selecione</option>
                    {opcoesNivelAtleta.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </select>
                </CampoEdicao>

                <div className="perfil-acoes-edicao perfil-campo-largo">
                  <button type="submit" className="botao-primario" disabled={salvandoAtleta}>
                    {salvandoAtleta ? 'Salvando...' : textoBotao}
                  </button>
                  {possuiAtleta && (
                    <button type="button" className="botao-secundario" onClick={() => setEditandoPerfil(false)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="perfil-subsecao">
              <div className="perfil-secao-titulo">
                <div>
                  <span>Perfil Esportivo</span>
                  <h2>Preferências de jogo</h2>
                </div>
              </div>

              {!editandoPerfil ? (
                <div className="perfil-info-grid">
                  <InfoItem rotulo="Pé dominante" valor={obterRotuloOpcao(opcoesPeDominante, formularioAtleta.peDominante)} />
                  <InfoItem rotulo="Tempo de prática" valor={obterRotuloOpcao(opcoesTempoPratica, formularioAtleta.tempoPratica)} />
                  <InfoItem rotulo="Arena principal" valor={formularioAtleta.arenaPrincipalNome} />
                  <InfoItem rotulo="Objetivo atual" valor={obterRotuloOpcao(opcoesObjetivoAtual, formularioAtleta.objetivoAtual)} />
                </div>
              ) : (
                <div className="perfil-edicao-grid">
                  <CampoEdicao label="Pé dominante">
                    <select
                      value={formularioAtleta.peDominante}
                      onChange={(evento) => atualizarCampoAtleta('peDominante', evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                      required
                    >
                      <option value="">Selecione</option>
                      {opcoesPeDominante.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo}
                        </option>
                      ))}
                    </select>
                  </CampoEdicao>

                  <CampoEdicao label="Tempo de prática">
                    <select
                      value={formularioAtleta.tempoPratica}
                      onChange={(evento) => atualizarCampoAtleta('tempoPratica', evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                      required
                    >
                      <option value="">Selecione</option>
                      {opcoesTempoPratica.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo}
                        </option>
                      ))}
                    </select>
                  </CampoEdicao>

                  <CampoEdicao label="Arena principal" largo>
                    <div className="perfil-autocomplete">
                      <input
                        type="text"
                        value={termoArenaPerfil}
                        onChange={(evento) => atualizarBuscaArenaPrincipal(evento.target.value)}
                        onFocus={scrollFocusedInputIntoView}
                        autoComplete="off"
                        placeholder="Busque uma arena cadastrada"
                      />
                      {formularioAtleta.arenaPrincipalId && (
                        <button type="button" className="botao-secundario compacto" onClick={limparArenaPrincipal}>
                          Limpar
                        </button>
                      )}
                    </div>
                    {carregandoArenasPerfil && <small>Buscando arenas...</small>}
                    {!formularioAtleta.arenaPrincipalId && arenasPerfil.length > 0 && (
                      <div className="perfil-autocomplete-lista">
                        {arenasPerfil.map((arena) => (
                          <button key={arena.id} type="button" onClick={() => selecionarArenaPrincipal(arena)}>
                            <strong>{arena.nome}</strong>
                            <small>{[arena.cidade, arena.estado].filter(Boolean).join(' • ') || 'Arena cadastrada'}</small>
                          </button>
                        ))}
                      </div>
                    )}
                    {formularioAtleta.arenaPrincipalNome && !formularioAtleta.arenaPrincipalId && (
                      <small>Selecione uma arena da lista ou limpe o campo.</small>
                    )}
                  </CampoEdicao>

                  <CampoEdicao label="Objetivo atual" largo>
                    <select
                      value={formularioAtleta.objetivoAtual}
                      onChange={(evento) => atualizarCampoAtleta('objetivoAtual', evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                      required
                    >
                      <option value="">Selecione</option>
                      {opcoesObjetivoAtual.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo}
                        </option>
                      ))}
                    </select>
                  </CampoEdicao>
                </div>
              )}
            </div>
          </form>
          <form className="perfil-subsecao" onSubmit={salvarMedidas}>
            <div className="perfil-secao-titulo">
              <div>
                <span>Medidas e Uniformes</span>
                <h2>Tamanhos do atleta</h2>
                <p className="perfil-texto-auxiliar">
                  Essas informações ajudam em campeonatos, eventos, uniformes e ações da QNF.
                </p>
              </div>
            </div>

            <div className="perfil-edicao-grid">
              <CampoEdicao label="Camiseta">
                <select
                  value={formularioMedidas.camiseta}
                  onChange={(evento) => atualizarCampoMedida('camiseta', evento.target.value)}
                  onFocus={scrollFocusedInputIntoView}
                >
                  <option value="">Não informado</option>
                  {tamanhosRoupa.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}
                </select>
              </CampoEdicao>

              <CampoEdicao label="Regata">
                <select
                  value={formularioMedidas.regata}
                  onChange={(evento) => atualizarCampoMedida('regata', evento.target.value)}
                  onFocus={scrollFocusedInputIntoView}
                >
                  <option value="">Não informado</option>
                  {tamanhosRoupa.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}
                </select>
              </CampoEdicao>

              <CampoEdicao label="Short">
                <select
                  value={formularioMedidas.short}
                  onChange={(evento) => atualizarCampoMedida('short', evento.target.value)}
                  onFocus={scrollFocusedInputIntoView}
                >
                  <option value="">Não informado</option>
                  {tamanhosShort.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}
                </select>
              </CampoEdicao>

              {Number(formularioAtleta.sexo) === 1 && (
                <CampoEdicao label="Sunga">
                  <select
                    value={formularioMedidas.sunga}
                    onChange={(evento) => atualizarCampoMedida('sunga', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  >
                    <option value="">Não informado</option>
                    {tamanhosRoupa.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}
                  </select>
                </CampoEdicao>
              )}

              {Number(formularioAtleta.sexo) === 2 && (
                <>
                  <CampoEdicao label="Top">
                    <select
                      value={formularioMedidas.top}
                      onChange={(evento) => atualizarCampoMedida('top', evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                    >
                      <option value="">Não informado</option>
                      {tamanhosRoupa.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}
                    </select>
                  </CampoEdicao>

                  <CampoEdicao label="Biquíni">
                    <select
                      value={formularioMedidas.biquini}
                      onChange={(evento) => atualizarCampoMedida('biquini', evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                    >
                      <option value="">Não informado</option>
                      {tamanhosRoupa.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}
                    </select>
                  </CampoEdicao>
                </>
              )}

              {!formularioAtleta.sexo && (
                <p className="perfil-texto-auxiliar perfil-campo-largo">
                  Você pode informar os tamanhos básicos agora. Ao preencher sexo/gênero, exibiremos opções específicas de uniforme quando necessário.
                </p>
              )}

              {!possuiAtleta && (
                <p className="perfil-texto-auxiliar perfil-campo-largo">
                  Salve o perfil do atleta para gravar as medidas.
                </p>
              )}
            </div>

            <div className="perfil-acoes-edicao">
              <button type="submit" className="botao-primario" disabled={salvandoMedidas || !medidasAlteradas}>
                {salvandoMedidas ? 'Salvando...' : 'Salvar medidas'}
              </button>
            </div>
          </form>
          </div>
        )}

        {abaAtiva === 'contato' && (
          <form className="perfil-tab-fade" onSubmit={salvarAtleta}>
            <div className="perfil-secao-titulo">
              <div>
                <span>Contato e localização</span>
                <h2>{localizacaoCompacta}</h2>
              </div>
              {!editandoPerfil && (
                <button type="button" className="botao-secundario compacto" onClick={() => setEditandoPerfil(true)}>
                  Editar contato
                </button>
              )}
            </div>

            {!editandoPerfil ? (
              <div className="perfil-info-grid">
                <InfoItem rotulo="Telefone" valor={formularioAtleta.telefone} icone={FaPhone} />
                <InfoItem rotulo="E-mail" valor={emailUsuarioPerfil} icone={FaEnvelope} />
                <InfoItem rotulo="Instagram" valor={formularioAtleta.instagram} icone={FaInstagram} />
                <InfoItem rotulo="Estado" valor={formularioAtleta.estado} icone={FaMapMarkerAlt} />
                <InfoItem rotulo="Cidade" valor={formularioAtleta.cidade} />
                <InfoItem rotulo="Bairro" valor={formularioAtleta.bairro} />
              </div>
            ) : (
              <div className="perfil-edicao-grid">
                <CampoEdicao label="Telefone">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    value={formularioAtleta.telefone}
                    onChange={(evento) => atualizarCampoAtleta('telefone', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  />
                </CampoEdicao>

                <CampoEdicao label="E-mail">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={emailUsuarioPerfil}
                    readOnly
                    disabled
                  />
                </CampoEdicao>

                <CampoEdicao label="Instagram">
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    enterKeyHint="next"
                    value={formularioAtleta.instagram}
                    onChange={(evento) => atualizarCampoAtleta('instagram', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  />
                </CampoEdicao>

                <CampoEdicao label="Estado">
                  <select
                    value={formularioAtleta.estado}
                    onChange={(evento) => atualizarCampoAtleta('estado', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  >
                    <option value="">Selecione</option>
                    {estadosBrasil.map((estado) => (
                      <option key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </option>
                    ))}
                  </select>
                </CampoEdicao>

                <CampoEdicao label="Cidade">
                  <input
                    type="text"
                    list="cidades-estado-perfil"
                    autoComplete="address-level2"
                    enterKeyHint="next"
                    value={formularioAtleta.cidade}
                    onChange={(evento) => atualizarCampoAtleta('cidade', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                    placeholder={formularioAtleta.estado ? 'Digite para buscar' : 'Selecione o estado'}
                  />
                  <datalist id="cidades-estado-perfil">
                    {cidadesEstado.map((cidade) => (
                      <option key={cidade} value={cidade} />
                    ))}
                  </datalist>
                  {carregandoCidades && <small>Carregando cidades...</small>}
                </CampoEdicao>

                <CampoEdicao label="Bairro">
                  <input
                    type="text"
                    autoComplete="address-line2"
                    enterKeyHint="done"
                    value={formularioAtleta.bairro}
                    onChange={(evento) => atualizarCampoAtleta('bairro', evento.target.value)}
                    onFocus={scrollFocusedInputIntoView}
                  />
                </CampoEdicao>

                <div className="perfil-acoes-edicao perfil-campo-largo">
                  <button type="submit" className="botao-primario" disabled={salvandoAtleta}>
                    {salvandoAtleta ? 'Salvando...' : textoBotao}
                  </button>
                  {possuiAtleta && (
                    <button type="button" className="botao-secundario" onClick={() => setEditandoPerfil(false)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        )}

        {abaAtiva === 'privacidade' && (
          <form className="perfil-tab-fade perfil-configuracoes" onSubmit={salvarPreferenciasPrivacidade}>
            <article className="perfil-config-card">
              <div>
                <span>Privacidade</span>
                <h2>Preferências do perfil</h2>
                <p>Controle como seus dados pessoais podem aparecer ou ser usados nos recursos da plataforma.</p>
              </div>

              <div className="perfil-privacidade-lista">
                <label className="perfil-switch-linha">
                  <input
                    type="checkbox"
                    checked={preferenciasPrivacidade.perfilPublico}
                    onChange={(evento) => atualizarPreferenciaPrivacidade('perfilPublico', evento.target.checked)}
                  />
                  <span aria-hidden="true" />
                  <strong>Perfil público</strong>
                  <small>Permite que seu perfil esportivo seja encontrado nas áreas públicas quando aplicável.</small>
                </label>

                <label className="perfil-switch-linha">
                  <input
                    type="checkbox"
                    checked={preferenciasPrivacidade.exibirEmail}
                    onChange={(evento) => atualizarPreferenciaPrivacidade('exibirEmail', evento.target.checked)}
                  />
                  <span aria-hidden="true" />
                  <strong>Exibir e-mail publicamente</strong>
                  <small>Por padrão o e-mail fica oculto nas páginas públicas.</small>
                </label>

                <label className="perfil-switch-linha">
                  <input
                    type="checkbox"
                    checked={preferenciasPrivacidade.permitirUsoLocalizacao}
                    onChange={(evento) => atualizarPreferenciaPrivacidade('permitirUsoLocalizacao', evento.target.checked)}
                  />
                  <span aria-hidden="true" />
                  <strong>Permitir uso de localização</strong>
                  <small>A localização segue opcional e só é enviada em novos registros quando autorizada.</small>
                </label>

                <label className="perfil-switch-linha">
                  <input
                    type="checkbox"
                    checked={preferenciasPrivacidade.permitirUsoImagem}
                    onChange={(evento) => atualizarPreferenciaPrivacidade('permitirUsoImagem', evento.target.checked)}
                  />
                  <span aria-hidden="true" />
                  <strong>Permitir uso de foto/imagem</strong>
                  <small>Autoriza o uso da sua imagem em recursos do perfil quando esse recurso estiver disponível.</small>
                </label>
              </div>

              <div className="perfil-config-acoes">
                <button type="submit" className="botao-primario" disabled={salvandoPrivacidade}>
                  <FaSave aria-hidden="true" />
                  {salvandoPrivacidade ? 'Salvando...' : 'Salvar privacidade'}
                </button>
                <Link className="botao-secundario" to="/privacidade" target="_blank" rel="noreferrer">
                  Política de Privacidade
                </Link>
              </div>
            </article>

            <article className="perfil-config-card">
              <div>
                <span>Foto do perfil</span>
                <h2>Imagem pessoal</h2>
                <p>
                  A remoção de foto será aplicada quando houver imagem de perfil cadastrada. Hoje seu perfil usa apenas
                  iniciais geradas pela plataforma.
                </p>
              </div>

              <button type="button" className="botao-secundario" disabled={!preferenciasPrivacidade.possuiFotoPerfil}>
                <FaTrashAlt aria-hidden="true" />
                Remover foto
              </button>
            </article>
          </form>
        )}

        {abaAtiva === 'configuracoes' && (
          <div className="perfil-tab-fade perfil-configuracoes">
            {usuarioEhAdministrador && (
              <form className="perfil-config-card" onSubmit={salvarUsuario}>
                <div>
                  <span>Administrador</span>
                  <h2>Dados do acesso</h2>
                  <p>Esses dados pertencem à autenticação do usuário, não ao atleta.</p>
                </div>

                <div className="perfil-edicao-grid">
                  <CampoEdicao label="Nome do usuário" largo>
                    <input
                      type="text"
                      autoComplete="name"
                      enterKeyHint="done"
                      value={formularioUsuario.nome}
                      onChange={(evento) => setFormularioUsuario({ nome: evento.target.value })}
                      onFocus={scrollFocusedInputIntoView}
                      required
                    />
                  </CampoEdicao>
                  <CampoEdicao label="E-mail" largo>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={emailUsuarioPerfil}
                      readOnly
                      disabled
                    />
                  </CampoEdicao>
                </div>

                <button type="submit" className="botao-secundario" disabled={salvandoUsuario}>
                  {salvandoUsuario ? 'Salvando...' : 'Salvar acesso'}
                </button>
              </form>
            )}

            <article className="perfil-config-card">
              <div>
                <span>Perfil</span>
                <h2>Edição</h2>
                <p>Atualize seus dados quando necessário.</p>
              </div>

              <div className="perfil-config-acoes">
                {editandoPerfil ? (
                  <button type="button" className="botao-primario" onClick={() => salvarAtleta()} disabled={salvandoAtleta}>
                    <FaSave aria-hidden="true" />
                    {salvandoAtleta ? 'Salvando...' : textoBotao}
                  </button>
                ) : (
                  <button type="button" className="botao-secundario" onClick={() => setEditandoPerfil(true)}>
                    <FaUserEdit aria-hidden="true" />
                    Editar perfil
                  </button>
                )}

              </div>
            </article>

            <article className="perfil-config-card">
              <div>
                <span>Ferramentas</span>
                <h2>Aplicativo e sessão</h2>
                <p>Atualize a plataforma ou encerre sua sessão neste dispositivo.</p>
              </div>

              <div className="perfil-ferramentas-lista">
                <button type="button" className="perfil-ferramenta-botao" onClick={atualizarAplicativo}>
                  <FaSyncAlt aria-hidden="true" />
                  <span>Atualizar aplicativo</span>
                </button>
                <button type="button" className="perfil-ferramenta-botao" onClick={sairDoPerfil}>
                  <FaSignOutAlt aria-hidden="true" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </article>

            <article className="perfil-config-card perfil-zona-perigo">
              <div>
                <span>Zona de perigo</span>
                <h2>Excluir conta</h2>
                <p>
                  Excluir sua conta remove seus dados pessoais e bloqueia seu acesso. Partidas e históricos
                  compartilhados serão preservados para não afetar outros atletas.
                </p>
              </div>

              <button
                type="button"
                className="botao-perigo"
                onClick={confirmarExclusaoMeuPerfil}
                disabled={excluindoPerfil}
              >
                <FaTrashAlt aria-hidden="true" />
                {excluindoPerfil ? 'Excluindo...' : 'Excluir minha conta'}
              </button>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
