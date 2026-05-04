import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { partidasServico } from '../../services/partidasServico';
import { usuariosServico } from '../../services/usuariosServico';
import { formatarDataHora } from '../../utils/formatacao';
import {
  atletaEstaNaDuplaA,
  obterClasseStatusAprovacao,
  obterDuplasDoAtleta,
  obterResultadoAtleta,
  obterTextoStatusAprovacaoHome,
  ordenarPartidasRecentes,
  partidaTemPlacarValido
} from '../../utils/partidas';

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
    .map((atleta) => atleta.nome)
    .filter(Boolean);

  return nomes.length > 0 ? nomes.join(' / ') : 'A definir';
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
  return partida?.nomeGrupo || partida?.nomeCategoria || 'Sem grupo';
}

export function HomeResumoUsuario({
  nomeAtleta = '',
  atletaId = null,
  resumoUsuario,
  ultimoJogoUsuario,
  carregandoResumo,
  erroResumo,
  erroUltimoJogoUsuario
}) {
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

  return (
    <section className="home-secao">
      <article className="cartao-lista home-resumo-usuario">
        <div className="home-usuario-infos">
          <div>
            <div className="home-usuario-infos">
              <div className="home-usuario-info-item">
                <span>Nome</span>
                <strong>{nomeAtleta || 'Não vinculado'}</strong>
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
              <p className="home-resumo-usuario-aproveitamento">
                Aproveitamento: <strong>{formatarPercentual(resumo.percentualAproveitamento)}</strong>
              </p>                         
              {erro && <p className="texto-erro">Não foi possível atualizar todo o resumo agora.</p>}
              <div className="home-ultimo-jogo">
                <div className="home-ultimo-jogo-topo">
                  <span className="home-ultimo-jogo-eyebrow">Último jogo</span>

                  {ultimoJogo && (
                    <div className="home-ultimo-jogo-info">
                      <strong>
                        {ultimoJogo.dataPartida
                          ? formatarDataHora(ultimoJogo.dataPartida)
                          : 'Data a definir'}
                      </strong>

                      <span className="home-ultimo-jogo-grupo">
                        {obterGrupoPartida(ultimoJogo)}
                      </span>
                    </div>
                  )}
                </div>

                {erroUltimoJogo ? (
                  <p className="home-resumo-usuario-vazio">Não foi possível carregar seu último jogo agora.</p>
                ) : ultimoJogo ? (
                  <>
                    <div className="home-ultimo-jogo-confronto">
                      <div>
                        <span>Sua dupla</span>
                        <strong>{formatarAtletas(duplasUltimoJogo.minhaDupla)}</strong>
                      </div>
                      <div className="home-ultimo-jogo-placar">
                        <strong>{partidaTemPlacarValido(ultimoJogo) ? placarUltimoJogo.minhaDupla : '-'}</strong>
                        <span>x</span>
                        <strong>{partidaTemPlacarValido(ultimoJogo) ? placarUltimoJogo.adversaria : '-'}</strong>
                      </div>
                      <div>
                        <span>Adversários</span>
                        <strong>{formatarAtletas(duplasUltimoJogo.duplaAdversaria)}</strong>
                      </div>
                    </div>
                    <div className="home-ultimo-jogo-status">
                      {resultadoUltimoJogo && (
                        <span className={`tag-status ${resultadoUltimoJogo.classe} ${obterClasseResultadoHome(resultadoUltimoJogo)}`}>
                          {resultadoUltimoJogo.texto}
                        </span>
                      )}
                      <span className={`tag-status ${obterClasseStatusAprovacao(ultimoJogo.statusAprovacao)}`}>
                        {obterTextoStatusAprovacaoHome(ultimoJogo.statusAprovacao)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="home-resumo-usuario-vazio">Você ainda não possui partidas registradas.</p>
                )}
              </div>
              <Link to="/partidas/registrar" className="botao-primario home-botao">
                  Registrar partida
              </Link>                                      
          </>
        )}
      </article>
    </section>
  );
}
