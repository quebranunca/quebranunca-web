import { useEffect, useMemo, useState } from 'react';
import {
  FaChevronRight,
  FaClock,
  FaEllipsisV,
  FaExclamationTriangle,
  FaFire,
  FaGlobeAmericas,
  FaLock,
  FaPencilAlt,
  FaTrashAlt,
  FaTrophy,
  FaUsers,
  FaVolleyballBall
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { AvatarGrupo } from '../components/grupos/AvatarGrupo';
import { AvatarGroup } from '../components/ui/AvatarGroup';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { gruposServico } from '../services/gruposServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import { extrairMensagemErro } from '../utils/erros';
import { formatarData, formatarDataHora, formatarHora } from '../utils/formatacao';
import { criarNavegacaoRegistroPartida } from '../utils/partidaRotas';

const TIPOS_PENDENCIA = {
  aprovarPartida: 1,
  completarContato: 2
};

function formatarPontos(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '0';
  }

  return Number.isInteger(numero) ? String(numero) : numero.toFixed(1).replace('.', ',');
}

function pluralizar(valor, singular, plural = `${singular}s`) {
  return Number(valor) === 1 ? singular : plural;
}

function nomeAtleta(atleta) {
  return obterNomeExibicaoAtleta(atleta) || atleta?.nome || 'Atleta';
}

function nomeCurtoAtleta(atleta) {
  return nomeAtleta(atleta).split(/\s+/).filter(Boolean)[0] || 'Atleta';
}

function listaSegura(valor) {
  return Array.isArray(valor) ? valor : [];
}

function normalizarAtletaPartida(atleta) {
  if (!atleta) {
    return null;
  }

  if (typeof atleta === 'string') {
    return { nome: atleta };
  }

  return atleta;
}

function normalizarDupla(dupla) {
  if (Array.isArray(dupla)) {
    return dupla.map(normalizarAtletaPartida).filter(Boolean);
  }

  if (!dupla) {
    return [];
  }

  if (typeof dupla === 'string') {
    return [{ nome: dupla }];
  }

  const listaInterna = dupla.atletas || dupla.jogadores || dupla.membros || dupla.integrantes;
  if (Array.isArray(listaInterna)) {
    return listaInterna.map(normalizarAtletaPartida).filter(Boolean);
  }

  return [
    dupla.atleta1,
    dupla.atleta2,
    dupla.jogador1,
    dupla.jogador2,
    dupla.primeiroAtleta,
    dupla.segundoAtleta
  ].map(normalizarAtletaPartida).filter(Boolean);
}

function formatarPosicaoDestaque(posicao) {
  if (!posicao) {
    return '';
  }

  const texto = String(posicao);
  return texto.includes('º') ? texto : `${texto}º`;
}

function nomeDupla(dupla, separador = ' + ') {
  return normalizarDupla(dupla).map(nomeAtleta).join(separador) || 'Dupla';
}

function obterDuplaVencedora(partida) {
  if (partida?.duplaVencedora === 1) {
    return normalizarDupla(partida.dupla1);
  }

  if (partida?.duplaVencedora === 2) {
    return normalizarDupla(partida.dupla2);
  }

  return [];
}

function formatarResultadoTexto(partida) {
  if (!partida?.possuiPlacarDetalhado) {
    const vencedora = partida?.duplaVencedora === 1 ? nomeDupla(partida.dupla1) : nomeDupla(partida.dupla2);
    const perdedora = partida?.duplaVencedora === 1 ? nomeDupla(partida.dupla2) : nomeDupla(partida.dupla1);
    return `${vencedora} venceu ${perdedora}`;
  }

  return `${partida.placarDupla1} x ${partida.placarDupla2}`;
}

function obterStatusPartidaGrupo(partida) {
  const status = String(partida?.status || '').trim();
  const statusNormalizado = status.toLowerCase();

  if (statusNormalizado === 'aprovada' || statusNormalizado === 'confirmada') {
    return { texto: 'Confirmada', classe: 'confirmada' };
  }

  if (statusNormalizado.includes('vinculo') || statusNormalizado.includes('vínculo')) {
    return { texto: 'Pendente de vínculo', classe: 'pendente' };
  }

  if (statusNormalizado.includes('pendente')) {
    return { texto: 'Pendente de confirmação', classe: 'pendente' };
  }

  return { texto: status || 'Pendente', classe: 'pendente' };
}

function formatarUltimaAtividade(data) {
  if (!data) {
    return 'Sem movimentação';
  }

  const hoje = new Date();
  const dataAtividade = new Date(data);
  const mesmoDia = hoje.toDateString() === dataAtividade.toDateString();

  if (mesmoDia) {
    return `Hoje às ${formatarHora(data)}`;
  }

  return formatarDataHora(data);
}

function formatarDiaAtividade(data) {
  if (!data) {
    return 'Sem data';
  }

  const hoje = new Date();
  const ontem = new Date();
  const dataEvento = new Date(data);
  ontem.setDate(hoje.getDate() - 1);

  if (hoje.toDateString() === dataEvento.toDateString()) {
    return 'Hoje';
  }

  if (ontem.toDateString() === dataEvento.toDateString()) {
    return 'Ontem';
  }

  return formatarData(data);
}

function obterPrivacidadeGrupo(privacidade) {
  const texto = String(privacidade || '').trim();
  const normalizado = texto.toLowerCase();
  const privado = normalizado.includes('priv');

  return {
    texto: texto || (privado ? 'Privado' : 'Público'),
    Icone: privado ? FaLock : FaGlobeAmericas
  };
}

function obterChaveDupla(dupla) {
  return normalizarDupla(dupla)
    .map((atleta) => atleta?.atletaId || atleta?.id)
    .filter(Boolean)
    .sort()
    .join('|');
}

function obterDuplasDaPartida(partida) {
  return [normalizarDupla(partida?.dupla1), normalizarDupla(partida?.dupla2)].filter((dupla) => dupla.length > 0);
}

function montarAtletasPreview(dashboard) {
  const mapa = new Map();

  function adicionar(atleta) {
    const atletaId = atleta?.atletaId || atleta?.id;
    if (!atletaId || mapa.has(atletaId)) {
      return;
    }

    mapa.set(atletaId, atleta);
  }

  listaSegura(dashboard?.ranking).forEach(adicionar);
  listaSegura(dashboard?.membrosMaisAtivos).forEach(adicionar);
  listaSegura(dashboard?.ultimasPartidas).forEach((partida) => {
    obterDuplasDaPartida(partida).forEach((dupla) => dupla.forEach(adicionar));
  });

  return [...mapa.values()];
}

function calcularDuplaDoMomento(partidas = []) {
  const mapa = new Map();

  listaSegura(partidas).forEach((partida) => {
    obterDuplasDaPartida(partida).forEach((dupla) => {
      const chave = obterChaveDupla(dupla);
      if (!chave) {
        return;
      }

      const atual = mapa.get(chave) || { chave, atletas: dupla, jogos: 0, vitorias: 0 };
      atual.jogos += 1;
      mapa.set(chave, atual);
    });

    const vencedora = obterDuplaVencedora(partida);
    const chaveVencedora = obterChaveDupla(vencedora);
    if (chaveVencedora && mapa.has(chaveVencedora)) {
      mapa.get(chaveVencedora).vitorias += 1;
    }
  });

  return [...mapa.values()]
    .sort((a, b) => b.vitorias - a.vitorias || b.jogos - a.jogos || nomeDupla(a.atletas).localeCompare(nomeDupla(b.atletas)))
    [0] || null;
}

function AvatarDupla({ atletas }) {
  const dupla = normalizarDupla(atletas).slice(0, 2).map((atleta) => ({
    id: atleta.atletaId || atleta.id || nomeAtleta(atleta),
    name: nomeAtleta(atleta),
    src: obterFotoPerfilAvatar(atleta),
    type: 'athlete'
  }));

  return (
    <AvatarGroup
      avatars={dupla}
      size="md"
      className="grupo-dashboard-dupla-avatares"
      ariaLabel={`Dupla ${dupla.map((atleta) => atleta.name).join(' e ') || 'sem atletas'}`}
    />
  );
}

function AtletaRankingLinhaGrupo({ atleta, posicao, detalhe, pontos, onClick }) {
  return (
    <button
      type="button"
      className="ranking-linha-compacta grupo-dashboard-ranking-linha"
      onClick={onClick}
      aria-label={`Abrir detalhes de ${nomeAtleta(atleta)}`}
    >
      <span className="ranking-linha-posicao">{posicao}</span>
      <AvatarUsuario
        nome={nomeAtleta(atleta)}
        fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
        tamanho="md"
        className="ranking-avatar"
      />
      <span className="ranking-linha-info">
        <strong>{nomeAtleta(atleta)}</strong>
        <small>{detalhe}</small>
      </span>
      {pontos !== undefined && (
        <span className="ranking-linha-pontos">
          <strong>{formatarPontos(pontos)}</strong>
          <small>pts</small>
        </span>
      )}
      <FaChevronRight className="ranking-linha-seta" aria-hidden="true" />
    </button>
  );
}

export function PaginaGrupoDashboard() {
  const { grupoId } = useParams();
  const navegar = useNavigate();
  const { showNotification } = useNotification();
  const { token } = useAutenticacao();
  const [dashboard, setDashboard] = useState(null);
  const [pendencias, setPendencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [menuAcoesAberto, setMenuAcoesAberto] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  const grupo = dashboard?.grupo;
  const resumo = dashboard?.resumo;
  const rankingTop3 = useMemo(() => listaSegura(dashboard?.ranking).slice(0, 3), [dashboard?.ranking]);
  const membrosMaisAtivos = useMemo(() => listaSegura(dashboard?.membrosMaisAtivos).slice(0, 5), [dashboard?.membrosMaisAtivos]);
  const ultimasPartidas = listaSegura(dashboard?.ultimasPartidas);
  const possuiPartidas = (resumo?.totalPartidas || grupo?.totalPartidas || ultimasPartidas.length || 0) > 0;
  const membrosPreview = useMemo(() => montarAtletasPreview(dashboard), [dashboard]);
  const membrosDestaque = useMemo(() => membrosPreview.slice(0, 3), [membrosPreview]);
  const membrosRestantes = Math.max((grupo?.totalMembros || 0) - membrosDestaque.length, 0);
  const mensagemMembrosVazia = (grupo?.totalMembros || 0) > 0
    ? 'Veja a lista completa para consultar os membros cadastrados.'
    : 'Nenhum membro no grupo ainda.';
  const podeRegistrarPartida = Boolean(grupo?.podeRegistrarPartida);
  const podeAdministrarGrupo = Boolean(grupo?.podeEditar || grupo?.podeExcluir);
  const podeExcluirGrupo = Boolean(grupo?.podeExcluir);
  const duplaDoMomento = useMemo(() => calcularDuplaDoMomento(ultimasPartidas), [ultimasPartidas]);
  const pendenciasResumo = useMemo(() => {
    const lista = Array.isArray(pendencias) ? pendencias : [];

    return {
      total: lista.length,
      partidas: lista.filter((item) => item.tipo === TIPOS_PENDENCIA.aprovarPartida).length,
      atletas: lista.filter((item) => item.tipo === TIPOS_PENDENCIA.completarContato).length
    };
  }, [pendencias]);
  useEffect(() => {
    carregarDashboard();
  }, [grupoId, token]);

  async function carregarDashboard() {
    setCarregando(true);
    setErro(false);

    try {
      const chamadas = [gruposServico.obterDashboardGrupo(grupoId)];
      if (token) {
        chamadas.push(pendenciasServico.listar());
      }

      const [resultadoDashboard, resultadoPendencias] = await Promise.allSettled(chamadas);

      if (resultadoDashboard.status === 'rejected') {
        throw resultadoDashboard.reason;
      }

      setDashboard(resultadoDashboard.value);
      setPendencias(token && resultadoPendencias?.status === 'fulfilled' ? resultadoPendencias.value || [] : []);
    } catch (error) {
      setErro(true);
      setDashboard(null);
      showNotification({
        type: 'error',
        title: 'Erro ao carregar grupo',
        message: extrairMensagemErro(error)
      });
    } finally {
      setCarregando(false);
    }
  }

  function abrirRegistroPartida() {
    if (!podeRegistrarPartida) {
      showNotification({
        type: 'warning',
        title: 'Acesso ao grupo necessário',
        message: 'Você precisa fazer parte deste grupo para registrar partidas nele.'
      });
      return;
    }

    const navegacaoRegistro = criarNavegacaoRegistroPartida({
      grupoId: grupo.id,
      origem: `/grupos/${grupo.id}`
    });

    navegar(navegacaoRegistro.to, { state: navegacaoRegistro.state });
  }

  function abrirConfiguracoes() {
    setMenuAcoesAberto(false);
    navegar(`/grupos/${grupo.id}/configuracoes`);
  }

  function abrirGerenciamentoMembros() {
    setMenuAcoesAberto(false);
    navegar(`/grupos/${grupo.id}/atletas`);
  }

  function abrirRegistroAdministrativo() {
    setMenuAcoesAberto(false);
    abrirRegistroPartida();
  }

  function abrirConfirmacaoExclusao() {
    setMenuAcoesAberto(false);
    setErroExclusao('');
    setConfirmandoExclusao(true);
  }

  function fecharConfirmacaoExclusao() {
    if (excluindo) {
      return;
    }

    setConfirmandoExclusao(false);
    setErroExclusao('');
  }

  async function excluirGrupo() {
    if (!podeExcluirGrupo || excluindo) {
      return;
    }

    setExcluindo(true);
    setErroExclusao('');

    try {
      await gruposServico.remover(grupo.id);
      setConfirmandoExclusao(false);
      showNotification({
        type: 'success',
        title: 'Grupo excluído',
        message: 'O grupo foi removido e o histórico esportivo foi preservado.'
      });
      navegar('/grupos', { replace: true });
    } catch (error) {
      setErroExclusao(extrairMensagemErro(error));
    } finally {
      setExcluindo(false);
    }
  }

  if (carregando) {
    return <section className="pagina grupo-dashboard-pagina"><article className="cartao-lista">Carregando dashboard do grupo...</article></section>;
  }

  if (erro || !dashboard) {
    return (
      <section className="pagina grupo-dashboard-pagina">
        <article className="cartao-lista grupos-dashboard-estado">
          <h3>Não foi possível carregar o dashboard</h3>
          <button type="button" className="botao-secundario" onClick={carregarDashboard}>Recarregar</button>
        </article>
      </section>
    );
  }

  const privacidadeGrupo = obterPrivacidadeGrupo(grupo.privacidade);
  const PrivacidadeIcone = privacidadeGrupo.Icone;

  return (
    <section className="pagina grupo-dashboard-pagina">
      <header className="grupo-dashboard-header grupo-dashboard-hero">
        <div className="grupo-dashboard-hero-topo">
          <AvatarGrupo
            grupo={grupo}
            nome={grupo.nome}
            imagemUrl={grupo.imagemUrl}
            tamanho="xl"
            className="grupo-dashboard-hero-avatar"
            alt={`Imagem do grupo ${grupo.nome}`}
          />
          <div className="grupo-dashboard-hero-acoes">
            <span className="grupo-dashboard-privacidade">
              <PrivacidadeIcone aria-hidden="true" />
              {privacidadeGrupo.texto}
            </span>
            {podeAdministrarGrupo && (
              <div className="grupo-dashboard-menu-acoes">
                <button
                  type="button"
                  className="grupo-dashboard-menu-botao"
                  onClick={() => setMenuAcoesAberto((aberto) => !aberto)}
                  aria-haspopup="menu"
                  aria-expanded={menuAcoesAberto}
                  aria-label="Ações do grupo"
                >
                  <FaEllipsisV aria-hidden="true" />
                </button>
                {menuAcoesAberto && (
                  <div className="grupo-dashboard-menu-lista" role="menu">
                    <button type="button" role="menuitem" onClick={abrirConfiguracoes}>
                      <FaPencilAlt aria-hidden="true" />
                      Editar grupo
                    </button>
                    <button type="button" role="menuitem" onClick={abrirGerenciamentoMembros}>
                      <FaUsers aria-hidden="true" />
                      Gerenciar membros
                    </button>
                    {podeRegistrarPartida && (
                      <button type="button" role="menuitem" onClick={abrirRegistroAdministrativo}>
                        <FaVolleyballBall aria-hidden="true" />
                        Registrar partida
                      </button>
                    )}
                    {podeExcluirGrupo && (
                      <button type="button" role="menuitem" className="perigo" onClick={abrirConfirmacaoExclusao}>
                        <FaTrashAlt aria-hidden="true" />
                        Excluir grupo
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grupo-dashboard-hero-conteudo">
          <h2>{grupo.nome}</h2>
          <div className="grupo-dashboard-hero-resumo" aria-label="Resumo do grupo">
            <span><FaUsers aria-hidden="true" /> {grupo.totalMembros} {pluralizar(grupo.totalMembros, 'membro')}</span>
            <span><FaVolleyballBall aria-hidden="true" /> {grupo.totalPartidas} {pluralizar(grupo.totalPartidas, 'partida')}</span>
            <span><FaClock aria-hidden="true" /> Última atividade: {formatarUltimaAtividade(resumo.ultimaPartidaEm)}</span>
          </div>
        </div>

        {podeRegistrarPartida && (
          <button type="button" className="botao-primario grupo-dashboard-hero-cta" onClick={abrirRegistroPartida}>
            Registrar partida
          </button>
        )}
      </header>

      <section className="grupo-dashboard-acoes-rapidas" aria-label="Ações do grupo">
        <button type="button" className="grupo-dashboard-acao-rapida" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>
          <span><FaUsers aria-hidden="true" /> Membros</span>
          <FaChevronRight aria-hidden="true" />
        </button>
        {possuiPartidas ? (
          <button type="button" className="grupo-dashboard-acao-rapida" onClick={() => navegar(`/ranking?tipo=grupos&grupoId=${grupo.id}`)}>
            <span><FaTrophy aria-hidden="true" /> Ranking</span>
            <FaChevronRight aria-hidden="true" />
          </button>
        ) : podeRegistrarPartida && (
          <button type="button" className="grupo-dashboard-acao-rapida" onClick={abrirRegistroPartida}>
            <span><FaVolleyballBall aria-hidden="true" /> Registrar primeira partida</span>
            <FaChevronRight aria-hidden="true" />
          </button>
        )}
      </section>

      <section className="grupo-dashboard-membros-card" aria-label="Membros do grupo">
        <div className="grupo-dashboard-membros-topo">
          <span className="grupo-dashboard-eyebrow"><FaUsers aria-hidden="true" /> Membros do grupo</span>
          <button type="button" className="grupo-dashboard-link-acao" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>
            Ver todos
            <FaChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="grupo-dashboard-membros-corpo">
          <div className="grupo-dashboard-membros-total">
            <span className="grupo-dashboard-membros-total-icone"><FaUsers aria-hidden="true" /></span>
            <strong>{grupo.totalMembros}</strong>
            <small>{pluralizar(grupo.totalMembros, 'membro')}</small>
          </div>

          <div className="grupo-dashboard-membros-destaques">
            <span className="grupo-dashboard-membros-subtitulo">Membros em destaque</span>
            {membrosDestaque.length > 0 ? (
              <div className="grupo-dashboard-membros-lista">
                {membrosDestaque.map((atleta) => (
                  <div key={atleta.atletaId || atleta.id || nomeAtleta(atleta)} className="grupo-dashboard-membro">
                    <span className="grupo-dashboard-membro-avatar">
                      <AvatarUsuario
                        nome={nomeAtleta(atleta)}
                        fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                        tamanho="md"
                      />
                      {atleta.posicao && <span className="grupo-dashboard-membro-posicao">{formatarPosicaoDestaque(atleta.posicao)}</span>}
                    </span>
                    <small title={nomeAtleta(atleta)}>{nomeCurtoAtleta(atleta)}</small>
                  </div>
                ))}
                {membrosRestantes > 0 && (
                  <div className="grupo-dashboard-membros-restante">
                    <strong>+{membrosRestantes}</strong>
                    <small>{pluralizar(membrosRestantes, 'outro membro', 'outros membros')}</small>
                  </div>
                )}
              </div>
            ) : (
              <p className="grupo-dashboard-vazio">{mensagemMembrosVazia}</p>
            )}
          </div>
        </div>

        <button type="button" className="grupo-dashboard-membros-convite" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>
          <span><FaUsers aria-hidden="true" /> Ver membros do grupo</span>
          <FaChevronRight aria-hidden="true" />
        </button>
      </section>

      {!possuiPartidas && (
        <article className="grupo-dashboard-bloco grupo-dashboard-primeira-partida">
          <div>
            <span className="grupo-dashboard-eyebrow"><FaVolleyballBall aria-hidden="true" /> Comece pelo essencial</span>
            <h3>Grupo pronto para receber partidas</h3>
            <p className="grupo-dashboard-vazio">Ranking, dupla do momento, movimentação e últimas partidas aparecem automaticamente quando houver resultados.</p>
          </div>
          <div className="grupo-dashboard-primeira-partida-acoes">
            {podeRegistrarPartida && (
              <button type="button" className="botao-primario" onClick={abrirRegistroPartida}>Registrar primeira partida</button>
            )}
            {podeAdministrarGrupo && (
              <button type="button" className="botao-secundario" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>Adicionar membros</button>
            )}
          </div>
        </article>
      )}

      {possuiPartidas && (
        <>
          <article className="grupo-dashboard-bloco grupo-dashboard-ranking">
            <div className="grupo-dashboard-bloco-topo">
              <div>
                <span className="grupo-dashboard-eyebrow"><FaTrophy aria-hidden="true" /> Ranking</span>
                <h3>Top 3 do grupo</h3>
              </div>
              <button type="button" onClick={() => navegar(`/ranking?tipo=grupos&grupoId=${grupo.id}`)}>Ver ranking completo →</button>
            </div>
            {rankingTop3.length > 0 ? (
              <div className="ranking-lista-compacta grupo-dashboard-ranking-lista">
                {rankingTop3.map((atleta, indice) => (
                  <AtletaRankingLinhaGrupo
                    key={atleta.atletaId}
                    atleta={atleta}
                    posicao={`${atleta.posicao || indice + 1}º`}
                    detalhe={`${atleta.vitorias} ${pluralizar(atleta.vitorias, 'vitória')} • ${atleta.jogos} jogos`}
                    pontos={atleta.pontos}
                    onClick={() => navegar(`/ranking?tipo=grupos&grupoId=${grupo.id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="grupo-dashboard-vazio">O ranking aparece quando o grupo tiver partidas registradas.</p>
            )}
          </article>

          <article className="grupo-dashboard-bloco grupo-dashboard-dupla-momento">
            <div className="grupo-dashboard-dupla-cabecalho">
              <span className="grupo-dashboard-eyebrow"><FaFire aria-hidden="true" /> Dupla do momento</span>
            </div>
            {duplaDoMomento ? (
              <>
                <div className="grupo-dashboard-dupla-identidade">
                  <h3>{nomeDupla(duplaDoMomento.atletas)}</h3>
                  <AvatarDupla atletas={duplaDoMomento.atletas} />
                </div>
                <div className="grupo-dashboard-dupla-metricas">
                  <span><strong>{duplaDoMomento.jogos}</strong><small>jogos</small></span>
                  <span><strong>{duplaDoMomento.vitorias}</strong><small>vitórias</small></span>
                  <span><strong>{duplaDoMomento.jogos ? Math.round((duplaDoMomento.vitorias / duplaDoMomento.jogos) * 100) : 0}%</strong><small>aproveitamento</small></span>
                </div>
              </>
            ) : (
              <div className="grupo-dashboard-dupla-vazio">
                <h3>Ainda não há dupla em destaque</h3>
                <p className="grupo-dashboard-vazio">Registre partidas para gerar esse destaque.</p>
              </div>
            )}
          </article>
        </>
      )}

      {pendenciasResumo.total > 0 && (
        <article className="grupo-dashboard-bloco grupo-dashboard-pendencias">
          <div className="grupo-dashboard-bloco-topo">
            <div>
              <span className="grupo-dashboard-eyebrow"><FaExclamationTriangle aria-hidden="true" /> Pendências</span>
              <h3>{pendenciasResumo.total} {pluralizar(pendenciasResumo.total, 'pendência aberta', 'pendências abertas')}</h3>
            </div>
            <button type="button" onClick={() => navegar('/app/pendencias')}>Resolver pendências →</button>
          </div>
          <div className="grupo-dashboard-pendencias-lista">
            {pendenciasResumo.partidas > 0 && (
              <span>{pendenciasResumo.partidas} {pluralizar(pendenciasResumo.partidas, 'partida aguardando ação', 'partidas aguardando ação')}</span>
            )}
            {pendenciasResumo.atletas > 0 && (
              <span>{pendenciasResumo.atletas} {pluralizar(pendenciasResumo.atletas, 'atleta aguardando cadastro', 'atletas aguardando cadastro')}</span>
            )}
          </div>
        </article>
      )}

      {possuiPartidas && (
        <>
          <article className="grupo-dashboard-bloco">
            <div className="grupo-dashboard-bloco-topo">
              <div>
                <span className="grupo-dashboard-eyebrow"><FaClock aria-hidden="true" /> Atividade recente</span>
                <h3>Movimentação do grupo</h3>
              </div>
            </div>
            <div className="grupo-dashboard-atividade">
              {ultimasPartidas.slice(0, 4).map((partida) => (
                <div key={partida.id} className="grupo-dashboard-atividade-item">
                  <span>{formatarDiaAtividade(partida.data)}</span>
                  <strong>Partida registrada</strong>
                  <small>{nomeDupla(partida.dupla1)} contra {nomeDupla(partida.dupla2)}</small>
                </div>
              ))}
            </div>
          </article>

          {membrosMaisAtivos.length > 0 && (
            <article className="grupo-dashboard-bloco">
              <div className="grupo-dashboard-bloco-topo">
                <h3>Membros mais ativos</h3>
                <button type="button" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>Ver todos →</button>
              </div>
              <div className="ranking-lista-compacta">
                {membrosMaisAtivos.map((atleta, indice) => (
                  <AtletaRankingLinhaGrupo
                    key={atleta.atletaId}
                    atleta={atleta}
                    posicao={`${indice + 1}`}
                    detalhe={`${atleta.totalPartidas} partidas`}
                    onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}
                  />
                ))}
              </div>
            </article>
          )}

          <article className="grupo-dashboard-bloco">
            <h3>Últimas partidas</h3>
            <div className="grupo-dashboard-partidas">
              {ultimasPartidas.map((partida) => {
                const statusPartida = obterStatusPartidaGrupo(partida);

                return (
                  <div key={partida.id} className="grupo-dashboard-partida">
                    <span>{partida.data ? formatarData(partida.data) : 'Sem data'}</span>
                    <div className="grupo-dashboard-partida-placar">
                      <strong>{nomeDupla(partida.dupla1)}</strong>
                      <b>{formatarResultadoTexto(partida)}</b>
                      <strong>{nomeDupla(partida.dupla2)}</strong>
                    </div>
                    <small className={`grupo-dashboard-status ${statusPartida.classe}`}>{statusPartida.texto}</small>
                    {!partida.possuiPlacarDetalhado && (
                      <em>Resultado informado sem placar detalhado</em>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        </>
      )}

      {confirmandoExclusao && (
        <div className="modal-backdrop grupo-dashboard-confirmacao-backdrop" role="presentation" onClick={fecharConfirmacaoExclusao}>
          <article
            className="modal-conteudo grupo-dashboard-confirmacao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="grupo-dashboard-excluir-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="grupo-dashboard-confirmacao-topo">
              <span className="grupo-dashboard-confirmacao-icone" aria-hidden="true">
                <FaExclamationTriangle />
              </span>
              <div>
                <h3 id="grupo-dashboard-excluir-titulo">Excluir grupo?</h3>
                <p>Esta ação removerá o grupo.</p>
                <p>As partidas, histórico, rankings e scouts continuarão preservados.</p>
              </div>
            </div>
            {erroExclusao && <p className="texto-erro">{erroExclusao}</p>}
            <div className="grupo-dashboard-confirmacao-acoes">
              <button type="button" className="botao-terciario" onClick={fecharConfirmacaoExclusao} disabled={excluindo}>
                Cancelar
              </button>
              <button type="button" className="botao-perigo" onClick={excluirGrupo} disabled={excluindo}>
                <FaTrashAlt aria-hidden="true" />
                {excluindo ? 'Excluindo...' : 'Excluir grupo'}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
