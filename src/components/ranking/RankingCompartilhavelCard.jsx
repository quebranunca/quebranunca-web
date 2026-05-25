import { forwardRef } from 'react';
import { CompartilhamentoCardBase } from '../compartilhamento/CompartilhamentoCardBase';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';

function formatarPontos(valor) {
  const numero = Number(valor || 0);
  const texto = Number.isInteger(numero)
    ? String(numero)
    : numero.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  return `${texto} pts`;
}

function obterGrupoPrincipal(ranking) {
  return (ranking || []).find((grupo) => (grupo.atletas || []).length > 0) || ranking?.[0] || null;
}

function obterAtletasTop(ranking) {
  const grupo = obterGrupoPrincipal(ranking);
  return (grupo?.atletas || []).slice(0, 6);
}

function LinhaRanking({ atleta }) {
  const top3 = Number(atleta.posicao) <= 3;

  return (
    <div className={`arte-ranking-linha ${top3 ? 'arte-ranking-linha-destaque' : ''}`}>
      <span>#{atleta.posicao}</span>
      <AvatarUsuario
        nome={obterNomeExibicaoAtleta(atleta)}
        fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
        tamanho="sm"
        className="arte-ranking-avatar"
        crossOrigin="anonymous"
      />
      <strong>{obterNomeExibicaoAtleta(atleta) || atleta.nomeAtleta || 'Atleta'}</strong>
      <small>{formatarPontos(atleta.pontos)}</small>
    </div>
  );
}

export const RankingCompartilhavelCard = forwardRef(function RankingCompartilhavelCard(
  { ranking, contexto },
  ref
) {
  const grupoPrincipal = obterGrupoPrincipal(ranking);
  const atletas = obterAtletasTop(ranking);
  const detalhe = contexto || grupoPrincipal?.nomeCompeticao || 'Ranking geral';
  const categoria = grupoPrincipal?.nomeCategoria;

  return (
    <CompartilhamentoCardBase
      refProp={ref}
      etiqueta="RANKING"
      destaque={detalhe}
      subtitulo={categoria}
      rodapeTitulo="Ranking atualizado."
      className="arte-compartilhamento-ranking-card"
    >
      <section className="arte-ranking arte-ranking-compartilhavel">
        <h2>TOP ATLETAS</h2>
        {atletas.length === 0 ? (
          <p className="arte-compartilhamento-vazio">Ranking sem atletas para exibir.</p>
        ) : (
          atletas.map((atleta) => (
            <LinhaRanking key={atleta.atletaId} atleta={atleta} />
          ))
        )}
      </section>
    </CompartilhamentoCardBase>
  );
});
