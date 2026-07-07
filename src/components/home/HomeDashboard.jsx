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
  FaPlus,
  FaTimes,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { obterNomeGrupoPartidaExibicao } from '../../utils/partidas';
import { formatarData } from '../../utils/formatacao';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
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

function obterNomeCompletoPerfil(perfil, usuario) {
  const apelido = obterTextoLimpo(perfil.apelido, usuario?.apelido);
  const candidatos = [
    perfil.nomeCompleto,
    perfil.nome,
    usuario?.nomeCompleto,
    usuario?.nome
  ]
    .map((valor) => String(valor || '').trim())
    .filter((texto) => texto && texto !== apelido);
  const nomeComSobrenome = candidatos.find((texto) => texto.split(/\s+/).length > 1);

  return obterTextoLimpo(
    nomeComSobrenome,
    ...candidatos,
    perfil.apelido,
    usuario?.apelido,
    'Atleta QuebraNunca'
  );
}

function obterApelidoPerfil(perfil, usuario, nomeCompleto) {
  const apelido = obterTextoLimpo(perfil.apelido, usuario?.apelido);
  return apelido && apelido !== nomeCompleto ? apelido : '';
}

function formatarPercentual(valor) {
  const numero = Number(valor ?? 0);
  return `${Number.isInteger(numero) ? numero : numero.toFixed(1)}%`;
}

function formatarPontosQN(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
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
  erro,
  onConfirmarPendenciaPartida,
  onNaoReconhecerPendenciaPartida,
  confirmandoPendenciaId,
  contestandoPendenciaId
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
  const ultimasPartidas = (obterDadosModulo(ultimasPartidasModulo, []) || []).slice(0, 3);
  const nomeCompleto = obterNomeCompletoPerfil(perfil, usuario);
  const apelido = obterApelidoPerfil(perfil, usuario, nomeCompleto);
  const fotoPerfilUrl = obterFotoPerfilAvatar(perfil) || obterFotoPerfilAvatar(usuario);
  const totalPartidas = Number(resumo.totalPartidas ?? 0);
  const totalVitorias = Number(resumo.vitorias ?? 0);
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
      valor: formatarPercentual(resumo.aproveitamento ?? perfil.aproveitamento ?? 0),
      icone: FaChartLine
    },
    {
      id: 'sequencia',
      rotulo: 'Sequência',
      valor: resumo.sequenciaAtual ?? perfil.sequenciaAtual ?? 0,
      icone: FaFire
    }
  ];

  const renderizadoresSecao = {
    [HomeSectionType.Identity]: () => (
      <HomeIdentidadeUsuario
        nomeCompleto={nomeCompleto}
        apelido={apelido}
        fotoPerfilUrl={fotoPerfilUrl}
      />
    ),
    [HomeSectionType.PendingConfirmation]: () => (
      <HomeConfirmarPartidaCard
        pendencia={pendenciaConfirmacaoPartida}
        confirmando={confirmandoPendenciaId === pendenciaConfirmacaoPartida?.id}
        contestando={contestandoPendenciaId === pendenciaConfirmacaoPartida?.id}
        onConfirmar={onConfirmarPendenciaPartida}
        onNaoReconhecer={onNaoReconhecerPendenciaPartida}
      />
    ),
    [HomeSectionType.Gamification]: () => <HomeGamificacaoCard modulo={gamificacaoModulo} />,
    [HomeSectionType.Performance]: () => <HomeDesempenho scouts={scouts} erro={resumoModulo.erro} />,
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
      <HomeUltimosJogos
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

function HomeIdentidadeUsuario({ nomeCompleto, apelido, fotoPerfilUrl }) {
  return (
    <header
      className="home-dashboard-identidade-card"
      role="region"
      aria-label="Identidade do usuário"
    >
      <div className="home-dashboard-avatar-menu">
        <Link
          to={HOME_NAVIGATION.perfil}
          className="home-dashboard-avatar-botao"
          aria-label="Abrir meu perfil"
        >
          <AvatarUsuario
            nome={nomeCompleto}
            fotoPerfilUrl={fotoPerfilUrl}
            tamanho="xl"
            className="home-dashboard-avatar"
          />
        </Link>
      </div>

      <Link to={HOME_NAVIGATION.perfil} className="home-dashboard-identidade-texto" aria-label="Abrir meu perfil">
        <h1>{nomeCompleto}</h1>
        {apelido && <p>{apelido}</p>}
      </Link>
    </header>
  );
}

function HomeConfirmarPartidaCard({ pendencia, confirmando, contestando, onConfirmar, onNaoReconhecer }) {
  if (!pendencia) {
    return null;
  }

  const grupo = obterNomeGrupoPartidaExibicao(pendencia.nomeGrupo, '') || 'Partidas avulsas';
  const duplaA = obterDuplaPendencia(pendencia, 'A');
  const duplaB = obterDuplaPendencia(pendencia, 'B');
  const resultado = obterResultadoDetalhadoPendencia(pendencia);
  const processando = confirmando || contestando;

  return (
    <section className="home-dashboard-confirmacao" aria-labelledby="home-confirmacao-titulo">
      <div className="home-dashboard-confirmacao-topo">
        <span aria-hidden="true"><FaClipboardCheck /></span>
        <div>
          <h2 id="home-confirmacao-titulo">Confirmar partida</h2>
          <strong>Você participou deste jogo?</strong>
          <p>Ajude a validar os dados e fortalecer o ranking da comunidade.</p>
        </div>
        <em>PENDENTE</em>
      </div>

      <div className="home-dashboard-confirmacao-meta">
        <span><FaUsers aria-hidden="true" />{grupo}</span>
        <span><FaCalendarAlt aria-hidden="true" />{formatarDataHoraCurta(pendencia.dataPartida || pendencia.dataCriacao)}</span>
      </div>

      <div className="home-dashboard-confirmacao-jogo">
        <span>{duplaA}</span>
        <strong>{resultado}</strong>
        <span>{duplaB}</span>
      </div>

      <small className="home-dashboard-confirmacao-registrador">
        Registrado por {pendencia.nomeCriadoPorUsuario || 'Usuário QNF'}
      </small>

      <footer className="home-dashboard-confirmacao-rodape">
        <div className="home-dashboard-confirmacao-acoes">
          <button
            type="button"
            className="botao-terciario"
            onClick={() => onNaoReconhecer?.(pendencia.id)}
            disabled={processando || !onNaoReconhecer}
          >
            <FaTimes aria-hidden="true" />
            {contestando ? 'Enviando...' : 'Não fui eu'}
          </button>
          <button
            type="button"
            className="botao-primario"
            onClick={() => onConfirmar?.(pendencia.id)}
            disabled={processando}
          >
            {confirmando ? 'Confirmando...' : 'Confirmar partida'}
          </button>
        </div>
        <Link to="/app/pendencias" className="home-dashboard-confirmacao-link">
          Ver todas
          <FaChevronRight aria-hidden="true" />
        </Link>
      </footer>
    </section>
  );
}

function obterDuplaPendencia(pendencia, lado) {
  const nome = lado === 'A' ? pendencia.nomeDuplaA : pendencia.nomeDuplaB;
  const atleta1 = lado === 'A' ? pendencia.nomeDuplaAAtleta1 : pendencia.nomeDuplaBAtleta1;
  const atleta2 = lado === 'A' ? pendencia.nomeDuplaAAtleta2 : pendencia.nomeDuplaBAtleta2;

  return nome || [atleta1, atleta2].filter(Boolean).join(' / ') || 'Dupla a definir';
}

function obterResultadoDetalhadoPendencia(pendencia) {
  if (pendencia?.placarDuplaA !== null && pendencia?.placarDuplaA !== undefined &&
    pendencia?.placarDuplaB !== null && pendencia?.placarDuplaB !== undefined) {
    return `${pendencia.placarDuplaA} x ${pendencia.placarDuplaB}`;
  }

  if (pendencia?.duplaVencedora === 1) {
    return 'Venceu dupla 1';
  }

  if (pendencia?.duplaVencedora === 2) {
    return 'Venceu dupla 2';
  }

  return 'Resultado informado';
}

function HomeDesempenho({ scouts, erro }) {
  return (
    <section className="home-dashboard-scouts" aria-labelledby="home-desempenho-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="home-desempenho-titulo">Seu desempenho</h2>
        <Link to={HOME_NAVIGATION.scouts}>
          Ver detalhes
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>

      {erro ? (
        <p className="home-dashboard-vazio">Não foi possível carregar seu desempenho agora.</p>
      ) : (
        <div className="home-dashboard-scouts-grid">
          {scouts.map((item) => {
            const Icone = item.icone;
            return (
              <article key={item.id} className="home-dashboard-scout-card">
                <Icone aria-hidden="true" />
                <strong>{item.valor}</strong>
                <span>{item.rotulo}</span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HomeGamificacaoCard({ modulo }) {
  if (modulo?.erro) {
    return null;
  }

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
  const progressoAtual = pontosProximaFaixa
    ? Math.max(0, totalAcumulado - pontosMinimos)
    : totalAcumulado;
  const progressoMeta = pontosProximaFaixa
    ? Math.max(0, pontosProximaFaixa - pontosMinimos)
    : totalAcumulado;
  const textoProgresso = pontosProximaFaixa
    ? `${formatarPontosQN(progressoAtual)} / ${formatarPontosQN(progressoMeta)}`
    : `${formatarPontosQN(totalAcumulado)} acumulados`;
  const textoProximaFaixa = pontuacao.temAtletaVinculado === false
    ? 'Vincule seu atleta para acompanhar sua evolução QN.'
    : pontosProximaFaixa
      ? `Faltam ${formatarPontosQN(pontosRestantes)} para a próxima faixa`
      : dados
        ? 'Faixa máxima alcançada'
        : 'Comece registrando ou confirmando partidas para evoluir.';

  return (
    <section className="home-dashboard-gamificacao" aria-labelledby="home-gamificacao-titulo">
      <div className="home-dashboard-gamificacao-topo">
        <div>
          <span className="home-dashboard-gamificacao-selo">Pontos QN</span>
          <h2 id="home-gamificacao-titulo">Evolução QN</h2>
          <p>Participe da comunidade e desbloqueie benefícios.</p>
        </div>
        <Link to={HOME_NAVIGATION.pontosQN} className="home-dashboard-gamificacao-cta">
          Ver benefícios
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>

      <div className="home-dashboard-gamificacao-resumo">
        <div>
          <span>Nível atual</span>
          <strong>{nivelNome}</strong>
        </div>
        <div>
          <span>Saldo promocional</span>
          <strong>{formatarPontosQN(saldoAtual)} Pontos QN</strong>
        </div>
      </div>

      <div className="home-dashboard-gamificacao-progresso" aria-hidden="true">
        <span style={{ width: `${progressoPercentual}%` }} />
      </div>

      <footer className="home-dashboard-gamificacao-rodape">
        <strong>{textoProgresso}</strong>
        <span>{textoProximaFaixa}</span>
      </footer>
    </section>
  );
}

function HomeAcoesPrincipais() {
  return (
    <section className="home-dashboard-acoes-principais" aria-label="Ações principais">
      <Link to={HOME_NAVIGATION.registrarPartida} className="home-dashboard-cta home-dashboard-cta-principal">
        <span className="home-dashboard-cta-icone"><FaPlus aria-hidden="true" /></span>
        <span>
          <strong>Registrar partida</strong>
          <small>Salve seu jogo e atualize sua evolução.</small>
        </span>
        <FaChevronRight aria-hidden="true" />
      </Link>

      <Link to={HOME_NAVIGATION.grupos} className="home-dashboard-cta home-dashboard-cta-principal home-dashboard-cta-grupo">
        <span className="home-dashboard-cta-icone"><FaUsers aria-hidden="true" /></span>
        <span>
          <strong>Criar grupo</strong>
          <small>Crie um grupo e acompanhe ranking, histórico e scouts com sua galera.</small>
        </span>
        <FaChevronRight aria-hidden="true" />
      </Link>
    </section>
  );
}

function HomeUltimosJogos({ ultimasPartidas, erro }) {
  return (
    <section className="home-dashboard-atividade" aria-labelledby="home-atividade-titulo">
      <div className="home-dashboard-section-title home-dashboard-section-title-com-acao">
        <h2 id="home-atividade-titulo">Últimos jogos</h2>
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
          <strong>Você ainda não possui atividades.</strong>
          <p>Registre sua primeira partida para iniciar seu histórico.</p>
          <Link to={HOME_NAVIGATION.registrarPartida}>Registrar agora</Link>
        </div>
      )}
    </section>
  );
}

function HomeDashboardSkeleton() {
  return (
    <section className="pagina home-dashboard home-dashboard-carregando" aria-busy="true">
      <div className="home-dashboard-identidade-card home-dashboard-skeleton-card" />
      <div className="home-dashboard-scouts home-dashboard-skeleton-card" />
      <div className="home-dashboard-cta home-dashboard-cta-principal home-dashboard-skeleton-card" />
      <div className="home-dashboard-cta home-dashboard-cta-secundario home-dashboard-skeleton-card" />
    </section>
  );
}
