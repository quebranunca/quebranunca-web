import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FaCheckCircle,
  FaClipboardList,
  FaGift,
  FaLock,
  FaShareAlt,
  FaShoppingBag,
  FaStar,
  FaUserFriends
} from 'react-icons/fa';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { useNotification } from '../contexts/NotificationContext';
import { gamificacaoServico } from '../services/gamificacaoServico';
import { extrairMensagemErro } from '../utils/erros';
import { AppHero } from '../components/AppHero';
import { MedalhaNivel } from '../components/gamificacao/MedalhaNivel';
import { criarNavegacaoRegistroPartida } from '../utils/partidaRotas';
import beneficioBoneQN from '../assets/pontos-qn/beneficio-bone-qn.png';
import beneficioChaveiroQN from '../assets/pontos-qn/beneficio-chaveiro-qn.png';

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'beneficios', rotulo: 'Benefícios' },
  { id: 'historico', rotulo: 'Histórico' }
];

const filtrosBeneficios = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'descontos', rotulo: 'Descontos' },
  { id: 'produtos', rotulo: 'Produtos' },
  { id: 'experiencias', rotulo: 'Experiências' },
  { id: 'app', rotulo: 'App' }
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
  {
    titulo: 'Registrar partida',
    pontos: 5,
    descricao: 'Salve seu jogo e ajude a manter o histórico do grupo.',
    rota: '/partidas/registrar',
    Icone: FaClipboardList
  },
  {
    titulo: 'Participar de partida',
    pontos: 10,
    descricao: 'Pontos aparecem quando a partida for considerada válida.',
    rota: '/minhas-partidas?filtro=participei',
    Icone: FaUserFriends
  },
  {
    titulo: 'Confirmar pendência',
    pontos: 2,
    descricao: 'Ajude a validar resultados e vínculos da comunidade.',
    rota: '/app/pendencias',
    Icone: FaCheckCircle
  },
  {
    titulo: 'Compartilhar resultado',
    pontos: 5,
    descricao: 'Compartilhe jogos registrados sem prometer acúmulo ilimitado.',
    rota: '/feed',
    Icone: FaShareAlt
  }
];

const abasDisponiveis = new Set(ABAS.map((item) => item.id));
const padroesCopyFinanceiraBeneficio = [
  /100\s*qn\s*=\s*r\$\s*1/i,
  /r\$\s*\d+/i,
  /\b\d+\s*reais?\b/i,
  /cashback/i,
  /saldo financeiro/i,
  /carteira/i,
  /cr[eé]dito financeiro/i,
  /convers[aã]o monet[aá]ria/i,
  /converter pontos em dinheiro/i,
  /\bsacar\b/i,
  /\bsaque\b/i,
  /\btransferir\b/i
];

function obterAbaQuery(searchParams) {
  const aba = searchParams.get('aba');
  if (aba === 'como-ganhar') {
    return 'resumo';
  }

  return abasDisponiveis.has(aba) ? aba : 'resumo';
}

function formatarPontos(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

function normalizarNomeFaixa(nome) {
  return normalizarTextoBusca(nome).replace(/\s+/g, '-');
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

function normalizarTextoBusca(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function obterTextoBeneficio(beneficio) {
  return normalizarTextoBusca([
    beneficio?.titulo,
    beneficio?.descricao,
    beneficio?.tipoNome,
    beneficio?.imagemUrl
  ].filter(Boolean).join(' '));
}

function obterCategoriaBeneficio(beneficio) {
  const tipo = Number(beneficio?.tipo);
  const percentualDesconto = Number(beneficio?.percentualDesconto);
  const texto = obterTextoBeneficio(beneficio);

  if (
    (percentualDesconto > 0 && percentualDesconto <= 30) ||
    tipo === 1 ||
    texto.includes('desconto') ||
    texto.includes('cupom')
  ) {
    return 'descontos';
  }

  if (
    texto.includes('chaveiro') ||
    texto.includes('bone') ||
    texto.includes('boné') ||
    texto.includes('brinde') ||
    texto.includes('camiseta') ||
    texto.includes('regata') ||
    texto.includes('produto')
  ) {
    return 'produtos';
  }

  if (tipo === 3 || texto.includes('experiencia') || texto.includes('aula') || texto.includes('evento')) {
    return 'experiencias';
  }

  if (
    texto.includes('registro extra') ||
    texto.includes('slot') ||
    texto.includes('grupo extra') ||
    texto.includes('estatistica') ||
    texto.includes('app')
  ) {
    return 'app';
  }

  if (tipo === 2 || tipo === 4) {
    return 'produtos';
  }

  if (texto.includes('campanha') || texto.includes('promocional') || texto.includes('condicao')) {
    return 'campanhas';
  }

  return 'outros';
}

function filtrarBeneficios(beneficios, filtro) {
  if (filtro === 'todos') {
    return beneficios;
  }

  return beneficios.filter((beneficio) => obterCategoriaBeneficio(beneficio) === filtro);
}

function beneficioPublicavel(beneficio) {
  return beneficio?.ativo !== false;
}

function obterFiltrosBeneficiosDisponiveis(beneficios) {
  const categoriasComItens = new Set(beneficios.map(obterCategoriaBeneficio));
  const filtrosComItens = filtrosBeneficios
    .filter((item) => item.id !== 'todos' && categoriasComItens.has(item.id));

  if (categoriasComItens.size < 2) {
    return [];
  }

  return [filtrosBeneficios[0], ...filtrosComItens];
}

function ehProdutoFisicoDestaque(beneficio) {
  const texto = obterTextoBeneficio(beneficio);
  return texto.includes('chaveiro') || texto.includes('bone') || Number(beneficio?.tipo) === 2;
}

function obterImagemBeneficio(beneficio) {
  const imagemUrl = beneficio?.imagemUrl?.trim();
  const texto = obterTextoBeneficio(beneficio);

  if (imagemUrl && imagensBeneficiosPontosQN[imagemUrl]) {
    return imagensBeneficiosPontosQN[imagemUrl];
  }

  if (texto.includes('chaveiro')) {
    return beneficioChaveiroQN;
  }

  if (texto.includes('bone')) {
    return beneficioBoneQN;
  }

  if (imagemUrl && (/^https?:\/\//i.test(imagemUrl) || imagemUrl.startsWith('/') || imagemUrl.startsWith('data:'))) {
    return imagemUrl;
  }

  return '';
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
    return 'Produto QN em campanha';
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
    return 'Produto';
  }

  const categoria = filtrosBeneficios.find((item) => item.id === obterCategoriaBeneficio(beneficio));
  if (categoria) {
    return categoria.rotulo;
  }

  const tipoNome = beneficio?.tipoNome?.trim();
  if (tipoNome && !contemCopyFinanceiraBeneficio(tipoNome)) {
    return tipoNome;
  }

  return 'Benefício promocional';
}

function obterPercentualDesconto(beneficio) {
  const percentual = Number(beneficio?.percentualDesconto);
  return percentual > 0 && percentual <= 30 ? percentual : null;
}

function obterStatusResgate(resgates, beneficioId) {
  return resgates.find((resgate) =>
    resgate.beneficioId === beneficioId &&
    Number(resgate.status) === 1);
}

function beneficioEmBreve(beneficio) {
  const status = normalizarTextoBusca([
    beneficio?.status,
    beneficio?.statusNome,
    beneficio?.disponibilidade,
    beneficio?.situacao,
    beneficio?.titulo,
    beneficio?.descricao,
    beneficio?.tipoNome
  ].filter(Boolean).join(' '));

  return beneficio?.emBreve === true || status.includes('em breve');
}

function beneficioTemEstoque(beneficio) {
  if (beneficio?.quantidadeDisponivel === null || beneficio?.quantidadeDisponivel === undefined) {
    return true;
  }

  return Number(beneficio.quantidadeDisponivel) > 0;
}

function beneficioDisponivelParaResgate(beneficio) {
  if (!beneficioPublicavel(beneficio) || beneficioEmBreve(beneficio)) {
    return false;
  }

  return beneficioTemEstoque(beneficio);
}

function obterTextoDisponibilidade(beneficio) {
  if (beneficioEmBreve(beneficio)) {
    return 'Em breve';
  }

  if (!beneficioTemEstoque(beneficio)) {
    return 'Indisponível no momento';
  }

  if (beneficio?.quantidadeDisponivel === null || beneficio?.quantidadeDisponivel === undefined) {
    return 'Disponível';
  }

  const quantidade = Number(beneficio.quantidadeDisponivel);
  return quantidade === 1 ? '1 disponível' : `${quantidade} disponíveis`;
}

function BarraProgresso({ valor }) {
  return (
    <div className="pontosqn-progresso" aria-hidden="true">
      <span style={{ width: `${Math.max(0, Math.min(100, Number(valor || 0)))}%` }} />
    </div>
  );
}

function obterFaixasMedalhaResumo(resumo) {
  const faixas = Array.isArray(resumo?.faixasMedalha) ? resumo.faixasMedalha : [];
  return faixas
    .filter((faixa) => faixa?.nome && Number.isFinite(Number(faixa.pontosMinimos)))
    .map((faixa) => ({
      nome: faixa.nome,
      pontosMinimos: Number(faixa.pontosMinimos),
      pontosProximaFaixa: faixa.pontosProximaFaixa === null || faixa.pontosProximaFaixa === undefined
        ? null
        : Number(faixa.pontosProximaFaixa)
    }))
    .sort((a, b) => a.pontosMinimos - b.pontosMinimos);
}

function obterProximaMedalhaNome(faixas, nivel, totalAcumulado) {
  const proximaPorLimite = faixas.find((faixa) => faixa.pontosMinimos === Number(nivel?.pontosProximaFaixa));
  if (proximaPorLimite) {
    return proximaPorLimite.nome;
  }

  return faixas.find((faixa) => faixa.pontosMinimos > Number(totalAcumulado || 0))?.nome || '';
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

function ProximosBeneficios() {
  const proximos = [
    { titulo: 'Boné QuebraNunca', imagem: beneficioBoneQN },
    { titulo: 'Chaveiro QuebraNunca', imagem: beneficioChaveiroQN }
  ];

  return (
    <div className="pontosqn-em-breve-grid" aria-label="Próximos benefícios">
      {proximos.map((beneficio) => (
        <article key={beneficio.titulo} className="pontosqn-em-breve-card">
          <img src={beneficio.imagem} alt={beneficio.titulo} loading="lazy" />
          <div>
            <strong>{beneficio.titulo}</strong>
            <span>Em breve</span>
          </div>
        </article>
      ))}
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
  const percentualDesconto = obterPercentualDesconto(beneficio);
  const emBreve = beneficioEmBreve(beneficio);
  const disponivel = beneficioDisponivelParaResgate(beneficio);
  const pontosFaltantes = Math.max(0, Number(beneficio.pontosFaltantes || 0));
  const estado = emBreve
    ? 'Em breve'
    : !disponivel
    ? 'Indisponível no momento'
    : resgateSolicitado
    ? 'Solicitado'
    : saldoSuficiente
      ? 'Disponível'
      : 'Pontos insuficientes';
  const podeResgatar = disponivel && saldoSuficiente && !resgateSolicitado;
  const textoCtaDesabilitado = emBreve
    ? 'Em breve'
    : !disponivel
    ? 'Indisponível no momento'
    : resgateSolicitado
    ? 'Solicitado'
    : pontosFaltantes > 0
      ? `Faltam ${formatarPontos(pontosFaltantes)} pontos`
      : 'Pontos insuficientes';
  const classeEstado = emBreve
    ? 'em-breve'
    : !disponivel
    ? 'indisponivel'
    : saldoSuficiente
    ? 'disponivel'
    : 'insuficiente';

  return (
    <article className={`pontosqn-beneficio-card ${produtoFisico ? 'produto-fisico' : ''} ${beneficio.destaque ? 'destaque' : ''} ${imagemBeneficio ? 'com-imagem' : 'sem-imagem'} ${!podeResgatar ? `estado-${classeEstado}` : ''}`}>
      <div
        className={`pontosqn-beneficio-imagem ${imagemBeneficio ? '' : 'pontosqn-beneficio-imagem-fallback'}`}
        {...(!imagemBeneficio ? { role: 'img', 'aria-label': `Benefício QN: ${tituloBeneficio}` } : {})}
      >
        {percentualDesconto && (
          <span className="pontosqn-beneficio-desconto">{percentualDesconto}% OFF</span>
        )}
        {imagemBeneficio ? (
          <img src={imagemBeneficio} alt={tituloBeneficio} loading="lazy" />
        ) : (
          <FaGift aria-hidden="true" />
        )}
      </div>
      <div className="pontosqn-beneficio-meta">
        <span className="pontosqn-beneficio-topo">
          <FaGift aria-hidden="true" />
          {tipoBeneficio}
        </span>
        <span className={`pontosqn-status ${classeEstado}`}>{estado}</span>
      </div>
      <h3>{tituloBeneficio}</h3>
      <p>{descricaoBeneficio}</p>
      <div className="pontosqn-beneficio-rodape">
        <div className="pontosqn-beneficio-custo">
          <span>Pontos necessários</span>
          <strong>{formatarPontos(beneficio.pontosNecessarios)} Pontos QN</strong>
          <small>{obterTextoDisponibilidade(beneficio)}</small>
        </div>
        {podeResgatar ? (
          <button
            type="button"
            className="botao-primario"
            disabled={resgatando}
            onClick={() => onResgatar(beneficio)}
          >
            {resgatando ? 'Solicitando...' : 'Resgatar'}
          </button>
        ) : (
          <button type="button" className="botao-secundario pontosqn-beneficio-cta-desabilitado" disabled>
            {textoCtaDesabilitado}
          </button>
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

function ComoGanharResumo() {
  const registrarPartida = criarNavegacaoRegistroPartida({ origem: '/app/pontos-qn' });

  return (
    <section className="cartao pontosqn-como-ganhar" id="como-ganhar-pontos">
      <h2>Como ganhar mais pontos</h2>
      <div className="pontosqn-acoes-grid">
        {regrasGanhoPontosQN.map(({ titulo, pontos, descricao, rota, Icone }) => {
          const navegacao = rota === '/partidas/registrar'
            ? registrarPartida
            : { to: rota, state: undefined };

          return (
          <Link key={titulo} to={navegacao.to} state={navegacao.state}>
            <Icone aria-hidden="true" />
            <span>
              <strong>{titulo}</strong>
              <small>{descricao}</small>
            </span>
            <b>+{pontos} QN</b>
          </Link>
          );
        })}
      </div>
    </section>
  );
}

function MedalhasResumo({ faixas, nivel, totalAcumulado }) {
  if (!faixas.length) {
    return null;
  }

  const total = Number(totalAcumulado || 0);
  const nivelAtual = normalizarTextoBusca(nivel?.nome || '');
  const proximaFaixa = faixas.find((faixa) => faixa.pontosMinimos > total);

  return (
    <section className="cartao pontosqn-medalhas-card">
      <div className="pontosqn-medalhas-topo">
        <div>
          <h2>Medalhas QN</h2>
          <p>Sua medalha evolui pelo total acumulado de Pontos QN. Resgatar benefícios não reduz sua medalha.</p>
        </div>
      </div>
      <div className="pontosqn-medalhas-lista" role="list">
        {faixas.map((faixa) => {
          const nomeNormalizado = normalizarTextoBusca(faixa.nome);
          const atual = nomeNormalizado === nivelAtual;
          const alcancada = total >= faixa.pontosMinimos;
          const proxima = proximaFaixa?.nome === faixa.nome;
          const pontosFaltantes = Math.max(0, faixa.pontosMinimos - total);
          const status = atual
            ? 'Medalha atual'
            : alcancada
            ? 'Alcançada'
            : proxima
            ? `Faltam ${formatarPontos(pontosFaltantes)} Pontos QN`
            : 'Próxima faixa';

          return (
            <article
              key={faixa.nome}
              className={`pontosqn-medalha-item ${atual ? 'atual' : ''} ${alcancada ? 'alcancada' : 'bloqueada'}`}
              role="listitem"
              aria-current={atual ? 'step' : undefined}
              aria-label={`${faixa.nome}: ${status}`}
              data-testid={`medalha-${normalizarNomeFaixa(faixa.nome)}`}
            >
              <MedalhaNivel nivel={faixa.nome} size={atual ? 'md' : 'sm'} className="pontosqn-medalha-icone" />
              <div>
                <strong>{faixa.nome}</strong>
                <span>A partir de {formatarPontos(faixa.pontosMinimos)} Pontos QN</span>
              </div>
              <small>{status}</small>
            </article>
          );
        })}
      </div>
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
  const totalAcumulado = resumo?.pontuacao?.totalAcumulado || 0;
  const nivel = resumo?.nivel;
  const faixasMedalha = useMemo(
    () => obterFaixasMedalhaResumo(resumo),
    [resumo]
  );
  const proximaMedalhaNome = obterProximaMedalhaNome(faixasMedalha, nivel, totalAcumulado);
  const temAtletaVinculado = resumo?.pontuacao?.temAtletaVinculado !== false;
  const beneficiosPublicaveis = useMemo(
    () => beneficios.filter(beneficioPublicavel),
    [beneficios]
  );
  const filtrosBeneficiosDisponiveis = useMemo(
    () => obterFiltrosBeneficiosDisponiveis(beneficiosPublicaveis),
    [beneficiosPublicaveis]
  );
  const filtroBeneficioEfetivo = useMemo(() => {
    if (filtrosBeneficiosDisponiveis.length === 0) {
      return 'todos';
    }

    return filtrosBeneficiosDisponiveis.some((item) => item.id === filtroBeneficio)
      ? filtroBeneficio
      : 'todos';
  }, [filtroBeneficio, filtrosBeneficiosDisponiveis]);
  const beneficiosFiltrados = useMemo(
    () => filtrarBeneficios(beneficiosPublicaveis, filtroBeneficioEfetivo),
    [beneficiosPublicaveis, filtroBeneficioEfetivo]
  );
  const temBeneficiosPublicaveis = beneficiosPublicaveis.length > 0;
  const mostrarFiltrosBeneficios = filtrosBeneficiosDisponiveis.length > 0;
  const temBeneficiosNaVitrine = useMemo(
    () => beneficiosPublicaveis.length > 0,
    [beneficiosPublicaveis]
  );
  const historicoFiltrado = useMemo(
    () => filtrarHistorico(extrato, filtroHistorico),
    [extrato, filtroHistorico]
  );
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

  function irParaComoGanharResumo() {
    selecionarAba('resumo');
    window.setTimeout(() => {
      const secao = document.getElementById('como-ganhar-pontos');
      if (typeof secao?.scrollIntoView === 'function') {
        secao.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }, 0);
  }

  if (carregando) {
    return (
      <main className="pagina pontosqn-pagina">
        <AppHero
          title="Pontos QN"
          subtitle="Evolua, conquiste benefícios e acompanhe seu progresso."
          autenticado={Boolean(usuario)}
          showBackButton
          variant="page"
        />
        <EstadoPainel titulo="Carregando Pontos QN" texto="Buscando saldo, benefícios e missões." />
      </main>
    );
  }

  if (erro) {
    return (
      <main className="pagina pontosqn-pagina">
        <AppHero
          title="Pontos QN"
          subtitle="Evolua, conquiste benefícios e acompanhe seu progresso."
          autenticado={Boolean(usuario)}
          showBackButton
          variant="page"
        />
        <EstadoPainel tipo="erro" titulo="Não foi possível carregar" texto={erro} />
        <button type="button" className="botao-primario" onClick={carregar}>Tentar novamente</button>
      </main>
    );
  }

  return (
    <main className="pagina pontosqn-pagina">
      <AppHero
        title="Pontos QN"
        subtitle="Evolua, conquiste benefícios e acompanhe seu progresso."
        autenticado={Boolean(usuario)}
        showBackButton
        variant="page"
      />

      <section className="pontosqn-resumo-shell" aria-label="Resumo de Pontos QN">
        <div className="pontosqn-saldo-card">
          <div className="pontosqn-saldo-topo">
            <span>Pontos disponíveis</span>
            <small>{nivel?.nome ? `${nivel.nome} · ${formatarPontos(totalAcumulado)} Pontos QN acumulados` : `${formatarPontos(totalAcumulado)} Pontos QN acumulados`}</small>
          </div>
          <strong>{formatarPontos(saldo)}</strong>
          <BarraProgresso valor={nivel?.progressoPercentual || 0} />
          <em>
            {nivel?.pontosProximaFaixa
              ? `Faltam ${formatarPontos(nivel?.pontosRestantes || 0)} Pontos QN para ${proximaMedalhaNome || 'a próxima faixa'}`
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
          <MedalhasResumo faixas={faixasMedalha} nivel={nivel} totalAcumulado={totalAcumulado} />
          <ComoGanharResumo />

          <section className="cartao pontosqn-sobre-card">
            <div>
              <h2>Sobre os Pontos QN</h2>
              <p>
                Pontos QN reconhecem participação e ações úteis para a comunidade. Eles não são dinheiro,
                não têm saque e só podem ser usados em benefícios do QuebraNunca.
              </p>
            </div>
            {temBeneficiosNaVitrine && (
              <button type="button" className="botao-secundario" onClick={() => selecionarAba('beneficios')}>
                Ver benefícios
              </button>
            )}
          </section>
        </section>
      )}

      {aba === 'beneficios' && (
        <section className="pontosqn-secao">
          <div className="pontosqn-vitrine-topo">
            <div>
              <span className="pontosqn-selo"><FaShoppingBag aria-hidden="true" /> Benefícios da comunidade</span>
              <h2>Benefícios QN</h2>
              <p>Troque seus pontos por campanhas, produtos e experiências disponíveis na comunidade.</p>
            </div>
            <div className="pontosqn-vitrine-saldo" aria-label={`${formatarPontos(saldo)} Pontos QN disponíveis para resgate`}>
              <span>Seu saldo para resgates</span>
              <strong>{formatarPontos(saldo)} <small>Pontos QN</small></strong>
              <button type="button" onClick={irParaComoGanharResumo}>Como ganhar mais</button>
            </div>
          </div>

          {mostrarFiltrosBeneficios && (
            <div className="ranking-tabs pontosqn-filtros" role="group" aria-label="Filtros de benefícios">
              {filtrosBeneficiosDisponiveis.map((item) => (
                <button key={item.id} type="button" className={filtroBeneficioEfetivo === item.id ? 'ativo' : ''} onClick={() => setFiltroBeneficio(item.id)}>
                  {item.rotulo}
                </button>
              ))}
            </div>
          )}

          {beneficiosFiltrados.length === 0 ? (
            !temBeneficiosPublicaveis ? (
              <EstadoPainel
                titulo="Novos benefícios em breve"
                texto="Continue jogando e acumulando Pontos QN. As próximas campanhas e brindes da comunidade aparecem aqui quando estiverem disponíveis."
              >
                <ProximosBeneficios />
                <button type="button" className="botao-secundario" onClick={irParaComoGanharResumo}>
                  Ver como ganhar pontos
                </button>
              </EstadoPainel>
            ) : (
              <EstadoPainel
                titulo="Nenhum benefício nesta categoria"
                texto="Tente outro filtro ou acompanhe as próximas campanhas QuebraNunca."
              >
                <button type="button" className="botao-secundario" onClick={() => setFiltroBeneficio('todos')}>
                  Ver todos
                </button>
              </EstadoPainel>
            )
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
          </div>
          <div className="ranking-tabs pontosqn-filtros" role="group" aria-label="Filtros do histórico">
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
