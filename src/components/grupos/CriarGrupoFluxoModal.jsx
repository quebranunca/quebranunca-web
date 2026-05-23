import { useMemo, useState } from 'react';
import {
  FaCheck,
  FaChevronLeft,
  FaGlobeAmericas,
  FaLock,
  FaShareAlt,
  FaTimes,
  FaUsers,
  FaUserPlus
} from 'react-icons/fa';
import { gruposServico } from '../../services/gruposServico';
import { extrairMensagemErro } from '../../utils/erros';
import { paraInputData } from '../../utils/formatacao';
import './criar-grupo-fluxo.css';

const estadoInicial = {
  nome: '',
  descricao: '',
  imagemUrl: '',
  privacidade: 'Privado'
};

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

  const similares = useMemo(() => obterSimilares(verificacaoNome), [verificacaoNome]);
  const existeExato = Boolean(verificacaoNome?.existeExato || verificacaoNome?.existe || verificacaoNome?.existente);
  const podeCriarComMesmoNome = !existeExato;

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

    setEtapa(0);
    setFormulario(estadoInicial);
    setErro('');
    setVerificacaoNome(null);
    setModalSimilaresAberto(false);
    setGrupoCriado(null);
    onFechar?.();
  }

  async function avancarDados() {
    const nome = normalizarNome(formulario.nome);
    if (!nome) {
      setErro('Informe o nome do grupo.');
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
      const grupo = await gruposServico.criar({
        nome: normalizarNome(formulario.nome),
        descricao: formulario.descricao.trim() || null,
        link: null,
        dataInicio: paraInputData(new Date().toISOString()),
        dataFim: null,
        localId: null,
        privacidade: formulario.privacidade,
        imagemUrl: formulario.imagemUrl.trim() || null
      });
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
        </section>
      );
    }

    return (
      <section className="criar-grupo-etapa">
        <div className="criar-grupo-etapa-titulo">
          <span>Dados do grupo</span>
          <h3>Crie o espaço da sua turma</h3>
        </div>

        <label className="criar-grupo-campo">
          <span>Nome</span>
          <input
            value={formulario.nome}
            onChange={(evento) => atualizarCampo('nome', evento.target.value)}
            onBlur={(evento) => atualizarCampo('nome', normalizarNome(evento.target.value))}
            placeholder="Ex.: Fechado de Quinta"
            autoFocus
            required
          />
        </label>

        <label className="criar-grupo-campo">
          <span>Descrição</span>
          <textarea
            value={formulario.descricao}
            onChange={(evento) => atualizarCampo('descricao', evento.target.value)}
            rows={3}
            placeholder="Opcional"
          />
        </label>

        <label className="criar-grupo-campo">
          <span>Foto/banner</span>
          <input
            type="url"
            value={formulario.imagemUrl}
            onChange={(evento) => atualizarCampo('imagemUrl', evento.target.value)}
            placeholder="URL da imagem, opcional"
          />
        </label>
      </section>
    );
  }

  return (
    <div className="modal-sobreposicao criar-grupo-sobreposicao" role="presentation">
      <div className="criar-grupo-modal" role="dialog" aria-modal="true" aria-labelledby="criar-grupo-titulo">
        <header className="criar-grupo-header">
          <button
            type="button"
            className="criar-grupo-icone-botao"
            onClick={() => setEtapa((atual) => Math.max(0, atual - 1))}
            disabled={etapa === 0 || etapa === 2 || salvando || verificando}
            aria-label="Voltar"
          >
            <FaChevronLeft aria-hidden="true" />
          </button>
          <div>
            <strong id="criar-grupo-titulo">Criar grupo</strong>
            <span>{etapa + 1} de 3</span>
          </div>
          <button type="button" className="criar-grupo-icone-botao" onClick={fechar} aria-label="Fechar">
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        <div className="criar-grupo-progresso" aria-hidden="true">
          {[0, 1, 2].map((indice) => (
            <span key={indice} className={indice <= etapa ? 'ativo' : ''} />
          ))}
        </div>

        <main className="criar-grupo-corpo">
          {renderizarConteudo()}
          {erro && <p className="criar-grupo-erro">{erro}</p>}
        </main>

        {etapa < 2 && (
          <footer className="criar-grupo-acoes">
            <button type="button" className="botao-secundario" onClick={fechar} disabled={salvando || verificando}>
              Cancelar
            </button>
            {etapa === 0 ? (
              <button type="button" className="botao-primario" onClick={avancarDados} disabled={verificando}>
                {verificando ? 'Verificando...' : 'Continuar'}
              </button>
            ) : (
              <button type="button" className="botao-primario" onClick={criarGrupo} disabled={salvando}>
                {salvando ? 'Criando...' : 'Criar grupo'}
              </button>
            )}
          </footer>
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
