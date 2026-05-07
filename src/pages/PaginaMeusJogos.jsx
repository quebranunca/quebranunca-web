import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { partidasServico } from '../services/partidasServico';
import { CompartilharPartidaBotao } from '../components/partidas/CompartilharPartidaBotao';
import { PlacarDupla } from '../components/partidas/PlacarDupla';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import {
  obterAtletasPartida,
  obterClasseStatusAprovacao,
  obterClasseStatusPartida,
  obterNomeStatusAprovacao,
  obterNomeStatusPartida,
  obterResultadoAtleta,
  ordenarPartidasRecentes,
  STATUS_APROVACAO_PARTIDA,
  STATUS_PARTIDA
} from '../utils/partidas';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';

function formatarAtletasPlacar(atletas) {
  const nomes = (atletas || [])
    .map((atleta) => obterNomeExibicaoAtleta(atleta))
    .filter(Boolean);

  return nomes.length > 0 ? nomes : 'A definir';
}

function atletaVenceuPartida(partida, atletaLogadoId) {
  const estaNaDuplaA = partida.duplaAAtleta1Id === atletaLogadoId || partida.duplaAAtleta2Id === atletaLogadoId;
  const estaNaDuplaB = partida.duplaBAtleta1Id === atletaLogadoId || partida.duplaBAtleta2Id === atletaLogadoId;

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

export function PaginaMeusJogos() {
  const { usuario } = useAutenticacao();
  const atletaLogadoId = usuario?.atletaId;
  const [partidas, setPartidas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

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

  return (
    <section className="pagina">
      <div className="cabecalho-pagina meus-jogos-cabecalho">
        <div>
          <h2>Meus Jogos</h2>
          <p>Todos os jogos vinculados ao seu atleta, com duplas, lados, placar e validação.</p>
        </div>
        <Link to="/partidas/registrar" className="botao-primario">
          Registrar partida
        </Link>
      </div>

      {!atletaLogadoId && (
        <article className="cartao-lista">
          <p>Seu usuário ainda não possui atleta vinculado.</p>
          <Link to="/app/perfil" className="botao-primario">
            Completar perfil
          </Link>
        </article>
      )}

      {atletaLogadoId && (
        <div className="meus-jogos-resumo">
          <div className="meus-jogos-resumo-pontos">
            <span>Pontos</span>
            <strong>{formatarPontuacao(resumo.pontos)}</strong>
            <small>Pendente +{formatarPontuacao(resumo.pontosPendentes)}</small>
          </div>
          <div>
            <span>Jogos</span>
            <strong>{resumo.jogos}</strong>
          </div>
          <div>
            <span>Vitórias</span>
            <strong>{resumo.vitorias}</strong>
          </div>
          <div>
            <span>Derrotas</span>
            <strong>{resumo.derrotas}</strong>
          </div>
        </div>
      )}

      {erro && <p className="texto-erro">{erro}</p>}

      {carregando ? (
        <p>Carregando seus jogos...</p>
      ) : atletaLogadoId && partidas.length === 0 ? (
        <article className="cartao-lista">
          <p>Nenhum jogo encontrado para o seu atleta.</p>
        </article>
      ) : atletaLogadoId ? (
        <div className="lista-cartoes meus-jogos-lista scroll-discreto scroll-fade">
          {partidas.map((partida) => {
            const atletas = obterAtletasPartida(partida, atletaLogadoId);
            const resultado = obterResultadoAtleta(partida, atletaLogadoId);
            const duplaAVencedora = partida.duplaVencedoraId && partida.duplaVencedoraId === partida.duplaAId;
            const duplaBVencedora = partida.duplaVencedoraId && partida.duplaVencedoraId === partida.duplaBId;

            return (
              <article key={partida.id} className="cartao-lista meus-jogos-card">
                <div className="meus-jogos-card-topo">
                  <div>
                    <h3>{partida.nomeGrupo || 'Partida'}</h3>
                    <p>{partida.dataPartida ? formatarDataHora(partida.dataPartida) : 'Data a definir'}</p>
                    {partida.faseCampeonato && <p>{partida.faseCampeonato}</p>}
                  </div>
                  <div className="meus-jogos-status">
                    <span className={`tag-status ${resultado.classe}`}>{resultado.texto}</span>    
                    <span className={`tag-status ${obterClasseStatusAprovacao(partida.statusAprovacao)}`}>
                      {obterNomeStatusAprovacao(partida.statusAprovacao)}
                    </span>          
                  </div>
                </div>

                <div className="meus-jogos-confronto">
                  <PlacarDupla
                    label="Dupla 1"
                    atletas={formatarAtletasPlacar(atletas.duplaA)}
                    placar={Number(partida.status) === STATUS_PARTIDA.encerrada ? partida.placarDuplaA : '-'}
                    vencedor={duplaAVencedora}
                  />

                  <PlacarDupla
                    label="Dupla 2"
                    atletas={formatarAtletasPlacar(atletas.duplaB)}
                    placar={Number(partida.status) === STATUS_PARTIDA.encerrada ? partida.placarDuplaB : '-'}
                    vencedor={duplaBVencedora}
                  />
                </div>
                <CompartilharPartidaBotao partidaId={partida.id} />
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
