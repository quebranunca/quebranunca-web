import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { RegistrarPartidaNovoContainer } from '../containers/partidas/RegistrarPartidaNovoContainer';
import { useNotification } from '../contexts/NotificationContext';
import { gruposServico } from '../services/gruposServico';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';

function formatarPontos(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '0 pts';
  }

  return `${Number.isInteger(numero) ? numero : numero.toFixed(1).replace('.', ',')} pts`;
}

function nomeAtleta(atleta) {
  return obterNomeExibicaoAtleta(atleta) || atleta?.nome || 'Atleta';
}

function nomeDupla(dupla) {
  return (dupla || []).map(nomeAtleta).join(' / ') || 'Dupla';
}

function formatarResultado(partida) {
  if (!partida?.possuiPlacarDetalhado) {
    const vencedora = partida?.duplaVencedora === 1 ? nomeDupla(partida.dupla1) : nomeDupla(partida.dupla2);
    const perdedora = partida?.duplaVencedora === 1 ? nomeDupla(partida.dupla2) : nomeDupla(partida.dupla1);
    return `${vencedora} venceu ${perdedora}`;
  }

  return `${nomeDupla(partida.dupla1)} ${partida.placarDupla1} x ${partida.placarDupla2} ${nomeDupla(partida.dupla2)}`;
}

function CardResumo({ rotulo, valor }) {
  return (
    <article className="grupo-dashboard-resumo-card">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </article>
  );
}

function ListaAtleta({ atleta, detalhe, posicao }) {
  return (
    <li>
      {posicao && <span className="grupo-dashboard-posicao">{posicao}º</span>}
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

export function PaginaGrupoDashboard() {
  const { grupoId } = useParams();
  const navegar = useNavigate();
  const { showNotification } = useNotification();
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [registroAberto, setRegistroAberto] = useState(false);

  const grupo = dashboard?.grupo;
  const resumo = dashboard?.resumo;

  const ultimaPartida = useMemo(() => {
    if (!resumo?.ultimaPartidaEm) {
      return 'Sem partidas';
    }

    return formatarDataHora(resumo.ultimaPartidaEm);
  }, [resumo?.ultimaPartidaEm]);

  useEffect(() => {
    carregarDashboard();
  }, [grupoId]);

  async function carregarDashboard() {
    setCarregando(true);
    setErro(false);

    try {
      const dados = await gruposServico.obterDashboardGrupo(grupoId);
      setDashboard(dados);
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
          <AvatarUsuario nome={grupo.nome} fotoPerfilUrl={grupo.imagemUrl} tamanho="lg" />
          <div>
            <span>{grupo.privacidade}</span>
            <h2>{grupo.nome}</h2>
            <p>{grupo.totalMembros} membros • {grupo.totalPartidas} partidas</p>
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
        <CardResumo rotulo="Atletas ativos" valor={resumo.totalAtletasAtivos} />
        <CardResumo rotulo="Última partida" valor={ultimaPartida} />
      </section>

      <section className="grupo-dashboard-grid">
        <article className="grupo-dashboard-bloco">
          <div className="grupo-dashboard-bloco-topo">
            <h3>Ranking do grupo</h3>
            <button type="button" onClick={() => navegar(`/ranking?tipo=grupos&grupoId=${grupo.id}`)}>Ver completo</button>
          </div>
          <ol className="grupo-dashboard-lista-atletas">
            {(dashboard.ranking || []).map((atleta) => (
              <ListaAtleta
                key={atleta.atletaId}
                atleta={atleta}
                posicao={atleta.posicao}
                detalhe={`${formatarPontos(atleta.pontos)} • ${atleta.jogos} jogos • ${atleta.vitorias} vitórias`}
              />
            ))}
          </ol>
        </article>

        <article className="grupo-dashboard-bloco">
          <h3>Membros mais ativos</h3>
          <ol className="grupo-dashboard-lista-atletas">
            {(dashboard.membrosMaisAtivos || []).map((atleta) => (
              <ListaAtleta
                key={atleta.atletaId}
                atleta={atleta}
                detalhe={`${atleta.totalPartidas} partidas`}
              />
            ))}
          </ol>
        </article>
      </section>

      <article className="grupo-dashboard-bloco">
        <h3>Últimas partidas</h3>
        <div className="grupo-dashboard-partidas">
          {(dashboard.ultimasPartidas || []).map((partida) => (
            <div key={partida.id} className="grupo-dashboard-partida">
              <span>{partida.data ? formatarDataHora(partida.data) : 'Sem data'}</span>
              <strong>{formatarResultado(partida)}</strong>
              <small>{partida.status}</small>
              {!partida.possuiPlacarDetalhado && (
                <em>Resultado informado sem placar detalhado</em>
              )}
            </div>
          ))}
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
