import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FaAward,
  FaChevronRight,
  FaClipboardList,
  FaGift,
  FaHistory,
  FaInfoCircle,
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
import beneficioBoneQN from '../assets/pontos-qn/beneficio-bone-qn.png';
import beneficioChaveiroQN from '../assets/pontos-qn/beneficio-chaveiro-qn.png';

const ABAS = [
  { id: 'resumo', rotulo: 'Pontos QN' },
  { id: 'beneficios', rotulo: 'Benefícios' },
  { id: 'como-ganhar', rotulo: 'Como ganhar' },
  { id: 'historico', rotulo: 'Histórico' }
];

const filtrosBeneficios = [
  { id: 'todos', rotulo: 'Todos', tipo: null },
  { id: 'descontos', rotulo: 'Descontos', tipo: 1 },
  { id: 'brindes', rotulo: 'Brindes', tipo: 2 },
  { id: 'experiencias', rotulo: 'Experiências', tipo: 3 },
  { id: 'produtos', rotulo: 'Produtos', tipo: 4 }
];

const imagensBeneficiosPontosQN = {
  'pontos-qn/beneficio-bone-qn.png': beneficioBoneQN,
  'pontos-qn/beneficio-chaveiro-qn.png': beneficioChaveiroQN
};

const filtrosHistorico = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'ganhos', rotulo: 'Ganhos' },
  { id: 'resgates', rotulo: 'Resgates' }
];

const regrasGanhoPontosQN = [
  { titulo: 'Participar de partida válida', pontos: 10, status: 'Ativo', descricao: 'Vale para atletas da partida depois que ela for considerada válida.' },
  { titulo: 'Registrar uma partida', pontos: 5, status: 'Ativo', descricao: 'Bônus para o atleta vinculado ao usuário que registrou a partida.' },
  { titulo: 'Partida com placar completo', pontos: 5, status: 'Ativo', descricao: 'Bônus de qualidade dos dados quando o placar é informado.' },
  { titulo: 'Vitória', pontos: 3, status: 'Ativo', descricao: 'Bônus leve para atletas da dupla vencedora, sem interferir no ranking.' },
  { titulo: 'Confirmar/aprovar partida', pontos: 2, status: 'Ativo', descricao: 'Para quem ajuda a validar uma partida pendente.' },
  { titulo: 'Resolver pendência de vínculo', pontos: 10, status: 'Ativo', descricao: 'Quando o vínculo é resolvido corretamente no fluxo atual.' },
  { titulo: 'Completar perfil', pontos: 50, status: 'Ativo', descricao: 'Uma única vez, quando o perfil de atleta estiver completo.' },
  { titulo: 'Compartilhar resultado', pontos: 5, status: 'Ativo', descricao: 'Limitado por partida/dia para evitar abuso.' },
  { titulo: 'Entrar em grupo', pontos: 20, status: 'Em breve', descricao: 'Regra prevista para pontuação automática por grupo.' },
  { titulo: 'Convidar atleta', pontos: 100, status: 'Em breve', descricao: 'Somente quando houver rastreabilidade confiável do convite.' }
];

const beneficiosReferenciaPontosQN = [
  { pontos: 500, beneficio: 'Condição especial em campanha', tipo: 'Campanha' },
  { pontos: 1000, beneficio: 'Benefício promocional QN', tipo: 'Campanha' },
  { pontos: 2000, beneficio: 'Chaveiro QuebraNunca', tipo: 'Produto' },
  { pontos: 2000, beneficio: 'Desconto promocional em produto QN', tipo: 'Campanha' },
  { pontos: 3000, beneficio: 'Benefício em produto parceiro', tipo: 'Campanha' },
  { pontos: 5000, beneficio: 'Condição especial QuebraNunca', tipo: 'Campanha' },
  { pontos: 8000, beneficio: 'Boné QuebraNunca', tipo: 'Produto' }
];

const abasDisponiveis = new Set(ABAS.map((item) => item.id));
const ordemProdutosDestaque = ['chaveiro', 'boné', 'bone'];
const padroesCopyFinanceiraBeneficio = [
  /r\$\s*\d+/i,
  /\b\d+\s*reais?\b/i,
  /\boff\b/i,
  /cashback/i,
  /saldo financeiro/i,
  /carteira/i,
  /cr[eé]dito financeiro/i,
  /convers[aã]o monet[aá]ria/i,
  /converter pontos em dinheiro/i
];

function obterAbaQuery(searchParams) {
  const aba = searchParams.get('aba');
  return abasDisponiveis.has(aba) ? aba : 'resumo';
}

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

function ehProdutoFisicoDestaque(beneficio) {
  const texto = `${beneficio?.titulo || ''} ${beneficio?.imagemUrl || ''}`.toLowerCase();
  return Number(beneficio?.tipo) === 4 ||
    texto.includes('chaveiro') ||
    texto.includes('boné') ||
    texto.includes('bone');
}

function ordenarProdutosDestaque(a, b) {
  const indiceA = ordemProdutosDestaque.findIndex((item) => `${a.titulo} ${a.imagemUrl || ''}`.toLowerCase().includes(item));
  const indiceB = ordemProdutosDestaque.findIndex((item) => `${b.titulo} ${b.imagemUrl || ''}`.toLowerCase().includes(item));
  return (indiceA === -1 ? 99 : indiceA) - (indiceB === -1 ? 99 : indiceB);
}

function obterImagemBeneficio(beneficio) {
  if (!beneficio?.imagemUrl) {
    return '';
  }

  return imagensBeneficiosPontosQN[beneficio.imagemUrl] || beneficio.imagemUrl;
}

function contemCopyFinanceiraBeneficio(texto) {
  return padroesCopyFinanceiraBeneficio.some((padrao) => padrao.test(texto || ''));
}

function obterTituloBeneficioSeguro(beneficio) {
  const titulo = beneficio?.titulo?.trim();
  if (titulo && !contemCopyFinanceiraBeneficio(titulo)) {
    return titulo;
  }

  const tipo = Number(beneficio?.tipo);
  const pontosNecessarios = Number(beneficio?.pontosNecessarios || 0);

  if (tipo === 4) {
    return 'Produto em campanha QuebraNunca';
  }

  if (tipo === 3) {
    return 'Experiência QuebraNunca';
  }

  if (tipo === 2) {
    return 'Brinde QuebraNunca';
  }

  if (pontosNecessarios >= 5000) {
    return 'Condição especial QuebraNunca';
  }

  if (pontosNecessarios >= 3000) {
    return 'Benefício em produto parceiro';
  }

  if (pontosNecessarios >= 2000) {
    return 'Desconto promocional em produto QN';
  }

  if (pontosNecessarios >= 1000) {
    return 'Benefício promocional QN';
  }

  return 'Condição especial em campanha';
}

function obterDescricaoBeneficioSegura(beneficio) {
  const descricao = beneficio?.descricao?.trim();
  if (descricao && !contemCopyFinanceiraBeneficio(descricao)) {
    return descricao;
  }

  return 'Benefício disponível por campanha QuebraNunca, sujeito à disponibilidade e validação.';
}

function obterTipoBeneficioSeguro(beneficio, produtoFisico) {
  if (produtoFisico) {
    return 'Produto físico';
  }

  const tipoNome = beneficio?.tipoNome?.trim();
  if (tipoNome && !contemCopyFinanceiraBeneficio(tipoNome)) {
    return tipoNome;
  }

  return 'Benefício promocional';
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

function EstadoPainel({ tipo = 'vazio', titulo, texto, children }) {
  const Icone = tipo === 'erro' ? FaLock : FaStar;
  return (
    <div className={`pontosqn-estado pontosqn-estado-${tipo}`}>
      <Icone aria-hidden="true" />
      <strong>{titulo}</strong>
      <p>{texto}</p>
      {children}
    </div>
  );
}

function BeneficioCard({ beneficio, resgateSolicitado, resgatando, onResgatar }) {
  const saldoSuficiente = Boolean(beneficio.saldoSuficiente);
  const imagemBeneficio = obterImagemBeneficio(beneficio);
  const produtoFisico = ehProdutoFisicoDestaque(beneficio);
  const tituloBeneficio = obterTituloBeneficioSeguro(beneficio);
  const descricaoBeneficio = obterDescricaoBeneficioSegura(beneficio);
  const tipoBeneficio = obterTipoBeneficioSeguro(beneficio, produtoFisico);
  const estado = resgateSolicitado
    ? 'Solicitado'
    : saldoSuficiente
      ? 'Disponível'
      : 'Pontos insuficientes';

  return (
    <article className={`pontosqn-beneficio-card ${produtoFisico ? 'produto-fisico' : ''} ${beneficio.destaque ? 'destaque' : ''} ${imagemBeneficio ? 'com-imagem' : ''}`}>
      {imagemBeneficio && (
        <div className="pontosqn-beneficio-imagem">
          <img src={imagemBeneficio} alt={tituloBeneficio} loading="lazy" />
        </div>
      )}
      <div className="pontosqn-beneficio-meta">
        <span className="pontosqn-beneficio-topo">
          <FaGift aria-hidden="true" />
          {tipoBeneficio}
        </span>
      </div>
      <h3>{tituloBeneficio}</h3>
      <p>{descricaoBeneficio}</p>
      <div className="pontosqn-beneficio-rodape">
        <div className="pontosqn-beneficio-custo">
          <span>Pontos necessários</span>
          <strong>{formatarPontos(beneficio.pontosNecessarios)} QN</strong>
        </div>
        {saldoSuficiente && !resgateSolicitado ? (
          <button
            type="button"
            className="botao-primario"
            disabled={resgatando}
            onClick={() => onResgatar(beneficio)}
          >
            {resgatando ? 'Solicitando...' : 'Resgatar'}
          </button>
        ) : (
          <span className={saldoSuficiente ? 'pontosqn-status disponivel' : 'pontosqn-status'}>
            {estado}
          </span>
        )}
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

function ComoGanharPontosQN() {
  return (
    <section className="pontosqn-secao pontosqn-regras">
      <div className="pontosqn-secao-topo">
        <h2>Como ganhar Pontos QN</h2>
      </div>

      <section className="cartao pontosqn-regras-card pontosqn-regras-intro">
        <span className="pontosqn-selo"><FaInfoCircle aria-hidden="true" /> O que são Pontos QN?</span>
        <p>
          Pontos QN são pontos promocionais da QuebraNunca. Você ganha participando da comunidade,
          registrando partidas, jogando, compartilhando resultados e participando de campanhas.
        </p>
        <p>
          Eles não são dinheiro, não podem ser sacados, não podem ser transferidos e só podem ser usados
          em benefícios da QuebraNunca.
        </p>
      </section>

      <section className="pontosqn-regras-grid">
        <article className="cartao pontosqn-regras-card">
          <h3>Como usar?</h3>
          <div className="pontosqn-economia-destaque">
            <strong>Benefícios promocionais</strong>
            <span>Use seus Pontos QN para desbloquear benefícios da comunidade.</span>
          </div>
          <p>Cada benefício pode ter regra, validade, limite e disponibilidade própria.</p>
        </article>

        <article className="cartao pontosqn-regras-card">
          <h3>Proteções do MVP</h3>
          <ul className="pontosqn-regras-lista">
            <li>Campanhas com QN têm limite e regras próprias.</li>
            <li>Frete ou logística só entram quando a campanha informar.</li>
            <li>Brindes são campanhas limitadas, não regra padrão.</li>
          </ul>
        </article>
      </section>

      <section className="cartao pontosqn-regras-card">
        <h3>Como ganhar?</h3>
        <div className="pontosqn-regras-ganhos">
          {regrasGanhoPontosQN.map((regra) => (
            <article key={regra.titulo} className={regra.status === 'Ativo' ? '' : 'em-breve'}>
              <div>
                <strong>{regra.titulo}</strong>
                <p>{regra.descricao}</p>
              </div>
              <span>{regra.status === 'Ativo' ? `+${regra.pontos} QN` : 'Em breve'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="cartao pontosqn-regras-card">
        <h3>Benefícios de referência</h3>
        <div className="pontosqn-regras-beneficios">
          {beneficiosReferenciaPontosQN.map((beneficio) => (
            <article key={`${beneficio.tipo}-${beneficio.pontos}-${beneficio.beneficio}`}>
              <strong>{formatarPontos(beneficio.pontos)} QN</strong>
              <span>{beneficio.beneficio}</span>
              <small>{beneficio.tipo}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="cartao pontosqn-regras-card">
        <h3>Regras importantes</h3>
        <ul className="pontosqn-regras-lista">
          <li>Pontos podem ser estornados se uma partida for cancelada, removida ou invalidada.</li>
          <li>Partidas duplicadas ou inválidas não geram pontos.</li>
          <li>Compartilhamentos têm limite para evitar acúmulo artificial.</li>
          <li>Benefícios podem ter validade, estoque limitado e aprovação manual.</li>
          <li>QN não pode ser convertido em dinheiro.</li>
        </ul>
      </section>
    </section>
  );
}

export function PaginaPontosQN() {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [aba, setAba] = useState(() => obterAbaQuery(searchParams));
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState(null);
  const [beneficios, setBeneficios] = useState([]);
  const [extrato, setExtrato] = useState([]);
  const [resgates, setResgates] = useState([]);
  const [filtroBeneficio, setFiltroBeneficio] = useState('todos');
  const [filtroHistorico, setFiltroHistorico] = useState('todos');
  const [resgatandoId, setResgatandoId] = useState('');

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [resumoApi, beneficiosApi, extratoApi, resgatesApi] = await Promise.all([
        gamificacaoServico.obterResumo(),
        gamificacaoServico.listarBeneficios(),
        gamificacaoServico.listarExtrato({ pagina: 1, quantidadePorPagina: 30 }),
        gamificacaoServico.listarResgates()
      ]);

      setResumo(resumoApi);
      setBeneficios(beneficiosApi || []);
      setExtrato(extratoApi?.itens || []);
      setResgates(resgatesApi || []);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    const abaUrl = obterAbaQuery(searchParams);
    setAba((abaAtual) => (abaAtual === abaUrl ? abaAtual : abaUrl));
  }, [searchParams]);

  const saldo = resumo?.pontuacao?.saldoAtual || 0;
  const nivel = resumo?.nivel;
  const temAtletaVinculado = resumo?.pontuacao?.temAtletaVinculado !== false;
  const produtosDestaque = useMemo(
    () => beneficios.filter(ehProdutoFisicoDestaque).sort(ordenarProdutosDestaque).slice(0, 2),
    [beneficios]
  );
  const idsProdutosDestaque = useMemo(
    () => new Set(produtosDestaque.map((item) => item.id)),
    [produtosDestaque]
  );
  const beneficiosFiltrados = useMemo(
    () => filtrarBeneficios(beneficios, filtroBeneficio),
    [beneficios, filtroBeneficio]
  );
  const mostrarProdutosDestaque = filtroBeneficio === 'todos' && produtosDestaque.length > 0;
  const beneficiosDaLista = useMemo(
    () => (mostrarProdutosDestaque
      ? beneficiosFiltrados.filter((item) => !idsProdutosDestaque.has(item.id))
      : beneficiosFiltrados),
    [beneficiosFiltrados, idsProdutosDestaque, mostrarProdutosDestaque]
  );
  const historicoFiltrado = useMemo(
    () => filtrarHistorico(extrato, filtroHistorico),
    [extrato, filtroHistorico]
  );
  const pontosSemana = useMemo(() => calcularPontosSemana(extrato), [extrato]);
  const mediaSemanal = Math.round((resumo?.pontuacao?.totalAcumulado || 0) / 4);

  async function solicitarResgate(beneficio) {
    const tituloBeneficio = obterTituloBeneficioSeguro(beneficio);
    if (!beneficio?.id || !window.confirm(`Solicitar resgate de ${tituloBeneficio} por ${beneficio.pontosNecessarios} Pontos QN?`)) {
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
      selecionarAba('beneficios');
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

  function selecionarAba(id) {
    setAba(id);
    setSearchParams(id === 'resumo' ? {} : { aba: id });
  }

  if (carregando && aba !== 'como-ganhar') {
    return (
      <main className="pagina pontosqn-pagina">
        <EstadoPainel titulo="Carregando Pontos QN" texto="Buscando saldo, benefícios e missões." />
      </main>
    );
  }

  if (erro && aba !== 'como-ganhar') {
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
        <div className="pontosqn-hero-texto">
          <span className="pontosqn-selo"><FaTrophy aria-hidden="true" /> Pontos QN</span>
          <h1>Bora jogar e somar pontos!</h1>
          <p>Oi, {obterPrimeiroNome(usuario)}. Pontos QN medem participação, qualidade dos dados e ações úteis para a comunidade.</p>
        </div>
        <div className="pontosqn-saldo-card">
          <div className="pontosqn-saldo-topo">
            <span>Pontos disponíveis</span>
            <small>{nivel?.nome || 'Bronze'}</small>
          </div>
          <strong>{formatarPontos(saldo)}</strong>
          <BarraProgresso valor={nivel?.progressoPercentual || 0} />
          <em>
            {nivel?.pontosProximaFaixa
              ? `Faltam ${formatarPontos(nivel?.pontosRestantes || 0)} pontos para a próxima faixa`
              : 'Faixa máxima alcançada'}
          </em>
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
            onClick={() => selecionarAba(item.id)}
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
              texto="Comece por uma ação simples e os Pontos QN aparecem no histórico assim que forem validados."
            >
              <div className="pontosqn-estado-dicas" aria-label="Próximos passos para ganhar Pontos QN">
                <span>Registrar uma partida</span>
                <span>Participar de jogos</span>
                <span>Completar o perfil</span>
                <span>Resolver pendências</span>
              </div>
            </EstadoPainel>
          )}

          <section className="cartao pontosqn-como-ganhar">
            <h2>Como ganhar mais pontos</h2>
            <div className="pontosqn-acoes-grid">
              <Link to="/partidas/registrar"><FaClipboardList aria-hidden="true" /><span>Registrar partida</span><FaChevronRight aria-hidden="true" /></Link>
              <Link to="/minhas-partidas?filtro=participei"><FaUserFriends aria-hidden="true" /><span>Participar de partida</span><FaChevronRight aria-hidden="true" /></Link>
              <Link to="/feed"><FaShareAlt aria-hidden="true" /><span>Compartilhar resultado</span><FaChevronRight aria-hidden="true" /></Link>
            </div>
          </section>

          <section className="pontosqn-duas-colunas">
            <div className="cartao">
              <h2>Resumo do programa</h2>
              <ul className="pontosqn-resumo-lista">
                <li>Pontos QN medem participação e ações úteis para a comunidade.</li>
                <li>QN é promocional: não saca, não transfere e só vale em campanhas QuebraNunca.</li>
                <li>Benefícios e brindes aparecem na vitrine conforme estoque e regras da campanha.</li>
              </ul>
            </div>

            <div className="cartao">
              <h2>Atalhos</h2>
              <div className="pontosqn-lista-compacta">
                <button type="button" onClick={() => selecionarAba('historico')}><span>Histórico de Pontos</span><FaHistory aria-hidden="true" /></button>
                <button type="button" onClick={() => selecionarAba('beneficios')}><span>Benefícios</span><FaGift aria-hidden="true" /></button>
                <button type="button" onClick={() => selecionarAba('como-ganhar')}><span>Como ganhar</span><FaAward aria-hidden="true" /></button>
              </div>
            </div>
          </section>
        </section>
      )}

      {aba === 'beneficios' && (
        <section className="pontosqn-secao">
          <div className="pontosqn-vitrine-topo">
            <div>
              <span className="pontosqn-selo"><FaShoppingBag aria-hidden="true" /> Benefícios disponíveis</span>
              <h2>Benefícios</h2>
              <p>Benefícios por campanha, com pontos necessários e disponibilidade indicados em cada card.</p>
            </div>
          </div>

          {mostrarProdutosDestaque && (
            <section className="pontosqn-produtos-destaque" aria-labelledby="produtos-destaque-titulo">
              <div className="pontosqn-secao-topo">
                <div>
                  <span className="pontosqn-selo"><FaGift aria-hidden="true" /> Brindes em destaque</span>
                  <h3 id="produtos-destaque-titulo">Boné e Chaveiro QuebraNunca</h3>
                </div>
              </div>
              <div className="pontosqn-produtos-grid">
                {produtosDestaque.map((beneficio) => (
                  <BeneficioCard
                    key={beneficio.id}
                    beneficio={beneficio}
                    resgateSolicitado={obterStatusResgate(resgates, beneficio.id)}
                    resgatando={resgatandoId === beneficio.id}
                    onResgatar={solicitarResgate}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="ranking-tabs pontosqn-filtros">
            {filtrosBeneficios.map((item) => (
              <button key={item.id} type="button" className={filtroBeneficio === item.id ? 'ativo' : ''} onClick={() => setFiltroBeneficio(item.id)}>
                {item.rotulo}
              </button>
            ))}
          </div>

          {beneficiosDaLista.length === 0 ? (
            <EstadoPainel titulo="Sem benefícios nesta categoria" texto="Troque o filtro ou volte em breve para ver novas campanhas QuebraNunca." />
          ) : (
            <div className="pontosqn-beneficios-grid">
              {beneficiosDaLista.map((beneficio) => (
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

      {aba === 'como-ganhar' && <ComoGanharPontosQN />}

      {aba === 'historico' && (
        <section className="pontosqn-secao">
          <div className="pontosqn-secao-topo">
            <h2>Histórico de Pontos</h2>
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
            <EstadoPainel
              titulo="Seu histórico ainda está vazio"
              texto="Os pontos aparecem aqui conforme você joga, registra partidas, completa o perfil e ajuda a comunidade."
            />
          ) : (
            <ul className="pontosqn-historico-lista">
              {historicoFiltrado.map((item) => <HistoricoItem key={item.id} item={item} />)}
            </ul>
          )}
        </section>
      )}

    </main>
  );
}
