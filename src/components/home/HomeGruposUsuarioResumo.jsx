import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gruposServico } from '../../services/gruposServico';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';
import { formatarDataHora } from '../../utils/formatacao';
import { CompartilharPartidaBotao } from '../../components/partidas/CompartilharPartidaBotao';
import { PlacarDupla } from '../../components/partidas/PlacarDupla';

function formatarAtletas(atletas) {
  const nomes = (atletas || [])
    .map((atleta) => obterNomeExibicaoAtleta(atleta))
    .filter(Boolean);

  return nomes.length > 0 ? nomes.join(' e ') : 'A definir';
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

function obterGrupoPartida(partida) {
  return partida?.nomeGrupo || partida?.nomeCategoria || 'Partidas Avulsas';
}

function obterRanking(resumo) {
  return Array.isArray(resumo?.rankingTop3) ? resumo.rankingTop3 : [];
}

function obterDuplasUltimoJogo(ultimoJogo) {
  return {
    minhaDupla: ultimoJogo?.minhaDupla || [],
    duplaAdversaria: ultimoJogo?.duplaAdversaria || []
  };
}

function obterPlacarUltimoJogo(ultimoJogo) {
  return {
    minhaDupla: ultimoJogo?.placarMinhaDupla ?? 0,
    adversaria: ultimoJogo?.placarAdversaria ?? 0
  };
}

function GrupoUsuarioCard({ resumo }) {
  const ranking = obterRanking(resumo);
  const ultimoJogo = resumo?.ultimoJogo;
  const nomeGrupo = resumo?.nome || 'grupo';

  const duplasUltimoJogo = obterDuplasUltimoJogo(ultimoJogo);
  const placarUltimoJogo = obterPlacarUltimoJogo(ultimoJogo);
  const resultadoUltimoJogo = ultimoJogo?.resultado || ultimoJogo;

  return (
    <article className="cartao-lista home-grupo-usuario-card">
      {ultimoJogo && (
        <div className="home-ultimo-jogo">
          <div className="home-ultimo-jogo-acoes">
            <div className="grupo-resumo-informacoes">
              <span className="grupo-resumo-rotulo grupo-resumo-grupo-nome">
                {obterGrupoPartida(ultimoJogo)}
              </span>

              <span className="grupo-resumo-rotulo">
                ({ultimoJogo.dataPartida
                  ? formatarDataHora(ultimoJogo.dataPartida)
                  : 'Data a definir'})
              </span>
            </div>

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
      )}

      <Link to="/grupos" className="botao-primario home-botao">
        Ver todos os grupos
      </Link>

      <section
        className="home-grupo-usuario-bloco"
        aria-label={`Ranking em ${nomeGrupo}`}
      >
        <span className="grupo-resumo-rotulo">Ranking</span>

        {ranking.length > 0 ? (
          <ol className="grupo-resumo-ranking home-grupo-usuario-ranking">
            {ranking.map((atleta) => (
              <li
                key={`${resumo.grupoId}-${atleta.posicao}-${atleta.atletaId}`}
                className={
                  atleta.usuarioLogado
                    ? 'home-grupo-usuario-ranking-atual'
                    : undefined
                }
              >
                <span>{atleta.posicao}º</span>
                <strong>{obterNomeExibicaoAtleta(atleta)}</strong>
                <small>{formatarPontuacao(atleta.pontuacao)}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p>Ranking ainda não disponível.</p>
        )}
      </section>
    </article>
  );
}

export function HomeGruposUsuarioResumo({
  resumos,
  carregando,
  erro
}) {
  const possuiDadosExternos =
    resumos !== undefined ||
    carregando !== undefined ||
    erro !== undefined;

  const location = useLocation();

  const [resumosLocal, setResumosLocal] = useState([]);
  const [carregandoLocal, setCarregandoLocal] = useState(true);
  const [erroLocal, setErroLocal] = useState(false);

  useEffect(() => {
    if (possuiDadosExternos) {
      return undefined;
    }

    let ativo = true;

    async function carregarResumos() {
      setCarregandoLocal(true);
      setErroLocal(false);

      try {
        const dados = await gruposServico.listarResumosUsuario();

        if (ativo) {
          setResumosLocal(Array.isArray(dados) ? dados : []);
        }
      } catch (falha) {
        if (ativo) {
          console.error('Erro ao carregar grupos do usuário na Home.', falha);
          setResumosLocal([]);
          setErroLocal(true);
        }
      } finally {
        if (ativo) {
          setCarregandoLocal(false);
        }
      }
    }

    carregarResumos();

    return () => {
      ativo = false;
    };
  }, [location.key, possuiDadosExternos]);

  const lista = possuiDadosExternos
    ? Array.isArray(resumos)
      ? resumos
      : []
    : resumosLocal;

  const estaCarregando = possuiDadosExternos
    ? Boolean(carregando)
    : carregandoLocal;

  const possuiErro = possuiDadosExternos
    ? Boolean(erro)
    : erroLocal;

  if (estaCarregando) {
    return (
      <section className="home-secao">
        <p>Carregando grupos...</p>
      </section>
    );
  }

  if (possuiErro) {
    return (
      <section className="home-secao">
        <p>Não foi possível carregar seus grupos agora.</p>
      </section>
    );
  }

  if (lista.length === 0) {
    return (
      <section className="home-secao">
        <article className="cartao-lista home-grupo-usuario-card">
          <p>Você ainda não possui grupos com partidas registradas.</p>

          <Link to="/grupos" className="botao-primario home-botao">
            Ver todos os grupos
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="home-secao">
      {lista.map((resumo) => (
        <GrupoUsuarioCard
          key={resumo.grupoId}
          resumo={resumo}
        />
      ))}
    </section>
  );
}