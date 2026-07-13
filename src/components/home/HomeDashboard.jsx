import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaChevronRight,
  FaClipboardCheck,
  FaEdit,
  FaFire,
  FaFutbol,
  FaGift,
  FaPlus,
  FaTimes,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { obterNomeGrupoPartidaExibicao } from '../../utils/partidas';
import { obterRotaDetalhePartida } from '../../utils/partidaRotas';
import { formatarData } from '../../utils/formatacao';
import { MedalhaNivel } from '../gamificacao/MedalhaNivel';
import { Avatar } from '../ui/Avatar';
import { HomeSectionType, homeSectionsConfig } from './homeSectionsConfig';

const HOME_NAVIGATION = Object.freeze({
  meusJogos: '/minhas-partidas',
  registrarPartida: '/partidas/registrar',
  grupos: '/grupos',
  perfil: '/app/perfil',
  editarPerfil: '/app/perfil?aba=perfil&editar=1',
  configuracoes: '/app/perfil?aba=configuracoes',
  pendencias: '/app/pendencias',
  scouts: '/app/scouts',
  pontosQN: '/app/pontos-qn'
});

function obterEstadoModulo(modulos, chave, dadosPadrao = null) {
  return modulos?.[chave] || {
    dados: dadosPadrao,
    carregando: false,
    erro: ''
  };
}

function obterDadosModulo(modulo, fallback) {
  return modulo?.dados ?? fallback;
}

function obterTextoLimpo(...valores) {
  return valores
    .map((valor) => String(valor || '').trim())
    .find(Boolean) || '';
}

function formatarPercentual(valor) {
  const numero = Number(valor ?? 0);
  return `${Number.isInteger(numero) ? numero : numero.toFixed(1)}%`;
}

function formatarPontosQN(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

const PROXIMA_FAIXA_QN = Object.freeze({
  bronze: 'Prata',
  prata: 'Ouro',
  ouro: 'Diamante'
});

const PADROES_COPY_FINANCEIRA_HOME = [
  /r\$/i,
  /\boff\b/i,
  /cashback/i,
  /dinheiro/i,
  /saldo financeiro/i,
  /carteira/i,
  /100\s*qn/i,
  /equivale/i,
  /convers[aã]o/i,
  /cr[eé]dito financeiro/i
];

function obterProximaFaixaNome(nivelNome) {
  return PROXIMA_FAIXA_QN[String(nivelNome || '').trim().toLowerCase()] || 'próxima faixa';
}

function obterTituloBeneficioHome(beneficio) {
  const titulo = obterTextoLimpo(beneficio?.titulo);
  if (!titulo || PADROES_COPY_FINANCEIRA_HOME.some((padrao) => padrao.test(titulo))) {
    return 'Benefício da comunidade';
  }

  return titulo;
}

function formatarDataAtividade(data) {
  if (!data) {
    return 'Data a confirmar';
  }

  const hoje = new Date();
  const referencia = new Date(data);

  if (Number.isNaN(referencia.getTime())) {
    return 'Data a confirmar';
  }

  const hojeLocal = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  const dataLocal = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate()).getTime();
  const diferencaDias = Math.round((hojeLocal - dataLocal) / 86400000);

  if (diferencaDias === 0) {
    return 'Hoje';
  }

  if (diferencaDias === 1) {
    return 'Ontem';
  }

  return formatarData(data);
}

function formatarDataHoraCurta(data) {
  if (!data) {
    return 'Data a confirmar';
  }

  const referencia = new Date(data);
  if (Number.isNaN(referencia.getTime())) {
    return 'Data a confirmar';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(referencia);
}

function obterResultadoPartida(partida) {
  const resultado = String(partida?.resultado || '').trim();
  const resultadoNormalizado = resultado
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (resultado === 'W' || resultadoNormalizado === 'vitoria') {
    return 'Vitória';
  }

  if (partida?.resultado === 'L' || resultadoNormalizado === 'derrota') {
    return 'Derrota';
  }

  return resultado || 'Pendente';
}

function obterPlacarDetalhadoPartida(partida) {
  const placarSuaDuplaValor = partida?.placarSuaDupla;
  const placarAdversariosValor = partida?.placarAdversarios;

  if (
    placarSuaDuplaValor === null ||
    placarSuaDuplaValor === undefined ||
    placarAdversariosValor === null ||
    placarAdversariosValor === undefined
  ) {
    return { temPlacar: false, suaDupla: null, adversarios: null };
  }

  const placarSuaDupla = Number(partida?.placarSuaDupla);
  const placarAdversarios = Number(partida?.placarAdversarios);

  if (
    !Number.isFinite(placarSuaDupla) ||
    !Number.isFinite(placarAdversarios) ||
    (placarSuaDupla === 0 && placarAdversarios === 0)
  ) {
    return { temPlacar: false, suaDupla: null, adversarios: null };
  }

  return {
    temPlacar: true,
    suaDupla: placarSuaDupla,
    adversarios: placarAdversarios
  };
}

function obterStatusPartida(partida) {
  const status = obterTextoLimpo(partida?.statusTexto, partida?.statusAprovacaoTexto, partida?.status);
  const statusNormalizado = status
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!status) {
    return 'Confirmada';
  }

  if (statusNormalizado.includes('encerr') || statusNormalizado.includes('aprov') || statusNormalizado.includes('confirm')) {
    return 'Confirmada';
  }

  if (statusNormalizado.includes('pend') || statusNormalizado.includes('aguard')) {
    return 'Aguardando confirmação';
  }

  return status;
}

function formatarTextoDupla(valor) {
  return obterTextoLimpo(valor)
    .replace(/\s+e\s+/gi, ' / ')
    .replace(/\s*\/\s*/g, ' / ');
}

function formatarNomesDupla(nomes, fallback) {
  const nomesLimpos = nomes.map((nome) => obterTextoLimpo(nome)).filter(Boolean);

  if (nomesLimpos.length > 0) {
    return nomesLimpos.join(' / ');
  }

  return formatarTextoDupla(fallback) || 'Dupla a definir';
}

function obterFotoAtletaPartida(partida, lado, indice) {
  const ladoTitulo = lado === 'A' ? 'DuplaA' : 'DuplaB';
  const ladoCamel = lado === 'A' ? 'duplaA' : 'duplaB';
  const chaveAtleta = `${ladoCamel}Atleta${indice}`;
  const chaveAtletaTitulo = `${ladoTitulo}Atleta${indice}`;

  return obterTextoLimpo(
    partida?.[`foto${chaveAtletaTitulo}`],
    partida?.[`foto${chaveAtletaTitulo}Url`],
    partida?.[`fotoPerfil${chaveAtletaTitulo}`],
    partida?.[`fotoPerfil${chaveAtletaTitulo}Url`],
    partida?.[`${chaveAtleta}FotoPerfilUrl`],
    partida?.[`${chaveAtleta}AvatarUrl`],
    partida?.[`avatar${chaveAtletaTitulo}`],
    partida?.[`avatar${chaveAtletaTitulo}Url`]
  );
}

function criarAtletaPartida(partida, lado, indice) {
  const ladoTitulo = lado === 'A' ? 'DuplaA' : 'DuplaB';
  const ladoCamel = lado === 'A' ? 'duplaA' : 'duplaB';

  return {
    id: obterTextoLimpo(partida?.[`${ladoCamel}Atleta${indice}Id`]),
    nome: obterTextoLimpo(
      partida?.[`nome${ladoTitulo}Atleta${indice}`],
      partida?.[`${ladoCamel}Atleta${indice}Nome`]
    ),
    fotoPerfilUrl: obterFotoAtletaPartida(partida, lado, indice)
  };
}

function criarAtletasPorTexto(texto, fallback) {
  const nomes = formatarTextoDupla(texto)
    .split('/')
    .map((nome) => nome.trim())
    .filter(Boolean);

  if (nomes.length === 0 && fallback) {
    return [{ id: '', nome: fallback, fotoPerfilUrl: '' }];
  }

  return nomes.slice(0, 2).map((nome) => ({
    id: '',
    nome,
    fotoPerfilUrl: ''
  }));
}

function criarDuplaDetalhada(partida, lado, fallbackTexto) {
  const atletas = [criarAtletaPartida(partida, lado, 1), criarAtletaPartida(partida, lado, 2)]
    .filter((atleta) => atleta.nome);
  const nome = atletas.length > 0
    ? formatarNomesDupla(atletas.map((atleta) => atleta.nome), fallbackTexto)
    : formatarTextoDupla(fallbackTexto) || 'Dupla a definir';

  return {
    atletas,
    nome,
    temDados: atletas.length > 0
  };
}

function obterDuplasUltimoJogo(partida, atletaId, nomeAtleta) {
  const duplaA = criarDuplaDetalhada(partida, 'A', 'Dupla A');
  const duplaB = criarDuplaDetalhada(partida, 'B', 'Dupla B');
  const atletaIdTexto = obterTextoLimpo(atletaId);
  const atletaEstaNaDuplaA = atletaIdTexto && [
    partida?.duplaAAtleta1Id,
    partida?.duplaAAtleta2Id
  ].map((id) => obterTextoLimpo(id)).includes(atletaIdTexto);
  const atletaEstaNaDuplaB = atletaIdTexto && [
    partida?.duplaBAtleta1Id,
    partida?.duplaBAtleta2Id
  ].map((id) => obterTextoLimpo(id)).includes(atletaIdTexto);

  if (atletaEstaNaDuplaA || atletaEstaNaDuplaB) {
    return {
      suaDupla: atletaEstaNaDuplaA ? duplaA : duplaB,
      adversarios: atletaEstaNaDuplaA ? duplaB : duplaA
    };
  }

  if (duplaA.temDados || duplaB.temDados) {
    return {
      suaDupla: duplaA,
      adversarios: duplaB
    };
  }

  return {
    suaDupla: {
      atletas: criarAtletasPorTexto(formatarNomesDupla([nomeAtleta, partida?.parceiro], 'Sua dupla'), ''),
      nome: formatarNomesDupla([nomeAtleta, partida?.parceiro], 'Sua dupla')
    },
    adversarios: {
      atletas: criarAtletasPorTexto(partida?.adversarios, 'Adversários'),
      nome: formatarTextoDupla(partida?.adversarios) || 'Adversários'
    }
  };
}

function obterClasseResultado(resultado) {
  if (resultado === 'Vitória') {
    return 'vitoria';
  }

  if (resultado === 'Derrota') {
    return 'derrota';
  }

  if (resultado === 'Empate') {
    return 'empate';
  }

  return 'pendente';
}

function obterTituloPartida(partida, contexto) {
  return obterTextoLimpo(
    partida?.nome,
    partida?.titulo,
    partida?.nomePartida,
    partida?.tipoPartida,
    contexto === 'Partida avulsa' ? 'Partidas Avulsas' : contexto
  );
}

function obterDataHoraAtividade(data) {
  if (!data) {
    return 'Data a confirmar';
  }

  const referencia = new Date(data);
  if (Number.isNaN(referencia.getTime())) {
    return 'Data a confirmar';
  }

  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(referencia);

  return `${formatarDataAtividade(data)} ${hora}`;
}

function obterTotalAtletasDuplas(duplas) {
  const nomes = [
    ...(duplas?.suaDupla?.atletas || []),
    ...(duplas?.adversarios?.atletas || [])
  ]
    .map((atleta) => obterTextoLimpo(atleta?.id, atleta?.nome))
    .filter(Boolean);

  return Math.max(0, new Set(nomes).size);
}

function HomeEstado({ titulo, mensagem }) {
  return (
    <section className="pagina home-dashboard">
      <div className="home-dashboard-empty-state home-dashboard-estado">
        <strong>{titulo}</strong>
        {mensagem && <p>{mensagem}</p>}
      </div>
    </section>
  );
}

export function HomeDashboard({
  modulos,
  dashboard,
  carregando,
  erro
}) {
  const { usuario } = useAutenticacao();

  if (carregando) {
    return <HomeDashboardSkeleton />;
  }

  if (erro && !modulos) {
    return <HomeEstado titulo="Não foi possível carregar sua Home." mensagem={erro} />;
  }

  if (!modulos && !dashboard) {
    return <HomeEstado titulo="Registre partidas para montar sua Home." />;
  }

  const perfilModulo = obterEstadoModulo(modulos, 'perfil', dashboard?.perfil || null);
  const resumoModulo = obterEstadoModulo(modulos, 'resumo', dashboard?.resumo || null);
  const pendenciasModulo = obterEstadoModulo(modulos, 'pendencias', null);
  const gamificacaoModulo = obterEstadoModulo(modulos, 'gamificacao', dashboard?.gamificacao || null);
  const ultimasPartidasModulo = obterEstadoModulo(modulos, 'ultimasPartidas', dashboard?.ultimasPartidas || []);

  const perfil = obterDadosModulo(perfilModulo, {}) || {};
  const resumo = obterDadosModulo(resumoModulo, {}) || {};
  const resumoPendencias = obterDadosModulo(pendenciasModulo, null);
  const pendenciaConfirmacaoPartida = resumoPendencias?.confirmacaoPartidaMaisRecente || null;
  const totalPendencias = Number(resumoPendencias?.total || (pendenciaConfirmacaoPartida ? 1 : 0));
  const ultimasPartidas = (obterDadosModulo(ultimasPartidasModulo, []) || []).slice(0, 1);
  const totalPartidas = Number(resumo.totalPartidas ?? 0);
  const totalVitorias = Number(resumo.vitorias ?? 0);
  const aproveitamento = Number(resumo.aproveitamento ?? perfil.aproveitamento ?? 0);
  const sequenciaAtual = Number(resumo.sequenciaAtual ?? perfil.sequenciaAtual ?? 0);
  const temDadosDesempenho = totalPartidas > 0 || totalVitorias > 0 || aproveitamento > 0 || sequenciaAtual > 0;
  const pendenciaCriarSenha = Array.isArray(usuario?.pendenciasConta)
    ? usuario.pendenciasConta.find((pendencia) => pendencia?.tipo === 'CriarSenha')
    : null;
  const deveCriarSenhaConta = Boolean(pendenciaCriarSenha) ||
    usuario?.possuiSenha === false ||
    usuario?.senhaCadastrada === false;

  const scouts = [
    {
      id: 'partidas',
      rotulo: 'Partidas',
      valor: totalPartidas,
      icone: FaFutbol
    },
    {
      id: 'vitorias',
      rotulo: 'Vitórias',
      valor: totalVitorias,
      icone: FaTrophy
    },
    {
      id: 'aproveitamento',
      rotulo: 'Aproveitamento',
      valor: formatarPercentual(aproveitamento),
      icone: FaChartLine
    },
    {
      id: 'sequencia',
      rotulo: 'Sequência',
      valor: sequenciaAtual,
      icone: FaFire
    }
  ];

  const renderizadoresSecao = {
    [HomeSectionType.Gamification]: () => (
      <HomePontosQNCard
        gamificacaoModulo={gamificacaoModulo}
      />
    ),
    [HomeSectionType.Performance]: () => (
      <HomeDesempenhoCard
        scouts={scouts}
        erroDesempenho={resumoModulo.erro}
        temDados={temDadosDesempenho}
      />
    ),
    [HomeSectionType.PendingConfirmation]: () => (
      <HomeConfirmarPartidaCard
        pendencia={pendenciaConfirmacaoPartida}
        totalPendencias={totalPendencias}
      />
    ),
    [HomeSectionType.PrimaryAction]: () => (
      <>
        <HomeAcoesPrincipais />
        {deveCriarSenhaConta && (
          <Link to={HOME_NAVIGATION.perfil} className="home-dashboard-alerta-senha">
            <span><FaEdit aria-hidden="true" /></span>
            <strong>Crie sua senha para continuar acessando sua conta com segurança.</strong>
            <em>Criar senha agora</em>
          </Link>
        )}
      </>
    ),
    [HomeSectionType.RecentMatches]: () => (
      <HomeUltimoJogo
        ultimasPartidas={ultimasPartidas}
        erro={ultimasPartidasModulo.erro}
        atletaId={usuario?.atletaId || perfil.atletaId}
        nomeAtleta={obterTextoLimpo(perfil.apelido, usuario?.apelido, perfil.nome, usuario?.nome)}
      />
    )
  };

  return (
    <section className="pagina home-dashboard">
      {homeSectionsConfig
        .filter((secao) => secao.enabled)
        .map((secao) => {
          const renderizar = renderizadoresSecao[secao.type];
          return renderizar ? <Fragment key={secao.type}>{renderizar()}</Fragment> : null;
        })}
    </section>
  );
}

function HomeConfirmarPartidaCard({ pendencia, totalPendencias }) {
  if (!pendencia) {
    return null;
  }

  const grupo = obterNomeGrupoPartidaExibicao(pendencia.nomeGrupo, '') || 'Partidas avulsas';
  const duplaA = obterDuplaPendencia(pendencia, 'A');
  const quantidade = Number(totalPendencias || 1);

  return (
    <section className="home-dashboard-pendencias" aria-labelledby="home-pendencias-titulo">
      <div className="home-dashboard-confirmacao-topo">
        <span aria-hidden="true"><FaClipboardCheck /></span>
        <div>
          <h2 id="home-pendencias-titulo">Pendências</h2>
          <strong>
            Você possui {quantidade} {quantidade === 1 ? 'pendência' : 'pendências'}
          </strong>
          <p>{grupo} • {duplaA}</p>
        </div>
        <em>PENDENTE</em>
      </div>

      <div className="home-dashboard-pendencias-rodape">
        <span><FaCalendarAlt aria-hidden="true" />{formatarDataHoraCurta(pendencia.dataPartida || pendencia.dataCriacao)}</span>
        <Link to="/app/pendencias" className="home-dashboard-confirmacao-link">
          Ver todas
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function obterDuplaPendencia(pendencia, lado) {
  const nome = lado === 'A' ? pendencia.nomeDuplaA : pendencia.nomeDuplaB;
  const atleta1 = lado === 'A' ? pendencia.nomeDuplaAAtleta1 : pendencia.nomeDuplaBAtleta1;
  const atleta2 = lado === 'A' ? pendencia.nomeDuplaAAtleta2 : pendencia.nomeDuplaBAtleta2;

  return nome || [atleta1, atleta2].filter(Boolean).join(' / ') || 'Dupla a definir';
}

function HomePontosQNCard({ gamificacaoModulo }) {
  const modulo = gamificacaoModulo;
  const carregando = Boolean(modulo?.carregando);
  const dados = obterDadosModulo(modulo, null);
  const pontuacao = dados?.pontuacao || {};
  const nivel = dados?.nivel || {};
  const saldoAtual = Number(pontuacao.saldoAtual ?? 0);
  const totalAcumulado = Number(pontuacao.totalAcumulado ?? 0);
  const pontosMinimos = Number(nivel.pontosMinimos ?? 0);
  const pontosProximaFaixa = nivel.pontosProximaFaixa === null || nivel.pontosProximaFaixa === undefined
    ? null
    : Number(nivel.pontosProximaFaixa);
  const pontosRestantes = Number(nivel.pontosRestantes ?? 0);
  const progressoPercentual = Math.max(0, Math.min(100, Number(nivel.progressoPercentual ?? 0)));
  const nivelNome = carregando && !dados ? 'Carregando' : obterTextoLimpo(nivel.nome, 'Bronze');
  const numeroNivel = obterTextoLimpo(nivel.numero, nivel.nivel, nivel.ordem, nivel.indice);
  const progressoAtual = pontosProximaFaixa
    ? Math.max(0, totalAcumulado - pontosMinimos)
    : totalAcumulado;
  const progressoMeta = pontosProximaFaixa
    ? Math.max(0, pontosProximaFaixa - pontosMinimos)
    : totalAcumulado;
  const proximaFaixaNome = obterProximaFaixaNome(nivelNome);
  const proximoBeneficio = Array.isArray(dados?.proximosBeneficios)
    ? dados.proximosBeneficios[0]
    : null;
  const recompensa = obterTituloBeneficioHome(proximoBeneficio);
  const textoProgresso = pontosProximaFaixa
    ? `${formatarPontosQN(progressoAtual)} / ${formatarPontosQN(progressoMeta)} QN`
    : `${formatarPontosQN(totalAcumulado)} QN acumulados`;
  const textoProximaFaixa = pontuacao.temAtletaVinculado === false
    ? 'Vincule seu atleta para acompanhar sua evolução QN.'
    : modulo?.erro
      ? 'Pontos QN indisponíveis agora.'
      : pontosProximaFaixa
        ? `Faltam ${formatarPontosQN(pontosRestantes)} QN para ${proximaFaixaNome}`
        : dados
          ? 'Faixa máxima alcançada'
          : 'Comece registrando ou confirmando partidas para evoluir.';

  return (
    <section className="home-dashboard-pontosqn-card" aria-labelledby="home-pontosqn-titulo">
      <div className="home-dashboard-card-topo">
        <div>
          <h2 id="home-pontosqn-titulo">Pontos QN</h2>
        </div>
        <Link to={HOME_NAVIGATION.pontosQN} className="home-dashboard-card-link">
          Ver benefícios
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>

      <div className="home-dashboard-qn-corpo">
        <MedalhaNivel
          nivel={nivelNome}
          size="lg"
          className="home-dashboard-qn-medalha"
        />
        <div className="home-dashboard-qn-nivel">
          <strong>{nivelNome}</strong>
          {numeroNivel && <span>Nível {numeroNivel}</span>}
        </div>

        <div className="home-dashboard-qn-saldo">
          <strong>{formatarPontosQN(saldoAtual)}</strong>
          <span>QN</span>
        </div>
      </div>

      <div className="home-dashboard-qn-progresso-linha">
        <div className="home-dashboard-qn-progresso" aria-hidden="true">
          <span style={{ width: `${progressoPercentual}%` }} />
        </div>
        <div>
          <strong>{textoProgresso}</strong>
          <span>{textoProximaFaixa}</span>
        </div>
      </div>

      <Link to={HOME_NAVIGATION.pontosQN} className="home-dashboard-qn-recompensa">
        <FaGift aria-hidden="true" />
        <span>
          <span>Próxima recompensa</span>
          <strong>{recompensa}</strong>
        </span>
        <FaChevronRight aria-hidden="true" />
      </Link>
    </section>
  );
}

function HomeDesempenhoCard({ scouts, erroDesempenho, temDados }) {
  return (
    <section className="home-dashboard-desempenho-card" aria-labelledby="home-desempenho-titulo">
      <div className="home-dashboard-card-topo">
        <div>
          <span aria-hidden="true"><FaChartLine /></span>
          <h2 id="home-desempenho-titulo">Seu desempenho</h2>
        </div>
        <Link to={HOME_NAVIGATION.scouts} className="home-dashboard-card-link">
          Ver detalhes
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>

      {erroDesempenho ? (
        <p className="home-dashboard-vazio home-dashboard-vazio-compacto">Não foi possível carregar seu desempenho agora.</p>
      ) : temDados ? (
        <div className="home-dashboard-desempenho-grid">
          {scouts.map((item) => {
            const Icone = item.icone;
            return (
              <article key={item.id} className="home-dashboard-desempenho-item">
                <Icone aria-hidden="true" />
                <strong>{item.valor}</strong>
                <span>{item.rotulo}</span>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="home-dashboard-vazio home-dashboard-vazio-compacto">
          Ainda não há dados suficientes para exibir seu desempenho.
        </p>
      )}
    </section>
  );
}

function HomeAcoesPrincipais() {
  return (
    <section className="home-dashboard-acoes-principais" aria-label="Ações principais">
      <HomeAcaoPrincipal
        to={HOME_NAVIGATION.registrarPartida}
        icone={FaPlus}
        titulo="Registrar partida"
        descricao="Salve seu jogo e atualize sua evolução."
        variante="principal"
      />

      <HomeAcaoPrincipal
        to={HOME_NAVIGATION.grupos}
        icone={FaUsers}
        titulo="Criar grupo"
        descricao="Ranking, histórico e scouts."
        variante="secundario"
      />
    </section>
  );
}

function HomeAcaoPrincipal({ to, icone: Icone, titulo, descricao, variante = 'principal' }) {
  return (
    <Link to={to} className={`home-dashboard-cta home-dashboard-cta-${variante}`}>
      <span className="home-dashboard-cta-icone"><Icone aria-hidden="true" /></span>
      <span>
        <strong>{titulo}</strong>
        <small>{descricao}</small>
      </span>
      <FaChevronRight aria-hidden="true" />
    </Link>
  );
}

function HomeUltimoJogo({ ultimasPartidas, erro, atletaId, nomeAtleta }) {
  return (
    <section className="home-dashboard-atividade" aria-labelledby="home-ultimo-jogo-titulo">
      <div className="home-dashboard-section-title home-dashboard-section-title-com-acao">
        <h2 id="home-ultimo-jogo-titulo">Último jogo</h2>
        <Link to={HOME_NAVIGATION.meusJogos}>
          Ver histórico
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>

      {erro ? (
        <p className="home-dashboard-vazio">Não foi possível carregar sua atividade agora.</p>
      ) : ultimasPartidas.length > 0 ? (
        <div className="home-dashboard-timeline">
          {ultimasPartidas.map((partida) => {
            const resultado = obterResultadoPartida(partida);
            const classeResultado = obterClasseResultado(resultado);
            const contexto = [
              obterNomeGrupoPartidaExibicao(partida.grupo, ''),
              partida.categoria,
              partida.competicao
            ].filter(Boolean)[0] || 'Partida avulsa';
            const placar = obterPlacarDetalhadoPartida(partida);
            const status = obterStatusPartida(partida);
            const duplas = obterDuplasUltimoJogo(partida, atletaId, nomeAtleta);
            const tituloPartida = obterTituloPartida(partida, contexto);
            const totalAtletas = obterTotalAtletasDuplas(duplas) || 4;

            return (
              <Link
                key={partida.id}
                to={partida.id ? obterRotaDetalhePartida(partida) : HOME_NAVIGATION.meusJogos}
                className="home-dashboard-timeline-item home-dashboard-ultimo-jogo-card"
              >
                <div className="home-dashboard-ultimo-jogo-linha">
                  <MatchStatusBadge resultado={resultado} classeResultado={classeResultado} />
                  <span className="home-dashboard-ultimo-jogo-data">
                    {formatarDataAtividade(partida.dataPartida)}
                    <FaChevronRight aria-hidden="true" />
                  </span>
                </div>

                <div className="home-dashboard-ultimo-jogo-contexto">
                  <strong>{tituloPartida}</strong>
                  <span>{contexto}</span>
                </div>

                {placar.temPlacar ? (
                  <MatchResultScore
                    duplas={duplas}
                    placar={placar}
                    classeResultado={classeResultado}
                  />
                ) : (
                  <MatchResultWinner
                    duplas={duplas}
                    resultado={resultado}
                    classeResultado={classeResultado}
                  />
                )}

                <div className="home-dashboard-ultimo-jogo-rodape">
                  <span>
                    {status === 'Confirmada' ? <FaCheckCircle aria-hidden="true" /> : <FaClipboardCheck aria-hidden="true" />}
                    {status}
                  </span>
                  <span>
                    <FaCalendarAlt aria-hidden="true" />
                    {obterDataHoraAtividade(partida.dataPartida)}
                  </span>
                  <span>
                    <FaUsers aria-hidden="true" />
                    {totalAtletas} atletas
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="home-dashboard-empty-state">
          <FaFutbol aria-hidden="true" />
          <strong>Você ainda não registrou nenhum jogo.</strong>
          <Link to={HOME_NAVIGATION.registrarPartida}>Registrar agora</Link>
        </div>
      )}
    </section>
  );
}

function MatchStatusBadge({ resultado, classeResultado }) {
  const Icone = resultado === 'Derrota'
    ? FaTimes
    : resultado === 'Vitória'
      ? FaTrophy
      : FaClipboardCheck;

  return (
    <span className={`home-dashboard-match-status ${classeResultado}`}>
      <Icone aria-hidden="true" />
      {resultado}
    </span>
  );
}

function MatchTeamPreview({ dupla, align = 'start', destaque = false }) {
  const atletas = Array.isArray(dupla?.atletas) && dupla.atletas.length > 0
    ? dupla.atletas
    : criarAtletasPorTexto(dupla?.nome, 'Dupla');

  return (
    <div className={`home-dashboard-match-team home-dashboard-match-team-${align}${destaque ? ' is-highlighted' : ''}`}>
      <div className="home-dashboard-match-avatars" aria-hidden="true">
        {atletas.slice(0, 2).map((atleta, indice) => (
          <Avatar
            key={`${atleta.id || atleta.nome || 'atleta'}-${indice}`}
            name={atleta.nome}
            src={atleta.fotoPerfilUrl}
            size="xs"
            type="athlete"
            className="home-dashboard-match-avatar"
          />
        ))}
      </div>
      <span>{dupla?.nome || 'Dupla a definir'}</span>
    </div>
  );
}

function MatchResultScore({ duplas, placar, classeResultado }) {
  return (
    <div className="home-dashboard-match-score" role="group" aria-label="Resultado com placar">
      <MatchTeamPreview dupla={duplas.suaDupla} />
      <div className={`home-dashboard-match-scoreboard ${classeResultado}`}>
        <strong>{placar.suaDupla}</strong>
        <span>x</span>
        <strong>{placar.adversarios}</strong>
      </div>
      <MatchTeamPreview dupla={duplas.adversarios} align="end" />
    </div>
  );
}

function MatchResultWinner({ duplas, resultado, classeResultado }) {
  const vencedor = resultado === 'Derrota' ? duplas.adversarios : duplas.suaDupla;
  const derrotado = resultado === 'Derrota' ? duplas.suaDupla : duplas.adversarios;
  const textoResultado = resultado === 'Vitória' || resultado === 'Derrota'
    ? 'Vitória sem placar'
    : 'Resultado por vencedor';

  return (
    <div className={`home-dashboard-match-winner ${classeResultado}`} role="group" aria-label="Resultado sem placar">
      <div className="home-dashboard-match-winner-label">
        <span>{textoResultado}</span>
        <em>Sem placar</em>
      </div>
      <div className="home-dashboard-match-winner-grid">
        <MatchTeamPreview dupla={vencedor} destaque />
        <div className="home-dashboard-match-winner-icon" aria-label="Dupla vencedora" role="img">
          <FaTrophy aria-hidden="true" />
        </div>
        <MatchTeamPreview dupla={derrotado} align="end" />
      </div>
    </div>
  );
}

function HomeDashboardSkeleton() {
  return (
    <section className="pagina home-dashboard home-dashboard-carregando" aria-busy="true">
      <div className="home-dashboard-pontosqn-card home-dashboard-skeleton-card" />
      <div className="home-dashboard-desempenho-card home-dashboard-skeleton-card" />
      <div className="home-dashboard-cta home-dashboard-cta-principal home-dashboard-skeleton-card" />
      <div className="home-dashboard-cta home-dashboard-cta-principal home-dashboard-skeleton-card" />
    </section>
  );
}
