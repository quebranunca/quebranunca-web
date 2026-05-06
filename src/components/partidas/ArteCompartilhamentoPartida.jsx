import { forwardRef } from 'react';
import { LogoQNF } from '../branding/LogoQNF';
import { formatarData } from '../../utils/formatacao';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';

function obterIniciais(nome) {
  return (nome || 'QN')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

function formatarPontos(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '0 pts';
  }

  const texto = Number.isInteger(numero)
    ? String(numero)
    : numero.toFixed(1).replace('.', ',');

  return `${texto} pts`;
}

function FotoAtleta({ atleta }) {
  const nome = obterNomeExibicaoAtleta(atleta) || 'Atleta';

  return (
    <div className="arte-partida-foto">
      {atleta?.fotoUrl ? (
        <img src={atleta.fotoUrl} alt={nome} crossOrigin="anonymous" />
      ) : (
        <span>{obterIniciais(nome)}</span>
      )}
    </div>
  );
}

function DuplaArte({ titulo, atletas }) {
  return (
    <div className="arte-partida-dupla">
      <span>{titulo}</span>
      <div className="arte-partida-fotos">
        {(atletas || []).map((atleta) => (
          <div key={atleta.atletaId} className="arte-partida-atleta">
            <FotoAtleta atleta={atleta} />
            <strong>{obterNomeExibicaoAtleta(atleta) || 'Atleta'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinhaRanking({ rotulo, atleta, destaque }) {
  if (!atleta) {
    return null;
  }

  return (
    <div className={`arte-ranking-linha ${destaque ? 'arte-ranking-linha-destaque' : ''}`}>
      <span>{rotulo}</span>
      <strong>#{atleta.posicao} {obterNomeExibicaoAtleta(atleta)}</strong>
      <small>{formatarPontos(atleta.pontos)}</small>
    </div>
  );
}

export const ArteCompartilhamentoPartida = forwardRef(function ArteCompartilhamentoPartida(
  { dados },
  ref
) {
  const ranking = dados?.rankingGrupo;
  const resultadoVitoria = dados?.resultadoAtletaLogado === 'Vitoria';
  const grupoNome = dados?.grupoNome || 'Partida registrada';

  return (
    <article ref={ref} className="arte-compartilhamento-partida">
      <div className="arte-partida-brilho" />

      <header className="arte-partida-topo">
        <LogoQNF variante="light" className="arte-partida-logo" />
        <div>
          <span>PARTIDA REGISTRADA</span>
          <strong>QuebraNunca Futevôlei</strong>
        </div>
      </header>

      <section className="arte-partida-grupo">
        <span>{grupoNome}</span>
        <strong>{dados?.dataPartida ? formatarData(dados.dataPartida) : 'Data a definir'}</strong>
      </section>

      <section className="arte-partida-confronto">
        <DuplaArte titulo="Dupla 1" atletas={dados?.dupla1 || []} />

        <div className="arte-partida-placar">
          <strong>{dados?.placarDupla1 ?? 0}</strong>
          <span>x</span>
          <strong>{dados?.placarDupla2 ?? 0}</strong>
        </div>

        <DuplaArte titulo="Dupla 2" atletas={dados?.dupla2 || []} />
      </section>

      <section className={`arte-partida-resultado ${resultadoVitoria ? 'vitoria' : 'derrota'}`}>
        <span>Seu resultado</span>
        <strong>{resultadoVitoria ? 'Vitória' : 'Derrota'}</strong>
      </section>

      {ranking && (
        <section className="arte-ranking">
          <h2>RANKING DO GRUPO</h2>
          <LinhaRanking rotulo="Acima de você" atleta={ranking.atletaAcima} />
          <LinhaRanking
            rotulo="Você"
            destaque
            atleta={{
              posicao: ranking.posicao,
              apelido: ranking.apelido,
              pontos: ranking.pontos
            }}
          />
          <LinhaRanking rotulo="Logo atrás" atleta={ranking.atletaAbaixo} />
        </section>
      )}

      <footer className="arte-partida-rodape">
        <strong>Mais um jogo na conta.</strong>
        <span>@quebranuncaftv · quebranunca.com.br</span>
      </footer>
    </article>
  );
});
