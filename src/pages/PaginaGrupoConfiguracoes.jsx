import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaExclamationTriangle,
  FaGlobeAmericas,
  FaImage,
  FaLock,
  FaPencilAlt,
  FaTrashAlt,
  FaUsers
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { AvatarGrupo } from '../components/grupos/AvatarGrupo';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { gruposServico } from '../services/gruposServico';
import { extrairMensagemErro } from '../utils/erros';
import { ehAdministrador } from '../utils/perfis';

const LIMITE_NOME_GRUPO = 50;
const CONFIRMACAO_EXCLUSAO_GRUPO = 'EXCLUIR';

function idsIguais(idA, idB) {
  return Boolean(idA && idB) && String(idA).toLowerCase() === String(idB).toLowerCase();
}

function obterPrivacidadeGrupo(grupo) {
  const privacidade = String(grupo?.privacidade || '').trim();
  if (privacidade) {
    return privacidade;
  }

  return grupo?.publico ? 'Público' : 'Privado';
}

function grupoEhPublico(grupo) {
  return obterPrivacidadeGrupo(grupo).toLowerCase().includes('públic') ||
    obterPrivacidadeGrupo(grupo).toLowerCase().includes('public');
}

function montarPayloadAtualizacaoGrupo(grupo, sobrescritas = {}) {
  const privacidade = sobrescritas.privacidade ?? obterPrivacidadeGrupo(grupo);
  const publico = sobrescritas.publico ?? (String(privacidade).toLowerCase().includes('públic') ||
    String(privacidade).toLowerCase().includes('public'));

  return {
    nome: sobrescritas.nome ?? grupo.nome,
    publico,
    privacidade,
    localPrincipal: grupo.localPrincipal ?? null,
    diasDaSemana: Array.isArray(grupo.diasDaSemana) ? grupo.diasDaSemana : []
  };
}

function ConfiguracaoLinha({ icone: Icone, titulo, descricao, destaque, perigo, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`grupo-config-linha${perigo ? ' grupo-config-linha-perigo' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="grupo-config-linha-icone" aria-hidden="true">
        <Icone />
      </span>
      <span className="grupo-config-linha-texto">
        <strong>{titulo}</strong>
        {descricao && <small>{descricao}</small>}
      </span>
      {destaque && <span className="grupo-config-linha-destaque">{destaque}</span>}
      <FaChevronRight className="grupo-config-linha-seta" aria-hidden="true" />
    </button>
  );
}

function ModalBase({ titulo, descricao, children, onFechar, labelledBy }) {
  return (
    <div className="modal-backdrop grupo-config-modal-backdrop" role="presentation" onClick={onFechar}>
      <article
        className="modal-conteudo grupo-config-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="grupo-config-modal-cabecalho">
          <div>
            <h3 id={labelledBy}>{titulo}</h3>
            {descricao && <p>{descricao}</p>}
          </div>
          <button type="button" className="grupo-config-modal-fechar" onClick={onFechar} aria-label="Fechar modal">
            ×
          </button>
        </div>
        {children}
      </article>
    </div>
  );
}

export function PaginaGrupoConfiguracoes() {
  const { grupoId } = useParams();
  const navegar = useNavigate();
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const arquivoImagemRef = useRef(null);
  const [grupo, setGrupo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [modalAtivo, setModalAtivo] = useState(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [erroNome, setErroNome] = useState('');
  const [tipoEdicao, setTipoEdicao] = useState('Privado');
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('');
  const [erroExclusao, setErroExclusao] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregarGrupo();
  }, [grupoId]);

  const usuarioEhCriador = useMemo(
    () => idsIguais(grupo?.usuarioOrganizadorId, usuario?.id),
    [grupo?.usuarioOrganizadorId, usuario?.id]
  );
  const usuarioAdministrador = ehAdministrador(usuario);
  const podeConfigurar = Boolean(grupo) && (usuarioAdministrador || usuarioEhCriador);
  const podeExcluir = Boolean(grupo) && usuarioEhCriador;
  const privacidade = obterPrivacidadeGrupo(grupo);
  const PrivacidadeIcone = grupoEhPublico(grupo) ? FaGlobeAmericas : FaLock;

  async function carregarGrupo() {
    setCarregando(true);
    setErroCarregamento('');

    try {
      const grupoAtual = await gruposServico.obterPorId(grupoId);
      setGrupo(grupoAtual);
    } catch (error) {
      setGrupo(null);
      setErroCarregamento(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function abrirModalNome() {
    setNomeEdicao(grupo?.nome || '');
    setErroNome('');
    setModalAtivo('nome');
  }

  function abrirModalTipo() {
    setTipoEdicao(obterPrivacidadeGrupo(grupo));
    setModalAtivo('tipo');
  }

  function abrirModalExclusao() {
    setConfirmacaoExclusao('');
    setErroExclusao('');
    setModalAtivo('exclusao');
  }

  function fecharModal() {
    if (processando) {
      return;
    }

    setModalAtivo(null);
    setErroNome('');
    setErroExclusao('');
  }

  async function salvarNome(evento) {
    evento.preventDefault();
    const nome = nomeEdicao.trim();

    if (!nome) {
      setErroNome('Informe o nome do grupo.');
      return;
    }

    if (nome.length > LIMITE_NOME_GRUPO) {
      setErroNome(`O nome deve ter no máximo ${LIMITE_NOME_GRUPO} caracteres.`);
      return;
    }

    setProcessando(true);
    setErroNome('');

    try {
      const grupoAtualizado = await gruposServico.atualizar(
        grupo.id,
        montarPayloadAtualizacaoGrupo(grupo, { nome })
      );
      setGrupo(grupoAtualizado);
      setModalAtivo(null);
      showNotification({
        type: 'success',
        title: 'Nome atualizado',
        message: 'As informações do grupo foram atualizadas.'
      });
    } catch (error) {
      setErroNome(extrairMensagemErro(error));
    } finally {
      setProcessando(false);
    }
  }

  async function salvarTipo() {
    setProcessando(true);

    try {
      const grupoAtualizado = await gruposServico.atualizar(
        grupo.id,
        montarPayloadAtualizacaoGrupo(grupo, {
          privacidade: tipoEdicao,
          publico: tipoEdicao === 'Público'
        })
      );
      setGrupo(grupoAtualizado);
      setModalAtivo(null);
      showNotification({
        type: 'success',
        title: 'Tipo atualizado',
        message: 'A visibilidade do grupo foi atualizada.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao atualizar tipo',
        message: extrairMensagemErro(error)
      });
    } finally {
      setProcessando(false);
    }
  }

  async function aoSelecionarImagem(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) {
      return;
    }

    setProcessando(true);

    try {
      const resposta = await gruposServico.atualizarImagem(grupo.id, arquivo);
      setGrupo((atual) => ({ ...atual, imagemUrl: resposta?.imagemUrl || atual?.imagemUrl }));
      setModalAtivo(null);
      showNotification({
        type: 'success',
        title: 'Imagem atualizada',
        message: 'A imagem do grupo foi atualizada.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao atualizar imagem',
        message: extrairMensagemErro(error)
      });
    } finally {
      setProcessando(false);
      evento.target.value = '';
    }
  }

  async function removerImagem() {
    setProcessando(true);

    try {
      await gruposServico.removerImagem(grupo.id);
      setGrupo((atual) => ({ ...atual, imagemUrl: null }));
      setModalAtivo(null);
      showNotification({
        type: 'success',
        title: 'Imagem removida',
        message: 'O grupo voltará a usar o avatar automático.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao remover imagem',
        message: extrairMensagemErro(error)
      });
    } finally {
      setProcessando(false);
    }
  }

  async function excluirGrupo(evento) {
    evento.preventDefault();
    if (confirmacaoExclusao !== CONFIRMACAO_EXCLUSAO_GRUPO || processando) {
      return;
    }

    setProcessando(true);
    setErroExclusao('');

    try {
      await gruposServico.remover(grupo.id);
      setModalAtivo(null);
      showNotification({
        type: 'success',
        title: 'Grupo excluído',
        message: 'O grupo foi removido com sucesso.'
      });
      navegar('/grupos', { replace: true });
    } catch (error) {
      setErroExclusao(extrairMensagemErro(error));
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <section className="pagina grupo-config-pagina">
        <article className="cartao-lista">Carregando configurações do grupo...</article>
      </section>
    );
  }

  if (erroCarregamento || !grupo) {
    return (
      <section className="pagina grupo-config-pagina">
        <article className="cartao-lista grupos-dashboard-estado">
          <h3>Não foi possível carregar o grupo</h3>
          {erroCarregamento && <p>{erroCarregamento}</p>}
          <button type="button" className="botao-secundario" onClick={carregarGrupo}>Recarregar</button>
        </article>
      </section>
    );
  }

  if (!podeConfigurar) {
    return (
      <section className="pagina grupo-config-pagina">
        <header className="grupo-config-topo">
          <button type="button" className="botao-voltar" onClick={() => navegar(`/grupos/${grupo.id}`)}>
            <span className="botao-voltar-icone"><FaChevronLeft aria-hidden="true" /></span>
            Voltar
          </button>
          <h2>Configurações do Grupo</h2>
        </header>
        <article className="cartao-lista grupos-dashboard-estado">
          <h3>Configurações indisponíveis</h3>
          <p>Somente o criador ou administradores podem alterar este grupo.</p>
          <button type="button" className="botao-secundario" onClick={() => navegar(`/grupos/${grupo.id}`)}>
            Voltar para o grupo
          </button>
        </article>
      </section>
    );
  }

  return (
    <section className="pagina grupo-config-pagina">
      <header className="grupo-config-topo">
        <button type="button" className="botao-voltar" onClick={() => navegar(`/grupos/${grupo.id}`)}>
          <span className="botao-voltar-icone"><FaChevronLeft aria-hidden="true" /></span>
          Voltar
        </button>
        <h2>Configurações do Grupo</h2>
      </header>

      <article className="grupo-config-resumo">
        <AvatarGrupo
          grupo={grupo}
          nome={grupo.nome}
          imagemUrl={grupo.imagemUrl}
          tamanho="xl"
          className="grupo-config-avatar"
        />
        <div>
          <h3>{grupo.nome}</h3>
          <span className="grupo-dashboard-privacidade">
            <PrivacidadeIcone aria-hidden="true" />
            {privacidade}
          </span>
        </div>
      </article>

      <section className="grupo-config-secao" aria-labelledby="grupo-config-info">
        <h3 id="grupo-config-info">Informações</h3>
        <div className="grupo-config-lista">
          <ConfiguracaoLinha
            icone={FaPencilAlt}
            titulo="Editar nome"
            descricao="Ajuste o nome exibido no grupo."
            onClick={abrirModalNome}
          />
          <ConfiguracaoLinha
            icone={FaImage}
            titulo="Alterar imagem"
            descricao="Troque a imagem ou volte ao avatar automático."
            onClick={() => setModalAtivo('imagem')}
          />
          <ConfiguracaoLinha
            icone={PrivacidadeIcone}
            titulo="Tipo do grupo"
            descricao={grupoEhPublico(grupo) ? 'Outros atletas podem encontrar o grupo.' : 'Somente membros participam.'}
            destaque={privacidade}
            onClick={abrirModalTipo}
          />
        </div>
      </section>

      <section className="grupo-config-secao" aria-labelledby="grupo-config-participantes">
        <h3 id="grupo-config-participantes">Participantes</h3>
        <div className="grupo-config-lista">
          <ConfiguracaoLinha
            icone={FaUsers}
            titulo="Membros"
            descricao="Visualizar, buscar, adicionar ou remover atletas."
            onClick={() => navegar(`/grupos/${grupo.id}/atletas`)}
          />
          <ConfiguracaoLinha
            icone={FaCrown}
            titulo="Administradores"
            descricao="Ver responsáveis administrativos do grupo."
            onClick={() => setModalAtivo('administradores')}
          />
        </div>
      </section>

      {podeExcluir && (
        <section className="grupo-config-secao grupo-config-zona-perigo" aria-labelledby="grupo-config-perigo">
          <h3 id="grupo-config-perigo">Zona de perigo</h3>
          <div className="grupo-config-lista">
            <ConfiguracaoLinha
              icone={FaTrashAlt}
              titulo="Excluir grupo"
              descricao="Disponível somente para o criador do grupo."
              perigo
              onClick={abrirModalExclusao}
            />
          </div>
        </section>
      )}

      <input
        ref={arquivoImagemRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={aoSelecionarImagem}
      />

      {modalAtivo === 'nome' && (
        <ModalBase
          titulo="Editar nome"
          descricao="Informe como o grupo deve aparecer para os atletas."
          onFechar={fecharModal}
          labelledBy="grupo-config-modal-nome"
        >
          <form className="grupo-config-form" onSubmit={salvarNome}>
            <label>
              Nome do grupo
              <input
                type="text"
                value={nomeEdicao}
                maxLength={LIMITE_NOME_GRUPO}
                onChange={(evento) => setNomeEdicao(evento.target.value)}
                autoFocus
              />
            </label>
            <small className="grupo-config-contador">{nomeEdicao.length}/{LIMITE_NOME_GRUPO}</small>
            {erroNome && <p className="texto-erro">{erroNome}</p>}
            <div className="grupo-config-modal-acoes">
              <button type="button" className="botao-terciario" onClick={fecharModal} disabled={processando}>
                Cancelar
              </button>
              <button type="submit" className="botao-primario" disabled={processando}>
                {processando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {modalAtivo === 'imagem' && (
        <ModalBase
          titulo="Alterar imagem"
          descricao="Use uma imagem do grupo ou mantenha o avatar automático."
          onFechar={fecharModal}
          labelledBy="grupo-config-modal-imagem"
        >
          <div className="grupo-config-imagem-modal">
            <AvatarGrupo grupo={grupo} nome={grupo.nome} imagemUrl={grupo.imagemUrl} tamanho="xl" />
            <div className="grupo-config-modal-acoes">
              <button
                type="button"
                className="botao-primario"
                onClick={() => arquivoImagemRef.current?.click()}
                disabled={processando}
              >
                {processando ? 'Enviando...' : 'Escolher imagem'}
              </button>
              {grupo.imagemUrl && (
                <button type="button" className="botao-terciario grupo-config-botao-remover-imagem" onClick={removerImagem} disabled={processando}>
                  Remover imagem
                </button>
              )}
              <button type="button" className="botao-secundario" onClick={fecharModal} disabled={processando}>
                Cancelar
              </button>
            </div>
          </div>
        </ModalBase>
      )}

      {modalAtivo === 'tipo' && (
        <ModalBase
          titulo="Tipo do grupo"
          descricao="Defina como os atletas encontram este grupo."
          onFechar={fecharModal}
          labelledBy="grupo-config-modal-tipo"
        >
          <div className="grupo-config-tipo-opcoes" role="radiogroup" aria-label="Tipo do grupo">
            <button
              type="button"
              className={tipoEdicao === 'Privado' ? 'selecionado' : ''}
              onClick={() => setTipoEdicao('Privado')}
              aria-pressed={tipoEdicao === 'Privado'}
            >
              <FaLock aria-hidden="true" />
              <strong>Privado</strong>
              <small>Somente membros participam.</small>
            </button>
            <button
              type="button"
              className={tipoEdicao === 'Público' ? 'selecionado' : ''}
              onClick={() => setTipoEdicao('Público')}
              aria-pressed={tipoEdicao === 'Público'}
            >
              <FaGlobeAmericas aria-hidden="true" />
              <strong>Público</strong>
              <small>Outros atletas podem encontrar o grupo.</small>
            </button>
          </div>
          <div className="grupo-config-modal-acoes">
            <button type="button" className="botao-terciario" onClick={fecharModal} disabled={processando}>
              Cancelar
            </button>
            <button type="button" className="botao-primario" onClick={salvarTipo} disabled={processando}>
              {processando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </ModalBase>
      )}

      {modalAtivo === 'administradores' && (
        <ModalBase
          titulo="Administradores"
          descricao="O modelo atual mantém o criador como responsável principal do grupo."
          onFechar={fecharModal}
          labelledBy="grupo-config-modal-administradores"
        >
          <div className="grupo-config-admin-lista">
            <article className="grupo-config-admin-item">
              <span className="grupo-config-linha-icone" aria-hidden="true">
                <FaCrown />
              </span>
              <div>
                <strong>{grupo.nomeUsuarioOrganizador || 'Criador do grupo'}</strong>
                <small>Criador/Owner</small>
              </div>
            </article>
            <p className="grupo-config-ajuda">
              Promoção e remoção de administradores dependem de suporte explícito do backend e não foram habilitadas nesta fase.
            </p>
          </div>
          <div className="grupo-config-modal-acoes">
            <button type="button" className="botao-secundario" onClick={fecharModal}>
              Fechar
            </button>
          </div>
        </ModalBase>
      )}

      {modalAtivo === 'exclusao' && (
        <ModalBase
          titulo="Excluir grupo"
          descricao="Esta ação exige confirmação do criador."
          onFechar={fecharModal}
          labelledBy="grupo-config-modal-exclusao"
        >
          <form className="grupo-config-form grupo-config-exclusao-form" onSubmit={excluirGrupo}>
            <div className="grupo-config-alerta-perigo">
              <FaExclamationTriangle aria-hidden="true" />
              <div>
                <p>Tem certeza que deseja excluir este grupo?</p>
                <p>Esta ação poderá impactar partidas, rankings, scouts e históricos vinculados ao grupo.</p>
                <p>Esta ação não poderá ser desfeita.</p>
              </div>
            </div>
            <label>
              Digite EXCLUIR para confirmar
              <input
                type="text"
                value={confirmacaoExclusao}
                onChange={(evento) => setConfirmacaoExclusao(evento.target.value)}
                autoComplete="off"
                autoFocus
              />
            </label>
            {erroExclusao && <p className="texto-erro">{erroExclusao}</p>}
            <div className="grupo-config-modal-acoes">
              <button type="button" className="botao-terciario" onClick={fecharModal} disabled={processando}>
                Cancelar
              </button>
              <button
                type="submit"
                className="botao-perigo"
                disabled={processando || confirmacaoExclusao !== CONFIRMACAO_EXCLUSAO_GRUPO}
              >
                <FaTrashAlt aria-hidden="true" />
                {processando ? 'Excluindo...' : 'Excluir grupo'}
              </button>
            </div>
          </form>
        </ModalBase>
      )}
    </section>
  );
}
