import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gruposServico } from '../../services/gruposServico';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';
import { formatarDataHora } from '../../utils/formatacao';
import { obterClasseStatusAprovacao, obterTextoStatusAprovacaoHome } from '../../utils/partidas';

function formatarPontuacao(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '0 pts';
  }

  const texto = Number.isInteger(numero) ? String(numero) : numero.toFixed(1).replace('.', ',');
  return `${texto} pts`;
}

function formatarDupla(atletas) {
  const nomes = (atletas || [])
    .map((atleta) => obterNomeExibicaoAtleta(atleta))
    .filter(Boolean);

  return nomes.length > 0 ? nomes.join(' / ') : 'A definir';
}

function obterRanking(resumo) {
  if (!Array.isArray(resumo?.rankingTop3)) {
    return [];
  }

  return resumo.rankingTop3;
}

function GrupoUsuarioCard({ resumo }) {
  const ultimaPartida = resumo?.ultimoJogo;
  const ranking = obterRanking(resumo);

  return (
    <article className="cartao-lista home-grupo-usuario-card">
      <div className="home-grupo-usuario-topo">
        <h3>{resumo?.nome || 'Grupo'}</h3>
      </div>

      <section className="home-grupo-usuario-bloco" aria-label={`Último jogo em ${resumo?.nome || 'grupo'}`}>
        <span className="grupo-resumo-rotulo">Último jogo</span>
        {ultimaPartida ? (
          <>
            <div className="home-grupo-usuario-jogo">
              <strong>{formatarDupla(ultimaPartida.dupla1)}</strong>
              <span>{ultimaPartida.placarDupla1} x {ultimaPartida.placarDupla2}</span>
              <strong>{formatarDupla(ultimaPartida.dupla2)}</strong>
            </div>
            <div className="home-grupo-usuario-meta">
              <small>{formatarDataHora(ultimaPartida.data)}</small>
              <small className={`tag-status ${obterClasseStatusAprovacao(ultimaPartida.statusAprovacao)}`}>
                {obterTextoStatusAprovacaoHome(ultimaPartida.statusAprovacao)}
              </small>
            </div>
          </>
        ) : (
          <p>Nenhuma partida registrada neste grupo ainda.</p>
        )}
      </section>

      <section className="home-grupo-usuario-bloco" aria-label={`Ranking em ${resumo?.nome || 'grupo'}`}>
        <span className="grupo-resumo-rotulo">Ranking</span>
        {ranking.length > 0 ? (
          <ol className="grupo-resumo-ranking home-grupo-usuario-ranking">
            {ranking.map((atleta) => (
              <li
                key={`${resumo.grupoId}-${atleta.posicao}-${atleta.atletaId}`}
                className={atleta.usuarioLogado ? 'home-grupo-usuario-ranking-atual' : undefined}
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
  const possuiDadosExternos = resumos !== undefined || carregando !== undefined || erro !== undefined;
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

  const lista = possuiDadosExternos ? (Array.isArray(resumos) ? resumos : []) : resumosLocal;
  const estaCarregando = possuiDadosExternos ? Boolean(carregando) : carregandoLocal;
  const possuiErro = possuiDadosExternos ? Boolean(erro) : erroLocal;

  return (
    <section className="home-secao home-grupos-usuario">      
      {estaCarregando ? (
        <article className="cartao-lista home-grupos-usuario-estado">
          <p>Carregando grupos...</p>
        </article>
      ) : (
        <div className="home-grupos-usuario-lista" aria-label="Resumo dos meus grupos">
          {lista.map((resumo) => (
            <GrupoUsuarioCard key={resumo.grupoId} resumo={resumo} />
          ))}
        </div>
      )}
    </section>
  );
}
