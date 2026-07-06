import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCheck,
  FaChevronLeft,
  FaGlobeAmericas,
  FaImage,
  FaLock,
  FaTrash,
  FaTimes,
  FaUsers
} from 'react-icons/fa';
import { gruposServico } from '../../services/gruposServico';
import { comprimirImagemParaUpload, ehImagemNaoSuportada, ehImagemPermitida } from '../../utils/compressaoImagem';
import { extrairMensagemErro } from '../../utils/erros';
import { paraInputData } from '../../utils/formatacao';
import { AvatarGrupo } from './AvatarGrupo';
import './criar-grupo-fluxo.css';

const estadoInicial = {
  nome: '',
  privacidade: 'Privado'
};

const tamanhoMaximoImagemGrupoBytes = 2 * 1024 * 1024;

const opcoesPrivacidade = [
  {
    valor: 'Privado',
    titulo: 'Privado',
    descricao: 'Somente membros convidados participam.',
    icone: FaLock
  },
  {
    valor: 'Público',
    titulo: 'Público',
    descricao: 'Outros atletas poderão encontrar e solicitar entrada.',
    icone: FaGlobeAmericas
  }
];

const etapasCriacaoGrupo = [
  { id: 'nome', titulo: 'Nome' },
  { id: 'tipo', titulo: 'Tipo' },
  { id: 'imagem', titulo: 'Imagem' },
  { id: 'confirmacao', titulo: 'Confirmação' }
];

function normalizarNome(nome) {
  return String(nome || '').trim().replace(/\s+/g, ' ');
}

function obterSimilares(verificacao) {
  return verificacao?.similares || verificacao?.grupos || [];
}

function campoEditavel(elemento) {
  return elemento instanceof HTMLInputElement ||
    elemento instanceof HTMLTextAreaElement ||
    elemento instanceof HTMLSelectElement;
}

function aguardarRecalculoViewport() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 90);
    });
  });
}

export function CriarGrupoFluxoModal({
  aberto,
  onFechar,
  onCriado
}) {
  const [etapa, setEtapa] = useState(0);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [verificacaoNome, setVerificacaoNome] = useState(null);
  const [modalSimilaresAberto, setModalSimilaresAberto] = useState(false);
  const [arquivoImagemGrupo, setArquivoImagemGrupo] = useState(null);
  const [previewImagemGrupo, setPreviewImagemGrupo] = useState('');
  const [modalConfirmacaoSaidaAberto, setModalConfirmacaoSaidaAberto] = useState(false);
  const inputImagemGrupoRef = useRef(null);
  const modalRef = useRef(null);
  const nomeNormalizado = normalizarNome(formulario.nome);
  const temDadosPreenchidos = Boolean(
    nomeNormalizado ||
    formulario.privacidade !== estadoInicial.privacidade ||
    previewImagemGrupo
  );

  const similares = useMemo(() => obterSimilares(verificacaoNome), [verificacaoNome]);
  const existeExato = Boolean(verificacaoNome?.existeExato || verificacaoNome?.existe || verificacaoNome?.existente);
  const podeCriarComMesmoNome = !existeExato;
  const corpoRef = useRef(null);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    document.documentElement.classList.add('criar-grupo-wizard-aberto');
    document.body.classList.add('criar-grupo-wizard-aberto');

    return () => {
      document.documentElement.classList.remove('criar-grupo-wizard-aberto');
      document.body.classList.remove('criar-grupo-wizard-aberto');
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    const viewport = window.visualViewport;
    const modal = modalRef.current;
    let rafId = 0;

    function atualizarViewport() {
      if (!modal) {
        return;
      }

      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const offset = viewport
          ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
          : 0;
        const tecladoAberto = offset > 90;
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
  }, [aberto]);

  useEffect(() => {
    if (!aberto || !corpoRef.current) {
      return;
    }

    if (typeof corpoRef.current.scrollTo === 'function') {
      corpoRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    corpoRef.current.scrollTop = 0;
  }, [aberto, etapa]);

  useEffect(() => {
    return () => {
      if (previewImagemGrupo) {
        URL.revokeObjectURL(previewImagemGrupo);
      }
    };
  }, [previewImagemGrupo]);

  if (!aberto) {
    return null;
  }

  function atualizarCampo(campo, valor) {
    setErro('');
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function rolarCampoParaVisivel(evento) {
    const campo = evento.currentTarget;
    window.setTimeout(() => {
      if (typeof campo?.scrollIntoView === 'function') {
        campo.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
    }, 120);
  }

  async function fecharTecladoAntesDaAcao() {
    const ativo = document.activeElement;
    if (campoEditavel(ativo) && modalRef.current?.contains(ativo)) {
      ativo.blur();
      await aguardarRecalculoViewport();
    }
  }

  function fechar() {
    if (salvando || verificando) {
      return;
    }

    if (temDadosPreenchidos) {
      setModalConfirmacaoSaidaAberto(true);
      return;
    }

    fecharSemConfirmacao();
  }

  function fecharSemConfirmacao() {
    setEtapa(0);
    setFormulario(estadoInicial);
    setErro('');
    setVerificacaoNome(null);
    setModalSimilaresAberto(false);
    setModalConfirmacaoSaidaAberto(false);
    setArquivoImagemGrupo(null);
    setPreviewImagemGrupo('');
    if (inputImagemGrupoRef.current) {
      inputImagemGrupoRef.current.value = '';
    }
    onFechar?.();
  }

  function voltar() {
    if (salvando || verificando) {
      return;
    }

    if (etapa > 0) {
      setEtapa((atual) => Math.max(0, atual - 1));
    }
  }

  function removerImagemSelecionada() {
    if (previewImagemGrupo) {
      URL.revokeObjectURL(previewImagemGrupo);
    }

    setArquivoImagemGrupo(null);
    setPreviewImagemGrupo('');
    if (inputImagemGrupoRef.current) {
      inputImagemGrupoRef.current.value = '';
    }
  }

  function selecionarImagemGrupo(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) {
      return;
    }

    if (ehImagemNaoSuportada(arquivo) || !ehImagemPermitida(arquivo)) {
      setErro('Envie uma imagem JPG, PNG ou WEBP.');
      evento.target.value = '';
      return;
    }

    if (arquivo.size > tamanhoMaximoImagemGrupoBytes) {
      setErro('A foto do grupo deve ter no máximo 2MB.');
      evento.target.value = '';
      return;
    }

    if (previewImagemGrupo) {
      URL.revokeObjectURL(previewImagemGrupo);
    }

    setErro('');
    setArquivoImagemGrupo(arquivo);
    setPreviewImagemGrupo(URL.createObjectURL(arquivo));
  }

  async function verificarNomeAntesDeCriar() {
    const nome = normalizarNome(formulario.nome);
    if (!nome) {
      setErro('Informe o nome do grupo para criar.');
      return false;
    }

    if (nome.length > 50) {
      setErro('O nome do grupo deve ter no máximo 50 caracteres.');
      return false;
    }

    try {
      setVerificando(true);
      const verificacao = await gruposServico.verificarNome(nome);
      setVerificacaoNome(verificacao);
      const gruposParecidos = obterSimilares(verificacao);

      if (verificacao?.existeExato || verificacao?.existe || verificacao?.existente || gruposParecidos.length > 0) {
        setModalSimilaresAberto(true);
        return false;
      }

      setErro('');
      return true;
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
      return false;
    } finally {
      setVerificando(false);
    }
  }

  async function avancar() {
    await fecharTecladoAntesDaAcao();

    if (etapa === 0) {
      const podeCriar = await verificarNomeAntesDeCriar();
      if (!podeCriar) {
        return;
      }

      setEtapa(1);
      return;
    }

    setErro('');
    setEtapa((atual) => Math.min(etapasCriacaoGrupo.length - 1, atual + 1));
  }

  function continuarComNomeAtual() {
    setModalSimilaresAberto(false);
    setErro('');
    setEtapa(1);
  }

  function pularImagem() {
    removerImagemSelecionada();
    setErro('');
    setEtapa(3);
  }

  async function criarGrupo() {
    await fecharTecladoAntesDaAcao();

    if (!nomeNormalizado) {
      setEtapa(0);
      setErro('Informe o nome do grupo para criar.');
      return;
    }

    if (nomeNormalizado.length > 50) {
      setEtapa(0);
      setErro('O nome do grupo deve ter no máximo 50 caracteres.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      let grupo = await gruposServico.criar({
        nome: normalizarNome(formulario.nome),
        descricao: null,
        link: null,
        dataInicio: paraInputData(new Date().toISOString()),
        dataFim: null,
        localId: null,
        privacidade: formulario.privacidade,
        imagemUrl: null,
        localPrincipal: null,
        diasDaSemana: []
      });
      if (arquivoImagemGrupo) {
        try {
          const imagemParaUpload = await comprimirImagemParaUpload(arquivoImagemGrupo, {
            maxSizeMB: 2,
            maxWidthOrHeight: 900
          });
          const respostaImagem = await gruposServico.atualizarImagem(grupo.id, imagemParaUpload);
          grupo = { ...grupo, imagemUrl: respostaImagem?.imagemUrl || grupo.imagemUrl };
        } catch (falhaUpload) {
          setErro(`Grupo criado, mas não foi possível enviar a foto. ${extrairMensagemErro(falhaUpload)}`);
        }
      }
      await onCriado?.(grupo);
      fecharSemConfirmacao();
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  function renderizarConteudo() {
    if (etapa === 0) {
      return (
        <section className="criar-grupo-etapa">
          <div className="criar-grupo-etapa-titulo">
            <span>Criar grupo</span>
            <h3>Como seu grupo se chama?</h3>
          </div>

          <label className="criar-grupo-campo">
            <span>Nome do grupo</span>
            <input
              value={formulario.nome}
              onChange={(evento) => atualizarCampo('nome', evento.target.value)}
              onBlur={(evento) => atualizarCampo('nome', normalizarNome(evento.target.value))}
              onFocus={rolarCampoParaVisivel}
              placeholder="Ex: Fechadinho de Quinta"
              autoFocus
              required
              maxLength="50"
            />
            <small className="criar-grupo-contador">
              {formulario.nome.length} de 50 caracteres
            </small>
          </label>
        </section>
      );
    }

    if (etapa === 1) {
      return (
        <section className="criar-grupo-etapa">
          <div className="criar-grupo-etapa-titulo">
            <span>Criar grupo</span>
            <h3>Quem poderá encontrar este grupo?</h3>
          </div>

          <fieldset className="criar-grupo-visibilidade">
            <legend>Selecione uma opção</legend>
            <div className="criar-grupo-opcoes">
              {opcoesPrivacidade.map((opcao) => {
                const selecionada = formulario.privacidade === opcao.valor;
                const Icone = opcao.icone;

                return (
                  <button
                    type="button"
                    key={opcao.valor}
                    className={`criar-grupo-opcao ${selecionada ? 'selecionada' : ''}`}
                    onClick={() => atualizarCampo('privacidade', opcao.valor)}
                    aria-pressed={selecionada}
                  >
                    <Icone aria-hidden="true" />
                    <span>
                      <strong>{opcao.titulo}</strong>
                      <small>{opcao.descricao}</small>
                    </span>
                    <span className="criar-grupo-opcao-check" aria-hidden="true">
                      {selecionada && <FaCheck />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>
      );
    }

    if (etapa === 2) {
      return (
        <section className="criar-grupo-etapa">
          <div className="criar-grupo-etapa-titulo">
            <span>Criar grupo</span>
            <h3>Escolha uma imagem para seu grupo</h3>
            <p className="criar-grupo-etapa-subtitulo">A imagem é opcional. Sem foto, o grupo usa o avatar automático com uma letra.</p>
          </div>

          <section className="criar-grupo-foto">
            <AvatarGrupo
              nome={formulario.nome}
              imagemUrl={previewImagemGrupo}
              tamanho="lg"
              className="criar-grupo-foto-avatar"
            />
            <div>
              <strong>{previewImagemGrupo ? 'Imagem selecionada' : 'Avatar padrão'}</strong>
              <span>{previewImagemGrupo ? 'A foto será enviada após a criação do grupo.' : 'Será exibido um avatar com uma letra do grupo.'}</span>
              <div className="criar-grupo-foto-acoes">
                <input
                  ref={inputImagemGrupoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={selecionarImagemGrupo}
                />
                <button type="button" className="botao-secundario" onClick={() => inputImagemGrupoRef.current?.click()}>
                  <FaImage aria-hidden="true" /> Upload
                </button>
                {previewImagemGrupo && (
                  <button type="button" className="criar-grupo-foto-remover" onClick={removerImagemSelecionada}>
                    <FaTrash aria-hidden="true" /> Remover
                  </button>
                )}
              </div>
            </div>
          </section>
        </section>
      );
    }

    return (
      <section className="criar-grupo-etapa">
        <div className="criar-grupo-etapa-titulo">
          <span>Criar grupo</span>
          <h3>Confirme as informações</h3>
        </div>

        <section className="criar-grupo-resumo-card" aria-label="Resumo do grupo">
          <AvatarGrupo
            nome={formulario.nome}
            imagemUrl={previewImagemGrupo}
            tamanho="lg"
            className="criar-grupo-resumo-avatar"
          />
          <div className="criar-grupo-resumo-linhas">
            <div className="criar-grupo-resumo-linha">
              <span>Nome</span>
              <strong>{nomeNormalizado}</strong>
            </div>
            <div className="criar-grupo-resumo-linha">
              <span>Tipo</span>
              <strong>{formulario.privacidade}</strong>
            </div>
            <div className="criar-grupo-resumo-linha">
              <span>Imagem</span>
              <strong>{previewImagemGrupo ? 'Imagem personalizada' : 'Avatar automático'}</strong>
            </div>
          </div>
        </section>
      </section>
    );
  }

  function obterTextoBotaoPrimario() {
    if (etapa === 0 && verificando) {
      return 'Verificando...';
    }

    if (etapa === 3) {
      return salvando ? 'Criando...' : 'Criar grupo';
    }

    return 'Continuar';
  }

  function acaoPrimaria() {
    if (etapa === 3) {
      criarGrupo();
      return;
    }

    avancar();
  }

  function acaoSecundaria() {
    if (etapa === 0) {
      fechar();
      return;
    }

    if (etapa === 2) {
      pularImagem();
      return;
    }

    voltar();
  }

  function obterTextoBotaoSecundario() {
    if (etapa === 0) {
      return 'Cancelar';
    }

    if (etapa === 2) {
      return 'Pular';
    }

    return 'Voltar';
  }

  const botaoPrimarioDesabilitado = salvando || verificando || (etapa === 0 && !nomeNormalizado);

  return (
    <div className="modal-sobreposicao criar-grupo-sobreposicao" role="presentation">
      <div ref={modalRef} className="criar-grupo-modal" role="dialog" aria-modal="true" aria-labelledby="criar-grupo-titulo">
        <header className="criar-grupo-header">
          <button
            type="button"
            className="criar-grupo-header-acao criar-grupo-header-voltar"
            onClick={etapa === 0 ? fechar : voltar}
            disabled={salvando || verificando}
            aria-label={etapa === 0 ? 'Cancelar criação de grupo' : 'Voltar'}
            title={etapa === 0 ? 'Cancelar' : 'Voltar'}
          >
            <FaChevronLeft aria-hidden="true" />
          </button>
          <div>
            <strong id="criar-grupo-titulo">Criar grupo</strong>
            <span>{etapasCriacaoGrupo[etapa]?.titulo || 'Grupo'}</span>
            <div className="criar-grupo-progresso" aria-label={`Etapa ${etapa + 1} de ${etapasCriacaoGrupo.length}`}>
              <div className="criar-grupo-pontos" aria-hidden="true">
                {etapasCriacaoGrupo.map((item, indice) => (
                  <span key={item.id} className={indice <= etapa ? 'ativo' : ''} />
                ))}
              </div>
              <small>{etapa + 1} de {etapasCriacaoGrupo.length}</small>
            </div>
          </div>
          <button
            type="button"
            className="criar-grupo-header-acao criar-grupo-header-fechar"
            onClick={fechar}
            disabled={salvando || verificando}
            aria-label="Fechar"
            title="Fechar"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        <main className="criar-grupo-corpo" ref={corpoRef}>
          {renderizarConteudo()}
          {erro && <p className="criar-grupo-erro">{erro}</p>}
        </main>

        <footer className="criar-grupo-acoes">
          <button
            type="button"
            className="botao-secundario"
            onClick={acaoSecundaria}
            disabled={salvando || verificando}
          >
            {obterTextoBotaoSecundario()}
          </button>
          <button
            type="button"
            className="botao-primario"
            onClick={acaoPrimaria}
            onPointerDown={() => {
              const ativo = document.activeElement;
              if (campoEditavel(ativo) && modalRef.current?.contains(ativo)) {
                ativo.blur();
              }
            }}
            disabled={botaoPrimarioDesabilitado}
          >
            {obterTextoBotaoPrimario()}
          </button>
        </footer>

        {modalConfirmacaoSaidaAberto && (
          <div className="criar-grupo-confirmacao-backdrop" role="presentation">
            <section className="criar-grupo-confirmacao" role="dialog" aria-modal="true">
              <div className="criar-grupo-confirmacao-topo">
                <h3>Deseja sair da criação do grupo?</h3>
                <p>As informações preenchidas serão perdidas.</p>
              </div>

              <div className="criar-grupo-confirmacao-acoes">
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
                  onClick={fecharSemConfirmacao}
                >
                  Sair
                </button>
              </div>
            </section>
          </div>
        )}

        {modalSimilaresAberto && (
          <div className="criar-grupo-similares-backdrop" role="presentation">
            <section className="criar-grupo-similares" role="dialog" aria-modal="true">
              <div className="criar-grupo-similares-topo">
                <FaUsers aria-hidden="true" />
                <div>
                  <h3>Encontramos grupos parecidos</h3>
                  <p>Confira antes de criar um novo grupo.</p>
                </div>
              </div>

              {similares.length > 0 ? (
                <div className="criar-grupo-similares-lista">
                  {similares.map((grupo) => (
                    <article key={grupo.id}>
                      <strong>{grupo.nome}</strong>
                      <span>{grupo.quantidadeAtletas || 0} atletas · {grupo.privacidade || 'Grupo'}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="criar-grupo-similares-aviso">Já existe um grupo com esse nome.</p>
              )}

              <div className="criar-grupo-similares-acoes">
                <button type="button" className="botao-secundario" onClick={() => setModalSimilaresAberto(false)}>
                  Revisar nome
                </button>
                {podeCriarComMesmoNome && (
                  <button
                    type="button"
                    className="botao-primario"
                    onClick={continuarComNomeAtual}
                  >
                    Continuar mesmo assim
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
