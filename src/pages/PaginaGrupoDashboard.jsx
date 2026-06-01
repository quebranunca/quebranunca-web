import { useEffect, useMemo, useState } from 'react';
import { FaChartLine, FaClock, FaExclamationTriangle, FaFire, FaTrophy } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { RegistrarPartidaNovoContainer } from '../containers/partidas/RegistrarPartidaNovoContainer';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { gruposServico } from '../services/gruposServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import { extrairMensagemErro } from '../utils/erros';
import { formatarData, formatarDataHora, formatarHora } from '../utils/formatacao';

const TIPOS_PENDENCIA = {
  aprovarPartida: 1,
  completarContato: 2
};

const MEDALHAS = ['1º', '2º', '3º'];

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

function nomeDupla(dupla, separador = ' + ') {
  return (dupla || []).map(nomeAtleta).join(separador) || 'Dupla';
}

function obterDuplaVencedora(partida) {
  if (partida?.duplaVencedora === 1) {
    return partida.dupla1 || [];
  }

  if (partida?.duplaVencedora === 2) {
    return partida.dupla2 || [];
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

function obterChaveDupla(dupla) {
  return (dupla || [])
    .map((atleta) => atleta?.atletaId || atleta?.id)
    .filter(Boolean)
    .sort()
    .join('|');
}

function obterDuplasDaPartida(partida) {
  return [partida?.dupla1 || [], partida?.dupla2 || []].filter((dupla) => dupla.length > 0);
}

function calcularDuplaDoMomento(partidas = []) {
  const mapa = new Map();

  partidas.forEach((partida) => {
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

function CardResumo({ rotulo, valor }) {
  return (
    <article className="grupo-dashboard-resumo-card">
      <strong>{valor}</strong>
      <span>{rotulo}</span>
    </article>
  );
}

function ListaAtleta({ atleta, detalhe, posicao, destaque }) {
  return (
    <li className={destaque ? 'grupo-dashboard-atleta-destaque' : undefined}>
      {posicao && <span className="grupo-dashboard-posicao">{posicao}</span>}
      <AvatarUsuario
        nome={nomeAtleta(atleta)}
        fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
        tamanho="sm"
      />
      <strong>{nomeAtleta(atleta)}</strong>
      <small>{detalhe}</small>
    </li>
  );
}

function AvatarDupla({ atletas }) {
  const dupla = atletas || [];

  return (
    <div className="grupo-dashboard-dupla-avatares" aria-hidden="true">
      {dupla.slice(0, 2).map((atleta) => (
        <AvatarUsuario
          key={atleta.atletaId || atleta.id || nomeAtleta(atleta)}
          nome={nomeAtleta(atleta)}
          fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
          tamanho="md"
        />
      ))}
    </div>
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
  const [registroAberto, setRegistroAberto] = useState(false);

  const grupo = dashboard?.grupo;
  const resumo = dashboard?.resumo;
  const rankingTop3 = useMemo(() => (dashboard?.ranking || []).slice(0, 3), [dashboard?.ranking]);
  const membrosMaisAtivos = useMemo(() => (dashboard?.membrosMaisAtivos || []).slice(0, 5), [dashboard?.membrosMaisAtivos]);
  const ultimasPartidas = dashboard?.ultimasPartidas || [];
  const duplaDoMomento = useMemo(() => calcularDuplaDoMomento(ultimasPartidas), [ultimasPartidas]);
  const pendenciasResumo = useMemo(() => {
    const lista = Array.isArray(pendencias) ? pendencias : [];

    return {
      total: lista.length,
      partidas: lista.filter((item) => item.tipo === TIPOS_PENDENCIA.aprovarPartida).length,
      atletas: lista.filter((item) => item.tipo === TIPOS_PENDENCIA.completarContato).length
    };
  }, [pendencias]);
  const estatisticas = useMemo(() => {
    const duplas = new Set();

    ultimasPartidas.forEach((partida) => {
      obterDuplasDaPartida(partida).forEach((dupla) => {
        const chave = obterChaveDupla(dupla);
        if (chave) {
          duplas.add(chave);
        }
      });
    });

    return {
      partidas: resumo?.totalPartidas || 0,
      atletas: resumo?.totalAtletasAtivos || 0,
      duplas: duplas.size,
      ultimaAtividade: formatarUltimaAtividade(resumo?.ultimaPartidaEm)
    };
  }, [resumo?.totalAtletasAtivos, resumo?.totalPartidas, resumo?.ultimaPartidaEm, ultimasPartidas]);

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

  return (
    <section className="pagina grupo-dashboard-pagina">
      <header className="grupo-dashboard-header">
        <div className="grupo-dashboard-identidade">
          <AvatarUsuario nome={grupo.nome} fotoPerfilUrl={grupo.imagemUrl} tamanho="xl" />
          <div>
            <span className="grupo-dashboard-privacidade">{grupo.privacidade}</span>
            <h2>{grupo.nome}</h2>
            <p>{grupo.totalMembros} membros • {grupo.totalPartidas} partidas • {resumo.totalAtletasAtivos} atletas ativos</p>
            <small>Última atividade: {formatarUltimaAtividade(resumo.ultimaPartidaEm)}</small>
          </div>
        </div>
        <div className="grupo-dashboard-acoes">
          {grupo.podeEditar && (
            <button type="button" className="botao-secundario" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>
              Editar grupo
            </button>
          )}
          <button type="button" className="botao-primario" onClick={() => setRegistroAberto(true)}>
            Registrar partida
          </button>
        </div>
      </header>

      <section className="grupo-dashboard-resumo">
        <CardResumo rotulo="Membros" valor={resumo.totalMembros} />
        <CardResumo rotulo="Partidas" valor={resumo.totalPartidas} />
        <CardResumo rotulo="Ativos" valor={resumo.totalAtletasAtivos} />
      </section>

      <article className="grupo-dashboard-bloco grupo-dashboard-ranking">
        <div className="grupo-dashboard-bloco-topo">
          <div>
            <span className="grupo-dashboard-eyebrow"><FaTrophy aria-hidden="true" /> Ranking</span>
            <h3>Top 3 do grupo</h3>
          </div>
          <button type="button" onClick={() => navegar(`/ranking?tipo=grupos&grupoId=${grupo.id}`)}>Ver ranking completo →</button>
        </div>
        {rankingTop3.length > 0 ? (
          <ol className="grupo-dashboard-lista-atletas grupo-dashboard-ranking-lista">
            {rankingTop3.map((atleta, indice) => (
              <ListaAtleta
                key={atleta.atletaId}
                atleta={atleta}
                posicao={MEDALHAS[indice] || `${atleta.posicao}º`}
                detalhe={`${atleta.vitorias} ${pluralizar(atleta.vitorias, 'vitória')} • ${formatarPontos(atleta.pontos)} pontos`}
                destaque={indice === 0}
              />
            ))}
          </ol>
        ) : (
          <p className="grupo-dashboard-vazio">O ranking aparece quando o grupo tiver partidas registradas.</p>
        )}
      </article>

      <article className="grupo-dashboard-bloco grupo-dashboard-dupla-momento">
        <div className="grupo-dashboard-bloco-topo">
          <div>
            <span className="grupo-dashboard-eyebrow"><FaFire aria-hidden="true" /> Dupla do momento</span>
            <h3>{duplaDoMomento ? nomeDupla(duplaDoMomento.atletas) : 'Aguardando partidas'}</h3>
          </div>
          {duplaDoMomento && <AvatarDupla atletas={duplaDoMomento.atletas} />}
        </div>
        {duplaDoMomento ? (
          <div className="grupo-dashboard-dupla-metricas">
            <span><strong>{duplaDoMomento.jogos}</strong> jogos</span>
            <span><strong>{duplaDoMomento.vitorias}</strong> vitórias</span>
            <span><strong>{duplaDoMomento.jogos ? Math.round((duplaDoMomento.vitorias / duplaDoMomento.jogos) * 100) : 0}%</strong> aproveitamento</span>
          </div>
        ) : (
          <p className="grupo-dashboard-vazio">Registre partidas para destacar a dupla em melhor fase.</p>
        )}
      </article>

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

      <article className="grupo-dashboard-bloco">
        <div className="grupo-dashboard-bloco-topo">
          <div>
            <span className="grupo-dashboard-eyebrow"><FaClock aria-hidden="true" /> Atividade recente</span>
            <h3>Movimentação do grupo</h3>
          </div>
        </div>
        {ultimasPartidas.length > 0 ? (
          <div className="grupo-dashboard-atividade">
            {ultimasPartidas.slice(0, 4).map((partida) => (
              <div key={partida.id} className="grupo-dashboard-atividade-item">
                <span>{formatarDiaAtividade(partida.data)}</span>
                <strong>{formatarResultadoTexto(partida)}</strong>
                <small>{nomeDupla(partida.dupla1)} contra {nomeDupla(partida.dupla2)}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="grupo-dashboard-vazio">Ainda não há movimentação esportiva no grupo.</p>
        )}
      </article>

      <section className="grupo-dashboard-grid">
        <article className="grupo-dashboard-bloco">
          <div className="grupo-dashboard-bloco-topo">
            <h3>Membros mais ativos</h3>
            <button type="button" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>Ver todos →</button>
          </div>
          <ol className="grupo-dashboard-lista-atletas">
            {membrosMaisAtivos.map((atleta, indice) => (
              <ListaAtleta
                key={atleta.atletaId}
                atleta={atleta}
                posicao={`${indice + 1}`}
                detalhe={`${atleta.totalPartidas} partidas`}
              />
            ))}
          </ol>
        </article>

        <article className="grupo-dashboard-bloco">
          <div className="grupo-dashboard-bloco-topo">
            <div>
              <span className="grupo-dashboard-eyebrow"><FaChartLine aria-hidden="true" /> Estatísticas</span>
              <h3>Nível de atividade</h3>
            </div>
          </div>
          <div className="grupo-dashboard-estatisticas">
            <span><strong>{estatisticas.partidas}</strong> partidas registradas</span>
            <span><strong>{estatisticas.atletas}</strong> atletas únicos</span>
            <span><strong>{estatisticas.duplas}</strong> duplas diferentes</span>
            <span><strong>Última atividade</strong> {estatisticas.ultimaAtividade}</span>
          </div>
        </article>
      </section>

      <article className="grupo-dashboard-bloco">
        <h3>Últimas partidas</h3>
        <div className="grupo-dashboard-partidas">
          {ultimasPartidas.map((partida) => (
            <div key={partida.id} className="grupo-dashboard-partida">
              <span>{partida.data ? formatarData(partida.data) : 'Sem data'}</span>
              <div className="grupo-dashboard-partida-placar">
                <strong>{nomeDupla(partida.dupla1)}</strong>
                <b>{formatarResultadoTexto(partida)}</b>
                <strong>{nomeDupla(partida.dupla2)}</strong>
              </div>
              <small>Status: {partida.status === 'Aprovada' ? 'Confirmada' : partida.status}</small>
              {!partida.possuiPlacarDetalhado && (
                <em>Resultado informado sem placar detalhado</em>
              )}
            </div>
          ))}
          {ultimasPartidas.length === 0 && (
            <p className="grupo-dashboard-vazio">Nenhuma partida registrada neste grupo.</p>
          )}
        </div>
      </article>

      {registroAberto && (
        <RegistrarPartidaNovoContainer
          contextoInicial={{ grupoId: grupo.id }}
          onFechar={() => {
            setRegistroAberto(false);
            carregarDashboard();
          }}
        />
      )}
    </section>
  );
}
