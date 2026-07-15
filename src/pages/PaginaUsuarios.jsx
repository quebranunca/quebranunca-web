import { useEffect, useState } from 'react';
import { ConteudoBotao } from '../components/ConteudoBotao';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { usuariosServico } from '../services/usuariosServico';
import { extrairMensagemErro } from '../utils/erros';
import { ehAdministrador, nomePerfil, PERFIS_USUARIO } from '../utils/perfis';
import { rolarParaTopo } from '../utils/rolagem';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';

function criarEdicao(usuario) {
  return {
    nome: usuario.nome || '',
    email: usuario.email || '',
    perfil: String(usuario.perfil),
    ativo: Boolean(usuario.ativo),
    atletaId: usuario.atletaId || '',
    nomeAtleta: obterNomeExibicaoAtleta(usuario.atleta)
  };
}

export function PaginaUsuarios() {
  const { usuario: usuarioLogado } = useAutenticacao();
  const [usuarios, setUsuarios] = useState([]);
  const [edicoes, setEdicoes] = useState({});
  const [filtros, setFiltros] = useState({ nome: '', email: '' });
  const [buscasAtleta, setBuscasAtleta] = useState({});
  const [resultadosAtleta, setResultadosAtleta] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);
  const [buscandoAtletaId, setBuscandoAtletaId] = useState(null);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    setCarregando(true);
    setErro('');

    try {
      const lista = await usuariosServico.listar({
        nome: filtros.nome || undefined,
        email: filtros.email || undefined
      });

      setUsuarios(lista);
      setEdicoes(Object.fromEntries(lista.map((usuario) => [usuario.id, criarEdicao(usuario)])));
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function atualizarFiltro(campo, valor) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function atualizarEdicao(usuarioId, campo, valor) {
    setEdicoes((anterior) => ({
      ...anterior,
      [usuarioId]: {
        ...anterior[usuarioId],
        [campo]: valor
      }
    }));
  }

  async function salvarUsuario(usuarioId) {
    const edicao = edicoes[usuarioId];
    if (!edicao) {
      return;
    }

    setSalvandoId(usuarioId);
    setErro('');
    setMensagem('');

    try {
      await usuariosServico.atualizar(usuarioId, {
        nome: edicao.nome,
        email: edicao.email,
        perfil: Number(edicao.perfil),
        ativo: Boolean(edicao.ativo),
        atletaId: edicao.atletaId || null
      });

      await carregarUsuarios();
      setMensagem('Usuário atualizado com sucesso.');
      rolarParaTopo();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvandoId(null);
    }
  }

  async function excluirUsuario(usuarioSelecionado) {
    if (!usuarioSelecionado || usuarioSelecionado.id === usuarioLogado?.id) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja excluir o usuário ${usuarioSelecionado.nome}? A conta será desativada e os dados pessoais serão anonimizados. Partidas, rankings e históricos compartilhados serão preservados.`
    );

    if (!confirmar) {
      return;
    }

    setExcluindoId(usuarioSelecionado.id);
    setErro('');
    setMensagem('');

    try {
      await usuariosServico.excluirPorAdministrador(usuarioSelecionado.id);
      await carregarUsuarios();
      setMensagem('Usuário excluído com sucesso.');
      rolarParaTopo();
    } catch (error) {
      setErro(extrairMensagemErro(error));
      rolarParaTopo();
    } finally {
      setExcluindoId(null);
    }
  }

  async function buscarAtletas(usuarioId) {
    setBuscandoAtletaId(usuarioId);
    setErro('');

    try {
      const resultados = await atletasServico.buscar(buscasAtleta[usuarioId] || '');
      setResultadosAtleta((anterior) => ({
        ...anterior,
        [usuarioId]: resultados
      }));
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setBuscandoAtletaId(null);
    }
  }

  function selecionarAtleta(usuarioId, atleta) {
    atualizarEdicao(usuarioId, 'atletaId', atleta.id);
    atualizarEdicao(usuarioId, 'nomeAtleta', obterNomeExibicaoAtleta(atleta));
    setResultadosAtleta((anterior) => ({ ...anterior, [usuarioId]: [] }));
  }

  return (
    <section className="pagina">
      <div className="cabecalho-pagina">
        <h2>Gestão de Usuários</h2>
        <p>Altere perfil, status e vínculo com atleta dos usuários cadastrados.</p>
      </div>

      <form
        className="formulario-grid"
        onSubmit={(evento) => {
          evento.preventDefault();
          carregarUsuarios();
        }}
      >
        <label>
          Nome
          <input
            type="text"
            value={filtros.nome}
            onChange={(evento) => atualizarFiltro('nome', evento.target.value)}
          />
        </label>

        <label>
          E-mail
          <input
            type="text"
            value={filtros.email}
            onChange={(evento) => atualizarFiltro('email', evento.target.value)}
          />
        </label>

        <div className="acoes-formulario">
          <button type="submit" className="botao-primario" disabled={carregando}>
            Filtrar
          </button>
        </div>
      </form>

      {erro && <p className="texto-erro">{erro}</p>}
      {mensagem && <p className="texto-sucesso">{mensagem}</p>}

      {carregando ? (
        <p>Carregando usuários...</p>
      ) : (
        <div className="lista-cartoes">
          {usuarios.map((usuario) => {
            const edicao = edicoes[usuario.id] || criarEdicao(usuario);
            const resultados = resultadosAtleta[usuario.id] || [];
            const usuarioAtual = usuario.id === usuarioLogado?.id;
            const usuarioEhAdministrador = ehAdministrador(usuario);

            return (
              <article key={usuario.id} className="cartao-lista">
                <div>
                  <h3>{usuario.nome}</h3>
                  <p>E-mail atual: {usuario.email}</p>
                  <p>Perfil atual: {nomePerfil(usuario.perfil)}</p>
                  <p>Status: {usuario.ativo ? 'Ativo' : 'Inativo'}</p>
                  <p>Atleta vinculado: {obterNomeExibicaoAtleta(usuario.atleta) || 'Nenhum'}</p>
                </div>

                <div className="formulario-grid">
                  <label>
                    Nome
                    <input
                      type="text"
                      autoComplete="name"
                      enterKeyHint="next"
                      value={edicao.nome}
                      onChange={(evento) => atualizarEdicao(usuario.id, 'nome', evento.target.value)}
                    />
                  </label>

                  <label>
                    E-mail
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      enterKeyHint="done"
                      value={edicao.email}
                      onChange={(evento) => atualizarEdicao(usuario.id, 'email', evento.target.value)}
                    />
                  </label>

                  <label>
                    Perfil
                    <select
                      value={edicao.perfil}
                      onChange={(evento) => atualizarEdicao(usuario.id, 'perfil', evento.target.value)}
                    >
                      {usuarioEhAdministrador && (
                        <option value={PERFIS_USUARIO.administrador}>Administrador</option>
                      )}
                      <option value={PERFIS_USUARIO.organizador}>Organizador</option>
                      <option value={PERFIS_USUARIO.atleta}>Atleta</option>
                    </select>
                  </label>

                  <label className="campo-checkbox">
                    <input
                      type="checkbox"
                      checked={edicao.ativo}
                      onChange={(evento) => atualizarEdicao(usuario.id, 'ativo', evento.target.checked)}
                    />
                    <span>Usuário ativo</span>
                  </label>

                  <label className="campo-largo">
                    Buscar atleta para vincular
                    <input
                      type="text"
                      value={buscasAtleta[usuario.id] || ''}
                      onChange={(evento) => setBuscasAtleta((anterior) => ({
                        ...anterior,
                        [usuario.id]: evento.target.value
                      }))}
                      placeholder="Nome, apelido, telefone ou e-mail"
                    />
                  </label>

                  <div className="acoes-formulario campo-largo">
                    <button
                      type="button"
                      className="botao-secundario"
                      onClick={() => buscarAtletas(usuario.id)}
                      disabled={buscandoAtletaId === usuario.id}
                    >
                      Buscar Atleta
                    </button>
                    <button
                      type="button"
                      className="botao-secundario"
                      onClick={() => {
                        atualizarEdicao(usuario.id, 'atletaId', '');
                        atualizarEdicao(usuario.id, 'nomeAtleta', '');
                      }}
                    >
                      Desvilcular atleta
                    </button>
                  </div>

                  {edicao.nomeAtleta && (
                    <p className="texto-sucesso campo-largo">Atleta selecionado: {edicao.nomeAtleta}</p>
                  )}

                  {resultados.length > 0 && (
                    <div className="campo-largo lista-sugestoes">
                      {resultados.map((atleta) => (
                        <button
                          key={atleta.id}
                          type="button"
                          className="item-sugestao"
                          onClick={() => selecionarAtleta(usuario.id, atleta)}
                        >
                          {obterNomeExibicaoAtleta(atleta)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="acoes-formulario campo-largo">
                    <button
                      type="button"
                      className="botao-primario"
                      onClick={() => salvarUsuario(usuario.id)}
                      disabled={salvandoId === usuario.id || excluindoId === usuario.id}
                    >
                      {salvandoId === usuario.id ? 'Salvando...' : 'Salvar'}
                    </button>
                    {!usuarioAtual && (
                      <button
                        type="button"
                        className="botao-perigo"
                        onClick={() => excluirUsuario(usuario)}
                        disabled={excluindoId === usuario.id || salvandoId === usuario.id}
                      >
                        {excluindoId === usuario.id ? 'Excluindo...' : 'Excluir usuário'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {usuarios.length === 0 && <p>Nenhum usuário encontrado.</p>}
        </div>
      )}
    </section>
  );
}
