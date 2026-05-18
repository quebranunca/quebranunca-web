import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaFilter, FaGamepad, FaMedal, FaPlus, FaSortAmountDown, FaTrophy } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { partidasServico } from '../services/partidasServico';
import { CompartilharPartidaBotao } from '../components/partidas/CompartilharPartidaBotao';
import { DuplaLink } from '../components/duplas/DuplaLink';
import { EditarPartidaRegistradaModal } from '../components/partidas/EditarPartidaRegistradaModal';
import { PartidaCardPremium } from '../components/partidas/PartidaCardPremium';
import { useNotification } from '../contexts/NotificationContext';
import { extrairMensagemErro } from '../utils/erros';
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
import { podeEditarPartida } from '../utils/permissoesPartida';

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
  const { showNotification } = useNotification();
  const atletaLogadoId = usuario?.atletaId;
  const [partidas, setPartidas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [ordem, setOrdem] = useState('recentes');
  const [partidaDetalhe, setPartidaDetalhe] = useState(null);
  const [partidaEmEdicao, setPartidaEmEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function carregarPartidas({ manterCarregando = true } = {}) {
    if (manterCarregando) {
      setCarregando(true);
    }
    setErro('');

    try {
      const lista = await partidasServico.listarMinhas();
      setPartidas(ordenarPartidasRecentes(lista || []));
    } catch (error) {
      setErro(extrairMensagemErro(error));
      setPartidas([]);
    } finally {
      if (manterCarregando) {
        setCarregando(false);
      }
    }
  }

  useEffect(() => {
    carregarPartidas();
  }, []);

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
      const lista = await partidasServico.listarMinhas();
      setPartidas(ordenarPartidasRecentes(lista || []));
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
              onEditar={podeEditarPartida(partida, usuario) ? () => abrirEdicao(partida) : null}
            />
          ))}
        </div>
      ) : null}

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

function PartidaCard({ partida, atletaLogadoId, onDetalhes, onEditar }) {
  const atletas = obterAtletasPartida(partida, atletaLogadoId);
  const resultado = obterResultadoAtleta(partida, atletaLogadoId);
  const minhaDuplaEhA = atletaEstaNaDuplaA(partida, atletaLogadoId);
  const minhaDuplaEhB = atletaEstaNaDuplaB(partida, atletaLogadoId);
  const duplaAVencedora = partida.duplaVencedoraId && partida.duplaVencedoraId === partida.duplaAId;
  const duplaBVencedora = partida.duplaVencedoraId && partida.duplaVencedoraId === partida.duplaBId;

  return (
    <PartidaCardPremium
      contexto={obterContextoPartida(partida)}
      status={partida.faseCampeonato || obterNomeStatusPartida(partida.status)}
      dataPartida={partida.dataPartida}
      resultado={resultado.texto}
      statusAprovacao={partida.statusAprovacao}
      duplaA={{
        label: minhaDuplaEhA ? 'Sua dupla' : 'Dupla 1',
        atletas: formatarAtletasPlacar(atletas.duplaA),
        atleta1Id: partida.duplaAAtleta1Id,
        atleta2Id: partida.duplaAAtleta2Id,
        placar: obterPlacar(partida, 'A'),
        destaque: minhaDuplaEhA,
        vencedora: duplaAVencedora
      }}
      duplaB={{
        label: minhaDuplaEhB ? 'Sua dupla' : 'Adversários',
        atletas: formatarAtletasPlacar(atletas.duplaB),
        atleta1Id: partida.duplaBAtleta1Id,
        atleta2Id: partida.duplaBAtleta2Id,
        placar: obterPlacar(partida, 'B'),
        destaque: minhaDuplaEhB,
        vencedora: duplaBVencedora
      }}
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
          {Number(partida.status) === STATUS_PARTIDA.encerrada && <CompartilharPartidaBotao partidaId={partida.id} />}
        </>
      }
      onDetalhes={onDetalhes}
    />
  );
}

function LinhaPlacar({ label, atletas, placar, destaque, vencedora, atleta1Id, atleta2Id }) {
  return (
    <div className={`meus-jogos-linha-placar ${destaque ? 'minha-dupla' : ''} ${vencedora ? 'vencedora' : ''}`}>
      <div>
        <span>{label}</span>
        <strong>
          <DuplaLink atleta1Id={atleta1Id} atleta2Id={atleta2Id}>
            {atletas}
          </DuplaLink>
        </strong>
      </div>
      <strong className="meus-jogos-placar-numero">{placar}</strong>
    </div>
  );
}

function DetalhesPartidaModal({ partida, atletaLogadoId, onFechar, onEditar }) {
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
            atleta1Id={partida.duplaAAtleta1Id}
            atleta2Id={partida.duplaAAtleta2Id}
          />
          <LinhaPlacar
            label="Dupla 2"
            atletas={formatarAtletasPlacar(atletas.duplaB)}
            placar={obterPlacar(partida, 'B')}
            destaque={atletaEstaNaDuplaB(partida, atletaLogadoId)}
            vencedora={partida.duplaVencedoraId === partida.duplaBId}
            atleta1Id={partida.duplaBAtleta1Id}
            atleta2Id={partida.duplaBAtleta2Id}
          />
        </div>

        {partida.observacoes && (
          <p className="meus-jogos-observacoes">{partida.observacoes}</p>
        )}
      </article>
    </div>
  );
}
