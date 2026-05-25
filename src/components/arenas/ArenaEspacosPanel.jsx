import { useMemo, useState } from 'react';
import { arenaService } from '../../services/arenaService';

const TIPOS_ESPACO = [
  { valor: 1, rotulo: 'Quadra coberta' },
  { valor: 2, rotulo: 'Quadra de areia' },
  { valor: 3, rotulo: 'Rede de praia' },
  { valor: 4, rotulo: 'Área de treino' },
  { valor: 5, rotulo: 'Sala de treino' },
  { valor: 6, rotulo: 'Outro' }
];

function obterRotuloTipoEspaco(tipoEspaco) {
  const normalizado = Number(tipoEspaco);
  const tipoEncontrado = TIPOS_ESPACO.find((tipo) => tipo.valor === normalizado);

  if (tipoEncontrado) {
    return tipoEncontrado.rotulo;
  }

  return `Tipo ${tipoEspaco ?? 'indefinido'}`;
}

function criarEstadoEspaco(base = {}) {
  return {
    nome: base.nome || '',
    tipoEspaco: base.tipoEspaco ?? 1,
    descricao: base.descricao || '',
    possuiIluminacao: Boolean(base.possuiIluminacao),
    possuiCobertura: Boolean(base.possuiCobertura),
    ativo: base.ativo !== false,
    ordemExibicao: base.ordemExibicao ?? ''
  };
}

function extrairMensagemErro(erro) {
  return erro?.response?.data?.mensagem || erro?.response?.data?.message || erro?.message || 'Não foi possível processar a solicitação.';
}

export function ArenaEspacosPanel({ arenaId, espacos = [], recarregarEspacos }) {
  const [form, setForm] = useState(criarEstadoEspaco());
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const espacosOrdenados = useMemo(() => {
    return [...espacos].sort((a, b) => {
      const ordemA = a.ordemExibicao ?? Number.MAX_SAFE_INTEGER;
      const ordemB = b.ordemExibicao ?? Number.MAX_SAFE_INTEGER;

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
    });
  }, [espacos]);

  function limparMensagens() {
    setErro('');
    setSucesso('');
  }

  function resetarFormulario() {
    setForm(criarEstadoEspaco());
    setEditandoId(null);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    limparMensagens();

    setForm((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function handleEditar(espaco) {
    limparMensagens();
    setEditandoId(espaco.id);
    setForm(criarEstadoEspaco(espaco));
  }

  async function handleSalvar(event) {
    event.preventDefault();
    limparMensagens();

    if (!form.nome.trim()) {
      setErro('Informe o nome do espaço.');
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      tipoEspaco: Number(form.tipoEspaco),
      descricao: form.descricao.trim() || null,
      possuiIluminacao: Boolean(form.possuiIluminacao),
      possuiCobertura: Boolean(form.possuiCobertura),
      ativo: Boolean(form.ativo),
      ordemExibicao: form.ordemExibicao === '' ? null : Number(form.ordemExibicao)
    };

    try {
      setSalvando(true);

      if (editandoId) {
        await arenaService.atualizarEspaco(arenaId, editandoId, payload);
        setSucesso('Espaço atualizado com sucesso.');
      } else {
        await arenaService.criarEspaco(arenaId, payload);
        setSucesso('Espaço cadastrado com sucesso.');
      }

      await recarregarEspacos();
      resetarFormulario();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleStatus(espaco) {
    limparMensagens();
    setTogglingId(espaco.id);

    try {
      await arenaService.atualizarStatusEspaco(arenaId, espaco.id, !espaco.ativo);
      await recarregarEspacos();
      setSucesso(`Status de ${espaco.nome} atualizado com sucesso.`);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="arena-espacos-panel">
      <div className="arena-espacos-panel__header">
        <div>
          <p className="arena-admin-page__breadcrumb">Espaços da arena</p>
          <h2>Administre as áreas físicas da arena</h2>
          <p className="arena-admin-page__descricao">
            Cadastre quadras, áreas de treino e demais espaços disponíveis para partidas e treinos.
          </p>
        </div>
      </div>

      <form className="arena-admin-form" onSubmit={handleSalvar}>
        <div className="arena-admin-form__grid">
          <label className="campo-formulario">
            <span>Nome do espaço</span>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Ex.: Quadra 1"
            />
          </label>

          <label className="campo-formulario">
            <span>Tipo de espaço</span>
            <select name="tipoEspaco" value={form.tipoEspaco} onChange={handleChange}>
              {TIPOS_ESPACO.map((tipo) => (
                <option key={tipo.valor} value={tipo.valor}>
                  {tipo.rotulo}
                </option>
              ))}
            </select>
          </label>

          <label className="campo-formulario">
            <span>Ordem de exibição</span>
            <input
              type="number"
              name="ordemExibicao"
              min="0"
              value={form.ordemExibicao}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </label>

          <label className="campo-formulario campo-formulario--check">
            <input
              type="checkbox"
              name="ativo"
              checked={form.ativo}
              onChange={handleChange}
            />
            <span>Ativo no painel público</span>
          </label>

          <label className="campo-formulario campo-formulario--check">
            <input
              type="checkbox"
              name="possuiIluminacao"
              checked={form.possuiIluminacao}
              onChange={handleChange}
            />
            <span>Possui iluminação</span>
          </label>

          <label className="campo-formulario campo-formulario--check">
            <input
              type="checkbox"
              name="possuiCobertura"
              checked={form.possuiCobertura}
              onChange={handleChange}
            />
            <span>Possui cobertura</span>
          </label>

          <label className="campo-formulario campo-formulario--full">
            <span>Descrição</span>
            <textarea
              name="descricao"
              rows="3"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Descreva destaque, características e observações do espaço."
            />
          </label>
        </div>

        <div className="arena-admin-form__mensagens">
          {sucesso && <p className="arena-admin-form__mensagem arena-admin-form__mensagem--sucesso">{sucesso}</p>}
          {erro && <p className="arena-admin-form__mensagem arena-admin-form__mensagem--erro">{erro}</p>}
        </div>

        <div className="arena-admin-form__acoes">
          <button type="submit" className="botao-primario" disabled={salvando}>
            {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar espaço'}
          </button>
          {editandoId && (
            <button type="button" className="botao-secundario" onClick={resetarFormulario}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="arena-espacos-panel__lista">
        {espacosOrdenados.length === 0 && (
          <div className="arena-empty-state">
            <h3>Nenhum espaço cadastrado</h3>
            <p>Comece adicionando o primeiro espaço da arena para organizar a gestão do local.</p>
          </div>
        )}

        {espacosOrdenados.map((espaco) => (
          <article key={espaco.id} className="arena-espaco-card">
            <div className="arena-espaco-card__topo">
              <div>
                <p className="arena-section__eyebrow">{obterRotuloTipoEspaco(espaco.tipoEspaco)}</p>
                <h3>{espaco.nome}</h3>
              </div>
              <span className={`arena-badge ${espaco.ativo ? 'arena-badge--ativo' : 'arena-badge--inativo'}`}>
                {espaco.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {espaco.descricao && <p className="arena-espaco-card__descricao">{espaco.descricao}</p>}

            <div className="arena-espaco-card__meta">
              <span>{espaco.possuiIluminacao ? 'Iluminação' : 'Sem iluminação'}</span>
              <span>{espaco.possuiCobertura ? 'Cobertura' : 'Sem cobertura'}</span>
              {espaco.ordemExibicao !== null && espaco.ordemExibicao !== undefined && (
                <span>Ordem {espaco.ordemExibicao}</span>
              )}
            </div>

            <div className="arena-espaco-card__acoes">
              <button type="button" className="botao-secundario" onClick={() => handleEditar(espaco)}>
                Editar
              </button>
              <button
                type="button"
                className="botao-primario"
                onClick={() => handleToggleStatus(espaco)}
                disabled={togglingId === espaco.id}
              >
                {togglingId === espaco.id ? 'Atualizando...' : espaco.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
