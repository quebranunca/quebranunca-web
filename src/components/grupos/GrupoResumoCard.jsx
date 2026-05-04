import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { gruposServico } from '../../services/gruposServico';

function formatarPontuacao(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '0 pts';
  }

  const texto = Number.isInteger(numero) ? String(numero) : numero.toFixed(1).replace('.', ',');
  return `${texto} pts`;
}

function formatarDataRelativa(data) {
  if (!data) {
    return '';
  }

  const dataJogo = new Date(data);
  if (Number.isNaN(dataJogo.getTime())) {
    return '';
  }

  const agora = new Date();
  const diferencaMs = dataJogo.getTime() - agora.getTime();
  const unidades = [
    { nome: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
    { nome: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
    { nome: 'day', ms: 1000 * 60 * 60 * 24 },
    { nome: 'hour', ms: 1000 * 60 * 60 },
    { nome: 'minute', ms: 1000 * 60 }
  ];

  const unidade = unidades.find((item) => Math.abs(diferencaMs) >= item.ms) || unidades[unidades.length - 1];
  const valor = Math.round(diferencaMs / unidade.ms);

  return new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(valor, unidade.nome);
}

function juntarNomes(nomes) {
  return (nomes || []).filter(Boolean).join(' / ');
}

function GrupoResumoEstado({ tipo, mensagem }) {
  return (
    <section className="home-secao">
      <article className={`cartao-lista grupo-resumo-card grupo-resumo-card-${tipo}`}>
        <div className="grupo-resumo-topo">
          <div>
            <span className="home-eyebrow grupo-resumo-eyebrow">Grupo</span>
            <h3>Seus grupos</h3>
          </div>
          <Link to="/grupos" className="botao-primario home-botao">
            Ver todos os grupos
          </Link>
        </div>

        <p className="grupo-resumo-mensagem">{mensagem}</p>
      </article>
    </section>
  );
}

export function GrupoResumoCard() {
  const { token, usuario } = useAutenticacao();
  const location = useLocation();
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarResumo() {
      if (!token) {
        setResumo(null);
        setErro(false);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro(false);

      try {
        const dados = await gruposServico.obterResumoUsuario();
        if (ativo) {
          setResumo(dados || null);
        }
      } catch {
        if (ativo) {
          setResumo(null);
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
  }, [location.key, token, usuario?.id, usuario?.atletaId]);

  if (carregando) {
    return <GrupoResumoEstado tipo="carregando" mensagem="Carregando seus grupos..." />;
  }

  if (erro) {
    return <GrupoResumoEstado tipo="erro" mensagem="Não foi possível carregar seus grupos agora." />;
  }

  if (!resumo) {
    return <GrupoResumoEstado tipo="vazio" mensagem="Você ainda não participa de nenhum grupo." />;
  }

  const ultimoJogo = resumo.ultimoJogo;
  const rankingTop3 = resumo.rankingTop3 || [];

  return (
    <section className="home-secao">
      <article className="cartao-lista grupo-resumo-card">
        <div className="grupo-resumo-topo">
          <div>
            <span className="home-eyebrow grupo-resumo-eyebrow">Grupo</span>
            <h3>{resumo.nome}</h3>
          </div>
          <Link to="/grupos" className="botao-primario home-botao">
            Ver todos os grupos
          </Link>
        </div>

        <div className="grupo-resumo-conteudo">
          <section className="grupo-resumo-bloco" aria-label="Último jogo do grupo">
            <span className="grupo-resumo-rotulo">Último jogo</span>
            {ultimoJogo ? (
              <>
                <strong>
                  {juntarNomes(ultimoJogo.dupla1)} vs {juntarNomes(ultimoJogo.dupla2)}
                </strong>
                <div className="grupo-resumo-jogo-meta">
                  <span>{ultimoJogo.placar}</span>
                  <small>{formatarDataRelativa(ultimoJogo.data)}</small>
                </div>
              </>
            ) : (
              <p>Nenhum jogo registrado ainda</p>
            )}
          </section>

          <section className="grupo-resumo-bloco" aria-label="Top 3 do ranking do grupo">
            <span className="grupo-resumo-rotulo">Top 3</span>
            {rankingTop3.length > 0 ? (
              <ol className="grupo-resumo-ranking">
                {rankingTop3.map((atleta) => (
                  <li key={`${atleta.posicao}-${atleta.nomeAtleta}`}>
                    <span>{atleta.posicao}º</span>
                    <strong>{atleta.nomeAtleta}</strong>
                    <small>{formatarPontuacao(atleta.pontuacao)}</small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Ranking ainda não disponível</p>
            )}
          </section>
        </div>
      </article>
    </section>
  );
}
