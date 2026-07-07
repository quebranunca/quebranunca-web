import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCheck, FaChevronLeft, FaPlus, FaSearch, FaUserPlus } from 'react-icons/fa';
import { AtletaPerfilLink } from '../components/AtletaPerfilLink';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { EmailDomainSuggestions } from '../components/formularios/EmailDomainSuggestions';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { grupoAtletasServico } from '../services/grupoAtletasServico';
import { gruposServico } from '../services/gruposServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { extrairMensagemErro } from '../utils/erros';
import { PERFIS_USUARIO, ehAtleta } from '../utils/perfis';
import { rolarParaTopo } from '../utils/rolagem';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import { aoPressionarEnterParaProximo, focusNextField, scrollFocusedInputIntoView } from '../utils/tecladoMobile';

const estadoInicialGrupoAtleta = {
  nomeAtleta: '',
  email: ''
};

const CODIGO_POSSIVEL_DUPLICIDADE_ATLETA_GRUPO = 'PossivelDuplicidadeAtletaGrupo';
const MENSAGEM_ATLETA_SEM_EMAIL = 'Atleta adicionado, mas ficou pendente preencher o email.';
const MENSAGEM_ATLETA_COM_EMAIL = 'Atleta adicionado ao grupo.';
const MENSAGEM_BLOQUEIO_NOME_DUPLICADO = 'Já existe um atleta com esse nome ou apelido e sem email. Se for outro atleta, altere o nome ou apelido para diferenciar.';
const MENSAGEM_MESMO_ATLETA_SEM_EMAIL = 'Esse atleta já está no grupo sem email. Preencha o email quando tiver essa informação.';
const MINIMO_CARACTERES_BUSCA_ATLETA = 3;
const TEMPO_DEBOUNCE_BUSCA_ATLETA_MS = 300;

export function PaginaGrupoAtletas() {
  const { grupoId, competicaoId } = useParams();
  const idGrupo = grupoId || competicaoId;
  const navegar = useNavigate();
  const { usuario, estadoAcesso, atualizarUsuarioLocal } = useAutenticacao();
  const { showNotification, closeNotification } = useNotification();
  const usuarioAtleta = ehAtleta(usuario);
  const usuarioAtivo = estadoAcesso === ESTADOS_ACESSO.ativo;
  const usuarioAdministrador = Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  const [grupo, setGrupo] = useState(null);
  const [grupoAtletas, setGrupoAtletas] = useState([]);
  const [formularioGrupoAtleta, setFormularioGrupoAtleta] = useState(estadoInicialGrupoAtleta);
  const [grupoAtletaSelecionadoId, setGrupoAtletaSelecionadoId] = useState('');
  const [termoBuscaAtleta, setTermoBuscaAtleta] = useState('');
  const [resultadosBuscaAtleta, setResultadosBuscaAtleta] = useState([]);
  const [atletaSelecionadoBusca, setAtletaSelecionadoBusca] = useState(null);
  const [criandoNovoAtleta, setCriandoNovoAtleta] = useState(false);
  const [buscandoAtletas, setBuscandoAtletas] = useState(false);
  const [erroBuscaAtletas, setErroBuscaAtletas] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvandoGrupoAtleta, setSalvandoGrupoAtleta] = useState(false);
  const [assumindoNomeGrupo, setAssumindoNomeGrupo] = useState(false);
  const nomeAtletaRef = useRef(null);
  const emailRef = useRef(null);

  const gerenciavel = useMemo(() => {
    if (!usuarioAtivo || !grupo) {
      return false;
    }

    if (usuarioAdministrador) {
      return true;
    }

    if (Number(usuario?.perfil) === PERFIS_USUARIO.organizador) {
      return grupo.usuarioOrganizadorId === usuario?.id;
    }

    return usuarioAtleta && grupo.usuarioOrganizadorId === usuario?.id;
  }, [grupo, usuario, usuarioAdministrador, usuarioAtivo, usuarioAtleta]);

  const usuarioJaNoGrupo = grupoAtletas.some((item) => item.atletaId === usuario?.atletaId);
  const nomesDisponiveisParaAssumir = grupoAtletas.filter((item) => (
    !item.vinculadoAUsuario || item.atletaId === usuario?.atletaId
  ));
  const atletasIdsNoGrupo = useMemo(
    () => new Set(grupoAtletas.map((item) => item.atletaId)),
    [grupoAtletas]
  );
  const termoBuscaPossuiMinimo = termoBuscaAtleta.trim().length >= MINIMO_CARACTERES_BUSCA_ATLETA;
  const podeSubmeterAdicaoAtleta = Boolean(atletaSelecionadoBusca)
    || (criandoNovoAtleta && Boolean(formularioGrupoAtleta.nomeAtleta.trim()));

  useEffect(() => {
    carregarDados();
  }, [idGrupo]);

  useEffect(() => {
    const termo = termoBuscaAtleta.trim();

    if (termo.length < MINIMO_CARACTERES_BUSCA_ATLETA) {
      setResultadosBuscaAtleta([]);
      setBuscandoAtletas(false);
      setErroBuscaAtletas('');
      return undefined;
    }

    setBuscandoAtletas(true);
    setErroBuscaAtletas('');

    const timeout = setTimeout(async () => {
      try {
        const resultados = await atletasServico.buscar(termo);
        setResultadosBuscaAtleta(resultados.slice(0, 10));
      } catch {
        setResultadosBuscaAtleta([]);
        setErroBuscaAtletas('Não foi possível realizar a busca');
      } finally {
        setBuscandoAtletas(false);
      }
    }, TEMPO_DEBOUNCE_BUSCA_ATLETA_MS);

    return () => clearTimeout(timeout);
  }, [termoBuscaAtleta]);

  async function carregarDados() {
    setCarregando(true);

    try {
      const [grupoAtual, listaAtletas] = await Promise.all([
        gruposServico.obterPorId(idGrupo),
        grupoAtletasServico.listarPorGrupo(idGrupo)
      ]);

      setGrupo(grupoAtual);
      setGrupoAtletas(listaAtletas);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao carregar atletas',
        message: extrairMensagemErro(error)
      });
      setGrupo(null);
      setGrupoAtletas([]);
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampoGrupoAtleta(campo, valor) {
    setFormularioGrupoAtleta((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function atualizarTermoBuscaAtleta(valor) {
    setTermoBuscaAtleta(valor);
    setAtletaSelecionadoBusca(null);
    if (!criandoNovoAtleta) {
      setFormularioGrupoAtleta((anterior) => ({ ...anterior, nomeAtleta: valor }));
    }
  }

  function selecionarAtletaExistente(atleta) {
    setAtletaSelecionadoBusca(atleta);
    setCriandoNovoAtleta(false);
    setTermoBuscaAtleta(obterNomeExibicaoAtleta(atleta) || atleta.nome || '');
    setFormularioGrupoAtleta({
      nomeAtleta: atleta.nome || '',
      email: ''
    });
  }

  function iniciarCadastroNovoAtleta() {
    const termo = termoBuscaAtleta.trim();
    setAtletaSelecionadoBusca(null);
    setCriandoNovoAtleta(true);
    setFormularioGrupoAtleta((anterior) => ({
      ...anterior,
      nomeAtleta: anterior.nomeAtleta.trim() || termo,
      email: anterior.email
    }));
    window.requestAnimationFrame(() => nomeAtletaRef.current?.focus());
  }

  function limparFluxoAdicaoAtleta() {
    setFormularioGrupoAtleta(estadoInicialGrupoAtleta);
    setTermoBuscaAtleta('');
    setResultadosBuscaAtleta([]);
    setAtletaSelecionadoBusca(null);
    setCriandoNovoAtleta(false);
    setErroBuscaAtletas('');
  }

  async function aoSubmeterGrupoAtleta(evento) {
    evento.preventDefault();

    if (atletaSelecionadoBusca && atletasIdsNoGrupo.has(atletaSelecionadoBusca.id)) {
      showNotification({
        type: 'warning',
        title: 'Atleta já está no grupo',
        message: 'Este atleta já faz parte do grupo.'
      });
      return;
    }

    if (!podeSubmeterAdicaoAtleta) {
      iniciarCadastroNovoAtleta();
      return;
    }

    setSalvandoGrupoAtleta(true);

    try {
      await grupoAtletasServico.criar(idGrupo, {
        atletaId: atletaSelecionadoBusca?.id || null,
        nomeAtleta: atletaSelecionadoBusca?.nome || formularioGrupoAtleta.nomeAtleta,
        apelidoAtleta: atletaSelecionadoBusca?.apelido || null,
        email: formularioGrupoAtleta.email || null
      });

      const possuiEmail = Boolean(formularioGrupoAtleta.email.trim());
      showNotification({
        type: atletaSelecionadoBusca || possuiEmail ? 'success' : 'warning',
        title: 'Atleta adicionado',
        message: atletaSelecionadoBusca || possuiEmail ? MENSAGEM_ATLETA_COM_EMAIL : MENSAGEM_ATLETA_SEM_EMAIL
      });
      limparFluxoAdicaoAtleta();
      const lista = await grupoAtletasServico.listarPorGrupo(idGrupo);
      setGrupoAtletas(lista);
      rolarParaTopo();
    } catch (error) {
      if (error?.response?.data?.codigo === CODIGO_POSSIVEL_DUPLICIDADE_ATLETA_GRUPO) {
        mostrarConflitoNome({
          grupoAtletaId: error.response.data.grupoAtletaId,
          mensagem: error.response.data.erro
        });
        return;
      }

      showNotification({
        type: 'error',
        title: 'Erro ao adicionar atleta',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvandoGrupoAtleta(false);
    }
  }

  function mostrarConflitoNome(conflito) {
    showNotification({
      type: 'warning',
      title: 'Possível duplicidade',
      message: `${conflito.mensagem} É o mesmo atleta?`,
      autoClose: false,
      actions: (
        <>
          <button
            type="button"
            className="botao-primario"
            onClick={() => confirmarMesmoAtleta(conflito.grupoAtletaId)}
          >
            É o mesmo atleta
          </button>
          <button
            type="button"
            className="botao-secundario"
            onClick={bloquearNovoAtletaComMesmoNome}
          >
            Cadastrar como novo
          </button>
        </>
      )
    });
  }

  async function confirmarMesmoAtleta(grupoAtletaId) {
    if (!grupoAtletaId) {
      closeNotification();
      return;
    }

    const email = formularioGrupoAtleta.email.trim();
    if (!email) {
      closeNotification();
      showNotification({
        type: 'warning',
        title: 'Atleta já está no grupo',
        message: MENSAGEM_MESMO_ATLETA_SEM_EMAIL
      });
      return;
    }

    closeNotification();
    setSalvandoGrupoAtleta(true);

    try {
      await grupoAtletasServico.completarEmail(idGrupo, grupoAtletaId, email);
      showNotification({
        type: 'success',
        title: 'Email atualizado',
        message: 'Email do atleta atualizado no grupo.'
      });
      limparFluxoAdicaoAtleta();
      const lista = await grupoAtletasServico.listarPorGrupo(idGrupo);
      setGrupoAtletas(lista);
      rolarParaTopo();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao atualizar email',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvandoGrupoAtleta(false);
    }
  }

  function bloquearNovoAtletaComMesmoNome() {
    closeNotification();
    showNotification({
      type: 'error',
      title: 'Nome indisponível',
      message: MENSAGEM_BLOQUEIO_NOME_DUPLICADO
    });
  }

  function formatarQuantidadePartidas(quantidade) {
    const total = Number(quantidade || 0);
    return `${total} ${total === 1 ? 'partida' : 'partidas'}`;
  }

  async function removerGrupoAtleta(id) {
    try {
      await grupoAtletasServico.remover(idGrupo, id);
      const lista = await grupoAtletasServico.listarPorGrupo(idGrupo);
      setGrupoAtletas(lista);
      showNotification({
        type: 'success',
        title: 'Atleta removido',
        message: 'O atleta foi removido do grupo.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao remover atleta',
        message: extrairMensagemErro(error)
      });
    }
  }

  function confirmarRemocaoGrupoAtleta(id) {
    showNotification({
      type: 'warning',
      title: 'Remover atleta?',
      message: 'Deseja remover este atleta do grupo?',
      autoClose: false,
      actions: (
        <>
          <button type="button" className="botao-secundario" onClick={closeNotification}>
            Cancelar
          </button>
          <button
            type="button"
            className="botao-perigo"
            onClick={() => {
              closeNotification();
              removerGrupoAtleta(id);
            }}
          >
            Remover
          </button>
        </>
      )
    });
  }

  async function assumirMeuNomeNoGrupo() {
    if (!grupoAtletaSelecionadoId) {
      showNotification({
        type: 'warning',
        title: 'Selecione um nome',
        message: 'Selecione o seu nome na lista do grupo.'
      });
      return;
    }

    setAssumindoNomeGrupo(true);

    try {
      const usuarioAtualizado = await grupoAtletasServico.assumirMeuNome(idGrupo, grupoAtletaSelecionadoId);
      atualizarUsuarioLocal(usuarioAtualizado);
      showNotification({
        type: 'success',
        title: 'Nome vinculado',
        message: 'Seu usuário foi vinculado ao nome selecionado neste grupo.'
      });
      const lista = await grupoAtletasServico.listarPorGrupo(idGrupo);
      setGrupoAtletas(lista);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao vincular nome',
        message: extrairMensagemErro(error)
      });
    } finally {
      setAssumindoNomeGrupo(false);
    }
  }

  return (
    <section className="pagina">
      <div className="cabecalho-pagina grupo-atletas-cabecalho">
        <button type="button" className="botao-voltar" onClick={() => navegar(`/grupos/${idGrupo}`)}>
          <span className="botao-voltar-icone"><FaChevronLeft aria-hidden="true" /></span>
          Voltar
        </button>
        <div>
          <h2>Membros</h2>
          <p>{grupo?.nome || 'Carregando grupo...'}</p>
        </div>
      </div>

      {carregando ? (
        <p>Carregando atletas do grupo...</p>
      ) : (
        <>
          {gerenciavel && (
            <form className="grupo-atletas-adicao" onSubmit={aoSubmeterGrupoAtleta}>
              <div className="grupo-atletas-busca">
                <label>
                  Adicionar atleta
                  <span className="campo-com-icone">
                    <FaSearch aria-hidden="true" />
                    <input
                      type="search"
                      autoComplete="off"
                      enterKeyHint="search"
                      placeholder="Nome ou apelido"
                      value={termoBuscaAtleta}
                      onChange={(evento) => atualizarTermoBuscaAtleta(evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                    />
                  </span>
                </label>
              </div>

              {atletaSelecionadoBusca && (
                <article className="grupo-atletas-card-selecionado">
                  <div className="grupo-atletas-card-status">
                    <FaCheck aria-hidden="true" />
                    <span>Atleta encontrado</span>
                  </div>
                  <div className="grupo-atletas-resultado-identidade">
                    <AvatarUsuario
                      nome={obterNomeExibicaoAtleta(atletaSelecionadoBusca)}
                      fotoPerfilUrl={obterFotoPerfilAvatar(atletaSelecionadoBusca)}
                      tamanho="md"
                    />
                    <div>
                      <strong>{obterNomeExibicaoAtleta(atletaSelecionadoBusca)}</strong>
                      <span>{formatarQuantidadePartidas(atletaSelecionadoBusca.quantidadeJogos)}</span>
                    </div>
                  </div>
                </article>
              )}

              {!atletaSelecionadoBusca && termoBuscaPossuiMinimo && (
                <div className="grupo-atletas-resultados" aria-live="polite">
                  {buscandoAtletas && [0, 1, 2].map((indice) => (
                    <div key={indice} className="grupo-atletas-resultado-skeleton" aria-hidden="true">
                      <span />
                      <div>
                        <span />
                        <span />
                      </div>
                    </div>
                  ))}

                  {!buscandoAtletas && erroBuscaAtletas && (
                    <p className="texto-erro grupo-atletas-estado-busca">{erroBuscaAtletas}</p>
                  )}

                  {!buscandoAtletas && !erroBuscaAtletas && resultadosBuscaAtleta.length === 0 && (
                    <p className="grupo-atletas-estado-busca">Nenhum atleta encontrado</p>
                  )}

                  {!buscandoAtletas && !erroBuscaAtletas && resultadosBuscaAtleta.map((atleta) => {
                    const jaEstaNoGrupo = atletasIdsNoGrupo.has(atleta.id);

                    return (
                      <button
                        key={atleta.id}
                        type="button"
                        className="grupo-atletas-resultado"
                        onClick={() => selecionarAtletaExistente(atleta)}
                        disabled={jaEstaNoGrupo}
                      >
                        <AvatarUsuario
                          nome={obterNomeExibicaoAtleta(atleta)}
                          fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                          tamanho="md"
                        />
                        <span className="grupo-atletas-resultado-texto">
                          <strong>{obterNomeExibicaoAtleta(atleta)}</strong>
                          {atleta.apelido && atleta.apelido !== atleta.nome && <span>{atleta.apelido}</span>}
                          <span>{formatarQuantidadePartidas(atleta.quantidadeJogos)}</span>
                        </span>
                        {jaEstaNoGrupo && <span className="grupo-atletas-ja-vinculado">Já está no grupo</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {!atletaSelecionadoBusca && (
                <button type="button" className="grupo-atletas-criar-novo" onClick={iniciarCadastroNovoAtleta}>
                  <FaPlus aria-hidden="true" />
                  <span>
                    Criar novo atleta{termoBuscaAtleta.trim() ? ` "${termoBuscaAtleta.trim()}"` : ''}
                  </span>
                </button>
              )}

              {criandoNovoAtleta && (
                <div className="formulario-grid grupo-atletas-formulario-novo">
                  <label>
                    Nome ou apelido
                    <input
                      ref={nomeAtletaRef}
                      type="text"
                      autoComplete="name"
                      enterKeyHint="next"
                      value={formularioGrupoAtleta.nomeAtleta}
                      onChange={(evento) => atualizarCampoGrupoAtleta('nomeAtleta', evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                      onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(emailRef))}
                      required
                    />
                  </label>

                  <label>
                    Email (opcional)
                    <input
                      ref={emailRef}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      enterKeyHint="done"
                      value={formularioGrupoAtleta.email}
                      placeholder="Opcional"
                      onChange={(evento) => atualizarCampoGrupoAtleta('email', evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                    />
                    <EmailDomainSuggestions
                      valor={formularioGrupoAtleta.email}
                      onChange={(valor) => atualizarCampoGrupoAtleta('email', valor)}
                      inputRef={emailRef}
                    />
                  </label>
                </div>
              )}

              <div className="acoes-formulario grupo-atletas-acoes-principais">
                <button type="submit" className="botao-primario" disabled={salvandoGrupoAtleta || !podeSubmeterAdicaoAtleta}>
                  <FaUserPlus aria-hidden="true" />
                  {salvandoGrupoAtleta
                    ? 'Salvando...'
                    : atletaSelecionadoBusca
                      ? 'Adicionar atleta ao grupo'
                      : 'Cadastrar e adicionar'}
                </button>
              </div>
            </form>
          )}

          {usuarioAtleta && !gerenciavel && !usuarioJaNoGrupo && (
            <div className="formulario-grid">
              <p className="campo-largo">
                Seu nome já foi lançado neste grupo? Selecione abaixo para vincular este usuário ao nome existente.
              </p>

              <label>
                Meu nome no grupo
                <select
                  value={grupoAtletaSelecionadoId}
                  onChange={(evento) => setGrupoAtletaSelecionadoId(evento.target.value)}
                >
                  <option value="">Selecione</option>
                  {nomesDisponiveisParaAssumir.map((item) => (
                    <option key={item.id} value={item.id}>
                      {obterNomeExibicaoAtleta(item)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="acoes-formulario">
                <button
                  type="button"
                  className="botao-primario"
                  onClick={assumirMeuNomeNoGrupo}
                  disabled={assumindoNomeGrupo || nomesDisponiveisParaAssumir.length === 0}
                >
                  {assumindoNomeGrupo ? 'Vinculando...' : 'Este nome sou eu'}
                </button>
              </div>
            </div>
          )}

          {usuarioAtleta && !gerenciavel && usuarioJaNoGrupo && (
            <p className="texto-sucesso">Seu atleta já está vinculado a este grupo.</p>
          )}

          <div className="lista-cartoes">
            {grupoAtletas.map((item) => {
              const atletaEhUsuarioAtual = Boolean(usuario?.atletaId && item.atletaId === usuario.atletaId);

              return (
                <article key={item.id} className="cartao-lista">
                  <div>
                    <div className="atleta-lista-identidade">
                      <AvatarUsuario
                        nome={obterNomeExibicaoAtleta(item)}
                        fotoPerfilUrl={obterFotoPerfilAvatar(item)}
                        tamanho="sm"
                        className="atleta-lista-avatar"
                      />
                      <h3>
                        <AtletaPerfilLink atleta={item} className="atleta-nome-link">
                          {obterNomeExibicaoAtleta(item)}
                        </AtletaPerfilLink>
                      </h3>
                    </div>
                    <p>Apelido: {item.apelidoAtleta || '-'}</p>
                    {gerenciavel && <p>Email: {item.emailAtleta || 'Pendente'}</p>}
                    {gerenciavel && <p>Cadastro no sistema: {item.cadastroPendente ? 'Pendente' : 'Completo'}</p>}
                    <p>Usuário vinculado: {item.vinculadoAUsuario ? 'Sim' : 'Não'}</p>
                  </div>

                  {gerenciavel && (
                    <div className="acoes-item">
                      {atletaEhUsuarioAtual ? (
                        <span className="texto-aviso">Você não pode remover seu próprio atleta do grupo.</span>
                      ) : (
                        <button type="button" className="botao-perigo" onClick={() => confirmarRemocaoGrupoAtleta(item.id)}>
                          Remover
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

            {grupoAtletas.length === 0 && <p>Nenhum atleta cadastrado neste grupo.</p>}
          </div>
        </>
      )}
    </section>
  );
}
