import { useEffect, useMemo, useRef, useState } from 'react';
import { FaTrash, FaUpload, FaTimes, FaChevronLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AtletaPerfilLink } from '../components/AtletaPerfilLink';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { AvatarGrupo } from '../components/grupos/AvatarGrupo';
import { CriarGrupoFluxoModal } from '../components/grupos/CriarGrupoFluxoModal';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { gruposServico } from '../services/gruposServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import { comprimirImagemParaUpload, ehImagemNaoSuportada, ehImagemPermitida } from '../utils/compressaoImagem';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import { PERFIS_USUARIO, ehAtleta } from '../utils/perfis';

const estadoInicial = {
  nome: '',
  privacidade: 'Privado',
  imagemUrl: '',
  localPrincipal: '',
  diasDaSemana: []
};

const tamanhoMaximoImagemGrupoBytes = 2 * 1024 * 1024;

const opcoesPrivacidade = [
  {
    valor: 'Público',
    titulo: '🌎 Público',
    descricao: 'Qualquer atleta pode encontrar e solicitar participação.'
  },
  {
    valor: 'Privado',
    titulo: '🔒 Privado',
    descricao: 'Somente convidados podem participar.'
  }
];

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

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
      <span className="grupos-dashboard-total-rotulo">{rotulo}</span>
      <strong>{valor}</strong>
    </article>
  );
}

function RankingPreview({ ranking }) {
  const lista = Array.isArray(ranking) ? ranking.slice(0, 3) : [];

  return (
    <section className="grupos-dashboard-ranking" aria-label="Prévia do ranking">
      <span className="grupo-resumo-rotulo grupos-dashboard-ranking-titulo">Ranking</span>

      {lista.length > 0 ? (
        <ol className="grupo-resumo-ranking grupos-dashboard-ranking-lista">
          {lista.map((atleta) => (
            <li
              key={`${atleta.posicao}-${atleta.atletaId}`}
              className={atleta.usuarioLogado ? 'home-grupo-usuario-ranking-atual' : undefined}
            >
              <span className="grupos-dashboard-ranking-posicao">{atleta.posicao}º</span>
              <AvatarUsuario
                nome={obterNomeExibicaoAtleta(atleta)}
                fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                tamanho="sm"
                className="grupo-ranking-avatar"
              />
              <AtletaPerfilLink atleta={atleta} className="atleta-nome-link grupos-dashboard-ranking-nome">
                <strong>{obterNomeExibicaoAtleta(atleta) || 'Atleta'}</strong>
              </AtletaPerfilLink>
              <small className="grupos-dashboard-ranking-pontos">{formatarPontuacao(atleta.pontuacao)}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>Ainda sem ranking</p>
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
  const [formularioOriginal, setFormularioOriginal] = useState(estadoInicial);
  const [grupoEdicaoId, setGrupoEdicaoId] = useState(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [modalConfirmacaoSaidaAberto, setModalConfirmacaoSaidaAberto] = useState(false);
  const [fluxoCriarAberto, setFluxoCriarAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [arquivoImagemGrupo, setArquivoImagemGrupo] = useState(null);
  const [previewImagemGrupo, setPreviewImagemGrupo] = useState('');
  const [removerImagemGrupo, setRemoverImagemGrupo] = useState(false);
  const inputImagemGrupoRef = useRef(null);
  const modalEdicaoRef = useRef(null);
  const nomeNormalizado = normalizarNome(formulario.nome);
  const localPrincipalNormalizado = normalizarNome(formulario.localPrincipal);
  const temDadosAlterados = grupoEdicaoId ? (
    nomeNormalizado !== normalizarNome(formularioOriginal.nome) ||
    formulario.privacidade !== formularioOriginal.privacidade ||
    localPrincipalNormalizado !== normalizarNome(formularioOriginal.localPrincipal) ||
    JSON.stringify(formulario.diasDaSemana || []) !== JSON.stringify(formularioOriginal.diasDaSemana || []) ||
    Boolean(arquivoImagemGrupo || previewImagemGrupo)
    || removerImagemGrupo
  ) : (
    nomeNormalizado !== '' ||
    formulario.privacidade !== estadoInicial.privacidade ||
    localPrincipalNormalizado !== estadoInicial.localPrincipal ||
    formulario.diasDaSemana.length > 0 ||
    Boolean(arquivoImagemGrupo || previewImagemGrupo)
  );

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

  useEffect(() => {
    if (!formularioAberto) {
      return undefined;
    }

    document.documentElement.classList.add('grupos-edicao-modal-aberto');
    document.body.classList.add('grupos-edicao-modal-aberto');

    return () => {
      document.documentElement.classList.remove('grupos-edicao-modal-aberto');
      document.body.classList.remove('grupos-edicao-modal-aberto');
    };
  }, [formularioAberto]);

  useEffect(() => {
    if (!formularioAberto) {
      return undefined;
    }

    const viewport = window.visualViewport;
    const modal = modalEdicaoRef.current;
    let rafId = 0;

    function atualizarViewport() {
      if (!modal) {
        return;
      }

      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const altura = viewport?.height || window.innerHeight;
        const offset = viewport
          ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
          : 0;
        const tecladoAberto = offset > 90 || (document.activeElement instanceof HTMLElement && window.innerHeight - altura > 120);
        modal.style.setProperty('--grupos-edicao-viewport-height', `${Math.round(altura)}px`);
        modal.dataset.tecladoAberto = tecladoAberto ? 'true' : 'false';
      });
    }

    atualizarViewport();
    viewport?.addEventListener('resize', atualizarViewport);
    viewport?.addEventListener('scroll', atualizarViewport);
    window.addEventListener('orientationchange', atualizarViewport);
    document.addEventListener('focusin', atualizarViewport);
    document.addEventListener('focusout', atualizarViewport);

    return () => {
      window.cancelAnimationFrame(rafId);
      viewport?.removeEventListener('resize', atualizarViewport);
      viewport?.removeEventListener('scroll', atualizarViewport);
      window.removeEventListener('orientationchange', atualizarViewport);
      document.removeEventListener('focusin', atualizarViewport);
      document.removeEventListener('focusout', atualizarViewport);
    };
  }, [formularioAberto]);

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

  function alternarDiaSemana(dia) {
    setFormulario((anterior) => {
      const diasAtuais = Array.isArray(anterior.diasDaSemana) ? anterior.diasDaSemana : [];
      const selecionado = diasAtuais.includes(dia);
      return {
        ...anterior,
        diasDaSemana: selecionado
          ? diasAtuais.filter((item) => item !== dia)
          : diasSemana.filter((item) => [...diasAtuais, dia].includes(item))
      };
    });
  }

  useEffect(() => {
    return () => {
      if (previewImagemGrupo) {
        URL.revokeObjectURL(previewImagemGrupo);
      }
    };
  }, [previewImagemGrupo]);

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
      const dadosFormulario = {
        nome: dadosGrupo.nome || '',
        privacidade: dadosGrupo.privacidade === 'Público' ? 'Público' : 'Privado',
        imagemUrl: dadosGrupo.imagemUrl || '',
        localPrincipal: dadosGrupo.localPrincipal || '',
        diasDaSemana: Array.isArray(dadosGrupo.diasDaSemana) ? dadosGrupo.diasDaSemana : []
      };
      setFormulario(dadosFormulario);
      setFormularioOriginal(dadosFormulario);
      setArquivoImagemGrupo(null);
      setPreviewImagemGrupo('');
      setRemoverImagemGrupo(false);
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
    if (salvando) return;

    // Se há dados alterados, pedir confirmação
    if (temDadosAlterados) {
      setModalConfirmacaoSaidaAberto(true);
      return;
    }

    limparFormularioSemConfirmacao();
  }

  function limparFormularioSemConfirmacao() {
    setGrupoEdicaoId(null);
    setFormulario(estadoInicial);
    setFormularioOriginal(estadoInicial);
    setFormularioAberto(false);
    setModalConfirmacaoSaidaAberto(false);
    setArquivoImagemGrupo(null);
    setPreviewImagemGrupo('');
    setRemoverImagemGrupo(false);
    if (inputImagemGrupoRef.current) {
      inputImagemGrupoRef.current.value = '';
    }
  }

  async function selecionarImagemGrupo(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) {
      return;
    }

    if (ehImagemNaoSuportada(arquivo)) {
      showNotification({
        type: 'error',
        title: 'Formato não suportado',
        message: 'Envie uma imagem JPG, PNG ou WEBP.'
      });
      evento.target.value = '';
      return;
    }

    if (!ehImagemPermitida(arquivo)) {
      showNotification({
        type: 'error',
        title: 'Formato inválido',
        message: 'A foto do grupo deve ser uma imagem JPG, PNG ou WEBP.'
      });
      evento.target.value = '';
      return;
    }

    if (arquivo.size > tamanhoMaximoImagemGrupoBytes) {
      showNotification({
        type: 'error',
        title: 'Imagem muito grande',
        message: 'A foto do grupo deve ter no máximo 2MB.'
      });
      evento.target.value = '';
      return;
    }

    if (previewImagemGrupo) {
      URL.revokeObjectURL(previewImagemGrupo);
    }

    setArquivoImagemGrupo(arquivo);
    setPreviewImagemGrupo(URL.createObjectURL(arquivo));
    setRemoverImagemGrupo(false);
  }

  function marcarRemocaoImagemGrupo() {
    if (previewImagemGrupo) {
      URL.revokeObjectURL(previewImagemGrupo);
    }

    setArquivoImagemGrupo(null);
    setPreviewImagemGrupo('');
    setRemoverImagemGrupo(Boolean(formulario.imagemUrl));
    if (inputImagemGrupoRef.current) {
      inputImagemGrupoRef.current.value = '';
    }
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
        publico: formulario.privacidade === 'Público',
        localPrincipal: localPrincipalNormalizado || null,
        diasDaSemana: formulario.diasDaSemana
      };

      if (grupoEdicaoId) {
        await gruposServico.atualizar(grupoEdicaoId, dados);
        if (arquivoImagemGrupo) {
          const imagemParaUpload = await comprimirImagemParaUpload(arquivoImagemGrupo, {
            maxSizeMB: 2,
            maxWidthOrHeight: 900
          });
          await gruposServico.atualizarImagem(grupoEdicaoId, imagemParaUpload);
        } else if (removerImagemGrupo) {
          await gruposServico.removerImagem(grupoEdicaoId);
        }
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
            ref={modalEdicaoRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="grupos-edicao-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="grupos-edicao-header">
              <button
                type="button"
                className="grupos-edicao-icone-botao"
                onClick={limparFormulario}
                disabled={salvando}
                aria-label="Voltar"
                title="Voltar"
              >
                <FaChevronLeft aria-hidden="true" />
              </button>
              <div>
                <strong id="grupos-edicao-titulo">Editar grupo</strong>
                <p>Atualize as informações básicas do grupo.</p>
              </div>
              <button
                type="button"
                className="grupos-edicao-icone-botao"
                onClick={limparFormulario}
                disabled={salvando}
                aria-label="Fechar"
                title="Fechar"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </header>

            <form id="grupos-edicao-formulario" className="grupos-edicao-formulario" onSubmit={aoSubmeter}>
              <section className="grupos-edicao-avatar-bloco" aria-label="Foto do grupo">
                <AvatarGrupo
                  nome={formulario.nome}
                  imagemUrl={previewImagemGrupo || (removerImagemGrupo ? '' : formulario.imagemUrl)}
                  tamanho="xl"
                  className="grupos-edicao-avatar"
                />
                <div className="grupos-edicao-avatar-info">
                  <strong>Foto do grupo</strong>
                  <span>Opcional. Use uma imagem JPG, PNG ou WEBP de até 2MB.</span>
                  <div className="grupos-edicao-avatar-acoes">
                    <input
                      ref={inputImagemGrupoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={selecionarImagemGrupo}
                    />
                    <button type="button" className="botao-secundario" onClick={() => inputImagemGrupoRef.current?.click()} disabled={salvando}>
                      <FaUpload aria-hidden="true" /> Alterar foto
                    </button>
                    {(formulario.imagemUrl || previewImagemGrupo) && !removerImagemGrupo && (
                      <button type="button" className="botao-texto-perigo" onClick={marcarRemocaoImagemGrupo} disabled={salvando}>
                        <FaTrash aria-hidden="true" /> Remover foto
                      </button>
                    )}
                  </div>
                </div>
              </section>

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
                <legend>Quem pode encontrar este grupo?</legend>
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

              <label className="grupos-edicao-campo">
                <span>Local principal</span>
                <input
                  value={formulario.localPrincipal}
                  onChange={(evento) => atualizarCampo('localPrincipal', evento.target.value)}
                  onBlur={(evento) => atualizarCampo('localPrincipal', normalizarNome(evento.target.value))}
                  placeholder="Ex.: Praia do Forte"
                  maxLength="200"
                />
              </label>

              <fieldset className="grupos-edicao-dias">
                <legend>Quando o grupo normalmente joga?</legend>
                <div>
                  {diasSemana.map((dia) => {
                    const selecionado = formulario.diasDaSemana.includes(dia);

                    return (
                      <button
                        type="button"
                        key={dia}
                        className={selecionado ? 'selecionado' : undefined}
                        onClick={() => alternarDiaSemana(dia)}
                        aria-pressed={selecionado}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

            </form>

            <footer className="grupos-edicao-acoes">
              <button type="button" className="botao-secundario" onClick={limparFormulario} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" form="grupos-edicao-formulario" className="botao-primario" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </footer>

            {modalConfirmacaoSaidaAberto && (
              <div className="grupos-edicao-confirmacao-backdrop" role="presentation">
                <section className="grupos-edicao-confirmacao" role="dialog" aria-modal="true">
                  <div className="grupos-edicao-confirmacao-topo">
                    <h3>Deseja sair sem salvar?</h3>
                    <p>As alterações não salvas serão perdidas.</p>
                  </div>

                  <div className="grupos-edicao-confirmacao-acoes">
                    <button
                      type="button"
                      className="botao-secundario"
                      onClick={() => setModalConfirmacaoSaidaAberto(false)}
                    >
                      Continuar editando
                    </button>
                    <button
                      type="button"
                      className="botao-perigo"
                      onClick={limparFormularioSemConfirmacao}
                    >
                      Sair
                    </button>
                  </div>
                </section>
              </div>
            )}
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
                    <AvatarGrupo
                      grupo={grupo}
                      tamanho="lg"
                      className="grupos-dashboard-card-avatar"
                      alt={`Foto do grupo ${grupo.nome}`}
                    />
                    <div>
                      <span className="grupos-dashboard-privacidade">{grupo.privacidade || 'Privado'}</span>
                      <h3>{grupo.nome}</h3>
                      {(grupo.criadoEm || grupo.dataCriacao) && (
                        <span className="grupos-dashboard-criacao">
                          Criado em {formatarUltimaAtividade(grupo.criadoEm || grupo.dataCriacao)}
                        </span>
                      )}
                    </div>

                    <span className="grupos-dashboard-atividade">
                      Última atividade: {formatarUltimaAtividade(grupo.ultimaAtividade)}
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
                  <button type="button" className="botao-primario grupos-dashboard-acao-principal" onClick={() => navegar(`/grupos/${grupoId}`)}>
                    Abrir grupo
                  </button>
                  <button type="button" className="botao-secundario grupos-dashboard-acao-principal" onClick={() => navegarParaRegistro(grupoId)}>
                    Registrar partida
                  </button>
                  {podeGerenciar(grupo) && (
                    <>
                      <button type="button" className="botao-secundario grupos-dashboard-acao-menor" onClick={() => iniciarEdicao(grupo)}>
                        Editar
                      </button>
                      <button type="button" className="botao-perigo grupos-dashboard-acao-menor" onClick={() => confirmarRemocaoGrupo(grupoId)}>
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
