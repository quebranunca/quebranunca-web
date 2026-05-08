import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { grupoAtletasServico } from '../services/grupoAtletasServico';
import { gruposServico } from '../services/gruposServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { extrairMensagemErro } from '../utils/erros';
import { PERFIS_USUARIO, ehAtleta } from '../utils/perfis';
import { rolarParaTopo } from '../utils/rolagem';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';

const estadoInicialGrupoAtleta = {
  nomeAtleta: '',
  email: ''
};

const CODIGO_POSSIVEL_DUPLICIDADE_ATLETA_GRUPO = 'PossivelDuplicidadeAtletaGrupo';
const MENSAGEM_ATLETA_SEM_EMAIL = 'Atleta adicionado, mas ficou pendente preencher o email.';
const MENSAGEM_ATLETA_COM_EMAIL = 'Atleta adicionado ao grupo.';
const MENSAGEM_BLOQUEIO_NOME_DUPLICADO = 'Já existe um atleta com esse nome ou apelido e sem email. Se for outro atleta, altere o nome ou apelido para diferenciar.';
const MENSAGEM_MESMO_ATLETA_SEM_EMAIL = 'Esse atleta já está no grupo sem email. Preencha o email quando tiver essa informação.';

export function PaginaGrupoAtletas() {
  const { grupoId, competicaoId } = useParams();
  const idGrupo = grupoId || competicaoId;
  const { usuario, estadoAcesso, atualizarUsuarioLocal } = useAutenticacao();
  const { showNotification, closeNotification } = useNotification();
  const usuarioAtleta = ehAtleta(usuario);
  const usuarioAtivo = estadoAcesso === ESTADOS_ACESSO.ativo;
  const usuarioAdministrador = Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  const [grupo, setGrupo] = useState(null);
  const [grupoAtletas, setGrupoAtletas] = useState([]);
  const [formularioGrupoAtleta, setFormularioGrupoAtleta] = useState(estadoInicialGrupoAtleta);
  const [grupoAtletaSelecionadoId, setGrupoAtletaSelecionadoId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvandoGrupoAtleta, setSalvandoGrupoAtleta] = useState(false);
  const [assumindoNomeGrupo, setAssumindoNomeGrupo] = useState(false);

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

  useEffect(() => {
    carregarDados();
  }, [idGrupo]);

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

  async function aoSubmeterGrupoAtleta(evento) {
    evento.preventDefault();
    setSalvandoGrupoAtleta(true);

    try {
      await grupoAtletasServico.criar(idGrupo, {
        nomeAtleta: formularioGrupoAtleta.nomeAtleta,
        email: formularioGrupoAtleta.email || null
      });

      const possuiEmail = Boolean(formularioGrupoAtleta.email.trim());
      showNotification({
        type: possuiEmail ? 'success' : 'warning',
        title: 'Atleta adicionado',
        message: possuiEmail ? MENSAGEM_ATLETA_COM_EMAIL : MENSAGEM_ATLETA_SEM_EMAIL
      });
      setFormularioGrupoAtleta(estadoInicialGrupoAtleta);
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
      setFormularioGrupoAtleta(estadoInicialGrupoAtleta);
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
      <div className="cabecalho-pagina">
        <h2>Atletas do grupo</h2>
        <p>{grupo?.nome || 'Carregando grupo...'}</p>
      </div>

      {carregando ? (
        <p>Carregando atletas do grupo...</p>
      ) : (
        <>
          <article className="cartao">
            <h3>{grupo?.nome || 'Grupo'}</h3>
            <p>
              Os jogos deste grupo só podem ser registrados com atletas listados aqui. Você pode lançar nomes mesmo que a pessoa ainda não tenha usuário no sistema.
            </p>
          </article>

          {gerenciavel && (
            <form className="formulario-grid" onSubmit={aoSubmeterGrupoAtleta}>
              <label>
                Nome ou apelido
                <input
                  type="text"
                  value={formularioGrupoAtleta.nomeAtleta}
                  onChange={(evento) => atualizarCampoGrupoAtleta('nomeAtleta', evento.target.value)}
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={formularioGrupoAtleta.email}
                  placeholder="Opcional, mas necessário para vincular a um usuário"
                  onChange={(evento) => atualizarCampoGrupoAtleta('email', evento.target.value)}
                />
              </label>

              <div className="acoes-formulario">
                <button type="submit" className="botao-primario" disabled={salvandoGrupoAtleta}>
                  {salvandoGrupoAtleta ? 'Salvando...' : 'Adicionar atleta ao grupo'}
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
                    <h3>{obterNomeExibicaoAtleta(item)}</h3>
                    <p>Apelido: {item.apelidoAtleta || '-'}</p>
                    <p>Email: {item.emailAtleta || 'Pendente'}</p>
                    <p>Cadastro no sistema: {item.cadastroPendente ? 'Pendente' : 'Completo'}</p>
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
