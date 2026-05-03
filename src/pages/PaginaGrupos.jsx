import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { gruposServico } from '../services/gruposServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { extrairMensagemErro } from '../utils/erros';
import { formatarData, paraInputData } from '../utils/formatacao';
import { obterLinkHttp } from '../utils/links';
import { PERFIS_USUARIO, ehAtleta } from '../utils/perfis';

const estadoInicial = {
  nome: '',
  descricao: '',
  link: '',
  dataInicio: paraInputData(new Date().toISOString()),
  dataFim: '',
  localId: ''
};

export function PaginaGrupos() {
  const navegar = useNavigate();
  const { usuario, estadoAcesso } = useAutenticacao();
  const usuarioAtivo = estadoAcesso === ESTADOS_ACESSO.ativo;
  const usuarioAdministrador = Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  const usuarioOrganizador = Number(usuario?.perfil) === PERFIS_USUARIO.organizador;
  const usuarioAtleta = ehAtleta(usuario);
  const podeCriarGrupo = usuarioAtivo && (usuarioAdministrador || usuarioOrganizador || usuarioAtleta);

  const [grupos, setGrupos] = useState([]);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [grupoEdicaoId, setGrupoEdicaoId] = useState(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const totalGrupos = grupos.length;
  const gruposOrdenados = useMemo(
    () => [...grupos].sort((a, b) => (a.nome || '').localeCompare(b.nome || '')),
    [grupos]
  );

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro('');
    try {
      const listaGrupos = await gruposServico.listar();
      setGrupos(listaGrupos);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function podeGerenciar(grupo) {
    if (!usuarioAtivo) {
      return false;
    }

    if (usuarioAdministrador) {
      return true;
    }

    return grupo.usuarioOrganizadorId === usuario?.id;
  }

  function abrirNovoGrupo() {
    setGrupoEdicaoId(null);
    setFormulario(estadoInicial);
    setFormularioAberto(true);
    setAviso('');
    setErro('');
  }

  function iniciarEdicao(grupo) {
    setGrupoEdicaoId(grupo.id);
    setFormulario({
      nome: grupo.nome || '',
      descricao: grupo.descricao || '',
      link: grupo.link || '',
      dataInicio: paraInputData(grupo.dataInicio),
      dataFim: paraInputData(grupo.dataFim),
      localId: grupo.localId || ''
    });
    setFormularioAberto(true);
    setAviso('');
    setErro('');
  }

  function limparFormulario() {
    setGrupoEdicaoId(null);
    setFormulario(estadoInicial);
    setFormularioAberto(false);
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro('');
    setAviso('');
    setSalvando(true);

    try {
      const dados = {
        nome: formulario.nome.trim(),
        descricao: formulario.descricao.trim() || null,
        link: formulario.link.trim() || null,
        dataInicio: formulario.dataInicio,
        dataFim: formulario.dataFim || null,
        localId: formulario.localId || null
      };

      if (grupoEdicaoId) {
        await gruposServico.atualizar(grupoEdicaoId, dados);
        setAviso('Grupo atualizado.');
      } else {
        await gruposServico.criar(dados);
        setAviso('Grupo criado.');
      }

      limparFormulario();
      await carregarDados();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function removerGrupo(id) {
    if (!window.confirm('Deseja remover este grupo?')) {
      return;
    }

    try {
      await gruposServico.remover(id);
      setAviso('Grupo removido.');
      await carregarDados();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    }
  }

  return (
    <section className="pagina">
      <div className="cabecalho-pagina">
        <h2>Grupos</h2>
        <p>Crie grupos, organize atletas e acompanhe jogos lançados.</p>
      </div>

      {erro && <p className="texto-erro">{erro}</p>}
      {aviso && <p className="texto-sucesso">{aviso}</p>}

      {podeCriarGrupo && !formularioAberto && (
        <div className="acoes-formulario">
          <button type="button" className="botao-primario" onClick={abrirNovoGrupo}>
            Novo grupo
          </button>
        </div>
      )}

      {podeCriarGrupo && formularioAberto && (
        <article className="cartao">
          <form className="formulario-grid" onSubmit={aoSubmeter}>
            <div className="campo-largo">
              <h3>{grupoEdicaoId ? 'Editar grupo' : 'Novo grupo'}</h3>
            </div>

            <label>
              Nome
              <input value={formulario.nome} onChange={(evento) => atualizarCampo('nome', evento.target.value)} required />
            </label>

            <label>
              Início
              <input type="date" value={formulario.dataInicio} onChange={(evento) => atualizarCampo('dataInicio', evento.target.value)} required />
            </label>

            <label>
              Fim
              <input type="date" value={formulario.dataFim} onChange={(evento) => atualizarCampo('dataFim', evento.target.value)} />
            </label>

            <label className="campo-largo">
              Link
              <input value={formulario.link} onChange={(evento) => atualizarCampo('link', evento.target.value)} placeholder="https://..." />
            </label>

            <label className="campo-largo">
              Descrição
              <textarea value={formulario.descricao} onChange={(evento) => atualizarCampo('descricao', evento.target.value)} rows={3} />
            </label>

            <div className="acoes-formulario campo-largo">
              <button type="submit" className="botao-primario" disabled={salvando}>
                {salvando ? 'Salvando...' : grupoEdicaoId ? 'Atualizar grupo' : 'Criar grupo'}
              </button>
              <button type="button" className="botao-secundario" onClick={limparFormulario}>
                Cancelar
              </button>
            </div>
          </form>
        </article>
      )}

      <div className="secao-lista">
        <div className="cabecalho-lista">
          <strong>{totalGrupos} grupo(s)</strong>
        </div>

        {carregando ? (
          <p>Carregando grupos...</p>
        ) : gruposOrdenados.length === 0 ? (
          <p>Nenhum grupo encontrado.</p>
        ) : (
          gruposOrdenados.map((grupo) => (
            <article key={grupo.id} className="cartao-lista competicao-card competicao-card-grupo">
              <div className="competicao-card-conteudo">
                <div className="competicao-card-cabecalho">
                  <div className="competicao-card-titulo">
                    <span className="competicao-card-tipo">Grupo</span>
                    <h3>{grupo.nome}</h3>
                  </div>
                </div>
                <div className="competicao-card-detalhes">
                  <p>Início: {formatarData(grupo.dataInicio)}</p>
                  <p>Fim: {formatarData(grupo.dataFim)}</p>
                  <p>Responsável: {grupo.nomeUsuarioOrganizador || 'Não informado'}</p>
                  {obterLinkHttp(grupo.link) && (
                    <p>
                      Link:{' '}
                      <a href={obterLinkHttp(grupo.link)} target="_blank" rel="noopener noreferrer">
                        Abrir
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <div className="acoes-item competicao-card-acoes">
                <button type="button" className="botao-secundario" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>
                  Atletas do grupo
                </button>
                <button type="button" className="botao-primario" onClick={() => navegar(`/partidas/registrar?grupoId=${grupo.id}`)}>
                  Registrar partida
                </button>
                <button type="button" className="botao-secundario" onClick={() => navegar(`/partidas/consulta?grupoId=${grupo.id}`)}>
                  Jogos do grupo
                </button>
                {podeGerenciar(grupo) && (
                  <>
                    <button type="button" className="botao-secundario botao-editar" onClick={() => iniciarEdicao(grupo)}>
                      Editar
                    </button>
                    <button type="button" className="botao-perigo" onClick={() => removerGrupo(grupo.id)}>
                      Remover
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
