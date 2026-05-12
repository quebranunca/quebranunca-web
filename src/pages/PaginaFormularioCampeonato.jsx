import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { campeonatosServico } from '../services/campeonatosServico';
import { categoriasServico } from '../services/categoriasServico';
import { formatosCampeonatoServico } from '../services/formatosCampeonatoServico';
import { ligasServico } from '../services/ligasServico';
import { locaisServico } from '../services/locaisServico';
import { regrasCompeticaoServico } from '../services/regrasCompeticaoServico';
import { extrairMensagemErro } from '../utils/erros';
import { paraInputData } from '../utils/formatacao';

const statusCampeonato = ['Rascunho', 'Inscrições abertas', 'Em andamento', 'Finalizado'];
const statusInscricao = [
  { valor: 1, rotulo: 'Não iniciada' },
  { valor: 2, rotulo: 'Aberta' },
  { valor: 3, rotulo: 'Fechada' },
  { valor: 4, rotulo: 'Encerrada' },
  { valor: 5, rotulo: 'Lista de espera' }
];

const opcoesGenero = {
  1: 'Masculino',
  2: 'Feminino',
  3: 'Misto'
};

const opcoesNivel = {
  1: 'Estreante',
  2: 'Iniciante',
  3: 'Intermediário',
  4: 'Amador',
  5: 'Profissional',
  6: 'Livre'
};

function estadoInicial() {
  return {
    nome: '',
    localId: '',
    dataInicio: '',
    dataFim: '',
    descricao: '',
    status: 'Rascunho',
    ligaId: '',
    formatoCampeonatoId: '',
    regraCompeticaoId: '',
    possuiFinalReset: true,
    categorias: []
  };
}

function criarCategoriaVinculada(categoria) {
  return {
    id: '',
    categoriaId: categoria.id,
    nome: categoria.nome,
    genero: categoria.genero,
    nivel: categoria.nivel,
    statusInscricao: 1,
    valorInscricao: '',
    limiteDuplas: '',
    dataAberturaInscricao: '',
    dataEncerramentoInscricao: '',
    permiteListaEspera: false,
    observacao: '',
    quantidadeDuplasInscritas: 0
  };
}

function mapearCategoriaApi(categoria) {
  return {
    id: categoria.id,
    categoriaId: categoria.categoriaId || categoria.id,
    nome: categoria.nome,
    genero: categoria.genero,
    nivel: categoria.nivel,
    statusInscricao: Number(categoria.statusInscricao || (categoria.inscricoesEncerradas ? 4 : 2)),
    valorInscricao: categoria.valorInscricao ? String(categoria.valorInscricao) : '',
    limiteDuplas: categoria.quantidadeMaximaDuplas ? String(categoria.quantidadeMaximaDuplas) : '',
    dataAberturaInscricao: paraInputData(categoria.dataAberturaInscricao),
    dataEncerramentoInscricao: paraInputData(categoria.dataEncerramentoInscricao),
    permiteListaEspera: Boolean(categoria.permiteListaEspera),
    observacao: categoria.observacao || '',
    quantidadeDuplasInscritas: Number(categoria.quantidadeDuplasInscritas || 0)
  };
}

function inferirStatusCampeonato(campeonato) {
  if (campeonato?.statusCampeonato) {
    return campeonato.statusCampeonato;
  }

  if (campeonato?.inscricoesAbertas) {
    return 'Inscrições abertas';
  }

  return 'Rascunho';
}

export function PaginaFormularioCampeonato() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState(estadoInicial);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
  const [locais, setLocais] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [regras, setRegras] = useState([]);
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const categoriasSelecionadasIds = useMemo(
    () => new Set(formulario.categorias.map((categoria) => categoria.categoriaId)),
    [formulario.categorias]
  );

  const categoriasParaAdicionar = categoriasDisponiveis.filter(
    (categoria) => !categoriasSelecionadasIds.has(categoria.id)
  );

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    setErro('');
    setAviso('');
    setCarregando(true);

    try {
      const [listaLocais, listaLigas, listaCategorias, listaFormatos, listaRegras] = await Promise.all([
        locaisServico.listar(),
        ligasServico.listar(),
        categoriasServico.listarDisponiveisVinculo(),
        formatosCampeonatoServico.listar(),
        regrasCompeticaoServico.listar().catch(() => [])
      ]);

      setLocais(listaLocais);
      setLigas(listaLigas);
      setCategoriasDisponiveis(listaCategorias);
      setFormatos(listaFormatos.filter((formato) => formato.ativo));
      setRegras(listaRegras);

      if (editando) {
        const detalhe = await campeonatosServico.obterPorId(id);
        const campeonato = detalhe.campeonato;
        setFormulario({
          nome: campeonato.nome || '',
          localId: campeonato.localId || '',
          dataInicio: paraInputData(campeonato.dataInicio),
          dataFim: paraInputData(campeonato.dataFim),
          descricao: campeonato.descricao || '',
          status: inferirStatusCampeonato(campeonato),
          ligaId: campeonato.ligaId || '',
          formatoCampeonatoId: campeonato.formatoCampeonatoId || '',
          regraCompeticaoId: campeonato.regraCompeticaoId || '',
          possuiFinalReset: Boolean(campeonato.possuiFinalReset),
          categorias: (detalhe.categorias || []).map(mapearCategoriaApi)
        });
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function adicionarCategoria() {
    const categoria = categoriasDisponiveis.find((item) => item.id === categoriaSelecionadaId);
    if (!categoria) {
      setErro('Selecione uma categoria cadastrada para vincular ao campeonato.');
      return;
    }

    if (categoriasSelecionadasIds.has(categoria.id)) {
      setErro('Esta categoria já foi vinculada ao campeonato.');
      return;
    }

    setFormulario((anterior) => ({
      ...anterior,
      categorias: [...anterior.categorias, criarCategoriaVinculada(categoria)]
    }));
    setCategoriaSelecionadaId('');
    setErro('');
  }

  function atualizarCategoria(indice, campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      categorias: anterior.categorias.map((categoria, indiceAtual) => (
        indiceAtual === indice ? { ...categoria, [campo]: valor } : categoria
      ))
    }));
  }

  function removerCategoria(indice) {
    const categoria = formulario.categorias[indice];
    if (categoria.quantidadeDuplasInscritas > 0) {
      setErro('Não é possível remover categoria com inscrições vinculadas.');
      return;
    }

    setFormulario((anterior) => ({
      ...anterior,
      categorias: anterior.categorias.filter((_, indiceAtual) => indiceAtual !== indice)
    }));
  }

  function montarPayload() {
    return {
      nome: formulario.nome,
      localId: formulario.localId,
      dataInicio: formulario.dataInicio,
      dataFim: formulario.dataFim || null,
      descricao: formulario.descricao || null,
      status: formulario.status,
      ligaId: formulario.ligaId || null,
      formatoCampeonatoId: formulario.formatoCampeonatoId || null,
      regraCompeticaoId: formulario.regraCompeticaoId || null,
      possuiFinalReset: formulario.possuiFinalReset,
      categorias: formulario.categorias.map((categoria) => ({
        id: categoria.id || null,
        categoriaId: categoria.categoriaId,
        valorInscricao: categoria.valorInscricao === '' ? 0 : Number(categoria.valorInscricao),
        limiteDuplas: categoria.limiteDuplas === '' ? null : Number(categoria.limiteDuplas),
        statusInscricao: Number(categoria.statusInscricao),
        dataAberturaInscricao: categoria.dataAberturaInscricao || null,
        dataEncerramentoInscricao: categoria.dataEncerramentoInscricao || null,
        permiteListaEspera: Boolean(categoria.permiteListaEspera),
        observacao: categoria.observacao || null
      }))
    };
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    setAviso('');
    setSalvando(true);

    try {
      const payload = montarPayload();
      const resultado = editando
        ? await campeonatosServico.atualizar(id, payload)
        : await campeonatosServico.criar(payload);

      setAviso('Campeonato salvo com sucesso.');
      navegar(`/campeonatos/${resultado.campeonato.id}/editar`, { replace: true });
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <section className="pagina">
        <p>Carregando campeonato...</p>
      </section>
    );
  }

  return (
    <section className="pagina">
      <div className="cabecalho-pagina">
        <h2>{editando ? 'Editar campeonato' : 'Novo campeonato'}</h2>
        <p>Cadastre o campeonato e vincule categorias já existentes.</p>
      </div>

      <form className="formulario-grid" onSubmit={salvar}>
        {erro && <p className="mensagem-erro campo-largo">{erro}</p>}
        {aviso && <p className="mensagem-sucesso campo-largo">{aviso}</p>}

        <div className="partidas-filtro-cabecalho campo-largo">
          <div>
            <strong>Dados do campeonato</strong>
          </div>
        </div>

        <label>
          Nome do campeonato
          <input value={formulario.nome} onChange={(evento) => atualizarCampo('nome', evento.target.value)} required />
        </label>

        <label>
          Local
          <select value={formulario.localId} onChange={(evento) => atualizarCampo('localId', evento.target.value)} required>
            <option value="">Selecione</option>
            {locais.map((local) => (
              <option key={local.id} value={local.id}>{local.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Data início
          <input type="date" value={formulario.dataInicio} onChange={(evento) => atualizarCampo('dataInicio', evento.target.value)} required />
        </label>

        <label>
          Data fim
          <input type="date" value={formulario.dataFim} onChange={(evento) => atualizarCampo('dataFim', evento.target.value)} />
        </label>

        <label>
          Status do campeonato
          <select value={formulario.status} onChange={(evento) => atualizarCampo('status', evento.target.value)}>
            {statusCampeonato.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label>
          Liga
          <select value={formulario.ligaId} onChange={(evento) => atualizarCampo('ligaId', evento.target.value)}>
            <option value="">Sem liga</option>
            {ligas.map((liga) => (
              <option key={liga.id} value={liga.id}>{liga.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Formato do campeonato
          <select value={formulario.formatoCampeonatoId} onChange={(evento) => atualizarCampo('formatoCampeonatoId', evento.target.value)}>
            <option value="">Padrão</option>
            {formatos.map((formato) => (
              <option key={formato.id} value={formato.id}>{formato.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Regra da competição
          <select value={formulario.regraCompeticaoId} onChange={(evento) => atualizarCampo('regraCompeticaoId', evento.target.value)}>
            <option value="">Regra padrão</option>
            {regras.map((regra) => (
              <option key={regra.id} value={regra.id}>{regra.nome}</option>
            ))}
          </select>
        </label>

        <label className="checkbox-label">
          <input type="checkbox" checked={formulario.possuiFinalReset} onChange={(evento) => atualizarCampo('possuiFinalReset', evento.target.checked)} />
          Possui final reset
        </label>

        <label className="campo-largo">
          Descrição/observações
          <textarea value={formulario.descricao} onChange={(evento) => atualizarCampo('descricao', evento.target.value)} />
        </label>

        <div className="partidas-filtro-cabecalho campo-largo">
          <div>
            <strong>Categorias do Campeonato</strong>
          </div>
        </div>

        <label>
          Categoria cadastrada
          <select value={categoriaSelecionadaId} onChange={(evento) => setCategoriaSelecionadaId(evento.target.value)}>
            <option value="">{categoriasParaAdicionar.length === 0 ? 'Nenhuma categoria disponível' : 'Selecione'}</option>
            {categoriasParaAdicionar.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome} - {opcoesGenero[categoria.genero]} - {opcoesNivel[categoria.nivel]}
              </option>
            ))}
          </select>
        </label>

        <div className="acoes-item">
          <button type="button" className="botao-secundario" onClick={adicionarCategoria} disabled={!categoriaSelecionadaId}>
            Vincular categoria
          </button>
        </div>

        <div className="campo-largo lista-cartoes">
          {formulario.categorias.map((categoria, indice) => (
            <article key={`${categoria.categoriaId}-${indice}`} className="cartao-lista">
              <div>
                <h3>{categoria.nome}</h3>
                <p>Gênero: {opcoesGenero[categoria.genero]}</p>
                <p>Nível: {opcoesNivel[categoria.nivel]}</p>
              </div>

              <div className="formulario-grid campo-largo">
                <label>
                  Status das inscrições
                  <select value={categoria.statusInscricao} onChange={(evento) => atualizarCategoria(indice, 'statusInscricao', evento.target.value)}>
                    {statusInscricao.map((status) => (
                      <option key={status.valor} value={status.valor}>{status.rotulo}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Valor da inscrição
                  <input type="number" min="0" step="0.01" value={categoria.valorInscricao} onChange={(evento) => atualizarCategoria(indice, 'valorInscricao', evento.target.value)} />
                </label>

                <label>
                  Limite de duplas
                  <input type="number" min="1" value={categoria.limiteDuplas} onChange={(evento) => atualizarCategoria(indice, 'limiteDuplas', evento.target.value)} />
                </label>

                <label>
                  Abertura das inscrições
                  <input type="date" value={categoria.dataAberturaInscricao} onChange={(evento) => atualizarCategoria(indice, 'dataAberturaInscricao', evento.target.value)} />
                </label>

                <label>
                  Encerramento das inscrições
                  <input type="date" value={categoria.dataEncerramentoInscricao} onChange={(evento) => atualizarCategoria(indice, 'dataEncerramentoInscricao', evento.target.value)} />
                </label>

                <label className="checkbox-label">
                  <input type="checkbox" checked={categoria.permiteListaEspera} onChange={(evento) => atualizarCategoria(indice, 'permiteListaEspera', evento.target.checked)} />
                  Permite lista de espera
                </label>

                <label className="campo-largo">
                  Observações
                  <textarea value={categoria.observacao} onChange={(evento) => atualizarCategoria(indice, 'observacao', evento.target.value)} />
                </label>
              </div>

              <div className="acoes-item">
                <button type="button" className="botao-perigo" onClick={() => removerCategoria(indice)}>
                  Remover categoria
                </button>
              </div>
            </article>
          ))}

          {formulario.categorias.length === 0 && (
            <p>Nenhuma categoria vinculada.</p>
          )}
        </div>

        <div className="acoes-item campo-largo">
          <button type="submit" className="botao-primario" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar rascunho'}
          </button>

          <button type="button" className="botao-secundario" onClick={() => navegar('/competicoes')}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
