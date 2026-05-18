import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronRight, FaFilter, FaTrophy } from 'react-icons/fa';
import { competicoesServico } from '../services/competicoesServico';
import { gruposServico } from '../services/gruposServico';
import { rankingServico } from '../services/rankingServico';
import { CompartilharRankingBotao } from '../components/ranking/CompartilharRankingBotao';
import { AvatarUsuario } from '../components/AvatarUsuario';
import { extrairMensagemErro } from '../utils/erros';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';

const ABAS_RANKING = [
  { valor: 'geral', rotulo: 'Geral' },
  { valor: 'grupos', rotulo: 'Grupos' },
  { valor: 'competicoes', rotulo: 'Competições' },
  { valor: 'regiao', rotulo: 'Região' }
];

const TIPOS_COMPETICAO = {
  grupo: 3
};

const generos = {
  1: 'Masculino',
  2: 'Feminino',
  3: 'Misto'
};

function normalizarRanking(lista, tipoConsulta) {
  const grupos = (lista || [])
    .map((grupo) => ({
      ...grupo,
      chave: `${tipoConsulta}-${grupo.categoriaId}-${grupo.competicaoId}`,
      atletas: (grupo.atletas || []).map((atleta) => ({
        ...atleta,
        pontos: Number(atleta.pontos || 0),
        pontosPendentes: Number(atleta.pontosPendentes || 0),
        partidas: atleta.partidas || []
      }))
    }));

  if (tipoConsulta !== 'competicoes') {
    return grupos;
  }

  return grupos.sort((a, b) => {
    const ordemCompeticao = a.nomeCompeticao.localeCompare(b.nomeCompeticao, 'pt-BR');
    if (ordemCompeticao !== 0) {
      return ordemCompeticao;
    }

    if ((a.genero ?? 0) !== (b.genero ?? 0)) {
      return (a.genero ?? 0) - (b.genero ?? 0);
    }

    return a.nomeCategoria.localeCompare(b.nomeCategoria, 'pt-BR');
  });
}

function formatarPontuacao(valor) {
  const numero = Number(valor || 0);
  if (Number.isInteger(numero)) {
    return String(numero);
  }

  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function calcularAproveitamento(item) {
  if (!item?.jogos) {
    return 0;
  }

  return Math.round((Number(item.vitorias || 0) / Number(item.jogos)) * 100);
}

function obterStatusVisual(item) {
  if (item.possuiUsuarioVinculado && !item.cadastroPendente) {
    return { texto: 'Ativo', classe: 'ativo' };
  }

  if (item.temEmail) {
    return { texto: 'Pendente', classe: 'pendente' };
  }

  return { texto: 'Sem conta', classe: 'sem-conta' };
}

function formatarRegiaoAtleta(item) {
  const partes = [item.estado, item.cidade, item.bairro].filter(Boolean);
  return partes.length > 0 ? partes.join(' / ') : '';
}

function obterResumoFiltro({
  abaRanking,
  grupoSelecionado,
  competicaoSelecionada,
  categoriaSelecionada,
  estadoRegiao,
  cidadeRegiao,
  bairroRegiao
}) {
  if (abaRanking === 'grupos') {
    return grupoSelecionado?.nome || 'Selecione um grupo';
  }

  if (abaRanking === 'competicoes') {
    return [competicaoSelecionada?.nome, categoriaSelecionada?.nome].filter(Boolean).join(' • ') || 'Selecione uma competição';
  }

  if (abaRanking === 'regiao') {
    return [estadoRegiao, cidadeRegiao, bairroRegiao].filter(Boolean).join(' / ') || 'Brasil';
  }

  return 'Todos os atletas';
}

export function PaginaRanking() {
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const [grupos, setGrupos] = useState([]);
  const [competicoes, setCompeticoes] = useState([]);
  const [regioes, setRegioes] = useState({ estados: [], cidades: [], bairros: [] });
  const [abaRanking, setAbaRanking] = useState('geral');
  const [grupoId, setGrupoId] = useState('');
  const [competicaoId, setCompeticaoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [estadoRegiao, setEstadoRegiao] = useState('');
  const [cidadeRegiao, setCidadeRegiao] = useState('');
  const [bairroRegiao, setBairroRegiao] = useState('');
  const [ranking, setRanking] = useState([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [carregandoBase, setCarregandoBase] = useState(true);
  const [carregandoRanking, setCarregandoRanking] = useState(false);
  const [erro, setErro] = useState('');

  const grupoSelecionado = useMemo(
    () => grupos.find((grupo) => grupo.id === grupoId) || null,
    [grupoId, grupos]
  );
  const competicaoSelecionada = useMemo(
    () => competicoes.find((competicao) => competicao.id === competicaoId) || null,
    [competicaoId, competicoes]
  );
  const cidadesRegiao = useMemo(() => {
    return (regioes.cidades || [])
      .filter((cidade) => !estadoRegiao || cidade.estado === estadoRegiao)
      .map((cidade) => cidade.cidade)
      .filter((cidade, indice, lista) => lista.indexOf(cidade) === indice)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [estadoRegiao, regioes.cidades]);
  const bairrosRegiao = useMemo(() => {
    return (regioes.bairros || [])
      .filter((bairro) => !estadoRegiao || bairro.estado === estadoRegiao)
      .filter((bairro) => !cidadeRegiao || bairro.cidade === cidadeRegiao)
      .map((bairro) => bairro.bairro)
      .filter((bairro, indice, lista) => lista.indexOf(bairro) === indice)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [cidadeRegiao, estadoRegiao, regioes.bairros]);
  const categoriasRanking = useMemo(() => {
    if (abaRanking !== 'competicoes') {
      return [];
    }

    return ranking
      .map((grupo) => ({
        id: grupo.categoriaId,
        nome: grupo.nomeCategoria,
        genero: grupo.genero
      }))
      .filter((categoria, indice, lista) => (
        categoria.id && lista.findIndex((item) => item.id === categoria.id) === indice
      ))
      .sort((a, b) => {
        if ((a.genero ?? 0) !== (b.genero ?? 0)) {
          return (a.genero ?? 0) - (b.genero ?? 0);
        }

        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [abaRanking, ranking]);
  const categoriaSelecionada = useMemo(
    () => categoriasRanking.find((categoria) => categoria.id === categoriaId) || null,
    [categoriaId, categoriasRanking]
  );
  const rankingFiltrado = useMemo(() => {
    if (!categoriaId) {
      return ranking;
    }

    return ranking.filter((grupo) => grupo.categoriaId === categoriaId);
  }, [ranking, categoriaId]);
  const resumoFiltro = obterResumoFiltro({
    abaRanking,
    grupoSelecionado,
    competicaoSelecionada,
    categoriaSelecionada,
    estadoRegiao,
    cidadeRegiao,
    bairroRegiao
  });

  useEffect(() => {
    carregarBase();
  }, []);

  useEffect(() => {
    if (abaRanking === 'grupos' && !grupoId) {
      setRanking([]);
      return;
    }

    if (abaRanking === 'competicoes' && !competicaoId) {
      setRanking([]);
      return;
    }

    carregarRanking();
  }, [abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao]);

  useEffect(() => {
    if (!categoriaId || categoriasRanking.length === 0) {
      return;
    }

    const categoriaExiste = categoriasRanking.some((categoria) => categoria.id === categoriaId);
    if (!categoriaExiste) {
      selecionarCategoria('');
    }
  }, [categoriaId, categoriasRanking]);

  async function carregarBase() {
    setCarregandoBase(true);
    setErro('');

    try {
      const [listaCompeticoes, listaGrupos, filtroRegioes] = await Promise.all([
        competicoesServico.listar(),
        gruposServico.listar(),
        rankingServico.listarRegioesDisponiveis()
      ]);
      const competicoesCampeonato = listaCompeticoes.filter((competicao) => Number(competicao.tipo) !== TIPOS_COMPETICAO.grupo);
      const tipoUrl = normalizarTipoUrl(params.get('tipo'));
      const grupoUrl = params.get('grupoId') || '';
      const competicaoUrl = params.get('competicaoId') || '';
      const estadoUrl = params.get('estado') || '';
      const cidadeUrl = params.get('cidade') || '';
      const bairroUrl = params.get('bairro') || '';

      const abaInicial = tipoUrl ||
        (grupoUrl ? 'grupos' : competicaoUrl ? 'competicoes' : 'geral');
      const grupoInicial = grupoUrl && listaGrupos.some((grupo) => grupo.id === grupoUrl)
        ? grupoUrl
        : listaGrupos[0]?.id || '';
      const competicaoInicial = competicaoUrl && competicoesCampeonato.some((competicao) => competicao.id === competicaoUrl)
        ? competicaoUrl
        : competicoesCampeonato[0]?.id || '';

      setGrupos(listaGrupos);
      setCompeticoes(competicoesCampeonato);
      setRegioes({
        estados: filtroRegioes?.estados || [],
        cidades: filtroRegioes?.cidades || [],
        bairros: filtroRegioes?.bairros || []
      });
      setAbaRanking(abaInicial);
      setGrupoId(grupoInicial);
      setCompeticaoId(competicaoInicial);
      setCategoriaId(params.get('categoriaId') || '');
      setEstadoRegiao(estadoUrl);
      setCidadeRegiao(cidadeUrl);
      setBairroRegiao(bairroUrl);
      atualizarParametros(abaInicial, grupoInicial, competicaoInicial, estadoUrl, cidadeUrl, bairroUrl, params.get('categoriaId') || '');
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoBase(false);
    }
  }

  async function carregarRanking() {
    setCarregandoRanking(true);
    setErro('');

    try {
      let lista = [];
      if (abaRanking === 'geral') {
        lista = await rankingServico.listarAtletasGeral();
      } else if (abaRanking === 'grupos') {
        lista = await rankingServico.listarAtletasPorGrupo(grupoId);
      } else if (abaRanking === 'regiao') {
        lista = await rankingServico.listarAtletasPorRegiao({
          estado: estadoRegiao,
          cidade: cidadeRegiao,
          bairro: bairroRegiao
        });
      } else {
        lista = await rankingServico.listarAtletasPorCompeticao(competicaoId);
      }

      setRanking(normalizarRanking(lista, abaRanking));
      atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, categoriaId);
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setRanking([]);
    } finally {
      setCarregandoRanking(false);
    }
  }

  function atualizarParametros(
    aba,
    novoGrupoId,
    novaCompeticaoId,
    novoEstadoRegiao = '',
    novaCidadeRegiao = '',
    novoBairroRegiao = '',
    novaCategoriaId = ''
  ) {
    const proximos = { tipo: aba };
    if (aba === 'grupos' && novoGrupoId) {
      proximos.grupoId = novoGrupoId;
    }
    if (aba === 'competicoes' && novaCompeticaoId) {
      proximos.competicaoId = novaCompeticaoId;
    }
    if (aba === 'competicoes' && novaCategoriaId) {
      proximos.categoriaId = novaCategoriaId;
    }
    if (aba === 'regiao') {
      if (novoEstadoRegiao) proximos.estado = novoEstadoRegiao;
      if (novaCidadeRegiao) proximos.cidade = novaCidadeRegiao;
      if (novoBairroRegiao) proximos.bairro = novoBairroRegiao;
    }

    setParams(proximos);
  }

  function selecionarAba(valor) {
    setAbaRanking(valor);
    setCategoriaId('');
    setFiltrosAbertos(false);
    atualizarParametros(valor, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, '');
  }

  function selecionarGrupo(valor) {
    setGrupoId(valor);
    atualizarParametros(abaRanking, valor, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, categoriaId);
  }

  function selecionarCompeticao(valor) {
    setCompeticaoId(valor);
    setCategoriaId('');
    atualizarParametros(abaRanking, grupoId, valor, estadoRegiao, cidadeRegiao, bairroRegiao, '');
  }

  function selecionarEstadoRegiao(valor) {
    setEstadoRegiao(valor);
    setCidadeRegiao('');
    setBairroRegiao('');
    atualizarParametros(abaRanking, grupoId, competicaoId, valor, '', '', categoriaId);
  }

  function selecionarCidadeRegiao(valor) {
    setCidadeRegiao(valor);
    setBairroRegiao('');
    atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, valor, '', categoriaId);
  }

  function selecionarBairroRegiao(valor) {
    setBairroRegiao(valor);
    atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, valor, categoriaId);
  }

  function selecionarCategoria(valor) {
    setCategoriaId(valor);
    atualizarParametros(abaRanking, grupoId, competicaoId, estadoRegiao, cidadeRegiao, bairroRegiao, valor);
  }

  function abrirAtleta(item, grupo) {
    navegar(`/atletas/${item.atletaId}/dashboard`, {
      state: {
        atletaRanking: item,
        grupoRanking: grupo
      }
    });
  }

  return (
    <section className="pagina pagina-ranking ranking-app">
      <header className="ranking-app-header">
        <div>
          <span>QNF Ranking</span>
          <h2>Ranking</h2>
        </div>
        <div className="ranking-app-header-acoes">
          <CompartilharRankingBotao
            contexto={resumoFiltro}
            titulo="Ranking QuebraNunca"
            ranking={rankingFiltrado}
          />
          <FaTrophy aria-hidden="true" />
        </div>
      </header>

      <nav className="ranking-tabs scroll-discreto" aria-label="Tipos de ranking">
        {ABAS_RANKING.map((aba) => (
          <button
            key={aba.valor}
            type="button"
            className={abaRanking === aba.valor ? 'ativo' : ''}
            onClick={() => selecionarAba(aba.valor)}
          >
            {aba.rotulo}
          </button>
        ))}
      </nav>

      <section className="ranking-filtros-shell">
        <div className="ranking-filtros-resumo">
          <div>
            <span>{ABAS_RANKING.find((aba) => aba.valor === abaRanking)?.rotulo}</span>
            <strong>{resumoFiltro}</strong>
          </div>
          <button
            type="button"
            className="botao-secundario botao-compacto"
            onClick={() => setFiltrosAbertos((aberto) => !aberto)}
            aria-expanded={filtrosAbertos}
          >
            <FaFilter aria-hidden="true" /> Filtros
          </button>
        </div>

        {filtrosAbertos && (
          <div className="ranking-filtros">
            {abaRanking === 'grupos' && (
              <label>
                Grupo
                <select value={grupoId} onChange={(evento) => selecionarGrupo(evento.target.value)}>
                  <option value="">Selecione</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
                  ))}
                </select>
              </label>
            )}

            {abaRanking === 'competicoes' && (
              <>
                <label>
                  Competição
                  <select value={competicaoId} onChange={(evento) => selecionarCompeticao(evento.target.value)}>
                    <option value="">Selecione</option>
                    {competicoes.map((competicao) => (
                      <option key={competicao.id} value={competicao.id}>{competicao.nome}</option>
                    ))}
                  </select>
                </label>

                {categoriasRanking.length > 0 && (
                  <label>
                    Categoria
                    <select value={categoriaId} onChange={(evento) => selecionarCategoria(evento.target.value)}>
                      <option value="">Todas as categorias</option>
                      {categoriasRanking.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}

            {abaRanking === 'regiao' && (
              <div className="ranking-regiao-grid">
                <label>
                  Estado
                  <select value={estadoRegiao} onChange={(evento) => selecionarEstadoRegiao(evento.target.value)}>
                    <option value="">Todos</option>
                    {(regioes.estados || []).map((estado) => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Cidade
                  <select value={cidadeRegiao} onChange={(evento) => selecionarCidadeRegiao(evento.target.value)}>
                    <option value="">Todas</option>
                    {cidadesRegiao.map((cidade) => (
                      <option key={cidade} value={cidade}>{cidade}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Bairro
                  <select value={bairroRegiao} onChange={(evento) => selecionarBairroRegiao(evento.target.value)}>
                    <option value="">Todos</option>
                    {bairrosRegiao.map((bairro) => (
                      <option key={bairro} value={bairro}>{bairro}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {abaRanking === 'geral' && (
              <p className="texto-ajuda">Ranking consolidado de todas as partidas registradas.</p>
            )}
          </div>
        )}
      </section>

      {erro && <p className="texto-erro">{erro}</p>}

      {carregandoBase || carregandoRanking ? (
        <div className="ranking-estado">Carregando ranking...</div>
      ) : rankingFiltrado.length === 0 ? (
        <div className="ranking-estado">Nenhuma pontuação encontrada para o filtro selecionado.</div>
      ) : (
        <div className="ranking-secoes">
          {rankingFiltrado.map((grupo) => (
            <RankingSecao
              key={grupo.chave}
              grupo={grupo}
              abaRanking={abaRanking}
              abrirAtleta={abrirAtleta}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RankingSecao({ grupo, abaRanking, abrirAtleta }) {
  const top3 = grupo.atletas.slice(0, 3);
  const restante = grupo.atletas.slice(3);

  return (
    <section className="ranking-secao">
      <div className="ranking-secao-titulo">
        <div>
          <span>{grupo.nomeCompeticao}</span>
          <h3>{grupo.nomeCategoria}</h3>
        </div>
        {grupo.genero && <small>{generos[grupo.genero] || 'Categoria'}</small>}
      </div>

      {top3.length > 0 && (
        <div className="ranking-podio-premium">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((item) => (
            <AtletaPodioCard
              key={item.atletaId}
              item={item}
              grupo={grupo}
              destaque={item.posicao === 1}
              onClick={() => abrirAtleta(item, grupo)}
            />
          ))}
        </div>
      )}

      <div className="ranking-lista-compacta">
        {restante.map((item) => (
          <AtletaRankingLinha
            key={item.atletaId}
            item={item}
            grupo={grupo}
            exibirRegiao={abaRanking === 'regiao'}
            onClick={() => abrirAtleta(item, grupo)}
          />
        ))}
      </div>
    </section>
  );
}

function AtletaPodioCard({ item, grupo, destaque, onClick }) {
  const status = obterStatusVisual(item);

  return (
    <button
      type="button"
      className={`ranking-podio-card ${destaque ? 'destaque' : ''}`}
      onClick={onClick}
      aria-label={`Abrir dashboard de ${obterNomeExibicaoAtleta(item)}`}
    >
      <span className="ranking-posicao-premium">{item.posicao}º</span>
      <AvatarAtleta item={item} destaque={destaque} />
      <strong>{obterNomeExibicaoAtleta(item)}</strong>
      <span className={`ranking-status-dot ${status.classe}`}>{status.texto}</span>
      <div className="ranking-podio-pontos">
        <strong>{formatarPontuacao(item.pontos)}</strong>
        <span>pts</span>
      </div>
      <div className="ranking-podio-stats">
        <span>{item.jogos} jogos</span>
        <span>{item.vitorias}V</span>
        <span>{item.derrotas}D</span>
      </div>
      <small>{grupo.nomeCategoria}</small>
    </button>
  );
}

function AtletaRankingLinha({ item, exibirRegiao, onClick }) {
  const status = obterStatusVisual(item);
  const aproveitamento = calcularAproveitamento(item);

  return (
    <button
      type="button"
      className="ranking-linha-compacta"
      onClick={onClick}
      aria-label={`Abrir dashboard de ${obterNomeExibicaoAtleta(item)}`}
    >
      <span className="ranking-linha-posicao">#{item.posicao}</span>
      <AvatarAtleta item={item} />
      <span className="ranking-linha-info">
        <strong>{obterNomeExibicaoAtleta(item)}</strong>
        {exibirRegiao && formatarRegiaoAtleta(item) && <small>{formatarRegiaoAtleta(item)}</small>}
        <small>{item.jogos} jogos • {item.vitorias} vitórias • {item.derrotas} derrotas</small>
        <small>{aproveitamento}% aproveitamento</small>
      </span>
      <span className="ranking-linha-pontos">
        <strong>{formatarPontuacao(item.pontos)}</strong>
        <small>pts</small>
      </span>
      <span className={`ranking-status-dot ${status.classe}`}>{status.texto}</span>
      <FaChevronRight className="ranking-linha-seta" aria-hidden="true" />
    </button>
  );
}

function AvatarAtleta({ item, destaque = false }) {
  return (
    <AvatarUsuario
      nome={obterNomeExibicaoAtleta(item)}
      fotoPerfilUrl={item.fotoPerfilUrl || item.fotoUrl}
      tamanho={destaque ? 'lg' : 'md'}
      className={`ranking-avatar ${destaque ? 'destaque' : ''}`}
    />
  );
}

function normalizarTipoUrl(tipo) {
  if (tipo === 'competicao') {
    return 'grupos';
  }

  if (ABAS_RANKING.some((aba) => aba.valor === tipo)) {
    return tipo;
  }

  return '';
}
