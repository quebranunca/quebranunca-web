import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { partidasServico } from '../../services/partidasServico';
import { usuariosServico } from '../../services/usuariosServico';
import { formatarDataHora } from '../../utils/formatacao';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';
import {
  atletaEstaNaDuplaA,
  obterClasseStatusAprovacao,
  obterDuplasDoAtleta,
  obterResultadoAtleta,
  obterTextoStatusAprovacaoHome,
  ordenarPartidasRecentes,
  partidaTemPlacarValido
} from '../../utils/partidas';
import { PlacarDupla } from '../../components/partidas/PlacarDupla';
import { CompartilharPartidaBotao } from '../../components/partidas/CompartilharPartidaBotao';

const RESUMO_ZERADO = {
  totalPartidas: 0,
  totalVitorias: 0,
  totalDerrotas: 0,
  percentualAproveitamento: 0,
  totalPartidasPendentes: 0
};

function obterNumero(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarPercentual(valor) {
  const numero = obterNumero(valor);
  return `${Number.isInteger(numero) ? numero : numero.toFixed(1)}%`;
}

function formatarAtletas(atletas) {
  const nomes = (atletas || [])
    .map((atleta) => obterNomeExibicaoAtleta(atleta))
    .filter(Boolean);

  return nomes.length > 0 ? nomes.join(' e ') : 'A definir';
}

function obterClasseResultadoHome(resultado) {
  if (resultado.texto === 'Vitória') {
    return 'home-ultimo-jogo-resultado-vitoria';
  }

  if (resultado.texto === 'Derrota') {
    return 'home-ultimo-jogo-resultado-derrota';
  }

  return 'home-ultimo-jogo-resultado-pendente';
}

function obterPlacarDoAtleta(partida, atletaId) {
  const estaNaDuplaA = atletaEstaNaDuplaA(partida, atletaId);
  return {
    minhaDupla: estaNaDuplaA ? partida.placarDuplaA : partida.placarDuplaB,
    adversaria: estaNaDuplaA ? partida.placarDuplaB : partida.placarDuplaA
  };
}

function obterGrupoPartida(partida) {
  return partida?.nomeGrupo || partida?.nomeCategoria || 'Partidas Avulsas';
}

function formatarPontuacao(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return '0 pts';
  }

  const texto = Number.isInteger(numero)
    ? String(numero)
    : numero.toFixed(1).replace('.', ',');

  return `${texto} pts`;
}

function obterRankingResumoUsuario(ranking = [], atletaUsuarioId) {
  if (!Array.isArray(ranking) || ranking.length === 0) {
    return [];
  }

  const rankingOrdenado = [...ranking].sort((a, b) => obterNumero(a?.posicao) - obterNumero(b?.posicao));

  if (!atletaUsuarioId) {
    return rankingOrdenado.slice(0, 3);
  }

  const indiceUsuario = rankingOrdenado.findIndex((item) => (
    item?.atletaId === atletaUsuarioId ||
    item?.idAtleta === atletaUsuarioId ||
    item?.usuarioId === atletaUsuarioId ||
    item?.idUsuario === atletaUsuarioId
  ));

  if (indiceUsuario <= 0) {
    return rankingOrdenado.slice(0, 3);
  }

  const inicio = Math.max(indiceUsuario - 1, 0);
  const fim = Math.min(indiceUsuario + 2, rankingOrdenado.length);

  return rankingOrdenado.slice(inicio, fim);
}

export function HomeResumoUsuario({
  nomeAtleta = '',
  atletaId = null,
  resumoUsuario,
  ultimoJogoUsuario,
  resumoGrupo,
  carregandoResumo,
  erroResumo,
  erroUltimoJogoUsuario
}) {
  const navegar = useNavigate();
  const possuiDadosExternos = resumoUsuario !== undefined ||
    ultimoJogoUsuario !== undefined ||
    carregandoResumo !== undefined ||
    erroResumo !== undefined ||
    erroUltimoJogoUsuario !== undefined;
  const [resumoLocal, setResumoLocal] = useState(RESUMO_ZERADO);
  const [ultimoJogoLocal, setUltimoJogoLocal] = useState(null);
  const [carregandoLocal, setCarregandoLocal] = useState(true);
  const [erroLocal, setErroLocal] = useState(false);
  const [erroUltimoJogoLocal, setErroUltimoJogoLocal] = useState(false);

  useEffect(() => {
    if (possuiDadosExternos) {
      return undefined;
    }

    let ativo = true;

    async function carregarResumo() {
      setCarregandoLocal(true);
      setErroLocal(false);
      setErroUltimoJogoLocal(false);

      try {
        const [resultadoResumo, resultadoPartidas] = await Promise.allSettled([
          usuariosServico.obterResumo(),
          atletaId ? partidasServico.listarMinhas() : Promise.resolve([])
        ]);

        if (!ativo) {
          return;
        }

        if (resultadoResumo.status === 'fulfilled') {
          const dados = resultadoResumo.value;
          setResumoLocal({
            totalPartidas: obterNumero(dados?.totalPartidas),
            totalVitorias: obterNumero(dados?.totalVitorias),
            totalDerrotas: obterNumero(dados?.totalDerrotas),
            percentualAproveitamento: obterNumero(dados?.percentualAproveitamento),
            totalPartidasPendentes: obterNumero(dados?.totalPartidasPendentes)
          });
        } else {
          console.error('Erro ao carregar resumo do usuário na Home.', resultadoResumo.reason);
          setResumoLocal(RESUMO_ZERADO);
          setErroLocal(true);
        }

        if (resultadoPartidas.status === 'fulfilled') {
          const partidasOrdenadas = ordenarPartidasRecentes(resultadoPartidas.value || []);
          setUltimoJogoLocal(partidasOrdenadas[0] || null);
        } else {
          console.error('Erro ao carregar último jogo do usuário na Home.', resultadoPartidas.reason);
          setUltimoJogoLocal(null);
          setErroUltimoJogoLocal(true);
        }
      } catch (erro) {
        if (ativo) {
          console.error('Erro ao carregar dados do usuário na Home.', erro);
          setResumoLocal(RESUMO_ZERADO);
          setUltimoJogoLocal(null);
          setErroLocal(true);
          setErroUltimoJogoLocal(true);
        }
      } finally {
        if (ativo) {
          setCarregandoLocal(false);
        }
      }
    }

    carregarResumo();

    return () => {
      ativo = false;
    };
  }, [atletaId, possuiDadosExternos]);

  const resumo = resumoUsuario
    ? {
      totalPartidas: obterNumero(resumoUsuario?.totalPartidas),
      totalVitorias: obterNumero(resumoUsuario?.totalVitorias),
      totalDerrotas: obterNumero(resumoUsuario?.totalDerrotas),
      percentualAproveitamento: obterNumero(resumoUsuario?.percentualAproveitamento),
      totalPartidasPendentes: obterNumero(resumoUsuario?.totalPartidasPendentes)
    }
    : (possuiDadosExternos ? RESUMO_ZERADO : resumoLocal);
  const ultimoJogo = possuiDadosExternos ? ultimoJogoUsuario : ultimoJogoLocal;
  const carregando = possuiDadosExternos ? Boolean(carregandoResumo) : carregandoLocal;
  const erro = possuiDadosExternos ? Boolean(erroResumo) : erroLocal;
  const erroUltimoJogo = possuiDadosExternos ? Boolean(erroUltimoJogoUsuario) : erroUltimoJogoLocal;

  const resultadoUltimoJogo = ultimoJogo
    ? obterResultadoAtleta(ultimoJogo, atletaId, {
      textoPendente: 'Aguardando resultado',
      textoInvalido: 'Aguardando resultado'
    })
    : null;
  const duplasUltimoJogo = ultimoJogo ? obterDuplasDoAtleta(ultimoJogo, atletaId) : null;
  const placarUltimoJogo = ultimoJogo ? obterPlacarDoAtleta(ultimoJogo, atletaId) : null;
  const rankingTop3 = resumoGrupo?.rankingTop3 || [];
  const rankingResumo = obterRankingResumoUsuario(rankingTop3, atletaId);
  const possuiRanking = rankingResumo.some((item) => item?.posicaoRanking || item?.posicao);
  const possuiPartidas = resumo.totalPartidas > 0;
  const exibirResumoRanking = possuiRanking || possuiPartidas;
  const grupoIdRanking = resumoGrupo?.grupoId || rankingTop3.find((item) => item?.grupoId)?.grupoId || null;
  const podeAbrirRankingGrupo = possuiRanking && Boolean(grupoIdRanking);

  function aoAbrirRankingGrupo() {
    if (!podeAbrirRankingGrupo) {
      return;
    }

    navegar(`/ranking?tipo=competicao&grupoId=${encodeURIComponent(grupoIdRanking)}`);
  }

  function aoTeclarRankingGrupo(evento) {
    if (evento.key === 'Enter') {
      aoAbrirRankingGrupo();
    }
  }

  return (
    <section className="home-secao">
      <article className="cartao-lista home-resumo-usuario">
        <div className="home-usuario-infos">           
          <div>
            <div className="home-usuario-infos">
             
                <div className="home-usuario-info-item">         
                  <Link
                to="/app/perfil"
                className="home-resumo-usuario-metricas"
                aria-label="Abrir meus perfil"
              >  
                  <span>Atleta</span>
                  <strong>{nomeAtleta || 'Não vinculado'}</strong>
                </Link>
                </div>    
                  
            </div>   
                                  
          </div>          
        </div>

        {carregando ? (
          <p>Carregando desempenho...</p>
        ) : (
          <>                 
            <Link
              to="/app/meus-jogos"
              className="home-resumo-usuario-metricas"
              aria-label="Abrir meus jogos"
            >
              <div>
                <span>Jogos</span>
                <strong>{resumo.totalPartidas}</strong>
              </div>
              <div>
                <span>Vitórias</span>
                <strong>{resumo.totalVitorias}</strong>
              </div>
              <div>
                <span>Derrotas</span>
                <strong>{resumo.totalDerrotas}</strong>
              </div>                  
            </Link>   
                                          
           {erroUltimoJogo ? (
              <p className="home-resumo-usuario-vazio">
                Não foi possível carregar seu último jogo agora.
              </p>
            ) : ultimoJogo ? (
              <div className="home-ultimo-jogo">
                <div className="home-ultimo-jogo-acoes">
                  <span className="grupo-resumo-rotulo">
                    {obterGrupoPartida(ultimoJogo)} - ({ultimoJogo.dataPartida ? formatarDataHora(ultimoJogo.dataPartida) : 'Data a definir'})
                  </span>
                  <CompartilharPartidaBotao partidaId={ultimoJogo.id} />
                </div>

                <PlacarDupla
                  label="Sua dupla"
                  atletas={formatarAtletas(duplasUltimoJogo.minhaDupla)}
                  placar={placarUltimoJogo.minhaDupla}
                  vencedor={resultadoUltimoJogo?.texto === 'Vitória'}
                />

                <PlacarDupla
                  label="Adversários"
                  atletas={formatarAtletas(duplasUltimoJogo.duplaAdversaria)}
                  placar={placarUltimoJogo.adversaria}
                  vencedor={resultadoUltimoJogo?.texto === 'Derrota'}
                />
              </div>
            ) : (
              <p className="home-resumo-usuario-vazio">
                Você ainda não possui partidas registradas.
              </p>
            )}                 
            
            {exibirResumoRanking && (
              <div className="grupo-resumo-conteudo">
                <section
                  className={`grupo-resumo-bloco${podeAbrirRankingGrupo ? ' grupo-resumo-bloco-clicavel' : ''}`}
                  aria-label="Resumo do ranking do grupo"
                  role={podeAbrirRankingGrupo ? 'button' : undefined}
                  tabIndex={podeAbrirRankingGrupo ? 0 : undefined}
                  onClick={podeAbrirRankingGrupo ? aoAbrirRankingGrupo : undefined}
                  onKeyDown={podeAbrirRankingGrupo ? aoTeclarRankingGrupo : undefined}
                >
                  <span className="grupo-resumo-rotulo">{obterGrupoPartida(ultimoJogo)} - Ranking</span>
                  {rankingResumo.length > 0 ? (
                    <ol className="grupo-resumo-ranking">
                      {rankingResumo.map((atleta) => (
                        <li key={`${atleta.posicao}-${atleta.nomeAtleta}`}>
                          <span>{atleta.posicao}º</span>
                          <strong>{obterNomeExibicaoAtleta(atleta)}</strong>
                          <small>{formatarPontuacao(atleta.pontuacao)}</small>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>Ranking ainda não disponível</p>
                  )}
                </section>
              </div>
            )}

            <Link to="/grupos" className="botao-primario home-botao">
              Ver todos os grupos
            </Link>    
                  
            <Link to="/partidas/registrar" className="botao-primario home-botao">
                Registrar partida
            </Link>                          
          </>          
        )}        
      </article>
    </section>
  );
}
