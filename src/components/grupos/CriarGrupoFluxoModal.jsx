import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCheck,
  FaChevronLeft,
  FaImage,
  FaGlobeAmericas,
  FaLock,
  FaShareAlt,
  FaTrash,
  FaTimes,
  FaUsers,
  FaUserPlus
} from 'react-icons/fa';
import { gruposServico } from '../../services/gruposServico';
import { comprimirImagemParaUpload, ehImagemNaoSuportada, ehImagemPermitida } from '../../utils/compressaoImagem';
import { extrairMensagemErro } from '../../utils/erros';
import { paraInputData } from '../../utils/formatacao';
import { AvatarGrupo } from './AvatarGrupo';
import './criar-grupo-fluxo.css';

const estadoInicial = {
  nome: '',
  descricao: '',
  privacidade: 'Privado'
};

const tamanhoMaximoImagemGrupoBytes = 2 * 1024 * 1024;

const opcoesPrivacidade = [
  {
    valor: 'Público',
    titulo: 'Público',
    descricao: 'Qualquer atleta pode encontrar e participar.',
    icone: FaGlobeAmericas
  },
  {
    valor: 'Privado',
    titulo: 'Privado',
    descricao: 'Só entra quem for convidado ou adicionado.',
    icone: FaLock
  }
];

function normalizarNome(nome) {
  return String(nome || '').trim().replace(/\s+/g, ' ');
}

function obterSimilares(verificacao) {
  return verificacao?.similares || verificacao?.grupos || [];
}

export function CriarGrupoFluxoModal({
  aberto,
  onFechar,
  onCriado,
  onAdicionarAtletas,
  onEntrarGrupo
}) {
  const [etapa, setEtapa] = useState(0);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [verificacaoNome, setVerificacaoNome] = useState(null);
  const [modalSimilaresAberto, setModalSimilaresAberto] = useState(false);
  const [grupoCriado, setGrupoCriado] = useState(null);
  const [arquivoImagemGrupo, setArquivoImagemGrupo] = useState(null);
  const [previewImagemGrupo, setPreviewImagemGrupo] = useState('');
  const [modalConfirmacaoSaidaAberto, setModalConfirmacaoSaidaAberto] = useState(false);
  const inputImagemGrupoRef = useRef(null);
  const nomeNormalizado = normalizarNome(formulario.nome);
  const temDadosPreenchidos = Boolean(nomeNormalizado || formulario.descricao.trim() || previewImagemGrupo);

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
    if (!aberto || !corpoRef.current) {
      return;
    }

    corpoRef.current.scrollTo({ top: 0, behavior: 'smooth' });
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

  function fechar() {
    if (salvando || verificando) {
      return;
    }

    // Se há dados preenchidos e não estamos na etapa de sucesso, pedir confirmação
    if (temDadosPreenchidos && etapa !== 2) {
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
    setGrupoCriado(null);
    setArquivoImagemGrupo(null);
    setPreviewImagemGrupo('');
    if (inputImagemGrupoRef.current) {
      inputImagemGrupoRef.current.value = '';
    }
    onFechar?.();
  }

  function voltar() {
    if (salvando || verificando || etapa === 2) {
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

  async function avancarDados() {
    const nome = normalizarNome(formulario.nome);
    if (!nome) {
      setErro('Informe o nome do grupo para continuar.');
      return;
    }

    if (nome.length > 50) {
      setErro('O nome do grupo deve ter no máximo 50 caracteres.');
      return;
    }

    try {
      setVerificando(true);
      const verificacao = await gruposServico.verificarNome(nome);
      setVerificacaoNome(verificacao);
      const gruposParecidos = obterSimilares(verificacao);

      if (verificacao?.existeExato || verificacao?.existe || verificacao?.existente || gruposParecidos.length > 0) {
        setModalSimilaresAberto(true);
        return;
      }

      setErro('');
      setEtapa(1);
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
    } finally {
      setVerificando(false);
    }
  }

  async function criarGrupo() {
    try {
      setSalvando(true);
      setErro('');
      let grupo = await gruposServico.criar({
        nome: normalizarNome(formulario.nome),
        descricao: formulario.descricao.trim() || null,
        link: null,
        dataInicio: paraInputData(new Date().toISOString()),
        dataFim: null,
        localId: null,
        privacidade: formulario.privacidade,
        imagemUrl: null
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
      setGrupoCriado(grupo);
      setEtapa(2);
      onCriado?.(grupo);
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  async function compartilharGrupo() {
    if (!grupoCriado?.id) {
      return;
    }

    const url = `${window.location.origin}/grupos/${grupoCriado.id}`;
    if (navigator.share) {
      await navigator.share({
        title: grupoCriado.nome,
        text: `Entre no grupo ${grupoCriado.nome} no QuebraNunca.`,
        url
      });
      return;
    }

    await navigator.clipboard?.writeText(url);
  }

  function renderizarConteudo() {
    if (etapa === 2) {
      return (
        <section className="criar-grupo-sucesso">
          <div className="criar-grupo-sucesso-icone"><FaCheck aria-hidden="true" /></div>
          <span>Grupo criado</span>
          <h3>{grupoCriado?.nome || formulario.nome}</h3>
          <p>Agora você pode chamar atletas e começar a registrar as partidas do grupo.</p>

          <div className="criar-grupo-acoes-sucesso">
            <button type="button" className="botao-secundario" onClick={compartilharGrupo}>
              <FaShareAlt aria-hidden="true" /> Compartilhar
            </button>
            <button type="button" className="botao-secundario" onClick={() => onAdicionarAtletas?.(grupoCriado)}>
              <FaUserPlus aria-hidden="true" /> Adicionar atletas
            </button>
            <button type="button" className="botao-primario" onClick={() => onEntrarGrupo?.(grupoCriado)}>
              Entrar no grupo
            </button>
          </div>
        </section>
      );
    }

    if (etapa === 1) {
      return (
        <section className="criar-grupo-etapa">
          <div className="criar-grupo-etapa-titulo">
            <span>Privacidade</span>
            <h3>Quem pode encontrar o grupo?</h3>
          </div>

          <div className="criar-grupo-opcoes">
            {opcoesPrivacidade.map((opcao) => {
              const Icone = opcao.icone;
              const selecionada = formulario.privacidade === opcao.valor;

              return (
                <button
                  type="button"
                  key={opcao.valor}
                  className={`criar-grupo-opcao ${selecionada ? 'selecionada' : ''}`}
                  onClick={() => atualizarCampo('privacidade', opcao.valor)}
                >
                  <Icone aria-hidden="true" />
                  <span>
                    <strong>{opcao.titulo}</strong>
                    <small>{opcao.descricao}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <section className="criar-grupo-beneficios">
            <h4 className="criar-grupo-beneficios-titulo">O que você poderá fazer:</h4>
            <ul className="criar-grupo-beneficios-lista">
              <li>
                <FaCheck aria-hidden="true" />
                <span>Ranking exclusivo</span>
              </li>
              <li>
                <FaCheck aria-hidden="true" />
                <span>Estatísticas da turma</span>
              </li>
              <li>
                <FaCheck aria-hidden="true" />
                <span>Histórico de partidas</span>
              </li>
              <li>
                <FaCheck aria-hidden="true" />
                <span>Convites para atletas</span>
              </li>
              <li>
                <FaCheck aria-hidden="true" />
                <span>Dashboard do grupo</span>
              </li>
            </ul>
          </section>
        </section>
      );
    }

    return (
      <section className="criar-grupo-etapa">
        <div className="criar-grupo-etapa-titulo">
          <span>Dados do grupo</span>
          <h3>Crie o espaço da sua turma</h3>
          <p className="criar-grupo-etapa-subtitulo">Reúna sua turma e acompanhe rankings, partidas e estatísticas exclusivas.</p>
        </div>

        {/* Preview do grupo */}
        <section className="criar-grupo-preview">
          <article className="criar-grupo-preview-card">
            <div className="criar-grupo-preview-header">
              <AvatarGrupo
                nome={formulario.nome}
                imagemUrl={previewImagemGrupo}
                tamanho="lg"
                className="criar-grupo-preview-avatar"
              />
              <div>
                <h4 className="criar-grupo-preview-nome">
                  {nomeNormalizado || 'Seu grupo aparecerá aqui'}
                </h4>
                <p className="criar-grupo-preview-descricao">Grupo de futevôlei</p>
              </div>
            </div>
          </article>
        </section>

        <label className="criar-grupo-campo">
          <span>Nome do grupo</span>
          <input
            value={formulario.nome}
            onChange={(evento) => atualizarCampo('nome', evento.target.value)}
            onBlur={(evento) => atualizarCampo('nome', normalizarNome(evento.target.value))}
            placeholder="Ex.: Fechado de Quinta"
            autoFocus
            required
            maxLength="50"
          />
          <small className="criar-grupo-contador">
            {formulario.nome.length} de 50 caracteres
          </small>
        </label>

        <label className="criar-grupo-campo">
          <span>Descrição</span>
          <textarea
            value={formulario.descricao}
            onChange={(evento) => atualizarCampo('descricao', evento.target.value)}
            rows={3}
            placeholder="Opcional"
            maxLength="200"
          />
          <small className="criar-grupo-contador">
            {formulario.descricao.length} de 200 caracteres
          </small>
        </label>

        <section className="criar-grupo-foto">
          <AvatarGrupo
            nome={formulario.nome}
            imagemUrl={previewImagemGrupo}
            tamanho="lg"
            className="criar-grupo-foto-avatar"
          />
          <div>
            <strong>Foto do grupo</strong>
            <span>Opcional. JPG, PNG ou WEBP até 2MB.</span>
            <div className="criar-grupo-foto-acoes">
              <input
                ref={inputImagemGrupoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={selecionarImagemGrupo}
              />
              <button type="button" className="botao-secundario" onClick={() => inputImagemGrupoRef.current?.click()}>
                <FaImage aria-hidden="true" /> Escolher foto
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
    <div className="modal-sobreposicao criar-grupo-sobreposicao" role="presentation">
      <div className="criar-grupo-modal" role="dialog" aria-modal="true" aria-labelledby="criar-grupo-titulo">
        <header className="criar-grupo-header">
          <button
            type="button"
            className="criar-grupo-header-acao criar-grupo-header-voltar"
            onClick={voltar}
            disabled={etapa === 2 || salvando || verificando}
            aria-label="Voltar"
            title="Voltar"
          >
            <FaChevronLeft aria-hidden="true" />
            <span>Voltar</span>
          </button>
          <div>
            <strong id="criar-grupo-titulo">Criar grupo</strong>
            <span>Etapa {etapa + 1} de 3</span>
          </div>
          <button
            type="button"
            className="criar-grupo-header-acao criar-grupo-header-fechar"
            onClick={fechar}
            disabled={salvando || verificando}
            aria-label="Fechar"
            title="Fechar"
          >
            <span>Fechar</span>
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        <div className="criar-grupo-progresso" aria-hidden="true">
          {[0, 1, 2].map((indice) => (
            <span key={indice} className={indice <= etapa ? 'ativo' : ''} />
          ))}
        </div>

        <main className="criar-grupo-corpo" ref={corpoRef}>
          {renderizarConteudo()}
          {erro && <p className="criar-grupo-erro">{erro}</p>}
        </main>

        {etapa < 2 && (
          <footer className="criar-grupo-acoes">
            <button
              type="button"
              className="botao-secundario"
              onClick={etapa === 0 ? fechar : voltar}
              disabled={salvando || verificando}
            >
              {etapa === 0 ? 'Cancelar' : 'Voltar'}
            </button>
            {etapa === 0 ? (
              <button
                type="button"
                className="botao-primario"
                onClick={avancarDados}
                disabled={verificando || !nomeNormalizado}
              >
                {verificando ? 'Verificando...' : 'Continuar'}
              </button>
            ) : (
              <button
                type="button"
                className="botao-primario"
                onClick={criarGrupo}
                disabled={salvando}
              >
                {salvando ? 'Criando...' : 'Criar grupo'}
              </button>
            )}
          </footer>
        )}

        {etapa === 2 && (
          <footer className="criar-grupo-acoes criar-grupo-acoes-sucesso-footer">
            <button
              type="button"
              className="botao-primario"
              onClick={() => onEntrarGrupo?.(grupoCriado)}
            >
              Entrar no grupo
            </button>
          </footer>
        )}

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
                    onClick={() => {
                      setModalSimilaresAberto(false);
                      setEtapa(1);
                    }}
                  >
                    Criar mesmo assim
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
