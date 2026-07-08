import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaChartLine,
  FaChevronRight,
  FaClipboardCheck,
  FaEdit,
  FaFire,
  FaFutbol,
  FaGift,
  FaPlus,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { obterNomeGrupoPartidaExibicao } from '../../utils/partidas';
import { formatarData } from '../../utils/formatacao';
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
  if (partida?.resultado === 'W') {
    return 'Vitória';
  }

  if (partida?.resultado === 'L') {
    return 'Derrota';
  }

  return partida?.resultado || 'Pendente';
}

function obterPlacarPartida(partida) {
  const placarSuaDupla = partida?.placarSuaDupla;
  const placarAdversarios = partida?.placarAdversarios;

  if (
    placarSuaDupla === null ||
    placarSuaDupla === undefined ||
    placarAdversarios === null ||
    placarAdversarios === undefined
  ) {
    return 'Placar pendente';
  }

  return `${placarSuaDupla} x ${placarAdversarios}`;
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
          <span aria-hidden="true"><FaTrophy /></span>
          <h2 id="home-pontosqn-titulo">Pontos QN</h2>
        </div>
        <Link to={HOME_NAVIGATION.pontosQN} className="home-dashboard-card-link">
          Ver benefícios
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>

      <div className="home-dashboard-qn-corpo">
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
        descricao="Crie um grupo e acompanhe ranking, histórico e scouts."
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

function HomeUltimoJogo({ ultimasPartidas, erro }) {
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
            const vitoria = resultado === 'Vitória';
            const contexto = [
              obterNomeGrupoPartidaExibicao(partida.grupo, ''),
              partida.categoria,
              partida.competicao
            ].filter(Boolean)[0] || 'Partida avulsa';
            const placar = obterPlacarPartida(partida);

            return (
              <Link
                key={partida.id}
                to={partida.id ? `${HOME_NAVIGATION.meusJogos}?partidaId=${partida.id}` : HOME_NAVIGATION.meusJogos}
                className="home-dashboard-timeline-item"
              >
                <Avatar
                  name={contexto}
                  size="sm"
                  type="group"
                  className="home-dashboard-jogo-avatar"
                  title={contexto}
                />
                <div className="home-dashboard-timeline-conteudo">
                  <div>
                    <strong>{contexto}</strong>
                    <span>{formatarDataAtividade(partida.dataPartida)}</span>
                  </div>
                </div>
                <em className={vitoria ? 'vitoria' : 'derrota'}>{resultado}</em>
                {placar !== 'Placar pendente' && <strong className="home-dashboard-jogo-placar">{placar}</strong>}
                <FaChevronRight aria-hidden="true" />
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
