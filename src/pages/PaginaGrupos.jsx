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
  
      {podeCriarGrupo && !formularioAberto && (  
        
          <button type="button" className="botao-primario" onClick={abrirNovoGrupo}>
            Criar Novo Grupo
          </button>      
        
      )}

      {podeCriarGrupo && formularioAberto && (
        <article className="cartao">
          <form className="formulario-grid" onSubmit={aoSubmeter}> 
            <label>
              Nome
              <input value={formulario.nome} onChange={(evento) => atualizarCampo('nome', evento.target.value)} required />
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
        {carregando ? (
          <p>Carregando grupos...</p>
        ) : gruposOrdenados.length === 0 ? (
          <p>Nenhum grupo encontrado.</p>
        ) : (
          gruposOrdenados.map((grupo) => (
            <article key={grupo.id} className="cartao-lista competicao-card competicao-card-grupo">
              <div className="competicao-card-data">
                <div className="competicao-card-conteudo">              
                  <h3>{grupo.nome}</h3>                    
                  <span>Criado por: {grupo.nomeUsuarioOrganizador || 'Não informado'}</span>                             
                </div>
                <div className="acoes-item competicao-card-acoes">
                  <button type="button" className="botao-primario" onClick={() => navegar(`/partidas/registrar?grupoId=${grupo.id}`)}>
                    Registrar partida
                  </button>
                  <button type="button" className="botao-primario" onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}>
                    Atletas do grupo
                  </button>               
                  <button type="button" className="botao-primario" onClick={() => navegar(`/partidas/consulta?grupoId=${grupo.id}`)}>
                    Jogos do grupo
                  </button>
                  {podeGerenciar(grupo) && (
                    <>
                      <button type="button" className="botao-primario" onClick={() => iniciarEdicao(grupo)}>
                        Editar
                      </button>
                      <button type="button" className="botao-perigo" onClick={() => removerGrupo(grupo.id)}>
                        Remover
                      </button>
                    </>
                  )}               
                </div>
              </div>     
            </article>
          ))
        )}       
      </div>      
    </section>
  );
}