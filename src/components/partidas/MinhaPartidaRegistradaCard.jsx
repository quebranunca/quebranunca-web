import { formatarDataHora } from '../../utils/formatacao';
import { formatarNomeDupla } from '../../utils/atletaUtils';
import {
  obterClasseStatusAprovacao,
  obterClasseStatusPartida,
  obterNomeStatusAprovacao,
  obterNomeStatusPartida
} from '../../utils/partidas';
import { PlacarDupla } from './PlacarDupla';

function formatarAtleta(nome, lado) {
  return nome || `${lado} a definir`;
}

export function MinhaPartidaRegistradaCard({ partida, onEditar, onExcluir, excluindo }) {
  const dataExibicao = partida.dataPartida || partida.dataCriacao;

  return (
    <article className="cartao-lista minhas-partidas-registradas-card">
      <div className="minhas-partidas-registradas-card-topo">
        <div>
          <h3>{partida.nomeGrupo || partida.nomeCategoria || 'Partida registrada'}</h3>
          <p>{dataExibicao ? formatarDataHora(dataExibicao) : 'Data não informada'}</p>
          {partida.nomeCriadoPorUsuario && <p>Registrada por {partida.nomeCriadoPorUsuario}</p>}
        </div>

        <div className="minhas-partidas-registradas-status">
          <span className={`tag-status ${obterClasseStatusPartida(partida.status)}`}>
            {obterNomeStatusPartida(partida.status)}
          </span>
          <span className={`tag-status ${obterClasseStatusAprovacao(partida.statusAprovacao)}`}>
            {obterNomeStatusAprovacao(partida.statusAprovacao)}
          </span>
        </div>
      </div>

      <div className="minhas-partidas-registradas-confronto">
        <PlacarDupla
          label="Dupla 1"
          atletas={formatarNomeDupla([
            formatarAtleta(partida.nomeDuplaAAtleta1, 'Direita'),
            formatarAtleta(partida.nomeDuplaAAtleta2, 'Esquerda')
          ])}
          placar={partida.placarDuplaA}
          vencedor={partida.duplaVencedoraId === partida.duplaAId}
          atleta1Id={partida.duplaAAtleta1Id}
          atleta2Id={partida.duplaAAtleta2Id}
        />

        <PlacarDupla
          label="Dupla 2"
          atletas={formatarNomeDupla([
            formatarAtleta(partida.nomeDuplaBAtleta1, 'Direita'),
            formatarAtleta(partida.nomeDuplaBAtleta2, 'Esquerda')
          ])}
          placar={partida.placarDuplaB}
          vencedor={partida.duplaVencedoraId === partida.duplaBId}
          atleta1Id={partida.duplaBAtleta1Id}
          atleta2Id={partida.duplaBAtleta2Id}
        />
      </div>

      <div className="acoes-formulario">
        <button type="button" className="botao-secundario" onClick={() => onEditar(partida)}>
          Editar
        </button>
        <button
          type="button"
          className="botao-perigo"
          onClick={() => onExcluir(partida)}
          disabled={excluindo}
        >
          {excluindo ? 'Excluindo...' : 'Deletar partida'}
        </button>
      </div>
    </article>
  );
}
