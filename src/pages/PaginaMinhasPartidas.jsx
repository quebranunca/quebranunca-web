import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaFilter, FaGamepad, FaSortAmountDown, FaTrophy } from 'react-icons/fa';
import { Link, useSearchParams } from 'react-router-dom';
import { CompartilharPartidaBotao } from '../components/partidas/CompartilharPartidaBotao';
import { EditarPartidaRegistradaModal } from '../components/partidas/EditarPartidaRegistradaModal';
import { PartidaCardPremium } from '../components/partidas/PartidaCardPremium';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { partidasServico } from '../services/partidasServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { formatarNomeDupla } from '../utils/atletaUtils';
import { extrairMensagemErro } from '../utils/erros';
import { podeEditarPartida } from '../utils/permissoesPartida';
import {
  atletaEstaNaDuplaA,
  atletaEstaNaDuplaB,
  obterAtletasPartida,
  obterNomeStatusAprovacao,
  obterNomeStatusPartida,
  ordenarPartidasRecentes,
  STATUS_APROVACAO_PARTIDA,
  STATUS_PARTIDA
} from '../utils/partidas';

const FILTROS_PRINCIPAIS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'participei', rotulo: 'Participei' },
  { id: 'registradas', rotulo: 'Registradas por mim' },
  { id: 'pendentes', rotulo: 'Pendentes' }
];

const FILTROS_ATLETA = [
  { id: 'vitorias', rotulo: 'Vitórias' },
  { id: 'derrotas', rotulo: 'Derrotas' }
];

const TIPOS_PENDENCIA = {
  aprovarPartida: 1,
  completarContato: 2
};

const STATUS_PENDENCIA = {
  pendente: 1,
  aguardandoCadastro: 4
};

function normalizarFiltro(valor) {
  const filtro = String(valor || '').trim().toLowerCase();

  if (['registradas', 'registradas-por-mim', 'minhas-registradas'].includes(filtro)) {
    return 'registradas';
  }

  if (['participei', 'participadas', 'meus-jogos'].includes(filtro)) {
    return 'participei';
  }

  if (['pendentes', 'pendencias', 'pendências'].includes(filtro)) {
    return 'pendentes';
  }

  if (['vitorias', 'vitórias'].includes(filtro)) {
    return 'vitorias';
  }

  if (['derrotas'].includes(filtro)) {
    return 'derrotas';
  }

  return 'todas';
}

function formatarAtletasPlacar(atletas) {
  return formatarNomeDupla(atletas, 'A definir');
}

function atletaParticipou(partida, atletaLogadoId) {
  return Boolean(atletaLogadoId) && (
    atletaEstaNaDuplaA(partida, atletaLogadoId) ||
    atletaEstaNaDuplaB(partida, atletaLogadoId)
  );
}

function duplaAVenceu(partida) {
  return Boolean(partida?.duplaAId && partida?.duplaVencedoraId === partida.duplaAId) ||
    Number(partida?.duplaVencedora) === 1;
}

function duplaBVenceu(partida) {
  return Boolean(partida?.duplaBId && partida?.duplaVencedoraId === partida.duplaBId) ||
    Number(partida?.duplaVencedora) === 2;
}

function partidaTemVencedora(partida) {
  return duplaAVenceu(partida) || duplaBVenceu(partida) || Boolean(partida?.duplaVencedoraId);
}

function atletaVenceuPartida(partida, atletaLogadoId) {
  const estaNaDuplaA = atletaEstaNaDuplaA(partida, atletaLogadoId);
  const estaNaDuplaB = atletaEstaNaDuplaB(partida, atletaLogadoId);

  return (estaNaDuplaA && duplaAVenceu(partida)) ||
    (estaNaDuplaB && duplaBVenceu(partida));
}

function obterResultadoParticipacao(partida, atletaLogadoId) {
  if (!atletaParticipou(partida, atletaLogadoId) || !partidaTemVencedora(partida)) {
    return { texto: '', classe: 'neutro' };
  }

  return atletaVenceuPartida(partida, atletaLogadoId)
    ? { texto: 'Vitória', classe: 'vitoria' }
    : { texto: 'Derrota', classe: 'derrota' };
}

function obterPontosPartidaAtleta(partida, atletaLogadoId) {
  if (!atletaVenceuPartida(partida, atletaLogadoId)) {
    return 0;
  }

  if (Number(partida.statusAprovacao) === STATUS_APROVACAO_PARTIDA.contestada) {
    return 0;
  }

  return Number(partida.pontosRankingVitoria || 0);
}

function obterPontosPendentesPartidaAtleta(partida, atletaLogadoId) {
  if (!atletaVenceuPartida(partida, atletaLogadoId)) {
    return 0;
  }

  const statusAprovacao = Number(partida.statusAprovacao);
  const possuiBonusPendente = statusAprovacao === STATUS_APROVACAO_PARTIDA.pendente ||
    statusAprovacao === STATUS_APROVACAO_PARTIDA.pendenteDeVinculos;

  return possuiBonusPendente ? Number(partida.pesoRankingCategoria || 1) : 0;
}

function formatarPontuacao(valor) {
  const numero = Number(valor || 0);

  return Number.isInteger(numero)
    ? String(numero)
    : numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
}

function placarFoiInformado(valor) {
  return valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor));
}

function partidaTemPlacar(partida) {
  return Number(partida?.status) === STATUS_PARTIDA.encerrada &&
    placarFoiInformado(partida?.placarDuplaA) &&
    placarFoiInformado(partida?.placarDuplaB);
}

function obterPlacar(partida, dupla) {
  if (!partidaTemPlacar(partida)) {
    return null;
  }

  return dupla === 'A' ? partida.placarDuplaA : partida.placarDuplaB;
}

function obterContextoPartida(partida) {
  return partida?.nomeGrupo?.trim() || 'Partida avulsa';
}

function pendenciaAindaVisivel(item) {
  if (!item) {
    return false;
  }

  if (item.tipo !== TIPOS_PENDENCIA.completarContato) {
    return item.status === STATUS_PENDENCIA.pendente;
  }

  if (item.status === STATUS_PENDENCIA.aguardandoCadastro) {
    return true;
  }

  return item.status === STATUS_PENDENCIA.pendente && !item.atletaPossuiUsuarioVinculado;
}

function pendenciaExigeAcao(item) {
  return item?.status === STATUS_PENDENCIA.pendente;
}

function criarPartidaAPartirPendencia(item) {
  if (!item?.partidaId) {
    return null;
  }

  return {
    id: item.partidaId,
    nomeGrupo: item.nomeGrupo,
    status: item.statusPartida,
    statusAprovacao: item.statusAprovacaoPartida,
    nomeDuplaA: item.nomeDuplaA,
    nomeDuplaAAtleta1: item.nomeDuplaAAtleta1,
    nomeDuplaAAtleta2: item.nomeDuplaAAtleta2,
    nomeDuplaB: item.nomeDuplaB,
    nomeDuplaBAtleta1: item.nomeDuplaBAtleta1,
    nomeDuplaBAtleta2: item.nomeDuplaBAtleta2,
    placarDuplaA: item.placarDuplaA,
    placarDuplaB: item.placarDuplaB,
    criadoPorUsuarioId: item.criadoPorUsuarioId,
    nomeCriadoPorUsuario: item.nomeCriadoPorUsuario,
    grupoId: item.grupoId,
    dataPartida: item.dataPartida,
    dataCriacao: item.dataCriacao,
    quantidadeAtletasPendentes: item.tipo === TIPOS_PENDENCIA.completarContato ? 1 : 0,
    atletasPendentes: item.nomeAtleta
      ? [{
        atletaId: item.atletaId,
        nomeAtleta: item.nomeAtleta,
        email: item.emailAtleta,
        statusPendencia: item.status === STATUS_PENDENCIA.aguardandoCadastro
          ? 'AguardandoCadastro'
          : 'Pendente'
      }]
      : []
  };
}

function mesclarDadosPartida(atual, nova) {
  const resultado = { ...atual };

  Object.entries(nova || {}).forEach(([chave, valor]) => {
    if (chave.startsWith('__')) {
      return;
    }

    if (valor !== null && valor !== undefined && valor !== '') {
      resultado[chave] = valor;
      return;
    }

    if (!(chave in resultado)) {
      resultado[chave] = valor;
    }
  });

  return resultado;
}

function adicionarPartidaAoMapa(mapa, partida, flags = {}) {
  if (!partida?.id) {
    return;
  }

  const atual = mapa.get(partida.id) || {};
  mapa.set(partida.id, {
    ...mesclarDadosPartida(atual, partida),
    __participei: Boolean(atual.__participei || flags.participei),
    __registradaPorMim: Boolean(atual.__registradaPorMim || flags.registradaPorMim),
    __pendenciaAcionavel: Boolean(atual.__pendenciaAcionavel || flags.pendenciaAcionavel),
    __pendencias: [
      ...(atual.__pendencias || []),
      ...(flags.pendencias || [])
    ]
  });
}

function combinarPartidas({ participadas, registradas, pendencias, atletaLogadoId, usuarioId }) {
  const mapa = new Map();
  const pendenciasVisiveis = (pendencias || []).filter(pendenciaAindaVisivel);
  const pendenciasPorPartida = new Map();

  pendenciasVisiveis.forEach((pendencia) => {
    if (!pendencia.partidaId) {
      return;
    }

    const lista = pendenciasPorPartida.get(pendencia.partidaId) || [];
    lista.push(pendencia);
    pendenciasPorPartida.set(pendencia.partidaId, lista);
  });

  (participadas || []).forEach((partida) => {
    adicionarPartidaAoMapa(mapa, partida, {
      participei: true,
      registradaPorMim: partida.criadoPorUsuarioId === usuarioId
    });
  });

  (registradas || []).forEach((partida) => {
    adicionarPartidaAoMapa(mapa, partida, {
      participei: atletaParticipou(partida, atletaLogadoId),
      registradaPorMim: true
    });
  });

  pendenciasVisiveis.forEach((pendencia) => {
    const partida = criarPartidaAPartirPendencia(pendencia);

    if (!partida) {
      return;
    }

    adicionarPartidaAoMapa(mapa, partida, {
      participei: atletaParticipou(partida, atletaLogadoId),
      registradaPorMim: partida.criadoPorUsuarioId === usuarioId,
      pendenciaAcionavel: pendenciaExigeAcao(pendencia),
      pendencias: [pendencia]
    });
  });

  return Array.from(mapa.values()).map((partida) => {
    const pendenciasDaPartida = pendenciasPorPartida.get(partida.id) || partida.__pendencias || [];
    return {
      ...partida,
      __participei: Boolean(partida.__participei || atletaParticipou(partida, atletaLogadoId)),
      __registradaPorMim: Boolean(partida.__registradaPorMim || partida.criadoPorUsuarioId === usuarioId),
      __pendenciaAcionavel: Boolean(partida.__pendenciaAcionavel || pendenciasDaPartida.some(pendenciaExigeAcao)),
      __pendencias: pendenciasDaPartida
    };
  });
}

function partidaEstaPendente(partida) {
  const statusAprovacao = Number(partida.statusAprovacao);

  return Boolean(partida.__pendenciaAcionavel) ||
    statusAprovacao === STATUS_APROVACAO_PARTIDA.pendente ||
    statusAprovacao === STATUS_APROVACAO_PARTIDA.pendenteDeVinculos ||
    Number(partida.quantidadeAtletasPendentes || 0) > 0 ||
    Number(partida.status) !== STATUS_PARTIDA.encerrada;
}

function partidaPassaFiltro(partida, filtro, atletaLogadoId) {
  if (filtro === 'todas') {
    return true;
  }

  if (filtro === 'participei') {
    return partida.__participei;
  }

  if (filtro === 'registradas') {
    return partida.__registradaPorMim;
  }

  if (filtro === 'pendentes') {
    return partidaEstaPendente(partida);
  }

  const resultado = obterResultadoParticipacao(partida, atletaLogadoId);

  if (filtro === 'vitorias') {
    return resultado.texto === 'Vitória';
  }

  if (filtro === 'derrotas') {
    return resultado.texto === 'Derrota';
  }

  return true;
}

function ordenarPartidas(partidas, ordem) {
  const recentes = ordenarPartidasRecentes(partidas);

  if (ordem === 'antigas') {
    return recentes.reverse();
  }

  if (ordem === 'pendentes') {
    return [...recentes].sort((a, b) => {
      const pendenciaA = partidaEstaPendente(a) ? 1 : 0;
      const pendenciaB = partidaEstaPendente(b) ? 1 : 0;
      return pendenciaB - pendenciaA;
    });
  }

  return recentes;
}

function obterMensagemVazia(filtro) {
  switch (filtro) {
    case 'participei':
      return 'Você ainda não participou de partidas registradas.';
    case 'registradas':
      return 'Você ainda não registrou partidas.';
    case 'pendentes':
      return 'Nenhuma pendência encontrada.';
    default:
      return 'Nenhuma partida encontrada.';
  }
}

function obterChipsPartida(partida, filtroAtivo, atletaLogadoId) {
  const chips = [];
  const resultado = obterResultadoParticipacao(partida, atletaLogadoId);
  const statusAprovacao = Number(partida.statusAprovacao);

  chips.push({
    texto: Number(partida.status) === STATUS_PARTIDA.encerrada ? 'Encerrada' : 'Pendente',
    classe: Number(partida.status) === STATUS_PARTIDA.encerrada ? 'validado' : 'pendente'
  });

  if (statusAprovacao === STATUS_APROVACAO_PARTIDA.pendenteDeVinculos) {
    chips.push({ texto: 'Pendente de vínculos', classe: 'pendente' });
  } else if (statusAprovacao === STATUS_APROVACAO_PARTIDA.pendente) {
    chips.push({ texto: 'Pendente', classe: 'pendente' });
  } else if (statusAprovacao === STATUS_APROVACAO_PARTIDA.aprovada) {
    chips.push({ texto: 'Aprovada', classe: 'validado' });
  } else if (statusAprovacao === STATUS_APROVACAO_PARTIDA.contestada) {
    chips.push({ texto: 'Contestada', classe: 'derrota' });
  }

  chips.push({
    texto: partidaTemPlacar(partida) ? 'Com placar' : 'Sem placar',
    classe: partidaTemPlacar(partida) ? 'validado' : 'neutro'
  });

  if (resultado.texto) {
    chips.push({ texto: resultado.texto, classe: resultado.classe });
  }

  if (partida.__registradaPorMim && filtroAtivo !== 'registradas') {
    chips.push({ texto: 'Registrada por mim', classe: 'neutro' });
  }

  if (partida.__participei && filtroAtivo !== 'participei') {
    chips.push({ texto: 'Participei', classe: 'neutro' });
  }

  return chips;
}

function obterTextoPendencias(partida) {
  const nomesPendentes = Array.isArray(partida.atletasPendentes)
    ? partida.atletasPendentes
      .map((atleta) => atleta?.nomeAtleta || atleta?.nome)
      .filter(Boolean)
    : [];

  if (nomesPendentes.length > 0) {
    return `Vínculo pendente: ${nomesPendentes.join(', ')}`;
  }

  const quantidade = Number(partida.quantidadeAtletasPendentes || 0);

  if (quantidade > 0) {
    return `${quantidade} ${quantidade === 1 ? 'vínculo pendente' : 'vínculos pendentes'}`;
  }

  if (partida.__pendenciaAcionavel) {
    return 'Partida com pendência acionável.';
  }

  return '';
}

export function PaginaMinhasPartidas() {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const atletaLogadoId = usuario?.atletaId;
  const usuarioId = usuario?.id;
  const [partidas, setPartidas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState(() => normalizarFiltro(searchParams.get('filtro')));
  const [ordem, setOrdem] = useState('recentes');
  const [partidaDetalhe, setPartidaDetalhe] = useState(null);
  const [partidaEmEdicao, setPartidaEmEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  useEffect(() => {
    setFiltroAtivo(normalizarFiltro(searchParams.get('filtro')));
  }, [searchParams]);

  async function carregarPartidas({ manterCarregando = true } = {}) {
    if (manterCarregando) {
      setCarregando(true);
    }
    setErro('');

    const resultadoParticipadas = atletaLogadoId
      ? partidasServico.listarMinhas()
      : Promise.resolve([]);

    const resultados = await Promise.allSettled([
      resultadoParticipadas,
      partidasServico.listarRegistradasPorMim(),
      pendenciasServico.listar()
    ]);

    const [participadasResultado, registradasResultado, pendenciasResultado] = resultados;
    const participadas = participadasResultado.status === 'fulfilled' ? participadasResultado.value || [] : [];
    const registradas = registradasResultado.status === 'fulfilled' ? registradasResultado.value || [] : [];
    const pendencias = pendenciasResultado.status === 'fulfilled' ? pendenciasResultado.value || [] : [];

    if (participadasResultado.status === 'rejected' && registradasResultado.status === 'rejected') {
      setErro(extrairMensagemErro(participadasResultado.reason || registradasResultado.reason));
      setPartidas([]);
    } else {
      const erroParcial = [participadasResultado, registradasResultado]
        .find((resultado) => resultado.status === 'rejected');

      if (erroParcial) {
        setErro(extrairMensagemErro(erroParcial.reason));
      }

      setPartidas(ordenarPartidasRecentes(combinarPartidas({
        participadas,
        registradas,
        pendencias,
        atletaLogadoId,
        usuarioId
      })));
    }

    if (manterCarregando) {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPartidas();
  }, [atletaLogadoId, usuarioId]);

  function abrirEdicao(partida) {
    setErroEdicao('');
    setPartidaDetalhe(null);
    setPartidaEmEdicao(partida);
  }

  function fecharEdicao() {
    if (!salvandoEdicao) {
      setErroEdicao('');
      setPartidaEmEdicao(null);
    }
  }

  async function salvarEdicao(dados) {
    if (!partidaEmEdicao) {
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao('');

    try {
      const partidaAtualizada = await partidasServico.atualizarBasica(partidaEmEdicao.id, dados);
      await carregarPartidas({ manterCarregando: false });
      showNotification({
        type: 'success',
        title: 'Partida atualizada',
        message: 'Partida atualizada com sucesso.'
      });
      return partidaAtualizada;
    } catch (error) {
      const mensagem = extrairMensagemErro(error);
      setErroEdicao(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao editar partida',
        message: mensagem
      });
      throw error;
    } finally {
      setSalvandoEdicao(false);
    }
  }

  const filtrosDisponiveis = useMemo(() => (
    atletaLogadoId ? [...FILTROS_PRINCIPAIS, ...FILTROS_ATLETA] : FILTROS_PRINCIPAIS
  ), [atletaLogadoId]);

  const resumo = useMemo(() => {
    return partidas
      .filter((partida) => partida.__participei)
      .reduce((acumulado, partida) => {
        const resultado = obterResultadoParticipacao(partida, atletaLogadoId);
        return {
          jogos: acumulado.jogos + 1,
          vitorias: acumulado.vitorias + (resultado.texto === 'Vitória' ? 1 : 0),
          derrotas: acumulado.derrotas + (resultado.texto === 'Derrota' ? 1 : 0),
          pontos: acumulado.pontos + obterPontosPartidaAtleta(partida, atletaLogadoId),
          pontosPendentes: acumulado.pontosPendentes + obterPontosPendentesPartidaAtleta(partida, atletaLogadoId)
        };
      }, { jogos: 0, vitorias: 0, derrotas: 0, pontos: 0, pontosPendentes: 0 });
  }, [atletaLogadoId, partidas]);

  const aproveitamento = resumo.jogos > 0
    ? Math.round((resumo.vitorias / resumo.jogos) * 100)
    : 0;

  const partidasFiltradas = useMemo(() => {
    return ordenarPartidas(
      partidas.filter((partida) => partidaPassaFiltro(partida, filtroAtivo, atletaLogadoId)),
      ordem
    );
  }, [atletaLogadoId, filtroAtivo, ordem, partidas]);

  return (
    <section className="pagina meus-jogos-pagina">
      <header className="meus-jogos-hero minhas-partidas-hero">
        <div>
          <span>Histórico esportivo</span>
          <h1>Minhas Partidas</h1>
          <p>Veja seus jogos, partidas registradas, resultados e pendências.</p>
        </div>
      </header>

      {atletaLogadoId && (
        <article className="meus-jogos-resumo-premium">
          <div className="meus-jogos-resumo-topo">
            <div>
              <span>Resumo</span>
              <strong>{formatarPontuacao(resumo.pontos)} pts</strong>
              <small>Pendente +{formatarPontuacao(resumo.pontosPendentes)}</small>
            </div>
            <FaTrophy aria-hidden="true" />
          </div>

          <div className="meus-jogos-metricas">
            <ResumoMetrica rotulo="Jogos" valor={resumo.jogos} />
            <ResumoMetrica rotulo="Vitórias" valor={resumo.vitorias} />
            <ResumoMetrica rotulo="Derrotas" valor={resumo.derrotas} />
            <ResumoMetrica rotulo="Aproveitamento" valor={`${aproveitamento}%`} />
          </div>
        </article>
      )}

      <section className="meus-jogos-controles" aria-label="Filtros das partidas">
        <div className="meus-jogos-filtros">
          {filtrosDisponiveis.map((filtro) => (
            <button
              key={filtro.id}
              type="button"
              className={filtroAtivo === filtro.id ? 'ativo' : ''}
              onClick={() => setFiltroAtivo(filtro.id)}
            >
              <FaFilter aria-hidden="true" />
              {filtro.rotulo}
            </button>
          ))}
        </div>

        <label className="meus-jogos-ordenacao">
          <FaSortAmountDown aria-hidden="true" />
          <select value={ordem} onChange={(evento) => setOrdem(evento.target.value)}>
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="pendentes">Pendentes primeiro</option>
          </select>
        </label>
      </section>

      {erro && <p className="texto-erro">{erro}</p>}

      {carregando ? (
        <article className="meus-jogos-estado">
          <span className="meus-jogos-loading" />
          <strong>Carregando suas partidas...</strong>
        </article>
      ) : partidas.length === 0 ? (
        <EstadoVazio filtro={filtroAtivo} />
      ) : partidasFiltradas.length === 0 ? (
        <EstadoVazio filtro={filtroAtivo} />
      ) : (
        <div className="meus-jogos-lista-premium">
          {partidasFiltradas.map((partida) => (
            <CardMinhaPartida
              key={partida.id}
              partida={partida}
              atletaLogadoId={atletaLogadoId}
              filtroAtivo={filtroAtivo}
              onDetalhes={() => setPartidaDetalhe(partida)}
              onEditar={podeEditarPartida(partida, usuario) ? () => abrirEdicao(partida) : null}
            />
          ))}
        </div>
      )}

      {partidaDetalhe && (
        <DetalhesPartidaModal
          partida={partidaDetalhe}
          atletaLogadoId={atletaLogadoId}
          onFechar={() => setPartidaDetalhe(null)}
          onEditar={podeEditarPartida(partidaDetalhe, usuario) ? () => abrirEdicao(partidaDetalhe) : null}
        />
      )}

      {partidaEmEdicao && (
        <EditarPartidaRegistradaModal
          partida={partidaEmEdicao}
          salvando={salvandoEdicao}
          erro={erroEdicao}
          onSalvar={salvarEdicao}
          onFechar={fecharEdicao}
        />
      )}
    </section>
  );
}

function ResumoMetrica({ rotulo, valor }) {
  return (
    <div>
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function EstadoVazio({ filtro }) {
  return (
    <article className="meus-jogos-estado">
      <FaGamepad aria-hidden="true" />
      <strong>{obterMensagemVazia(filtro)}</strong>
      <Link to="/partidas/registrar" className="botao-secundario botao-compacto">
        Registrar partida
      </Link>
    </article>
  );
}

function CardMinhaPartida({ partida, atletaLogadoId, filtroAtivo, onDetalhes, onEditar }) {
  const atletas = obterAtletasPartida(partida, atletaLogadoId);
  const minhaDuplaEhA = atletaEstaNaDuplaA(partida, atletaLogadoId);
  const minhaDuplaEhB = atletaEstaNaDuplaB(partida, atletaLogadoId);
  const temPlacar = partidaTemPlacar(partida);
  const pendenciasTexto = obterTextoPendencias(partida);
  const podeCompartilhar = Number(partida.status) === STATUS_PARTIDA.encerrada && partida.id;
  const podeResolverPendencias = partida.__pendenciaAcionavel;

  return (
    <PartidaCardPremium
      contexto={obterContextoPartida(partida)}
      status={obterNomeStatusPartida(partida.status)}
      dataPartida={partida.dataPartida || partida.dataCriacao}
      badges={obterChipsPartida(partida, filtroAtivo, atletaLogadoId)}
      avisoPendencias={pendenciasTexto}
      duplaA={{
        label: minhaDuplaEhA ? 'Sua dupla' : 'Dupla 1',
        atletas: formatarAtletasPlacar(atletas.duplaA),
        atleta1Id: partida.duplaAAtleta1Id,
        atleta2Id: partida.duplaAAtleta2Id,
        placar: obterPlacar(partida, 'A'),
        mostrarPlacar: temPlacar,
        destaque: minhaDuplaEhA,
        vencedora: duplaAVenceu(partida)
      }}
      duplaB={{
        label: minhaDuplaEhB ? 'Sua dupla' : 'Dupla 2',
        atletas: formatarAtletasPlacar(atletas.duplaB),
        atleta1Id: partida.duplaBAtleta1Id,
        atleta2Id: partida.duplaBAtleta2Id,
        placar: obterPlacar(partida, 'B'),
        mostrarPlacar: temPlacar,
        destaque: minhaDuplaEhB,
        vencedora: duplaBVenceu(partida)
      }}
      acaoPrincipal={podeResolverPendencias && (
        <Link to="/app/pendencias" className="botao-primario botao-compacto meus-jogos-acao-principal">
          <FaExclamationTriangle aria-hidden="true" />
          Resolver pendências
        </Link>
      )}
      acaoCompartilhar={
        <>
          {onEditar && (
            <button
              type="button"
              className="botao-secundario botao-compacto botao-editar-partida-discreto"
              onClick={onEditar}
              aria-label="Editar partida"
              title="Editar partida"
            >
              <FaEdit aria-hidden="true" />
              Editar
            </button>
          )}
          {podeCompartilhar && <CompartilharPartidaBotao partidaId={partida.id} />}
        </>
      }
      onDetalhes={onDetalhes}
      detalhesDesabilitado={!partida.id}
    />
  );
}

function DetalhesPartidaModal({ partida, atletaLogadoId, onFechar, onEditar }) {
  const atletas = obterAtletasPartida(partida, atletaLogadoId);
  const resultado = obterResultadoParticipacao(partida, atletaLogadoId);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onFechar}>
      <article className="modal-conteudo meus-jogos-modal" role="dialog" aria-modal="true" aria-label="Detalhes da partida" onClick={(evento) => evento.stopPropagation()}>
        <div className="modal-cabecalho">
          <div>
            <span>Detalhes da partida</span>
            <h3>{obterContextoPartida(partida)}</h3>
          </div>
          <div className="acoes-item acoes-item-compactas">
            {onEditar && (
              <button type="button" className="botao-secundario botao-compacto botao-editar-partida-discreto" onClick={onEditar}>
                <FaEdit aria-hidden="true" />
                Editar partida
              </button>
            )}
            <button type="button" className="botao-secundario botao-compacto" onClick={onFechar}>
              Fechar
            </button>
          </div>
        </div>

        <div className="meus-jogos-modal-grid">
          <ResumoMetrica rotulo="Resultado" valor={resultado.texto || 'Partida'} />
          <ResumoMetrica rotulo="Status" valor={obterNomeStatusAprovacao(partida.statusAprovacao)} />
          <ResumoMetrica rotulo="Jogo" valor={obterNomeStatusPartida(partida.status)} />
          <ResumoMetrica rotulo="Pendências" valor={partida.quantidadeAtletasPendentes || 0} />
        </div>

        <div className="meus-jogos-placar-premium">
          <PartidaCardPremium.LinhaPlacar
            label="Dupla 1"
            atletas={formatarAtletasPlacar(atletas.duplaA)}
            placar={obterPlacar(partida, 'A')}
            mostrarPlacar={partidaTemPlacar(partida)}
            destaque={atletaEstaNaDuplaA(partida, atletaLogadoId)}
            vencedora={duplaAVenceu(partida)}
            atleta1Id={partida.duplaAAtleta1Id}
            atleta2Id={partida.duplaAAtleta2Id}
          />
          <PartidaCardPremium.LinhaPlacar
            label="Dupla 2"
            atletas={formatarAtletasPlacar(atletas.duplaB)}
            placar={obterPlacar(partida, 'B')}
            mostrarPlacar={partidaTemPlacar(partida)}
            destaque={atletaEstaNaDuplaB(partida, atletaLogadoId)}
            vencedora={duplaBVenceu(partida)}
            atleta1Id={partida.duplaBAtleta1Id}
            atleta2Id={partida.duplaBAtleta2Id}
          />
        </div>

        {obterTextoPendencias(partida) && (
          <p className="meus-jogos-observacoes">{obterTextoPendencias(partida)}</p>
        )}

        {partida.observacoes && (
          <p className="meus-jogos-observacoes">{partida.observacoes}</p>
        )}
      </article>
    </div>
  );
}
