import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usuariosServico } from '../services/usuariosServico';

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

export function HomeResumoUsuario() {
  const [resumo, setResumo] = useState(RESUMO_ZERADO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarResumo() {
      setCarregando(true);
      setErro(false);

      try {
        const dados = await usuariosServico.obterResumo();
        if (!ativo) {
          return;
        }

        setResumo({
          totalPartidas: obterNumero(dados?.totalPartidas),
          totalVitorias: obterNumero(dados?.totalVitorias),
          totalDerrotas: obterNumero(dados?.totalDerrotas),
          percentualAproveitamento: obterNumero(dados?.percentualAproveitamento),
          totalPartidasPendentes: obterNumero(dados?.totalPartidasPendentes)
        });
      } catch {
        if (ativo) {
          setResumo(RESUMO_ZERADO);
          setErro(true);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarResumo();

    return () => {
      ativo = false;
    };
  }, []);

  const possuiPartidasAprovadas = resumo.totalPartidas > 0;
  const possuiPendencias = resumo.totalPartidasPendentes > 0;

  return (
    <section className="home-secao">
      <article className="cartao-lista home-resumo-usuario">
        <div className="linha-entre home-resumo-usuario-topo">
          <div>
            <h3>Seu desempenho</h3>
            {erro && <p>Não foi possível carregar seu desempenho agora.</p>}
          </div>
        </div>

        {carregando ? (
          <p>Carregando desempenho...</p>
        ) : (
          <>
            {possuiPartidasAprovadas ? (
              <>
                <div className="home-resumo-usuario-metricas" aria-label="Resumo do desempenho">
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
                </div>
                <p className="home-resumo-usuario-aproveitamento">
                  Aproveitamento: <strong>{formatarPercentual(resumo.percentualAproveitamento)}</strong>
                </p>
              </>
            ) : (
              <div className="home-resumo-usuario-vazio">
                <p>Você ainda não possui partidas aprovadas.</p>
                <p>Registre uma partida para começar a acompanhar seu desempenho.</p>
              </div>
            )}

            {possuiPendencias && (
              <div className="home-resumo-usuario-pendencias">
                <span>
                  {resumo.totalPartidasPendentes === 1
                    ? '1 partida aguardando aprovação'
                    : `${resumo.totalPartidasPendentes} partidas aguardando aprovação`}
                </span>
                <Link to="/app/pendencias" className="botao-secundario botao-compacto">
                  Ver pendências
                </Link>
              </div>
            )}
          </>
        )}
      </article>
    </section>
  );
}
