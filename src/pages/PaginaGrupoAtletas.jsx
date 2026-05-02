import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { competicoesServico } from '../services/competicoesServico';
import { grupoAtletasServico } from '../services/grupoAtletasServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { extrairMensagemErro } from '../utils/erros';
import { PERFIS_USUARIO, ehAtleta } from '../utils/perfis';
import { rolarParaTopo } from '../utils/rolagem';

const estadoInicialGrupoAtleta = {
  nomeAtleta: '',
  apelidoAtleta: ''
};

export function PaginaGrupoAtletas() {
  const { competicaoId } = useParams();
  const { usuario, estadoAcesso, atualizarUsuarioLocal } = useAutenticacao();
  const usuarioAtleta = ehAtleta(usuario);
  const usuarioAtivo = estadoAcesso === ESTADOS_ACESSO.ativo;
  const usuarioAdministrador = Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  const [competicao, setCompeticao] = useState(null);
  const [grupoAtletas, setGrupoAtletas] = useState([]);
  const [formularioGrupoAtleta, setFormularioGrupoAtleta] = useState(estadoInicialGrupoAtleta);
  const [grupoAtletaSelecionadoId, setGrupoAtletaSelecionadoId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvandoGrupoAtleta, setSalvandoGrupoAtleta] = useState(false);
  const [assumindoNomeGrupo, setAssumindoNomeGrupo] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const gerenciavel = useMemo(() => {
    if (!usuarioAtivo || !competicao) {
      return false;
    }

    if (usuarioAdministrador) {
      return true;
    }

    if (Number(usuario?.perfil) === PERFIS_USUARIO.organizador) {
      return competicao.usuarioOrganizadorId === usuario?.id;
    }

    return usuarioAtleta && competicao.usuarioOrganizadorId === usuario?.id;
  }, [competicao, usuario, usuarioAdministrador, usuarioAtivo, usuarioAtleta]);

  const usuarioJaNoGrupo = grupoAtletas.some((item) => item.atletaId === usuario?.atletaId);
  const nomesDisponiveisParaAssumir = grupoAtletas.filter((item) => (
    !item.vinculadoAUsuario || item.atletaId === usuario?.atletaId
  ));

  useEffect(() => {
    carregarDados();
  }, [competicaoId]);

  async function carregarDados() {
    setCarregando(true);
    setErro('');
    setAviso('');

    try {
      const [listaCompeticoes, listaAtletas] = await Promise.all([
        competicoesServico.listarVisiveis(),
        grupoAtletasServico.listarPorCompeticao(competicaoId)
      ]);

      const grupo = listaCompeticoes.find((item) => item.id === competicaoId && Number(item.tipo) === 3) || null;
      setCompeticao(grupo);
      setGrupoAtletas(listaAtletas);

      if (!grupo) {
        setErro('Grupo não encontrado.');
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setCompeticao(null);
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
    setErro('');
    setAviso('');
    setSalvandoGrupoAtleta(true);

    try {
      await grupoAtletasServico.criar(competicaoId, {
        nomeAtleta: formularioGrupoAtleta.nomeAtleta,
        apelidoAtleta: formularioGrupoAtleta.apelidoAtleta || null
      });

      setFormularioGrupoAtleta(estadoInicialGrupoAtleta);
      const lista = await grupoAtletasServico.listarPorCompeticao(competicaoId);
      setGrupoAtletas(lista);
      rolarParaTopo();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvandoGrupoAtleta(false);
    }
  }

  async function removerGrupoAtleta(id) {
    if (!window.confirm('Deseja remover este atleta do grupo?')) {
      return;
    }

    try {
      await grupoAtletasServico.remover(competicaoId, id);
      const lista = await grupoAtletasServico.listarPorCompeticao(competicaoId);
      setGrupoAtletas(lista);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    }
  }

  async function assumirMeuNomeNoGrupo() {
    if (!grupoAtletaSelecionadoId) {
      setErro('Selecione o seu nome na lista do grupo.');
      return;
    }

    setErro('');
    setAviso('');
    setAssumindoNomeGrupo(true);

    try {
      const usuarioAtualizado = await grupoAtletasServico.assumirMeuNome(competicaoId, grupoAtletaSelecionadoId);
      atualizarUsuarioLocal(usuarioAtualizado);
      setAviso('Seu usuário foi vinculado ao nome selecionado neste grupo.');
      const lista = await grupoAtletasServico.listarPorCompeticao(competicaoId);
      setGrupoAtletas(lista);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setAssumindoNomeGrupo(false);
    }
  }

  return (
    <section className="pagina">
      <div className="cabecalho-pagina">
        <h2>Atletas do grupo</h2>
        <p>{competicao?.nome || 'Carregando grupo...'}</p>
      </div>

      {erro && <p className="texto-erro">{erro}</p>}
      {aviso && <p className="texto-sucesso">{aviso}</p>}

      {carregando ? (
        <p>Carregando atletas do grupo...</p>
      ) : (
        <>
          <article className="cartao">
            <h3>{competicao?.nome || 'Grupo'}</h3>
            <p>
              Os jogos deste grupo só podem ser registrados com atletas listados aqui. Você pode lançar nomes mesmo que a pessoa ainda não tenha usuário no sistema.
            </p>
          </article>

          {gerenciavel && (
            <form className="formulario-grid" onSubmit={aoSubmeterGrupoAtleta}>
              <label>
                Nome completo do atleta
                <input
                  type="text"
                  value={formularioGrupoAtleta.nomeAtleta}
                  onChange={(evento) => atualizarCampoGrupoAtleta('nomeAtleta', evento.target.value)}
                  required
                />
              </label>

              <label>
                Apelido ou complemento
                <input
                  type="text"
                  value={formularioGrupoAtleta.apelidoAtleta}
                  onChange={(evento) => atualizarCampoGrupoAtleta('apelidoAtleta', evento.target.value)}
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
                      {item.nomeAtleta}{item.apelidoAtleta ? ` (${item.apelidoAtleta})` : ''}
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
                    <h3>{item.nomeAtleta}</h3>
                    <p>Apelido/complemento: {item.apelidoAtleta || '-'}</p>
                    <p>Cadastro no sistema: {item.cadastroPendente ? 'Pendente' : 'Completo'}</p>
                    <p>Usuário vinculado: {item.vinculadoAUsuario ? 'Sim' : 'Não'}</p>
                  </div>

                  {gerenciavel && (
                    <div className="acoes-item">
                      {atletaEhUsuarioAtual ? (
                        <span className="texto-aviso">Você não pode remover seu próprio atleta do grupo.</span>
                      ) : (
                        <button type="button" className="botao-perigo" onClick={() => removerGrupoAtleta(item.id)}>
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

      <footer className="rodape-pagina">
        <BotaoVoltar fallback="/grupos" />
      </footer>
    </section>
  );
}
