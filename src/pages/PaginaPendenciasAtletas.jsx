import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaChevronDown, FaClock, FaGamepad } from 'react-icons/fa';
import { EmailDomainSuggestions } from '../components/formularios/EmailDomainSuggestions';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { gruposServico } from '../services/gruposServico';
import { partidasServico } from '../services/partidasServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import { criarPendenciasPerfil } from '../utils/pendenciasPerfil';
import { rolarParaTopo } from '../utils/rolagem';
import { scrollFocusedInputIntoView } from '../utils/tecladoMobile';
import { formatarNomeDupla, obterNomeExibicaoAtleta, obterNomeExibicaoDupla } from '../utils/atletaUtils';
import { obterNomeGrupoPartidaExibicao } from '../utils/partidas';
import { useNotification } from '../contexts/NotificationContext';

const TIPOS_PENDENCIA = {
  aprovarPartida: 1,
  completarContato: 2,
  confirmarParticipacaoPartida: 3,
  responderCancelamentoPartida: 4
};

const STATUS_APROVACAO = {
  pendenteDeVinculos: 1,
  pendenteAprovacao: 2,
  aprovada: 3,
  contestada: 4
};

const STATUS_PENDENCIA = {
  pendente: 1,
  aguardandoCadastro: 4,
  contestada: 5
};

const PRIORIDADES = {
  alta: 1,
  media: 2,
  baixa: 3
};

const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'partidas', rotulo: 'Partidas' },
  { id: 'vinculos', rotulo: 'Vínculos' },
  { id: 'perfil', rotulo: 'Perfil' },
  { id: 'resolvidas', rotulo: 'Resolvidas' }
];

function pendenciaAindaVisivel(item) {
  if (!item) {
    return false;
  }

  if (item.tipo !== TIPOS_PENDENCIA.completarContato) {
    return item.status === STATUS_PENDENCIA.pendente;
  }

  if (item.status === STATUS_PENDENCIA.aguardandoCadastro) {
    return true;
  }

  return item.status === STATUS_PENDENCIA.pendente &&
    !item.atletaPossuiUsuarioVinculado;
}

function criarEstadoEmails(lista) {
  const proximo = {};
  (lista || []).forEach((item) => {
    if (pendenciaAindaVisivel(item) && item.tipo === TIPOS_PENDENCIA.completarContato) {
      proximo[item.id] = item.emailAtleta || '';
    }
  });
  return proximo;
}

function pendenciaExigeAcao(item) {
  return item?.status === STATUS_PENDENCIA.pendente;
}

function pendenciaAguardandoCadastro(item) {
  return item?.status === STATUS_PENDENCIA.aguardandoCadastro;
}

function obterRotuloStatusAprovacao(status) {
  switch (status) {
    case STATUS_APROVACAO.pendenteDeVinculos:
      return 'Vínculo pendente';
    case STATUS_APROVACAO.pendenteAprovacao:
      return 'Aguardando';
    case STATUS_APROVACAO.aprovada:
      return 'Resolvida';
    case STATUS_APROVACAO.contestada:
      return 'Contestada';
    default:
      return 'Pendente';
  }
}

function obterClasseStatusAprovacao(status) {
  switch (status) {
    case STATUS_APROVACAO.aprovada:
      return 'sucesso';
    case STATUS_APROVACAO.contestada:
      return 'neutro';
    default:
      return 'alerta';
  }
}

function obterPrioridade(item) {
  if (item?.prioridade) {
    return Number(item.prioridade);
  }

  return item?.tipo === TIPOS_PENDENCIA.aprovarPartida ||
    item?.tipo === TIPOS_PENDENCIA.responderCancelamentoPartida
    ? PRIORIDADES.alta
    : PRIORIDADES.media;
}

function obterApresentacaoPrioridade(item) {
  switch (obterPrioridade(item)) {
    case PRIORIDADES.alta:
      return { rotulo: 'Alta prioridade', classe: 'alta' };
    case PRIORIDADES.baixa:
      return { rotulo: 'Baixa prioridade', classe: 'baixa' };
    default:
      return { rotulo: 'Média prioridade', classe: 'media' };
  }
}

function obterNomeConfirmacaoAtleta(atleta) {
  const nome = atleta?.nome?.trim();
  const apelido = atleta?.apelido?.trim();

  if (nome && apelido) {
    return `${nome} (${apelido})`;
  }

  return nome || apelido || 'atleta cadastrado';
}

function obterDupla(item, lado) {
  const nome = lado === 'A' ? item.nomeDuplaA : item.nomeDuplaB;
  const atleta1 = lado === 'A' ? item.nomeDuplaAAtleta1 : item.nomeDuplaBAtleta1;
  const atleta2 = lado === 'A' ? item.nomeDuplaAAtleta2 : item.nomeDuplaBAtleta2;

  return obterNomeExibicaoDupla(nome) || formatarNomeDupla([atleta1, atleta2], 'Dupla a definir');
}

function obterContextoPartida(item) {
  return obterNomeGrupoPartidaExibicao(item.nomeGrupo, '') || item.nomeCategoria || 'Partidas avulsas';
}

function ehPendenciaConfirmacaoParticipacao(item) {
  return item?.tipo === TIPOS_PENDENCIA.confirmarParticipacaoPartida;
}

function ehPendenciaCancelamentoPartida(item) {
  return item?.tipo === TIPOS_PENDENCIA.responderCancelamentoPartida;
}

function PendenciasCabecalho({ metricas }) {
  const textoAcoes = metricas.abertas === 1
    ? '1 ação precisa da sua atenção'
    : `${metricas.abertas} ações precisam da sua atenção`;
  const textoImportantes = metricas.importantes === 0
    ? 'Nenhuma ação urgente'
    : `${metricas.importantes} ${metricas.importantes === 1 ? 'pendência importante' : 'pendências importantes'}`;

  return (
    <header className="pendencias-cabecalho">
      <h2>Pendências</h2>
      <strong>{metricas.abertas === 0 ? 'Tudo resolvido' : textoAcoes}</strong>
      <p>{textoImportantes}</p>
    </header>
  );
}

function PendenciasResumo({ metricas }) {
  const itens = [
    { id: 'abertas', rotulo: 'abertas', valor: metricas.abertas },
    { id: 'validacoes', rotulo: 'partidas', valor: metricas.validacoes },
    { id: 'vinculos', rotulo: 'vínculos', valor: metricas.vinculos },
    { id: 'perfil', rotulo: 'perfil', valor: metricas.perfil }
  ];

  return (
    <section className="pendencias-resumo" aria-label="Resumo de pendências">
      {itens.map((item) => (
        <span key={item.id} className="pendencias-resumo-item">
          <strong>{item.valor}</strong>
          <small>{item.rotulo}</small>
        </span>
      ))}
    </section>
  );
}

function PendenciasFiltros({ filtroAtivo, aoAlterar, totais }) {
  return (
    <nav className="pendencias-filtros" aria-label="Filtros de pendências">
      {FILTROS.map((filtro) => (
        <button
          key={filtro.id}
          type="button"
          className={filtroAtivo === filtro.id ? 'ativo' : ''}
          onClick={() => aoAlterar(filtro.id)}
        >
          {filtro.rotulo}
          <span>{totais[filtro.id] || 0}</span>
        </button>
      ))}
    </nav>
  );
}

function PendenciaStatusBadge({ children, tipo = 'alerta' }) {
  return (
    <span className={`pendencia-status ${tipo}`}>
      {children}
    </span>
  );
}

function PendenciaPerfilCard({ item }) {
  const prioridade = obterApresentacaoPrioridade(item);

  return (
    <article className={`pendencia-card pendencia-vinculo-card prioridade-${prioridade.classe}`}>
      <div className="pendencia-card-topo">
        <div className="pendencia-card-conteudo">
          <span>{prioridade.rotulo} · Perfil</span>
          <h3>{item.titulo}</h3>
          <p>{item.descricao}</p>
        </div>
        <PendenciaStatusBadge>Cadastro</PendenciaStatusBadge>
      </div>

      <div className="pendencia-card-atalho">
        <Link to="/app/perfil" className="botao-primario">
          {item.acaoTexto}
        </Link>
      </div>
    </article>
  );
}

function PendenciaPartidaCard({ item, expandida, onExpandir, processando, onResponder }) {
  const confirmacaoParticipacao = ehPendenciaConfirmacaoParticipacao(item);
  const status = confirmacaoParticipacao ? 'Aguardando confirmação' : obterRotuloStatusAprovacao(item.statusAprovacaoPartida);
  const prioridade = obterApresentacaoPrioridade(item);
  const detalhesId = `pendencia-detalhes-${item.id}`;
  const linkPartida = item.partidaId ? `/minhas-partidas?partidaId=${item.partidaId}` : '/partidas/consulta';

  return (
    <article className={`pendencia-card pendencia-partida-card prioridade-${prioridade.classe}${expandida ? ' expandida' : ''}`}>
      <div className="pendencia-card-topo">
        <div className="pendencia-card-conteudo">
          <span>{prioridade.rotulo} · Partida</span>
          <h3>{confirmacaoParticipacao ? 'Confirmar participação' : 'Confirmar resultado'}</h3>
          <p>{confirmacaoParticipacao ? 'Você participou desta partida?' : 'Uma partida aguarda sua confirmação.'}</p>
          <small>{obterContextoPartida(item)} · {formatarDataHora(item.dataPartida || item.dataCriacao)}</small>
        </div>
        <PendenciaStatusBadge tipo={confirmacaoParticipacao ? 'alerta' : obterClasseStatusAprovacao(item.statusAprovacaoPartida)}>
          {status}
        </PendenciaStatusBadge>
      </div>

      <div className="pendencia-card-atalho">
        <button
          type="button"
          className="botao-primario"
          aria-expanded={expandida}
          aria-controls={detalhesId}
          onClick={() => onExpandir(item.id)}
          disabled={processando}
        >
          {expandida ? 'Fechar' : 'Resolver'}
          <FaChevronDown className={expandida ? 'girado' : ''} aria-hidden="true" />
        </button>
      </div>

      {expandida && (
        <section id={detalhesId} className="pendencia-expandido">
          <div className="pendencia-partida-placar">
            <div>
              <span>Dupla 1</span>
              <strong>{obterDupla(item, 'A')}</strong>
              <b>{item.placarDuplaA ?? '-'}</b>
            </div>
            <div>
              <span>Dupla 2</span>
              <strong>{obterDupla(item, 'B')}</strong>
              <b>{item.placarDuplaB ?? '-'}</b>
            </div>
          </div>

          <dl className="pendencia-detalhes">
            <div>
              <dt>Registrado por</dt>
              <dd>{item.nomeCriadoPorUsuario || 'Usuário QNF'}</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>{formatarDataHora(item.dataPartida)}</dd>
            </div>
          </dl>

          <div className="pendencia-card-acoes">
            <button
              type="button"
              className="botao-primario"
              onClick={() => onResponder(item.id, 'aprovar')}
              disabled={processando}
            >
              {processando ? 'Processando...' : 'Confirmar'}
            </button>
            <Link to={linkPartida} className="botao-secundario">
              Ver detalhes
            </Link>
            <button
              type="button"
              className="botao-terciario"
              onClick={() => onResponder(item.id, 'contestar')}
              disabled={processando}
            >
              {processando ? 'Processando...' : confirmacaoParticipacao ? 'Não reconheço' : 'Recusar resultado'}
            </button>
          </div>
        </section>
      )}
    </article>
  );
}

function PendenciaCancelamentoPartidaCard({ item, expandida, onExpandir, processando, onResponderCancelamento }) {
  const prioridade = obterApresentacaoPrioridade(item);
  const detalhesId = `pendencia-detalhes-${item.id}`;
  const linkPartida = item.partidaId ? `/minhas-partidas?partidaId=${item.partidaId}` : '/minhas-partidas?filtro=pendentes';

  return (
    <article className={`pendencia-card pendencia-partida-card prioridade-${prioridade.classe}${expandida ? ' expandida' : ''}`}>
      <div className="pendencia-card-topo">
        <div className="pendencia-card-conteudo">
          <span>{prioridade.rotulo} · Cancelamento</span>
          <h3>Solicitação de cancelamento</h3>
          <p>Revise o pedido de cancelamento desta partida.</p>
          <small>{obterContextoPartida(item)} · {formatarDataHora(item.dataPartida || item.dataCriacao)}</small>
        </div>
        <PendenciaStatusBadge tipo="alerta">
          Aguardando resposta
        </PendenciaStatusBadge>
      </div>

      <div className="pendencia-card-atalho">
        <button
          type="button"
          className="botao-primario"
          aria-expanded={expandida}
          aria-controls={detalhesId}
          onClick={() => onExpandir(item.id)}
          disabled={processando}
        >
          {expandida ? 'Fechar' : 'Revisar'}
          <FaChevronDown className={expandida ? 'girado' : ''} aria-hidden="true" />
        </button>
      </div>

      {expandida && (
        <section id={detalhesId} className="pendencia-expandido">
          <div className="pendencia-partida-placar">
            <div>
              <span>Dupla 1</span>
              <strong>{obterDupla(item, 'A')}</strong>
              <b>{item.placarDuplaA ?? '-'}</b>
            </div>
            <div>
              <span>Dupla 2</span>
              <strong>{obterDupla(item, 'B')}</strong>
              <b>{item.placarDuplaB ?? '-'}</b>
            </div>
          </div>

          <p className="pendencia-vinculo-partida">
            <FaGamepad aria-hidden="true" />
            <span>A partida só será cancelada se um atleta adversário aprovar.</span>
          </p>

          <div className="pendencia-card-acoes">
            <button
              type="button"
              className="botao-secundario"
              onClick={() => onResponderCancelamento(item, 'aprovar')}
              disabled={processando || !item.solicitacaoCancelamentoPartidaId}
            >
              {processando ? 'Processando...' : 'Aprovar cancelamento'}
            </button>
            <button
              type="button"
              className="botao-terciario"
              onClick={() => onResponderCancelamento(item, 'recusar')}
              disabled={processando || !item.solicitacaoCancelamentoPartidaId}
            >
              {processando ? 'Processando...' : 'Recusar'}
            </button>
            <Link to={linkPartida} className="botao-secundario">
              Ver solicitação
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}

function PendenciaVinculoCard({ item, expandida, onExpandir, email, onEmailChange, onSalvar, processando }) {
  const nomeAtleta = obterNomeExibicaoAtleta(item) || 'Atleta pendente';
  const prioridade = obterApresentacaoPrioridade(item);
  const emailRef = useRef(null);
  const detalhesId = `pendencia-detalhes-${item.id}`;
  const aguardandoCadastro = pendenciaAguardandoCadastro(item);
  const [buscaAtleta, setBuscaAtleta] = useState('');
  const [atletasEncontrados, setAtletasEncontrados] = useState([]);
  const [buscandoAtletas, setBuscandoAtletas] = useState(false);
  const [atletaSelecionado, setAtletaSelecionado] = useState(null);

  useEffect(() => {
    let cancelado = false;
    async function buscar() {
      const termo = buscaAtleta.trim();
      if (!expandida || !item.grupoId || termo.length < 3) {
        setAtletasEncontrados([]);
        return;
      }

      setBuscandoAtletas(true);
      try {
        const resultado = await gruposServico.buscarAtletas(item.grupoId, termo);
        if (!cancelado) {
          setAtletasEncontrados(resultado || []);
        }
      } catch {
        if (!cancelado) {
          setAtletasEncontrados([]);
        }
      } finally {
        if (!cancelado) {
          setBuscandoAtletas(false);
        }
      }
    }

    buscar();
    return () => {
      cancelado = true;
    };
  }, [buscaAtleta, expandida, item.grupoId]);

  function selecionarAtleta(atleta) {
    setAtletaSelecionado(atleta);
    onEmailChange(item.id, '');
  }

  function limparAtletaSelecionado() {
    setAtletaSelecionado(null);
  }

  function salvar() {
    if (atletaSelecionado?.id) {
      onSalvar(item.id, { atletaId: atletaSelecionado.id });
      return;
    }

    onSalvar(item.id, { email: email || '' });
  }

  return (
    <article className={`pendencia-card pendencia-vinculo-card prioridade-${prioridade.classe}${expandida ? ' expandida' : ''}`}>
      <div className="pendencia-card-topo">
        <div className="pendencia-card-conteudo">
          <span>{prioridade.rotulo} · Vínculo</span>
          <h3>Confirmar vínculo do atleta</h3>
          <p>{nomeAtleta} apareceu em uma partida registrada.</p>
          <small>{formatarDataHora(item.dataPartida || item.dataCriacao)}</small>
        </div>
        <PendenciaStatusBadge tipo={aguardandoCadastro ? 'neutro' : 'alerta'}>
          {aguardandoCadastro ? 'Aguardando cadastro' : 'Pendente de vínculo'}
        </PendenciaStatusBadge>
      </div>

      <div className="pendencia-card-atalho">
        <button
          type="button"
          className="botao-primario"
          aria-expanded={expandida}
          aria-controls={detalhesId}
          onClick={() => onExpandir(item.id)}
          disabled={processando}
        >
          {expandida ? 'Fechar' : 'Resolver'}
          <FaChevronDown className={expandida ? 'girado' : ''} aria-hidden="true" />
        </button>
      </div>

      {expandida && (
        <section id={detalhesId} className="pendencia-expandido">
          {item.partidaId && (
            <div className="pendencia-vinculo-partida">
              <FaGamepad aria-hidden="true" />
              <span>
                {obterDupla(item, 'A')} x {obterDupla(item, 'B')} · {formatarDataHora(item.dataPartida)}
              </span>
            </div>
          )}

          <div className="pendencia-bloco-vinculo">
            <strong>Selecionar atleta cadastrado no grupo</strong>
            <label className="pendencia-campo-email">
              Buscar atleta
              <input
                type="search"
                value={buscaAtleta}
                onChange={(evento) => setBuscaAtleta(evento.target.value)}
                onFocus={scrollFocusedInputIntoView}
                placeholder="Digite nome ou apelido"
                disabled={processando || !item.grupoId}
              />
            </label>

            {atletaSelecionado && (
              <div className="pendencia-atleta-selecionado">
                <span>{atletaSelecionado.textoExibicao || atletaSelecionado.nome}</span>
                <button type="button" className="botao-terciario" onClick={limparAtletaSelecionado} disabled={processando}>
                  Limpar
                </button>
              </div>
            )}

            {!atletaSelecionado && buscaAtleta.trim().length >= 3 && (
              <div className="pendencia-resultados-atletas">
                {buscandoAtletas && <small>Buscando atletas...</small>}
                {!buscandoAtletas && atletasEncontrados.length === 0 && <small>Nenhum atleta ativo encontrado.</small>}
                {!buscandoAtletas && atletasEncontrados.map((atleta) => (
                  <button
                    key={atleta.id}
                    type="button"
                    className="pendencia-atleta-opcao"
                    onClick={() => selecionarAtleta(atleta)}
                    disabled={processando}
                  >
                    <strong>{atleta.textoExibicao || atleta.nome}</strong>
                    {atleta.apelido && <span>{atleta.nome}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="pendencia-campo-email">
            Ou informar e-mail
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="done"
              value={email || ''}
              onChange={(evento) => onEmailChange(item.id, evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              placeholder="atleta@exemplo.com"
              disabled={processando || Boolean(atletaSelecionado)}
            />
            <EmailDomainSuggestions
              valor={email}
              onChange={(valor) => onEmailChange(item.id, valor)}
              inputRef={emailRef}
            />
            <small>
              Se não houver cadastro ativo para este e-mail, a pendência ficará aguardando cadastro.
            </small>
          </label>

          <div className="pendencia-card-acoes">
            <button
              type="button"
              className="botao-primario"
              onClick={salvar}
              disabled={processando || (!atletaSelecionado && !email?.trim())}
            >
              {processando ? 'Salvando...' : 'Confirmar vínculo'}
            </button>
          </div>
        </section>
      )}
    </article>
  );
}

function PendenciaResolvidaCard({ item }) {
  return (
    <article className="pendencia-card pendencia-resolvida-card">
      <div className="pendencia-card-topo">
        <div className="pendencia-card-conteudo">
          <span>Resolvida</span>
          <h3>{item.titulo}</h3>
          <p>{item.descricao}</p>
        </div>
        <PendenciaStatusBadge tipo="sucesso">Resolvida</PendenciaStatusBadge>
      </div>
    </article>
  );
}

function EstadoPendencias({ tipo, filtro = 'todas' }) {
  const ehErro = tipo === 'erro';
  const estadoVazio = filtro === 'resolvidas'
    ? {
      titulo: 'Nenhuma resolução recente',
      texto: 'Ações concluídas nesta sessão aparecerão aqui.'
    }
    : filtro !== 'todas'
      ? {
        titulo: 'Nada neste filtro',
        texto: 'Não há ações desse tipo aguardando você.'
      }
      : {
        titulo: 'Você está em dia',
        texto: 'Não há pendências para resolver agora.'
      };
  const titulo = ehErro ? 'Não foi possível carregar' : estadoVazio.titulo;
  const texto = ehErro
    ? 'Tente atualizar a central de pendências em instantes.'
    : estadoVazio.texto;

  return (
    <section className="pendencias-estado">
      {ehErro ? <FaClock aria-hidden="true" /> : <FaCheck aria-hidden="true" />}
      <strong>{titulo}</strong>
      <p>{texto}</p>
      {!ehErro && filtro === 'todas' && (
        <Link to="/minhas-partidas?filtro=pendentes" className="botao-secundario">
          Ver minhas partidas
        </Link>
      )}
    </section>
  );
}

export function PaginaPendenciasAtletas() {
  const { usuario, estadoAcesso } = useAutenticacao();
  const [pendencias, setPendencias] = useState([]);
  const [pendenciasResolvidas, setPendenciasResolvidas] = useState([]);
  const [atletaPerfil, setAtletaPerfil] = useState(null);
  const [emails, setEmails] = useState({});
  const [filtroAtivo, setFiltroAtivo] = useState('todas');
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [processandoId, setProcessandoId] = useState(null);
  const [pendenciaExpandidaId, setPendenciaExpandidaId] = useState(null);
  const { showNotification, closeNotification } = useNotification();

  useEffect(() => {
    carregarPendencias();
  }, [usuario?.atletaId]);

  const pendenciasPerfil = useMemo(
    () => criarPendenciasPerfil({ estadoAcesso, usuario, atletaDetalhe: atletaPerfil }),
    [atletaPerfil, estadoAcesso, usuario]
  );

  const metricas = useMemo(() => {
    const pendenciasAcionaveis = pendencias.filter(pendenciaExigeAcao);
    const validacoes = pendenciasAcionaveis.filter((item) =>
      item.tipo === TIPOS_PENDENCIA.aprovarPartida ||
      item.tipo === TIPOS_PENDENCIA.confirmarParticipacaoPartida ||
      item.tipo === TIPOS_PENDENCIA.responderCancelamentoPartida
    ).length;
    const vinculos = pendenciasAcionaveis.filter((item) => item.tipo === TIPOS_PENDENCIA.completarContato).length;
    const importantes = pendenciasAcionaveis.filter((item) => obterPrioridade(item) === PRIORIDADES.alta).length;

    return {
      abertas: pendenciasAcionaveis.length,
      validacoes,
      vinculos,
      perfil: pendenciasPerfil.length,
      importantes,
      aguardandoCadastro: pendencias.filter(pendenciaAguardandoCadastro).length,
      resolvidas: pendenciasResolvidas.length
    };
  }, [pendencias, pendenciasPerfil.length, pendenciasResolvidas.length]);

  const totaisFiltros = useMemo(() => ({
    todas: metricas.abertas,
    partidas: metricas.validacoes,
    vinculos: metricas.vinculos + metricas.aguardandoCadastro,
    perfil: metricas.perfil,
    resolvidas: metricas.resolvidas
  }), [metricas]);

  const pendenciasFiltradas = useMemo(() => {
    if (filtroAtivo === 'partidas') {
      return pendencias.filter((item) =>
        item.tipo === TIPOS_PENDENCIA.aprovarPartida ||
        item.tipo === TIPOS_PENDENCIA.confirmarParticipacaoPartida ||
        item.tipo === TIPOS_PENDENCIA.responderCancelamentoPartida
      );
    }

    if (filtroAtivo === 'vinculos') {
      return pendencias.filter((item) => item.tipo === TIPOS_PENDENCIA.completarContato);
    }

    if (filtroAtivo === 'resolvidas') {
      return pendenciasResolvidas;
    }

    if (filtroAtivo === 'perfil') {
      return [];
    }

    return pendencias;
  }, [filtroAtivo, pendencias, pendenciasResolvidas]);

  async function carregarPendencias() {
    setCarregando(true);
    setErroCarregamento('');

    try {
      const lista = await pendenciasServico.listar();
      const pendenciasVisiveis = (lista || []).filter(pendenciaAindaVisivel);
      setPendencias(pendenciasVisiveis);
      setEmails(criarEstadoEmails(pendenciasVisiveis));

      if (usuario?.atletaId) {
        setAtletaPerfil(await atletasServico.obterMeu());
      } else {
        setAtletaPerfil(null);
      }
    } catch (error) {
      const mensagem = extrairMensagemErro(error);
      setErroCarregamento(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao carregar pendências',
        message: mensagem
      });

      setPendencias([]);
      setAtletaPerfil(null);
    } finally {
      setCarregando(false);
    }
  }

  function registrarResolvida(titulo, descricao) {
    setPendenciasResolvidas((listaAtual) => [
      {
        id: `${Date.now()}-${listaAtual.length}`,
        titulo,
        descricao
      },
      ...listaAtual
    ]);
  }

  function atualizarEmail(pendenciaId, email) {
    setEmails((anterior) => ({
      ...anterior,
      [pendenciaId]: email
    }));
  }

  function alterarFiltro(filtro) {
    setFiltroAtivo(filtro);
    setPendenciaExpandidaId(null);
  }

  function alternarExpansao(pendenciaId) {
    setPendenciaExpandidaId((idAtual) => idAtual === pendenciaId ? null : pendenciaId);
  }

  async function salvarEmail(pendenciaId, dadosResolucao = null) {
    setProcessandoId(pendenciaId);

    try {
      const resultado = await pendenciasServico.completarContato(
        pendenciaId,
        dadosResolucao || { email: emails[pendenciaId] || '' }
      );
      if (resultado?.usuarioJaCadastrado && resultado?.usuarioEncontrado) {
        mostrarConfirmacaoVinculoAtleta(pendenciaId, resultado.usuarioEncontrado);
        return;
      }

      const pendenciaAtualizada = resultado?.pendencia || resultado;
      if (pendenciaAtualizada?.status === STATUS_PENDENCIA.aguardandoCadastro) {
        setPendencias((listaAtual) => listaAtual.map((item) =>
          item.id === pendenciaId ? { ...item, ...pendenciaAtualizada } : item
        ));
      } else {
        setPendencias((listaAtual) => listaAtual.filter((item) =>
          item.id !== pendenciaId &&
          (
            item.tipo !== TIPOS_PENDENCIA.completarContato ||
            !pendenciaAtualizada?.atletaId ||
            item.atletaId !== pendenciaAtualizada.atletaId
          )
        ));
        registrarResolvida('Atleta vinculado', 'A participação foi vinculada ao atleta cadastrado.');
      }
      setPendenciaExpandidaId(null);

      showNotification({
        type: 'success',
        title: pendenciaAtualizada?.status === STATUS_PENDENCIA.aguardandoCadastro ? 'E-mail registrado' : 'Pendência resolvida',
        message: pendenciaAtualizada?.status === STATUS_PENDENCIA.aguardandoCadastro
          ? 'A pendência ficou aguardando cadastro ativo do atleta.'
          : 'A participação foi vinculada ao atleta cadastrado.'
      });

      rolarParaTopo();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao salvar e-mail',
        message: extrairMensagemErro(error)
      });
    } finally {
      setProcessandoId(null);
    }
  }

  function mostrarConfirmacaoVinculoAtleta(pendenciaId, usuarioEncontrado) {
    const nomeAtleta = obterNomeConfirmacaoAtleta(usuarioEncontrado);

    showNotification({
      type: 'warning',
      title: 'Atleta já cadastrado',
      message: `Este e-mail já pertence ao atleta ${nomeAtleta}. Deseja vincular esta participação da partida a esse atleta?`,
      autoClose: false,
      actions: (
        <>
          <button
            type="button"
            className="botao-primario"
            onClick={() => confirmarVinculoAtleta(pendenciaId, usuarioEncontrado.usuarioId)}
          >
            Vincular atleta
          </button>
          <button
            type="button"
            className="botao-secundario"
            onClick={closeNotification}
          >
            Cancelar
          </button>
        </>
      )
    });
  }

  async function confirmarVinculoAtleta(pendenciaId, usuarioId) {
    closeNotification();
    setProcessandoId(pendenciaId);

    try {
      const pendenciaAtualizada = await pendenciasServico.confirmarVinculoAtletaCadastrado(pendenciaId, usuarioId);
      setPendencias((listaAtual) => listaAtual.filter((item) =>
        item.id !== pendenciaId &&
        (
          item.tipo !== TIPOS_PENDENCIA.completarContato ||
          !pendenciaAtualizada?.atletaId ||
          item.atletaId !== pendenciaAtualizada.atletaId
        )
      ));
      registrarResolvida('Atleta vinculado', 'A participação foi vinculada ao atleta cadastrado.');
      setPendenciaExpandidaId(null);

      showNotification({
        type: 'success',
        title: 'Atleta vinculado!',
        message: 'A participação foi vinculada ao atleta cadastrado.'
      });

      rolarParaTopo();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao vincular atleta',
        message: extrairMensagemErro(error)
      });
    } finally {
      setProcessandoId(null);
    }
  }

  async function responderPartida(pendenciaId, acao) {
    setProcessandoId(pendenciaId);
    const pendenciaRespondida = pendencias.find((item) => item.id === pendenciaId);
    const confirmacaoParticipacao = ehPendenciaConfirmacaoParticipacao(pendenciaRespondida);

    try {
      if (acao === 'contestar') {
        await pendenciasServico.contestarPartida(pendenciaId);
        registrarResolvida(
          confirmacaoParticipacao ? 'Partida não reconhecida' : 'Resultado recusado',
          confirmacaoParticipacao ? 'A partida saiu da sua Home.' : 'A contestação da partida foi registrada.'
        );

        showNotification({
          type: 'success',
          title: confirmacaoParticipacao ? 'Partida não reconhecida' : 'Solicitação recusada',
          message: confirmacaoParticipacao ? 'A partida saiu das suas pendências.' : 'O resultado foi contestado com sucesso.'
        });
      } else {
        await pendenciasServico.aprovarPartida(pendenciaId);
        registrarResolvida(
          'Partida confirmada',
          confirmacaoParticipacao ? 'Sua participação foi confirmada.' : 'O resultado foi confirmado com sucesso.'
        );

        showNotification({
          type: 'success',
          title: 'Partida confirmada',
          message: confirmacaoParticipacao ? 'Partida confirmada.' : 'A pendência foi resolvida.'
        });
      }

      setPendencias((listaAtual) => listaAtual.filter((item) => item.id !== pendenciaId));
      setPendenciaExpandidaId(null);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao responder partida',
        message: extrairMensagemErro(error)
      });
    } finally {
      setProcessandoId(null);
    }
  }

  async function responderCancelamentoPartida(item, acao) {
    if (!item?.partidaId || !item?.solicitacaoCancelamentoPartidaId) {
      showNotification({
        type: 'error',
        title: 'Não foi possível abrir a solicitação',
        message: 'A pendência não possui uma solicitação de cancelamento vinculada.'
      });
      return;
    }

    setProcessandoId(item.id);

    try {
      if (acao === 'aprovar') {
        await partidasServico.aprovarCancelamentoPartida(item.partidaId, item.solicitacaoCancelamentoPartidaId);
        registrarResolvida('Partida cancelada', 'O cancelamento foi aprovado e a partida saiu dos cálculos esportivos.');
        showNotification({
          type: 'success',
          title: 'Partida cancelada com sucesso.'
        });
      } else {
        await partidasServico.recusarCancelamentoPartida(item.partidaId, item.solicitacaoCancelamentoPartidaId);
        registrarResolvida('Cancelamento recusado', 'A solicitação foi encerrada e a partida continua válida.');
        showNotification({
          type: 'success',
          title: 'Solicitação de cancelamento recusada.'
        });
      }

      setPendenciaExpandidaId(null);
      await carregarPendencias();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao responder cancelamento',
        message: extrairMensagemErro(error)
      });
    } finally {
      setProcessandoId(null);
    }
  }

  const mostrarPerfil = filtroAtivo === 'perfil';
  const pendenciasFiltradasAcionaveis = pendenciasFiltradas.filter(pendenciaExigeAcao);
  const pendenciasFiltradasAguardando = pendenciasFiltradas.filter(pendenciaAguardandoCadastro);
  const listaVazia =
    !carregando &&
    !erroCarregamento &&
    pendenciasFiltradas.length === 0 &&
    (!mostrarPerfil || pendenciasPerfil.length === 0);

  return (
    <section className="pagina pendencias-pagina">
      <PendenciasCabecalho metricas={metricas} />

      <PendenciasResumo metricas={metricas} />

      <PendenciasFiltros
        filtroAtivo={filtroAtivo}
        aoAlterar={alterarFiltro}
        totais={totaisFiltros}
      />

      {carregando && (
        <section className="pendencias-estado">
          <span className="pendencias-loading" aria-hidden="true" />
          <strong>Carregando pendências</strong>
          <p>Buscando suas ações abertas.</p>
        </section>
      )}

      {!carregando && erroCarregamento && <EstadoPendencias tipo="erro" />}

      {listaVazia && <EstadoPendencias filtro={filtroAtivo} />}

      {!carregando && !erroCarregamento && !listaVazia && (
        <div className="pendencias-lista">
          {filtroAtivo === 'resolvidas' ? (
            pendenciasResolvidas.map((item) => (
              <PendenciaResolvidaCard key={item.id} item={item} />
            ))
          ) : (
            <>
              {pendenciasFiltradasAcionaveis.map((item) => (
                item.tipo === TIPOS_PENDENCIA.completarContato ? (
                  <PendenciaVinculoCard
                    key={item.id}
                    item={item}
                    expandida={pendenciaExpandidaId === item.id}
                    onExpandir={alternarExpansao}
                    email={emails[item.id]}
                    onEmailChange={atualizarEmail}
                    onSalvar={salvarEmail}
                    processando={processandoId === item.id}
                  />
                ) : ehPendenciaCancelamentoPartida(item) ? (
                  <PendenciaCancelamentoPartidaCard
                    key={item.id}
                    item={item}
                    expandida={pendenciaExpandidaId === item.id}
                    onExpandir={alternarExpansao}
                    processando={processandoId === item.id}
                    onResponderCancelamento={responderCancelamentoPartida}
                  />
                ) : (
                  <PendenciaPartidaCard
                    key={item.id}
                    item={item}
                    expandida={pendenciaExpandidaId === item.id}
                    onExpandir={alternarExpansao}
                    processando={processandoId === item.id}
                    onResponder={responderPartida}
                  />
                )
              ))}

              {pendenciasFiltradasAguardando.length > 0 && (
                <section className="pendencias-aguardando-cadastro" aria-label="Pendências aguardando cadastro">
                  <h3>Aguardando cadastro</h3>
                  {pendenciasFiltradasAguardando.map((item) => (
                    <PendenciaVinculoCard
                      key={item.id}
                      item={item}
                      expandida={pendenciaExpandidaId === item.id}
                      onExpandir={alternarExpansao}
                      email={emails[item.id]}
                      onEmailChange={atualizarEmail}
                      onSalvar={salvarEmail}
                      processando={processandoId === item.id}
                    />
                  ))}
                </section>
              )}
            </>
          )}

          {filtroAtivo !== 'resolvidas' && mostrarPerfil && pendenciasPerfil.map((item) => (
            <PendenciaPerfilCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
