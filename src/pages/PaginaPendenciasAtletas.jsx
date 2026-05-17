import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaCheck, FaClock, FaGamepad, FaLink, FaRegCheckCircle } from 'react-icons/fa';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import { criarPendenciasPerfil } from '../utils/pendenciasPerfil';
import { rolarParaTopo } from '../utils/rolagem';
import { obterNomeExibicaoAtleta, obterNomeExibicaoDupla } from '../utils/atletaUtils';
import { useNotification } from '../contexts/NotificationContext';

const TIPOS_PENDENCIA = {
  aprovarPartida: 1,
  completarContato: 2
};

const STATUS_APROVACAO = {
  pendenteDeVinculos: 1,
  pendenteAprovacao: 2,
  aprovada: 3,
  contestada: 4
};

const STATUS_PENDENCIA = {
  pendente: 1
};

const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'partidas', rotulo: 'Partidas' },
  { id: 'vinculos', rotulo: 'Vínculos' },
  { id: 'resolvidas', rotulo: 'Resolvidas' }
];

function pendenciaAindaVisivel(item) {
  if (!item || item.status !== STATUS_PENDENCIA.pendente) {
    return false;
  }

  if (item.tipo !== TIPOS_PENDENCIA.completarContato) {
    return true;
  }

  return !item.emailAtleta && !item.atletaPossuiUsuarioVinculado;
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

  return obterNomeExibicaoDupla(nome) || [atleta1, atleta2].filter(Boolean).join(' e ') || 'Dupla a definir';
}

function obterContextoPartida(item) {
  return item.nomeGrupo || item.nomeCategoria || 'Partida QNF';
}

function PendenciasResumo({ metricas }) {
  const itens = [
    { id: 'abertas', rotulo: 'abertas', valor: metricas.abertas, icone: <FaBell /> },
    { id: 'validacoes', rotulo: 'validações', valor: metricas.validacoes, icone: <FaGamepad /> },
    { id: 'vinculos', rotulo: 'vínculos', valor: metricas.vinculos, icone: <FaLink /> },
    { id: 'resolvidas', rotulo: 'resolvidas', valor: metricas.resolvidas, icone: <FaRegCheckCircle /> }
  ];

  return (
    <section className="pendencias-resumo" aria-label="Resumo de pendências">
      {itens.map((item) => (
        <article key={item.id} className="pendencias-resumo-item">
          <span aria-hidden="true">{item.icone}</span>
          <strong>{item.valor}</strong>
          <small>{item.rotulo}</small>
        </article>
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
  return (
    <article className="pendencia-card pendencia-vinculo-card">
      <div className="pendencia-card-topo">
        <div>
          <span>Perfil</span>
          <h3>{item.titulo}</h3>
          <p>{item.descricao}</p>
        </div>
        <PendenciaStatusBadge>Cadastro</PendenciaStatusBadge>
      </div>

      <div className="pendencia-card-acoes">
        <Link to="/app/perfil" className="botao-primario">
          {item.acaoTexto}
        </Link>
      </div>
    </article>
  );
}

function PendenciaPartidaCard({ item, processando, onResponder }) {
  const status = obterRotuloStatusAprovacao(item.statusAprovacaoPartida);

  return (
    <article className="pendencia-card pendencia-partida-card">
      <div className="pendencia-card-topo">
        <div>
          <span>Validação de partida</span>
          <h3>Confirmar resultado</h3>
          <p>{obterContextoPartida(item)} · {formatarDataHora(item.dataPartida || item.dataCriacao)}</p>
        </div>
        <PendenciaStatusBadge tipo={obterClasseStatusAprovacao(item.statusAprovacaoPartida)}>
          {status}
        </PendenciaStatusBadge>
      </div>

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
          {processando ? 'Processando...' : 'Validar partida'}
        </button>
        <Link to="/partidas/consulta" className="botao-secundario">
          Ver partida
        </Link>
        <button
          type="button"
          className="botao-terciario"
          onClick={() => onResponder(item.id, 'contestar')}
          disabled={processando}
        >
          {processando ? 'Processando...' : 'Recusar resultado'}
        </button>
      </div>
    </article>
  );
}

function PendenciaVinculoCard({ item, email, onEmailChange, onSalvar, processando }) {
  const nomeAtleta = obterNomeExibicaoAtleta(item) || 'atleta pendente';

  return (
    <article className="pendencia-card pendencia-vinculo-card">
      <div className="pendencia-card-topo">
        <div>
          <span>Vínculo pendente</span>
          <h3>Confirmar vínculo do atleta</h3>
          <p>Encontramos uma partida onde aparece {nomeAtleta}. Complete o contato para regularizar o vínculo.</p>
        </div>
        <PendenciaStatusBadge>Sem contato</PendenciaStatusBadge>
      </div>

      {item.partidaId && (
        <div className="pendencia-vinculo-partida">
          <FaGamepad aria-hidden="true" />
          <span>
            {obterDupla(item, 'A')} x {obterDupla(item, 'B')} · {formatarDataHora(item.dataPartida)}
          </span>
        </div>
      )}

      <label className="pendencia-campo-email">
        E-mail do atleta
        <input
          type="email"
          value={email || ''}
          onChange={(evento) => onEmailChange(item.id, evento.target.value)}
          placeholder="atleta@exemplo.com"
        />
      </label>

      <div className="pendencia-card-acoes">
        <button
          type="button"
          className="botao-primario"
          onClick={() => onSalvar(item.id)}
          disabled={processando}
        >
          {processando ? 'Salvando...' : 'Confirmar vínculo'}
        </button>
      </div>
    </article>
  );
}

function PendenciaResolvidaCard({ item }) {
  return (
    <article className="pendencia-card pendencia-resolvida-card">
      <div className="pendencia-card-topo">
        <div>
          <span>Resolvida</span>
          <h3>{item.titulo}</h3>
          <p>{item.descricao}</p>
        </div>
        <PendenciaStatusBadge tipo="sucesso">Resolvida</PendenciaStatusBadge>
      </div>
    </article>
  );
}

function EstadoPendencias({ tipo }) {
  const ehErro = tipo === 'erro';
  const titulo = ehErro ? 'Não foi possível carregar' : 'Você está em dia';
  const texto = ehErro
    ? 'Tente atualizar a central de pendências em instantes.'
    : 'Não há pendências para resolver agora.';

  return (
    <section className="pendencias-estado">
      {ehErro ? <FaClock aria-hidden="true" /> : <FaCheck aria-hidden="true" />}
      <strong>{titulo}</strong>
      <p>{texto}</p>
      {!ehErro && (
        <Link to="/app/meus-jogos" className="botao-secundario">
          Ver meus jogos
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
  const { showNotification, closeNotification } = useNotification();

  useEffect(() => {
    carregarPendencias();
  }, [usuario?.atletaId]);

  const pendenciasPerfil = useMemo(
    () => criarPendenciasPerfil({ estadoAcesso, usuario, atletaDetalhe: atletaPerfil }),
    [atletaPerfil, estadoAcesso, usuario]
  );

  const metricas = useMemo(() => {
    const validacoes = pendencias.filter((item) => item.tipo === TIPOS_PENDENCIA.aprovarPartida).length;
    const vinculos = pendencias.filter((item) => item.tipo === TIPOS_PENDENCIA.completarContato).length + pendenciasPerfil.length;

    return {
      abertas: pendencias.length + pendenciasPerfil.length,
      validacoes,
      vinculos,
      resolvidas: pendenciasResolvidas.length
    };
  }, [pendencias, pendenciasPerfil.length, pendenciasResolvidas.length]);

  const totaisFiltros = useMemo(() => ({
    todas: metricas.abertas,
    partidas: metricas.validacoes,
    vinculos: metricas.vinculos,
    resolvidas: metricas.resolvidas
  }), [metricas]);

  const pendenciasFiltradas = useMemo(() => {
    if (filtroAtivo === 'partidas') {
      return pendencias.filter((item) => item.tipo === TIPOS_PENDENCIA.aprovarPartida);
    }

    if (filtroAtivo === 'vinculos') {
      return pendencias.filter((item) => item.tipo === TIPOS_PENDENCIA.completarContato);
    }

    if (filtroAtivo === 'resolvidas') {
      return pendenciasResolvidas;
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

  async function salvarEmail(pendenciaId) {
    setProcessandoId(pendenciaId);

    try {
      const resultado = await pendenciasServico.completarContato(pendenciaId, emails[pendenciaId] || '');
      if (resultado?.usuarioJaCadastrado && resultado?.usuarioEncontrado) {
        mostrarConfirmacaoVinculoAtleta(pendenciaId, resultado.usuarioEncontrado);
        return;
      }

      const pendenciaAtualizada = resultado?.pendencia || resultado;
      setPendencias((listaAtual) => listaAtual.filter((item) =>
        item.id !== pendenciaId &&
        (
          item.tipo !== TIPOS_PENDENCIA.completarContato ||
          !pendenciaAtualizada?.atletaId ||
          item.atletaId !== pendenciaAtualizada.atletaId
        )
      ));
      registrarResolvida('Vínculo regularizado', 'O contato do atleta foi atualizado.');

      showNotification({
        type: 'success',
        title: 'Contato atualizado!',
        message: 'A pendência saiu da lista.'
      });

      await carregarPendencias();
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

      showNotification({
        type: 'success',
        title: 'Atleta vinculado!',
        message: 'A participação foi vinculada ao atleta cadastrado.'
      });

      await carregarPendencias();
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

    try {
      if (acao === 'contestar') {
        await pendenciasServico.contestarPartida(pendenciaId);
        registrarResolvida('Resultado recusado', 'A contestação da partida foi registrada.');

        showNotification({
          type: 'success',
          title: 'Contestação registrada!',
          message: 'A partida foi contestada com sucesso.'
        });
      } else {
        await pendenciasServico.aprovarPartida(pendenciaId);
        registrarResolvida('Partida validada', 'O resultado foi confirmado e enviado para o ranking.');

        showNotification({
          type: 'success',
          title: 'Aprovação registrada!',
          message: 'A partida foi aprovada com sucesso.'
        });
      }

      setPendencias((listaAtual) => listaAtual.filter((item) => item.id !== pendenciaId));
      await carregarPendencias();
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

  const mostrarPerfil = filtroAtivo === 'todas' || filtroAtivo === 'vinculos';
  const listaVazia =
    !carregando &&
    !erroCarregamento &&
    pendenciasFiltradas.length === 0 &&
    (!mostrarPerfil || pendenciasPerfil.length === 0);

  return (
    <section className="pagina pendencias-pagina">
      <section className="pendencias-hero">
        <div>
          <span>Central de ações</span>
          <h2>Pendências</h2>
          <p>Valide partidas, regularize vínculos e mantenha seu ranking atualizado.</p>
        </div>
      </section>

      <PendenciasResumo metricas={metricas} />

      <PendenciasFiltros
        filtroAtivo={filtroAtivo}
        aoAlterar={setFiltroAtivo}
        totais={totaisFiltros}
      />

      {carregando && (
        <section className="pendencias-estado">
          <span className="meus-jogos-loading" aria-hidden="true" />
          <strong>Carregando pendências</strong>
          <p>Buscando suas ações abertas.</p>
        </section>
      )}

      {!carregando && erroCarregamento && <EstadoPendencias tipo="erro" />}

      {listaVazia && <EstadoPendencias />}

      {!carregando && !erroCarregamento && !listaVazia && (
        <div className="pendencias-lista">
          {mostrarPerfil && pendenciasPerfil.map((item) => (
            <PendenciaPerfilCard key={item.id} item={item} />
          ))}

          {filtroAtivo === 'resolvidas' ? (
            pendenciasResolvidas.map((item) => (
              <PendenciaResolvidaCard key={item.id} item={item} />
            ))
          ) : (
            pendenciasFiltradas.map((item) => (
              item.tipo === TIPOS_PENDENCIA.completarContato ? (
                <PendenciaVinculoCard
                  key={item.id}
                  item={item}
                  email={emails[item.id]}
                  onEmailChange={atualizarEmail}
                  onSalvar={salvarEmail}
                  processando={processandoId === item.id}
                />
              ) : (
                <PendenciaPartidaCard
                  key={item.id}
                  item={item}
                  processando={processandoId === item.id}
                  onResponder={responderPartida}
                />
              )
            ))
          )}
        </div>
      )}
    </section>
  );
}
