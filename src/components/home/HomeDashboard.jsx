import { Link } from 'react-router-dom';
import {
  FaBell,
  FaChartLine,
  FaChevronRight,
  FaEdit,
  FaFire,
  FaGamepad,
  FaLightbulb,
  FaMedal,
  FaPlus,
  FaStar,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';
import heroFutevolei from '../../assets/home-futevolei-hero.jpg';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { formatarData } from '../../utils/formatacao';
import { montarRotaPerfilAtleta } from '../../utils/perfilAtleta';
import { obterNomeExibicaoAtletaPerfil } from '../../utils/atletaUtils';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
import { NotificacoesBotao } from '../NotificacoesBotao';

const HOME_NAVIGATION = Object.freeze({
  ranking: '/ranking',
  meusJogos: '/app/meus-jogos',
  registrarPartida: '/partidas/registrar',
  grupos: '/grupos',
  perfil: '/app/perfil'
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

function nomeAtleta(item) {
  return obterNomeExibicaoAtletaPerfil(item) || 'Atleta';
}

function formatarPercentual(valor) {
  const numero = Number(valor ?? 0);
  return `${Number.isInteger(numero) ? numero : numero.toFixed(1)}%`;
}

function formatarFaixa(nome) {
  const valor = String(nome || '').trim();
  return valor ? `Faixa ${valor}` : 'Faixa Bronze';
}

function obterGrupoAtual(ultimasPartidas) {
  const grupo = ultimasPartidas.find((partida) => partida?.grupo)?.grupo;
  return grupo || 'Sem grupo ativo';
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

function formatarQuantidade(valor, singular, plural = `${singular}s`) {
  const quantidade = Number(valor ?? 0);
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function obterResumoHero(totalPartidas, vitorias, grupoAtual) {
  if (totalPartidas <= 0) {
    return {
      destaque: 'Você ainda não registrou sua primeira partida.',
      apoio: 'Que tal começar hoje?'
    };
  }

  if (grupoAtual === 'Sem grupo ativo') {
    return {
      destaque: `Você já registrou ${formatarQuantidade(totalPartidas, 'partida')}.`,
      apoio: 'Entre em um grupo para acompanhar ranking e scouts com sua galera.'
    };
  }

  return {
    destaque: `Você já registrou ${formatarQuantidade(totalPartidas, 'partida')} e ${formatarQuantidade(vitorias, 'vitória')}.`,
    apoio: `Continue evoluindo no ${grupoAtual}.`
  };
}

function montarJornada({ totalPartidas, vitorias, grupoAtual, posicaoRanking }) {
  const etapas = [
    {
      id: 'primeira-partida',
      titulo: 'Primeira partida',
      concluida: totalPartidas > 0
    },
    {
      id: 'primeira-vitoria',
      titulo: 'Primeira vitória',
      concluida: vitorias > 0
    },
    {
      id: 'entrar-grupo',
      titulo: 'Entrar em um grupo',
      concluida: grupoAtual !== 'Sem grupo ativo'
    },
    {
      id: 'top-ranking',
      titulo: 'Top Ranking',
      concluida: Boolean(posicaoRanking)
    }
  ];
  const concluidas = etapas.filter((etapa) => etapa.concluida).length;
  const atual = etapas.find((etapa) => !etapa.concluida) || etapas[etapas.length - 1];
  const porcentagem = Math.round((concluidas / etapas.length) * 100);

  return {
    porcentagem,
    etapaAtualId: atual.id,
    titulo:
      totalPartidas <= 0
        ? 'Primeiro passo'
        : atual.titulo,
    descricao:
      totalPartidas <= 0
        ? 'Registre sua primeira partida para começar sua evolução.'
        : 'Continue acumulando jogos, vitórias e presença em grupo para evoluir no QuebraNunca.',
    etapas
  };
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

export function HomeDashboard({ modulos, dashboard, carregando, erro }) {
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
  const gamificacaoModulo = obterEstadoModulo(modulos, 'gamificacao', null);
  const pendenciasModulo = obterEstadoModulo(modulos, 'pendencias', null);
  const ultimasPartidasModulo = obterEstadoModulo(modulos, 'ultimasPartidas', dashboard?.ultimasPartidas || []);
  const conexoesModulo = obterEstadoModulo(modulos, 'conexoes', {
    melhoresParceiros: dashboard?.melhoresParceiros || [],
    parceirosRecentes: dashboard?.parceirosRecentes || []
  });

  const perfil = obterDadosModulo(perfilModulo, {}) || {};
  const resumo = obterDadosModulo(resumoModulo, {}) || {};
  const gamificacaoResumo = obterDadosModulo(gamificacaoModulo, null);
  const resumoPendencias = obterDadosModulo(pendenciasModulo, null);
  const ultimasPartidas = (obterDadosModulo(ultimasPartidasModulo, []) || []).slice(0, 3);
  const conexoes = obterDadosModulo(conexoesModulo, {}) || {};
  const melhoresParceiros = conexoes.melhoresParceiros || [];
  const parceirosRecentes = conexoes.parceirosRecentes || [];
  const parceiroMomento = melhoresParceiros[0] || parceirosRecentes[0] || null;
  const nomePrincipal = nomeAtleta({
    nome: perfil.nome || usuario?.nome,
    apelido: perfil.apelido || usuario?.apelido
  });
  const fotoPerfilUrl = obterFotoPerfilAvatar(perfil) || obterFotoPerfilAvatar(usuario);
  const perfilDestino = montarRotaPerfilAtleta(perfil.atletaId || usuario?.atletaId, usuario) || HOME_NAVIGATION.perfil;
  const grupoAtual = obterGrupoAtual(ultimasPartidas);
  const faixa = formatarFaixa(gamificacaoResumo?.nivel?.nome || perfil.categoriaPrincipal);
  const totalPartidas = Number(resumo.totalPartidas ?? 0);
  const totalVitorias = Number(resumo.vitorias ?? 0);
  const resumoHero = obterResumoHero(totalPartidas, totalVitorias, grupoAtual);
  const jornada = montarJornada({
    totalPartidas,
    vitorias: totalVitorias,
    grupoAtual,
    posicaoRanking: perfil.posicaoRanking
  });
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
      icone: FaGamepad
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

  const destaques = [
    {
      id: 'ranking',
      titulo: 'Ranking pessoal',
      valor: perfil.posicaoRanking ? `#${perfil.posicaoRanking}` : 'Sem ranking',
      descricao: perfil.posicaoRanking ? 'posição atual' : 'jogue para ranquear',
      icone: FaMedal,
      destino: HOME_NAVIGATION.ranking
    },
    {
      id: 'dupla',
      titulo: 'Dupla do momento',
      valor: parceiroMomento ? nomeAtleta(parceiroMomento) : 'A descobrir',
      descricao: parceiroMomento ? `${formatarPercentual(parceiroMomento.aproveitamento)} juntos` : 'registre partidas em dupla',
      icone: FaStar,
      destino: HOME_NAVIGATION.meusJogos
    }
  ];

  return (
    <section className="pagina home-dashboard">
      <HomeHero
        nomePrincipal={nomePrincipal}
        fotoPerfilUrl={fotoPerfilUrl}
        grupoAtual={grupoAtual}
        faixa={faixa}
        perfilDestino={perfilDestino}
        resumoPendencias={resumoPendencias}
        resumoHero={resumoHero}
      />

      {deveCriarSenhaConta && (
        <Link to={HOME_NAVIGATION.perfil} className="home-dashboard-alerta-senha">
          <span><FaBell aria-hidden="true" /></span>
          <strong>Crie sua senha para continuar acessando sua conta com segurança.</strong>
          <em>Criar senha agora</em>
        </Link>
      )}

      <HomeScouts scouts={scouts} erro={resumoModulo.erro} />

      <HomeJornada jornada={jornada} />

      <HomeAcoesPrincipais />

      <HomeDestaques destaques={destaques} />

      <HomeAtividadeRecente
        ultimasPartidas={ultimasPartidas}
        erro={ultimasPartidasModulo.erro}
      />

      <HomeDicaRapida />
    </section>
  );
}

function HomeHero({ nomePrincipal, fotoPerfilUrl, grupoAtual, faixa, perfilDestino, resumoPendencias, resumoHero }) {
  return (
    <header
      className="home-dashboard-hero"
      style={{ '--home-hero-image': `url(${heroFutevolei})` }}
      role="region"
      aria-label="Resumo principal da Home"
    >
      <div className="home-dashboard-hero-acoes">
        <Link to={perfilDestino} className="home-dashboard-hero-icone" aria-label="Editar perfil">
          <FaEdit aria-hidden="true" />
        </Link>
        <NotificacoesBotao autenticado resumo={resumoPendencias} />
      </div>

      <div className="home-dashboard-hero-identidade">
        <AvatarUsuario
          nome={nomePrincipal}
          fotoPerfilUrl={fotoPerfilUrl}
          tamanho="xl"
          className="home-dashboard-avatar"
        />

        <div className="home-dashboard-hero-texto">
          <h1>{nomePrincipal}</h1>
          <div className="home-dashboard-hero-meta">
            <span>{grupoAtual}</span>
            <span>{faixa}</span>
          </div>
          <p className="home-dashboard-hero-resumo">
            <strong>{resumoHero.destaque}</strong>
            <span>{resumoHero.apoio}</span>
          </p>
        </div>
      </div>
    </header>
  );
}

function HomeScouts({ scouts, erro }) {
  return (
    <section className="home-dashboard-scouts" aria-labelledby="home-scouts-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="home-scouts-titulo">Meus principais scouts</h2>
      </div>

      {erro ? (
        <p className="home-dashboard-vazio">Não foi possível carregar seus scouts agora.</p>
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

function HomeJornada({ jornada }) {
  return (
    <section className="home-dashboard-jornada" aria-labelledby="home-jornada-titulo">
      <div className="home-dashboard-jornada-topo">
        <span>{jornada.porcentagem}%</span>
        <div>
          <h2 id="home-jornada-titulo">Sua jornada</h2>
          <strong>{jornada.titulo}</strong>
          <p>{jornada.descricao}</p>
        </div>
      </div>

      <div className="home-dashboard-jornada-progresso" aria-hidden="true">
        <span style={{ width: `${jornada.porcentagem}%` }} />
      </div>

      <ol className="home-dashboard-jornada-etapas">
        {jornada.etapas.map((etapa) => (
          <li
            key={etapa.id}
            className={[
              etapa.concluida ? 'concluida' : '',
              etapa.id === jornada.etapaAtualId ? 'atual' : ''
            ].filter(Boolean).join(' ')}
          >
            <span aria-hidden="true" />
            <em>{etapa.titulo}</em>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HomeAcoesPrincipais() {
  return (
    <section className="home-dashboard-acoes-principais" aria-label="Ações principais">
      <Link to={HOME_NAVIGATION.registrarPartida} className="home-dashboard-cta home-dashboard-cta-principal">
        <span className="home-dashboard-cta-icone"><FaPlus aria-hidden="true" /></span>
        <span>
          <strong>Registrar Partida</strong>
          <small>Salve seu jogo e atualize sua evolução.</small>
        </span>
        <FaChevronRight aria-hidden="true" />
      </Link>

      <Link to={HOME_NAVIGATION.grupos} className="home-dashboard-cta home-dashboard-cta-secundario">
        <span className="home-dashboard-cta-icone"><FaUsers aria-hidden="true" /></span>
        <span>
          <strong>Ainda joga sem grupo?</strong>
          <small>Crie um grupo e acompanhe ranking, histórico e scouts com sua galera.</small>
          <em>Criar Grupo</em>
        </span>
        <FaChevronRight aria-hidden="true" />
      </Link>
    </section>
  );
}

function HomeDestaques({ destaques }) {
  return (
    <section className="home-dashboard-destaques" aria-labelledby="home-destaques-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="home-destaques-titulo">Em destaque para você</h2>
        <Link to={HOME_NAVIGATION.meusJogos}>
          Ver todos
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>

      <div className="home-dashboard-destaques-grid">
        {destaques.map((item) => {
          const Icone = item.icone;
          return (
            <Link key={item.id} to={item.destino} className="home-dashboard-destaque-card">
              <Icone aria-hidden="true" />
              <span>{item.titulo}</span>
              <strong>{item.valor}</strong>
              <small>{item.descricao}</small>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function HomeDicaRapida() {
  return (
    <section className="home-dashboard-dica" aria-labelledby="home-dica-titulo">
      <FaLightbulb aria-hidden="true" />
      <div>
        <h2 id="home-dica-titulo">Dica rápida</h2>
        <p>Você pode registrar partidas informando apenas o vencedor ou o placar completo.</p>
        <p>Ambos contam para sua evolução.</p>
      </div>
      <Link to={HOME_NAVIGATION.registrarPartida}>Saiba mais</Link>
    </section>
  );
}

function HomeAtividadeRecente({ ultimasPartidas, erro }) {
  return (
    <section className="home-dashboard-atividade" aria-labelledby="home-atividade-titulo">
      <div className="home-dashboard-section-title home-dashboard-section-title-com-acao">
        <h2 id="home-atividade-titulo">Atividade recente</h2>
        <Link to={HOME_NAVIGATION.meusJogos}>Ver histórico</Link>
      </div>

      {erro ? (
        <p className="home-dashboard-vazio">Não foi possível carregar sua atividade agora.</p>
      ) : ultimasPartidas.length > 0 ? (
        <div className="home-dashboard-timeline">
          {ultimasPartidas.map((partida) => {
            const resultado = obterResultadoPartida(partida);
            const vitoria = resultado === 'Vitória';

            return (
              <article key={partida.id} className="home-dashboard-timeline-item">
                <span className="home-dashboard-timeline-ponto" aria-hidden="true" />
                <div className="home-dashboard-timeline-conteudo">
                  <div>
                    <strong>Você registrou uma partida</strong>
                    <span>{formatarDataAtividade(partida.dataPartida)}</span>
                  </div>
                  <p>{partida.grupo || partida.categoria || partida.competicao || 'Geral'}</p>
                  <footer>
                    <span>{obterPlacarPartida(partida)}</span>
                    <em className={vitoria ? 'vitoria' : 'derrota'}>{resultado}</em>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="home-dashboard-empty-state">
          <FaGamepad aria-hidden="true" />
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
      <div className="home-dashboard-hero home-dashboard-skeleton-card" />
      <div className="home-dashboard-scouts home-dashboard-skeleton-card" />
      <div className="home-dashboard-cta home-dashboard-cta-principal home-dashboard-skeleton-card" />
      <div className="home-dashboard-cta home-dashboard-cta-secundario home-dashboard-skeleton-card" />
    </section>
  );
}
