import { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaChevronRight, FaFilter, FaGamepad, FaMedal, FaPlus, FaSortAmountDown, FaTrophy } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { partidasServico } from '../services/partidasServico';
import { CompartilharPartidaBotao } from '../components/partidas/CompartilharPartidaBotao';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import {
  atletaEstaNaDuplaA,
  atletaEstaNaDuplaB,
  obterAtletasPartida,
  obterNomeStatusAprovacao,
  obterNomeStatusPartida,
  obterResultadoAtleta,
  ordenarPartidasRecentes,
  STATUS_APROVACAO_PARTIDA,
  STATUS_PARTIDA
} from '../utils/partidas';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';

const filtrosJogos = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'vitorias', rotulo: 'Vitórias' },
  { id: 'derrotas', rotulo: 'Derrotas' },
  { id: 'pendentes', rotulo: 'Pendente' },
  { id: 'validados', rotulo: 'Validados' }
];

function formatarAtletasPlacar(atletas) {
  const nomes = (atletas || [])
    .map((atleta) => obterNomeExibicaoAtleta(atleta))
    .filter(Boolean);

  return nomes.length > 0 ? nomes.join(' e ') : 'A definir';
}

function atletaVenceuPartida(partida, atletaLogadoId) {
  const estaNaDuplaA = atletaEstaNaDuplaA(partida, atletaLogadoId);
  const estaNaDuplaB = atletaEstaNaDuplaB(partida, atletaLogadoId);

  return (estaNaDuplaA && partida.duplaVencedoraId === partida.duplaAId) ||
    (estaNaDuplaB && partida.duplaVencedoraId === partida.duplaBId);
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

function obterContextoPartida(partida) {
  return partida.nomeGrupo || partida.nomeCategoria || 'Partida';
}

function obterClasseResultado(resultado) {
  if (resultado.texto === 'Vitória') {
    return 'vitoria';
  }

  if (resultado.texto === 'Derrota') {
    return 'derrota';
  }

  return 'pendente';
}

function obterClasseValidacao(statusAprovacao) {
  switch (Number(statusAprovacao)) {
    case STATUS_APROVACAO_PARTIDA.aprovada:
      return 'validado';
    case STATUS_APROVACAO_PARTIDA.contestada:
      return 'derrota';
    default:
      return 'pendente';
  }
}

function obterPlacar(partida, dupla) {
  if (Number(partida.status) !== STATUS_PARTIDA.encerrada) {
    return '-';
  }

  return dupla === 'A' ? partida.placarDuplaA : partida.placarDuplaB;
}

function ordenarPartidas(partidas, ordem) {
  const recentes = ordenarPartidasRecentes(partidas);
  return ordem === 'antigas' ? recentes.reverse() : recentes;
}

function partidaPassaFiltro(partida, filtro, atletaLogadoId) {
  if (filtro === 'todos') {
    return true;
  }

  const resultado = obterResultadoAtleta(partida, atletaLogadoId);
  const statusAprovacao = Number(partida.statusAprovacao);

  if (filtro === 'vitorias') {
    return resultado.texto === 'Vitória';
  }

  if (filtro === 'derrotas') {
    return resultado.texto === 'Derrota';
  }

  if (filtro === 'validados') {
    return statusAprovacao === STATUS_APROVACAO_PARTIDA.aprovada;
  }

  return statusAprovacao === STATUS_APROVACAO_PARTIDA.pendente ||
    statusAprovacao === STATUS_APROVACAO_PARTIDA.pendenteDeVinculos ||
    Number(partida.status) !== STATUS_PARTIDA.encerrada;
}

export function PaginaMeusJogos() {
  const { usuario } = useAutenticacao();
  const atletaLogadoId = usuario?.atletaId;
  const [partidas, setPartidas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [ordem, setOrdem] = useState('recentes');
  const [partidaDetalhe, setPartidaDetalhe] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function carregarPartidas() {
      setCarregando(true);
      setErro('');

      try {
        const lista = await partidasServico.listarMinhas();
        if (ativo) {
          setPartidas(ordenarPartidasRecentes(lista || []));
        }
      } catch (error) {
        if (ativo) {
          setErro(extrairMensagemErro(error));
          setPartidas([]);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPartidas();

    return () => {
      ativo = false;
    };
  }, []);

  const resumo = useMemo(() => {
    return partidas.reduce((acumulado, partida) => {
      const resultado = obterResultadoAtleta(partida, atletaLogadoId);
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
      <header className="meus-jogos-hero">
        <div>
          <span>Histórico esportivo</span>
          <h1>Meus Jogos</h1>
          <p>Partidas vinculadas ao seu atleta, com placar, resultado e validação.</p>
        </div>
        <Link to="/partidas/registrar" className="botao-primario meus-jogos-registrar">
          <FaPlus aria-hidden="true" />
          Registrar
        </Link>
      </header>

      {!atletaLogadoId && (
        <article className="meus-jogos-estado">
          <strong>Seu usuário ainda não possui atleta vinculado.</strong>
          <p>Complete seu perfil para acompanhar seu histórico esportivo.</p>
          <Link to="/app/perfil" className="botao-primario">
            Completar perfil
          </Link>
        </article>
      )}

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

      {atletaLogadoId && (
        <section className="meus-jogos-controles" aria-label="Filtros dos jogos">
          <div className="meus-jogos-filtros">
            {filtrosJogos.map((filtro) => (
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
              <option value="antigas">Mais antigos</option>
            </select>
          </label>
        </section>
      )}

      {erro && <p className="texto-erro">{erro}</p>}

      {carregando ? (
        <article className="meus-jogos-estado">
          <span className="meus-jogos-loading" />
          <strong>Carregando seus jogos...</strong>
        </article>
      ) : atletaLogadoId && partidas.length === 0 ? (
        <article className="meus-jogos-estado">
          <FaGamepad aria-hidden="true" />
          <strong>Você ainda não registrou partidas</strong>
          <p>Quando seus jogos forem lançados, o histórico aparece aqui.</p>
          <Link to="/partidas/registrar" className="botao-primario">
            Registrar primeira partida
          </Link>
        </article>
      ) : atletaLogadoId && partidasFiltradas.length === 0 ? (
        <article className="meus-jogos-estado">
          <strong>Nenhum jogo para este filtro.</strong>
          <p>Troque o filtro para consultar outros resultados.</p>
        </article>
      ) : atletaLogadoId ? (
        <div className="meus-jogos-lista-premium">
          {partidasFiltradas.map((partida) => (
            <PartidaCard
              key={partida.id}
              partida={partida}
              atletaLogadoId={atletaLogadoId}
              onDetalhes={() => setPartidaDetalhe(partida)}
            />
          ))}
        </div>
      ) : null}

      {partidaDetalhe && (
        <DetalhesPartidaModal
          partida={partidaDetalhe}
          atletaLogadoId={atletaLogadoId}
          onFechar={() => setPartidaDetalhe(null)}
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

function PartidaCard({ partida, atletaLogadoId, onDetalhes }) {
  const atletas = obterAtletasPartida(partida, atletaLogadoId);
  const resultado = obterResultadoAtleta(partida, atletaLogadoId);
  const minhaDuplaEhA = atletaEstaNaDuplaA(partida, atletaLogadoId);
  const minhaDuplaEhB = atletaEstaNaDuplaB(partida, atletaLogadoId);
  const duplaAVencedora = partida.duplaVencedoraId && partida.duplaVencedoraId === partida.duplaAId;
  const duplaBVencedora = partida.duplaVencedoraId && partida.duplaVencedoraId === partida.duplaBId;

  return (
    <article className="meus-jogos-card-premium">
      <div className="meus-jogos-card-topo-premium">
        <div>
          <span>{obterContextoPartida(partida)}</span>
          <strong>{partida.faseCampeonato || obterNomeStatusPartida(partida.status)}</strong>
          <small><FaCalendarAlt aria-hidden="true" /> {partida.dataPartida ? formatarDataHora(partida.dataPartida) : 'Data a definir'}</small>
        </div>

        <div className="meus-jogos-badges">
          <span className={`meus-jogos-badge ${obterClasseResultado(resultado)}`}>
            {resultado.texto}
          </span>
          <span className={`meus-jogos-badge ${obterClasseValidacao(partida.statusAprovacao)}`}>
            {obterNomeStatusAprovacao(partida.statusAprovacao)}
          </span>
        </div>
      </div>

      <div className="meus-jogos-placar-premium">
        <LinhaPlacar
          label={minhaDuplaEhA ? 'Sua dupla' : 'Dupla 1'}
          atletas={formatarAtletasPlacar(atletas.duplaA)}
          placar={obterPlacar(partida, 'A')}
          destaque={minhaDuplaEhA}
          vencedora={duplaAVencedora}
        />
        <LinhaPlacar
          label={minhaDuplaEhB ? 'Sua dupla' : 'Adversários'}
          atletas={formatarAtletasPlacar(atletas.duplaB)}
          placar={obterPlacar(partida, 'B')}
          destaque={minhaDuplaEhB}
          vencedora={duplaBVencedora}
        />
      </div>

      <div className="meus-jogos-card-acoes">
        {Number(partida.status) === STATUS_PARTIDA.encerrada && <CompartilharPartidaBotao partidaId={partida.id} />}
        <button type="button" className="botao-secundario botao-compacto meus-jogos-detalhes" onClick={onDetalhes}>
          Detalhes
          <FaChevronRight aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function LinhaPlacar({ label, atletas, placar, destaque, vencedora }) {
  return (
    <div className={`meus-jogos-linha-placar ${destaque ? 'minha-dupla' : ''} ${vencedora ? 'vencedora' : ''}`}>
      <div>
        <span>{label}</span>
        <strong>{atletas}</strong>
      </div>
      <strong className="meus-jogos-placar-numero">{placar}</strong>
    </div>
  );
}

function DetalhesPartidaModal({ partida, atletaLogadoId, onFechar }) {
  const atletas = obterAtletasPartida(partida, atletaLogadoId);
  const resultado = obterResultadoAtleta(partida, atletaLogadoId);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onFechar}>
      <article className="modal-conteudo meus-jogos-modal" role="dialog" aria-modal="true" aria-label="Detalhes da partida" onClick={(evento) => evento.stopPropagation()}>
        <div className="modal-cabecalho">
          <div>
            <span>Detalhes da partida</span>
            <h3>{obterContextoPartida(partida)}</h3>
          </div>
          <button type="button" className="botao-secundario botao-compacto" onClick={onFechar}>
            Fechar
          </button>
        </div>

        <div className="meus-jogos-modal-grid">
          <ResumoMetrica rotulo="Resultado" valor={resultado.texto} />
          <ResumoMetrica rotulo="Status" valor={obterNomeStatusAprovacao(partida.statusAprovacao)} />
          <ResumoMetrica rotulo="Jogo" valor={obterNomeStatusPartida(partida.status)} />
          <ResumoMetrica rotulo="Pendências" valor={partida.quantidadeAtletasPendentes || 0} />
        </div>

        <div className="meus-jogos-placar-premium">
          <LinhaPlacar
            label="Dupla 1"
            atletas={formatarAtletasPlacar(atletas.duplaA)}
            placar={obterPlacar(partida, 'A')}
            destaque={atletaEstaNaDuplaA(partida, atletaLogadoId)}
            vencedora={partida.duplaVencedoraId === partida.duplaAId}
          />
          <LinhaPlacar
            label="Dupla 2"
            atletas={formatarAtletasPlacar(atletas.duplaB)}
            placar={obterPlacar(partida, 'B')}
            destaque={atletaEstaNaDuplaB(partida, atletaLogadoId)}
            vencedora={partida.duplaVencedoraId === partida.duplaBId}
          />
        </div>

        {partida.observacoes && (
          <p className="meus-jogos-observacoes">{partida.observacoes}</p>
        )}
      </article>
    </div>
  );
}
