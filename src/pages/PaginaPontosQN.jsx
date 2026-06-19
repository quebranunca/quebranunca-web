import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaAward,
  FaCheckCircle,
  FaChevronRight,
  FaClipboardList,
  FaGift,
  FaHistory,
  FaLock,
  FaShareAlt,
  FaShoppingBag,
  FaStar,
  FaTrophy,
  FaUserFriends
} from 'react-icons/fa';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { useNotification } from '../contexts/NotificationContext';
import { gamificacaoServico } from '../services/gamificacaoServico';
import { extrairMensagemErro } from '../utils/erros';

const ABAS = [
  { id: 'resumo', rotulo: 'Pontos QN' },
  { id: 'beneficios', rotulo: 'Benefícios' },
  { id: 'historico', rotulo: 'Histórico' },
  { id: 'missoes', rotulo: 'Missões' },
  { id: 'conquistas', rotulo: 'Conquistas' }
];

const filtrosBeneficios = [
  { id: 'todos', rotulo: 'Todos', tipo: null },
  { id: 'descontos', rotulo: 'Descontos', tipo: 1 },
  { id: 'brindes', rotulo: 'Brindes', tipo: 2 },
  { id: 'experiencias', rotulo: 'Experiências', tipo: 3 }
];

const filtrosHistorico = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'ganhos', rotulo: 'Ganhos' },
  { id: 'resgates', rotulo: 'Resgates' }
];

function formatarPontos(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

function obterPrimeiroNome(usuario) {
  return (usuario?.nome || 'Atleta').split(' ')[0];
}

function calcularPontosSemana(extrato = []) {
  const agora = new Date();
  const inicio = new Date(agora);
  const dia = inicio.getDay();
  const diff = (dia + 6) % 7;
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - diff);

  return extrato
    .filter((item) => item.pontos > 0 && new Date(item.criadoEm) >= inicio)
    .reduce((total, item) => total + Number(item.pontos || 0), 0);
}

function filtrarHistorico(extrato, filtro) {
  if (filtro === 'ganhos') {
    return extrato.filter((item) => item.pontos > 0);
  }

  if (filtro === 'resgates') {
    return extrato.filter((item) => item.pontos < 0);
  }

  return extrato;
}

function filtrarBeneficios(beneficios, filtro) {
  const tipo = filtrosBeneficios.find((item) => item.id === filtro)?.tipo;
  if (!tipo) {
    return beneficios;
  }

  return beneficios.filter((beneficio) => Number(beneficio.tipo) === tipo);
}

function obterStatusResgate(resgates, beneficioId) {
  return resgates.find((resgate) =>
    resgate.beneficioId === beneficioId &&
    Number(resgate.status) === 1);
}

function BarraProgresso({ valor }) {
  return (
    <div className="pontosqn-progresso" aria-hidden="true">
      <span style={{ width: `${Math.max(0, Math.min(100, Number(valor || 0)))}%` }} />
    </div>
  );
}

function EstadoPainel({ tipo = 'vazio', titulo, texto }) {
  const Icone = tipo === 'erro' ? FaLock : FaStar;
  return (
    <div className={`pontosqn-estado pontosqn-estado-${tipo}`}>
      <Icone aria-hidden="true" />
      <strong>{titulo}</strong>
      <p>{texto}</p>
    </div>
  );
}

function BeneficioCard({ beneficio, resgateSolicitado, resgatando, onResgatar }) {
  const saldoSuficiente = Boolean(beneficio.saldoSuficiente);
  const textoBotao = resgateSolicitado
    ? 'Solicitado'
    : saldoSuficiente
      ? 'Trocar'
      : `Faltam ${formatarPontos(beneficio.pontosFaltantes)} pts`;

  return (
    <article className={`pontosqn-beneficio-card ${beneficio.destaque ? 'destaque' : ''}`}>
      <div className="pontosqn-beneficio-topo">
        <span className="pontosqn-icone">
          <FaGift aria-hidden="true" />
        </span>
        <span>{beneficio.tipoNome}</span>
      </div>
      <h3>{beneficio.titulo}</h3>
      <p>{beneficio.descricao}</p>
      <div className="pontosqn-beneficio-rodape">
        <strong>{formatarPontos(beneficio.pontosNecessarios)} pts</strong>
        <button
          type="button"
          className={saldoSuficiente && !resgateSolicitado ? 'botao-primario' : 'botao-secundario'}
          disabled={!saldoSuficiente || Boolean(resgateSolicitado) || resgatando}
          onClick={() => onResgatar(beneficio)}
        >
          {resgatando ? 'Solicitando...' : textoBotao}
        </button>
      </div>
    </article>
  );
}

function HistoricoItem({ item }) {
  const positivo = Number(item.pontos) > 0;
  return (
    <li className="pontosqn-historico-item">
      <span className={`pontosqn-historico-icone ${positivo ? 'positivo' : 'negativo'}`}>
        {positivo ? <FaStar aria-hidden="true" /> : <FaShoppingBag aria-hidden="true" />}
      </span>
      <div>
        <strong>{item.descricao}</strong>
        <small>{item.tipoEventoNome} · {new Date(item.criadoEm).toLocaleDateString('pt-BR')}</small>
      </div>
      <b className={positivo ? 'positivo' : 'negativo'}>{positivo ? '+' : ''}{formatarPontos(item.pontos)}</b>
    </li>
  );
}

function MissaoCard({ missao }) {
  const progresso = missao.meta > 0 ? (missao.progressoAtual / missao.meta) * 100 : 0;
  return (
    <article className={`pontosqn-missao-card ${missao.concluida ? 'concluida' : ''}`}>
      <div>
        <strong>{missao.titulo}</strong>
        <p>{missao.descricao}</p>
      </div>
      <span>{missao.progressoAtual}/{missao.meta}</span>
      <BarraProgresso valor={progresso} />
      <small>{formatarPontos(missao.pontosRecompensa)} pts · até {new Date(missao.terminaEm).toLocaleDateString('pt-BR')}</small>
    </article>
  );
}

function ConquistaCard({ conquista }) {
  const progresso = conquista.meta > 0 ? (conquista.progressoAtual / conquista.meta) * 100 : 0;
  return (
    <article className={`pontosqn-conquista-card ${conquista.desbloqueada ? 'desbloqueada' : 'bloqueada'}`}>
      <span className="pontosqn-icone">
        {conquista.desbloqueada ? <FaAward aria-hidden="true" /> : <FaLock aria-hidden="true" />}
      </span>
      <div>
        <strong>{conquista.titulo}</strong>
        <p>{conquista.descricao}</p>
        <BarraProgresso valor={progresso} />
        <small>{conquista.progressoAtual}/{conquista.meta}</small>
      </div>
    </article>
  );
}

export function PaginaPontosQN() {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const [aba, setAba] = useState('resumo');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState(null);
  const [beneficios, setBeneficios] = useState([]);
  const [extrato, setExtrato] = useState([]);
  const [resgates, setResgates] = useState([]);
  const [missoes, setMissoes] = useState([]);
  const [conquistas, setConquistas] = useState([]);
  const [filtroBeneficio, setFiltroBeneficio] = useState('todos');
  const [filtroHistorico, setFiltroHistorico] = useState('todos');
  const [resgatandoId, setResgatandoId] = useState('');

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [resumoApi, beneficiosApi, extratoApi, resgatesApi, missoesApi, conquistasApi] = await Promise.all([
        gamificacaoServico.obterResumo(),
        gamificacaoServico.listarBeneficios(),
        gamificacaoServico.listarExtrato({ pagina: 1, quantidadePorPagina: 30 }),
        gamificacaoServico.listarResgates(),
        gamificacaoServico.listarMissoes(),
        gamificacaoServico.listarConquistas()
      ]);

      setResumo(resumoApi);
      setBeneficios(beneficiosApi || []);
      setExtrato(extratoApi?.itens || []);
      setResgates(resgatesApi || []);
      setMissoes(missoesApi || []);
      setConquistas(conquistasApi || []);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const saldo = resumo?.pontuacao?.saldoAtual || 0;
  const nivel = resumo?.nivel;
  const atividade = resumo?.atividade;
  const temAtletaVinculado = resumo?.pontuacao?.temAtletaVinculado !== false;
  const beneficiosFiltrados = useMemo(
    () => filtrarBeneficios(beneficios, filtroBeneficio),
    [beneficios, filtroBeneficio]
  );
  const historicoFiltrado = useMemo(
    () => filtrarHistorico(extrato, filtroHistorico),
    [extrato, filtroHistorico]
  );
  const pontosSemana = useMemo(() => calcularPontosSemana(extrato), [extrato]);
  const mediaSemanal = Math.round((resumo?.pontuacao?.totalAcumulado || 0) / 4);
  const conquistasDesbloqueadas = conquistas.filter((item) => item.desbloqueada);
  const conquistasBloqueadas = conquistas.filter((item) => !item.desbloqueada);
  const beneficioDestaque = beneficios.find((item) => item.destaque) || beneficios[0];

  async function solicitarResgate(beneficio) {
    if (!beneficio?.id || !window.confirm(`Solicitar resgate de ${beneficio.titulo} por ${beneficio.pontosNecessarios} Pontos QN?`)) {
      return;
    }

    setResgatandoId(beneficio.id);
    try {
      await gamificacaoServico.solicitarResgate(beneficio.id, { observacaoAtleta: '' });
      showNotification({
        type: 'success',
        title: 'Resgate solicitado',
        message: 'Resgate solicitado. Aguarde aprovação.'
      });
      await carregar();
      setAba('beneficios');
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Não foi possível solicitar',
        message: extrairMensagemErro(error)
      });
    } finally {
      setResgatandoId('');
    }
  }

  if (carregando) {
    return (
      <main className="pagina pontosqn-pagina">
        <EstadoPainel titulo="Carregando Pontos QN" texto="Buscando saldo, benefícios e missões." />
      </main>
    );
  }

  if (erro) {
    return (
      <main className="pagina pontosqn-pagina">
        <EstadoPainel tipo="erro" titulo="Não foi possível carregar" texto={erro} />
        <button type="button" className="botao-primario" onClick={carregar}>Tentar novamente</button>
      </main>
    );
  }

  return (
    <main className="pagina pontosqn-pagina">
      <section className="pontosqn-hero">
        <div>
          <span className="pontosqn-selo"><FaTrophy aria-hidden="true" /> Pontos QN</span>
          <h1>Bora jogar e somar pontos!</h1>
          <p>Oi, {obterPrimeiroNome(usuario)}. Pontos QN medem participação, qualidade dos dados e ações úteis para a comunidade.</p>
        </div>
        <div className="pontosqn-saldo-card">
          <span>Saldo atual</span>
          <strong>{formatarPontos(saldo)}</strong>
          <small>{nivel?.nome || 'Bronze'}</small>
          <BarraProgresso valor={nivel?.progressoPercentual || 0} />
          <em>Faltam {formatarPontos(nivel?.pontosRestantes || 0)} pontos para {nivel?.pontosProximaFaixa ? 'a próxima faixa' : 'manter Lenda QN'}</em>
        </div>
      </section>

      {!temAtletaVinculado && (
        <EstadoPainel
          tipo="erro"
          titulo="Usuário sem atleta vinculado"
          texto="Vincule seu atleta no perfil para acumular Pontos QN em partidas, compartilhamentos e resgates."
        />
      )}

      <nav className="ranking-tabs pontosqn-tabs" aria-label="Seções de Pontos QN">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={aba === item.id ? 'ativo' : ''}
            onClick={() => setAba(item.id)}
          >
            {item.rotulo}
          </button>
        ))}
      </nav>

      {aba === 'resumo' && (
        <section className="pontosqn-secao">
          {saldo === 0 && (
            <EstadoPainel
              titulo="Você ainda não tem pontos"
              texto="Registre ou participe de uma partida para começar."
            />
          )}

          <div className="pontosqn-metricas">
            <article><FaUserFriends aria-hidden="true" /><span>Partidas no mês</span><strong>{atividade?.partidasNoMes || 0}</strong></article>
            <article><FaCheckCircle aria-hidden="true" /><span>Sequência</span><strong>{atividade?.sequenciaSemanal || 0}</strong></article>
            <article><FaTrophy aria-hidden="true" /><span>Ranking</span><strong>{atividade?.posicaoRanking ? `${atividade.posicaoRanking}º` : '-'}</strong></article>
          </div>

          <section className="cartao pontosqn-como-ganhar">
            <h2>Como ganhar mais pontos</h2>
            <div className="pontosqn-acoes-grid">
              <Link to="/partidas/registrar"><FaClipboardList aria-hidden="true" /><span>Registrar partida</span><FaChevronRight aria-hidden="true" /></Link>
              <Link to="/app/meus-jogos"><FaUserFriends aria-hidden="true" /><span>Participar de partida</span><FaChevronRight aria-hidden="true" /></Link>
              <Link to="/feed"><FaShareAlt aria-hidden="true" /><span>Compartilhar resultado</span><FaChevronRight aria-hidden="true" /></Link>
            </div>
          </section>

          <section className="pontosqn-duas-colunas">
            <div className="cartao">
              <h2>Benefícios disponíveis</h2>
              <div className="pontosqn-lista-compacta">
                {beneficios.slice(0, 3).map((beneficio) => (
                  <button key={beneficio.id} type="button" onClick={() => setAba('beneficios')}>
                    <span>{beneficio.titulo}</span>
                    <strong>{formatarPontos(beneficio.pontosNecessarios)} pts</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="cartao">
              <h2>Atalhos</h2>
              <div className="pontosqn-lista-compacta">
                <button type="button" onClick={() => setAba('historico')}><span>Histórico de Pontos</span><FaHistory aria-hidden="true" /></button>
                <button type="button" onClick={() => setAba('beneficios')}><span>Benefícios</span><FaGift aria-hidden="true" /></button>
                <button type="button" onClick={() => setAba('conquistas')}><span>Conquistas</span><FaAward aria-hidden="true" /></button>
              </div>
            </div>
          </section>
        </section>
      )}

      {aba === 'beneficios' && (
        <section className="pontosqn-secao">
          <div className="pontosqn-secao-topo">
            <h2>Benefícios</h2>
            <span>{formatarPontos(saldo)} Pontos QN</span>
          </div>

          <div className="ranking-tabs pontosqn-filtros">
            {filtrosBeneficios.map((item) => (
              <button key={item.id} type="button" className={filtroBeneficio === item.id ? 'ativo' : ''} onClick={() => setFiltroBeneficio(item.id)}>
                {item.rotulo}
              </button>
            ))}
          </div>

          {beneficioDestaque && (
            <article className="pontosqn-beneficio-banner">
              <span><FaShoppingBag aria-hidden="true" /> Destaque</span>
              <strong>{beneficioDestaque.titulo}</strong>
              <p>{beneficioDestaque.descricao}</p>
            </article>
          )}

          {beneficiosFiltrados.length === 0 ? (
            <EstadoPainel titulo="Sem benefícios disponíveis" texto="Novos benefícios aparecerão aqui quando forem ativados." />
          ) : (
            <div className="pontosqn-beneficios-grid">
              {beneficiosFiltrados.map((beneficio) => (
                <BeneficioCard
                  key={beneficio.id}
                  beneficio={beneficio}
                  resgateSolicitado={obterStatusResgate(resgates, beneficio.id)}
                  resgatando={resgatandoId === beneficio.id}
                  onResgatar={solicitarResgate}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {aba === 'historico' && (
        <section className="pontosqn-secao">
          <div className="pontosqn-secao-topo">
            <h2>Histórico de Pontos</h2>
            <span>{formatarPontos(saldo)} pts</span>
          </div>
          <div className="pontosqn-metricas">
            <article><FaStar aria-hidden="true" /><span>Ganhos na semana</span><strong>{formatarPontos(pontosSemana)}</strong></article>
            <article><FaHistory aria-hidden="true" /><span>Média semanal</span><strong>{formatarPontos(mediaSemanal)}</strong></article>
          </div>
          <div className="ranking-tabs pontosqn-filtros">
            {filtrosHistorico.map((item) => (
              <button key={item.id} type="button" className={filtroHistorico === item.id ? 'ativo' : ''} onClick={() => setFiltroHistorico(item.id)}>
                {item.rotulo}
              </button>
            ))}
          </div>
          {historicoFiltrado.length === 0 ? (
            <EstadoPainel titulo="Sem movimentações" texto="Suas entradas e resgates aparecerão aqui." />
          ) : (
            <ul className="pontosqn-historico-lista">
              {historicoFiltrado.map((item) => <HistoricoItem key={item.id} item={item} />)}
            </ul>
          )}
        </section>
      )}

      {aba === 'missoes' && (
        <section className="pontosqn-secao">
          <div className="pontosqn-secao-topo">
            <h2>Missões da semana</h2>
            <span>{missoes.filter((item) => item.concluida).length}/{missoes.length}</span>
          </div>
          <div className="pontosqn-missoes-grid">
            {missoes.map((missao) => <MissaoCard key={missao.codigo} missao={missao} />)}
          </div>
        </section>
      )}

      {aba === 'conquistas' && (
        <section className="pontosqn-secao">
          <div className="pontosqn-secao-topo">
            <h2>Conquistas</h2>
            <span>{nivel?.nome || 'Bronze'} · {formatarPontos(saldo)} pts</span>
          </div>
          <h3>Desbloqueadas</h3>
          <div className="pontosqn-conquistas-grid">
            {conquistasDesbloqueadas.length > 0
              ? conquistasDesbloqueadas.map((conquista) => <ConquistaCard key={conquista.codigo} conquista={conquista} />)
              : <EstadoPainel titulo="Nenhuma conquista ainda" texto="A primeira vem quando você participa de uma partida válida." />}
          </div>
          <h3>Bloqueadas</h3>
          <div className="pontosqn-conquistas-grid">
            {conquistasBloqueadas.map((conquista) => <ConquistaCard key={conquista.codigo} conquista={conquista} />)}
          </div>
        </section>
      )}
    </main>
  );
}
