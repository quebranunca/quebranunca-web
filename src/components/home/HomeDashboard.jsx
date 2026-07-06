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
import { montarRotaPerfilAtleta } from '../../utils/perfilAtleta';
import { obterNomeGrupoPartidaExibicao } from '../../utils/partidas';
import { formatarData } from '../../utils/formatacao';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
import { NotificacoesBotao } from '../NotificacoesBotao';

const HOME_NAVIGATION = Object.freeze({
  meusJogos: '/minhas-partidas',
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
  const ultimasPartidasModulo = obterEstadoModulo(modulos, 'ultimasPartidas', dashboard?.ultimasPartidas || []);

  const perfil = obterDadosModulo(perfilModulo, {}) || {};
  const resumo = obterDadosModulo(resumoModulo, {}) || {};
  const resumoPendencias = obterDadosModulo(pendenciasModulo, null);
  const pendenciaConfirmacaoPartida = resumoPendencias?.confirmacaoPartidaMaisRecente || null;
  const ultimasPartidas = (obterDadosModulo(ultimasPartidasModulo, []) || []).slice(0, 3);
  const nomeCompleto = obterNomeCompletoPerfil(perfil, usuario);
  const apelido = obterApelidoPerfil(perfil, usuario, nomeCompleto);
  const fotoPerfilUrl = obterFotoPerfilAvatar(perfil) || obterFotoPerfilAvatar(usuario);
  const perfilDestino = montarRotaPerfilAtleta(perfil.atletaId || usuario?.atletaId, usuario) || HOME_NAVIGATION.perfil;
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

  return (
    <section className="pagina home-dashboard">
      <HomeIdentidadeUsuario
        nomeCompleto={nomeCompleto}
        apelido={apelido}
        fotoPerfilUrl={fotoPerfilUrl}
        perfilDestino={perfilDestino}
        resumoPendencias={resumoPendencias}
      />

      <HomeConfirmarPartidaCard
        pendencia={pendenciaConfirmacaoPartida}
        confirmando={confirmandoPendenciaId === pendenciaConfirmacaoPartida?.id}
        contestando={contestandoPendenciaId === pendenciaConfirmacaoPartida?.id}
        onConfirmar={onConfirmarPendenciaPartida}
        onNaoReconhecer={onNaoReconhecerPendenciaPartida}
      />

      <HomeAcoesPrincipais />

      {deveCriarSenhaConta && (
        <Link to={HOME_NAVIGATION.perfil} className="home-dashboard-alerta-senha">
          <span><FaEdit aria-hidden="true" /></span>
          <strong>Crie sua senha para continuar acessando sua conta com segurança.</strong>
          <em>Criar senha agora</em>
        </Link>
      )}

      <HomeDesempenho scouts={scouts} erro={resumoModulo.erro} />

      <HomeUltimosJogos
        ultimasPartidas={ultimasPartidas}
        erro={ultimasPartidasModulo.erro}
      />
    </section>
  );
}

function HomeIdentidadeUsuario({ nomeCompleto, apelido, fotoPerfilUrl, perfilDestino, resumoPendencias }) {
  return (
    <header
      className="home-dashboard-identidade-card"
      role="region"
      aria-label="Identidade do usuário"
    >
      <AvatarUsuario
        nome={nomeCompleto}
        fotoPerfilUrl={fotoPerfilUrl}
        tamanho="xl"
        className="home-dashboard-avatar"
      />

      <div className="home-dashboard-identidade-texto">
        <h1>{nomeCompleto}</h1>
        {apelido && <p>{apelido}</p>}
      </div>

      <div className="home-dashboard-identidade-acoes">
        <NotificacoesBotao autenticado resumo={resumoPendencias} />
        <Link to={perfilDestino} className="home-dashboard-icone-redondo" aria-label="Editar perfil">
          <FaEdit aria-hidden="true" />
        </Link>
      </div>
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
            className="botao-primario"
            onClick={() => onConfirmar?.(pendencia.id)}
            disabled={processando}
          >
            {confirmando ? 'Confirmando...' : 'Confirmar'}
          </button>
          <button
            type="button"
            className="botao-terciario"
            onClick={() => onNaoReconhecer?.(pendencia.id)}
            disabled={processando || !onNaoReconhecer}
          >
            <FaTimes aria-hidden="true" />
            {contestando ? 'Enviando...' : 'Não fui eu'}
          </button>
        </div>
        <Link to="/app/pendencias" className="home-dashboard-confirmacao-link">
          Ver todas pendências
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
        <Link to={HOME_NAVIGATION.meusJogos}>
          Ver mais
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

      <Link to={HOME_NAVIGATION.grupos} className="home-dashboard-cta home-dashboard-cta-secundario">
        <span className="home-dashboard-cta-icone"><FaUsers aria-hidden="true" /></span>
        <span>
          <strong>Ainda joga sem grupo?</strong>
          <small>Crie um grupo e acompanhe ranking, histórico e scouts com sua galera.</small>
          <em>Criar grupo</em>
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
                <span className="home-dashboard-jogo-avatar" aria-hidden="true">
                  {obterIniciaisContexto(contexto)}
                </span>
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

function obterIniciaisContexto(contexto) {
  const partes = String(contexto || '')
    .replace(/^partida avulsa$/i, 'PA')
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) {
    return 'QN';
  }

  return partes
    .slice(0, 2)
    .map((parte) => Array.from(parte)[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
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
