import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtletaPerfilLink } from '../components/AtletaPerfilLink';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { CriarGrupoFluxoModal } from '../components/grupos/CriarGrupoFluxoModal';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { gruposServico } from '../services/gruposServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import { PERFIS_USUARIO, ehAtleta } from '../utils/perfis';

const estadoInicial = {
  nome: '',
  privacidade: 'Privado'
};

const opcoesPrivacidade = [
  {
    valor: 'Público',
    titulo: 'Público',
    descricao: 'Permite encontrar o grupo e registrar partidas com atletas de fora conforme as regras atuais.'
  },
  {
    valor: 'Privado',
    titulo: 'Privado',
    descricao: 'Mantém o grupo restrito aos atletas já vinculados ao grupo.'
  }
];

const dashboardVazio = {
  totais: {
    quantidadeGrupos: 0,
    quantidadeAtletas: 0,
    quantidadePartidas: 0,
    pendenciasGrupos: 0
  },
  grupos: []
};

function formatarPontuacao(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return '0 pts';
  }

  const texto = Number.isInteger(numero)
    ? String(numero)
    : numero.toFixed(1).replace('.', ',');

  return `${texto} pts`;
}

function formatarUltimaAtividade(data) {
  if (!data) {
    return 'Sem atividade';
  }

  return formatarDataHora(data);
}

function obterIdGrupo(grupo) {
  return grupo.grupoId || grupo.id;
}

function obterQuantidade(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarNome(nome) {
  return String(nome || '').trim().replace(/\s+/g, ' ');
}

function CardTotal({ rotulo, valor }) {
  return (
    <article className="grupos-dashboard-total">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </article>
  );
}

function RankingPreview({ ranking }) {
  const lista = Array.isArray(ranking) ? ranking.slice(0, 3) : [];

  return (
    <section className="grupos-dashboard-ranking" aria-label="Prévia do ranking">
      <span className="grupo-resumo-rotulo">Ranking</span>

      {lista.length > 0 ? (
        <ol className="grupo-resumo-ranking">
          {lista.map((atleta) => (
            <li
              key={`${atleta.posicao}-${atleta.atletaId}`}
              className={atleta.usuarioLogado ? 'home-grupo-usuario-ranking-atual' : undefined}
            >
              <span>{atleta.posicao}º</span>
              <AvatarUsuario
                nome={obterNomeExibicaoAtleta(atleta)}
                fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                tamanho="sm"
                className="grupo-ranking-avatar"
              />
              <AtletaPerfilLink atleta={atleta} className="atleta-nome-link">
                <strong>{obterNomeExibicaoAtleta(atleta) || 'Atleta'}</strong>
              </AtletaPerfilLink>
              <small>{formatarPontuacao(atleta.pontuacao)}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>Ranking ainda não disponível</p>
      )}
    </section>
  );
}

export function PaginaGrupos() {
  const navegar = useNavigate();
  const { token, usuario, estadoAcesso } = useAutenticacao();
  const { showNotification, closeNotification } = useNotification();
  const usuarioAtivo = estadoAcesso === ESTADOS_ACESSO.ativo;
  const usuarioAdministrador = Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  const usuarioOrganizador = Number(usuario?.perfil) === PERFIS_USUARIO.organizador;
  const usuarioAtleta = ehAtleta(usuario);
  const podeCriarGrupo = usuarioAtivo && (usuarioAdministrador || usuarioOrganizador || usuarioAtleta);

  const [dashboard, setDashboard] = useState(dashboardVazio);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [grupoEdicaoId, setGrupoEdicaoId] = useState(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [fluxoCriarAberto, setFluxoCriarAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const gruposOrdenados = useMemo(
    () => [...(dashboard.grupos || [])].sort((a, b) => {
      const dataA = a.ultimaAtividade ? new Date(a.ultimaAtividade).getTime() : 0;
      const dataB = b.ultimaAtividade ? new Date(b.ultimaAtividade).getTime() : 0;
      return dataB - dataA || (a.nome || '').localeCompare(b.nome || '');
    }),
    [dashboard.grupos]
  );

  useEffect(() => {
    carregarDados();
  }, [token, usuario?.id]);

  async function carregarDados() {
    setCarregando(true);
    setErroCarregamento(false);

    try {
      if (!token) {
        setDashboard(dashboardVazio);
        return;
      }

      const dados = await gruposServico.obterDashboard();
      setDashboard({
        totais: dados?.totais || dashboardVazio.totais,
        grupos: Array.isArray(dados?.grupos) ? dados.grupos : []
      });
    } catch (error) {
      setDashboard(dashboardVazio);
      setErroCarregamento(true);
      showNotification({
        type: 'error',
        title: 'Erro ao carregar grupos',
        message: extrairMensagemErro(error)
      });
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
    setFluxoCriarAberto(true);
  }

  async function iniciarEdicao(grupo) {
    const grupoId = obterIdGrupo(grupo);

    try {
      const dadosGrupo = await gruposServico.obterPorId(grupoId);
      setGrupoEdicaoId(grupoId);
      setFormulario({
        nome: dadosGrupo.nome || '',
        privacidade: dadosGrupo.privacidade === 'Público' ? 'Público' : 'Privado'
      });
      setFormularioAberto(true);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao abrir grupo',
        message: extrairMensagemErro(error)
      });
    }
  }

  async function aoCriarGrupoFluxo() {
    await carregarDados();
  }

  function limparFormulario() {
    setGrupoEdicaoId(null);
    setFormulario(estadoInicial);
    setFormularioAberto(false);
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setSalvando(true);

    try {
      const nome = normalizarNome(formulario.nome);
      if (!nome) {
        showNotification({
          type: 'error',
          title: 'Nome obrigatório',
          message: 'Informe o nome do grupo para salvar.'
        });
        return;
      }

      const dados = {
        nome,
        publico: formulario.privacidade === 'Público'
      };

      if (grupoEdicaoId) {
        await gruposServico.atualizar(grupoEdicaoId, dados);
        showNotification({
          type: 'success',
          title: 'Grupo atualizado',
          message: 'As alterações foram salvas com sucesso.'
        });
      } else {
        await gruposServico.criar(dados);
        showNotification({
          type: 'success',
          title: 'Grupo criado',
          message: 'O grupo foi criado com sucesso.'
        });
      }

      limparFormulario();
      await carregarDados();
    } catch (error) {
      showNotification({
        type: 'error',
        title: grupoEdicaoId ? 'Erro ao atualizar grupo' : 'Erro ao criar grupo',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvando(false);
    }
  }

  async function removerGrupo(id) {
    try {
      await gruposServico.remover(id);
      showNotification({
        type: 'success',
        title: 'Grupo removido',
        message: 'O grupo foi removido com sucesso.'
      });
      await carregarDados();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao remover grupo',
        message: extrairMensagemErro(error)
      });
    }
  }

  function confirmarRemocaoGrupo(id) {
    showNotification({
      type: 'warning',
      title: 'Remover grupo?',
      message: 'Esta ação remove o grupo selecionado.',
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
              removerGrupo(id);
            }}
          >
            Remover
          </button>
        </>
      )
    });
  }

  function navegarParaRegistro(grupoId) {
    if (!usuarioAtivo) {
      navegar('/login');
      return;
    }

    navegar(`/partidas/registrar?grupoId=${grupoId}`);
  }

  const totais = dashboard.totais || dashboardVazio.totais;

  return (
    <section className="pagina grupos-dashboard-pagina">
      <header className="cabecalho-pagina grupos-dashboard-cabecalho">
        <div>
          <h2>Grupos</h2>
          <p>Acompanhe partidas, rankings e atletas dos seus grupos</p>
        </div>

        {podeCriarGrupo && !formularioAberto && (
          <button type="button" className="botao-primario" onClick={abrirNovoGrupo}>
            Criar grupo
          </button>
        )}
      </header>

      {podeCriarGrupo && formularioAberto && (
        <div className="modal-sobreposicao grupos-edicao-sobreposicao" role="presentation" onClick={limparFormulario}>
          <article
            className="modal-conteudo grupos-edicao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="grupos-edicao-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="modal-cabecalho">
              <div>
                <h3 id="grupos-edicao-titulo">Editar grupo</h3>
                <p>Atualize as informações básicas do grupo.</p>
              </div>
            </div>

            <form className="grupos-edicao-formulario" onSubmit={aoSubmeter}>
              <label className="grupos-edicao-campo">
                <span>Nome do grupo</span>
                <input
                  value={formulario.nome}
                  onChange={(evento) => atualizarCampo('nome', evento.target.value)}
                  required
                  autoFocus
                />
              </label>

              <fieldset className="grupos-edicao-visibilidade">
                <legend>Visibilidade</legend>
                <div>
                  {opcoesPrivacidade.map((opcao) => {
                    const selecionada = formulario.privacidade === opcao.valor;

                    return (
                      <button
                        type="button"
                        key={opcao.valor}
                        className={selecionada ? 'selecionada' : undefined}
                        onClick={() => atualizarCampo('privacidade', opcao.valor)}
                        aria-pressed={selecionada}
                      >
                        <strong>{opcao.titulo}</strong>
                        <span>{opcao.descricao}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grupos-edicao-acoes">
                <button type="button" className="botao-secundario" onClick={limparFormulario} disabled={salvando}>
                  Cancelar
                </button>
                <button type="submit" className="botao-primario" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </article>
        </div>
      )}

      <section className="grupos-dashboard-totais" aria-label="Resumo dos grupos">
        <CardTotal rotulo="Grupos" valor={obterQuantidade(totais.quantidadeGrupos)} />
        <CardTotal rotulo="Atletas" valor={obterQuantidade(totais.quantidadeAtletas)} />
        <CardTotal rotulo="Partidas" valor={obterQuantidade(totais.quantidadePartidas)} />
        <CardTotal rotulo="Pendências" valor={obterQuantidade(totais.pendenciasGrupos)} />
      </section>

      {carregando ? (
        <article className="cartao-lista grupos-dashboard-estado">
          <p>Carregando grupos...</p>
        </article>
      ) : erroCarregamento ? (
        <article className="cartao-lista grupos-dashboard-estado">
          <h3>Não foi possível carregar seus grupos agora</h3>
          <p>Tente novamente em instantes.</p>
          <button type="button" className="botao-secundario" onClick={carregarDados}>
            Recarregar
          </button>
        </article>
      ) : gruposOrdenados.length === 0 ? (
        <article className="cartao-lista grupos-dashboard-vazio">
          <h3>Você ainda não participa de nenhum grupo</h3>
          <p>Crie um grupo para organizar partidas com seus amigos ou participe de um grupo existente.</p>

          <div className="grupos-dashboard-acoes">
            {podeCriarGrupo && (
              <button type="button" className="botao-primario" onClick={abrirNovoGrupo}>
                Criar grupo
              </button>
            )}
            <button type="button" className="botao-secundario" onClick={() => navegar('/partidas/registrar')}>
              Registrar partida avulsa
            </button>
          </div>
        </article>
      ) : (
        <section className="grupos-dashboard-lista" aria-label="Lista de grupos">
          {gruposOrdenados.map((grupo) => {
            const grupoId = obterIdGrupo(grupo);
            return (
              <article key={grupoId} className="cartao-lista grupos-dashboard-card">
                <button
                  type="button"
                  className="grupos-dashboard-card-corpo"
                  onClick={() => navegar(`/grupos/${grupoId}`)}
                >
                  <div className="grupos-dashboard-card-topo">
                    <div>
                      <span className="grupos-dashboard-privacidade">{grupo.privacidade || 'Privado'}</span>
                      <h3>{grupo.nome}</h3>
                    </div>

                    <span className="grupos-dashboard-atividade">
                      {formatarUltimaAtividade(grupo.ultimaAtividade)}
                    </span>
                  </div>

                  <div className="grupos-dashboard-metricas">
                    <span>{obterQuantidade(grupo.quantidadeAtletas)} atletas</span>
                    <span>{obterQuantidade(grupo.quantidadePartidas)} partidas</span>
                    <span>{obterQuantidade(grupo.pendencias)} pendências</span>
                  </div>
                </button>

                <RankingPreview ranking={grupo.rankingTop3} />

                <div className="grupos-dashboard-acoes">
                  <button type="button" className="botao-primario" onClick={() => navegar(`/grupos/${grupoId}`)}>
                    Abrir grupo
                  </button>
                  <button type="button" className="botao-secundario" onClick={() => navegarParaRegistro(grupoId)}>
                    Registrar partida
                  </button>
                  {podeGerenciar(grupo) && (
                    <>
                      <button type="button" className="botao-secundario" onClick={() => iniciarEdicao(grupo)}>
                        Editar
                      </button>
                      <button type="button" className="botao-perigo" onClick={() => confirmarRemocaoGrupo(grupoId)}>
                        Remover
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <CriarGrupoFluxoModal
        aberto={fluxoCriarAberto}
        onFechar={() => setFluxoCriarAberto(false)}
        onCriado={aoCriarGrupoFluxo}
        onAdicionarAtletas={(grupo) => {
          setFluxoCriarAberto(false);
          navegar(`/grupos/${grupo.id}/atletas`);
        }}
        onEntrarGrupo={(grupo) => {
          setFluxoCriarAberto(false);
          navegar(`/grupos/${grupo.id}/atletas`);
        }}
      />
    </section>
  );
}
