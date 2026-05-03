import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { partidasServico } from '../services/partidasServico';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';

function obterNomeStatusPartida(status) {
  switch (Number(status)) {
    case 1:
      return 'Agendada';
    case 2:
      return 'Encerrada';
    default:
      return 'Indefinida';
  }
}

function obterClasseStatusPartida(status) {
  return Number(status) === 2 ? 'tag-status-sucesso' : 'tag-status-alerta';
}

function obterNomeStatusAprovacao(status) {
  switch (Number(status)) {
    case 1:
      return 'Pendente';
    case 2:
      return 'Aprovada';
    case 3:
      return 'Contestada';
    case 4:
      return 'Pendente de vínculos';
    default:
      return 'Indefinida';
  }
}

function obterClasseStatusAprovacao(status) {
  switch (Number(status)) {
    case 2:
      return 'tag-status-sucesso';
    case 3:
      return 'tag-status-erro';
    default:
      return 'tag-status-alerta';
  }
}

function obterAtletasPartida(partida, atletaLogadoId) {
  return {
    duplaA: [
      {
        id: partida.duplaAAtleta1Id,
        nome: partida.nomeDuplaAAtleta1,
        lado: 'Direita',
        destaque: partida.duplaAAtleta1Id === atletaLogadoId
      },
      {
        id: partida.duplaAAtleta2Id,
        nome: partida.nomeDuplaAAtleta2,
        lado: 'Esquerda',
        destaque: partida.duplaAAtleta2Id === atletaLogadoId
      }
    ],
    duplaB: [
      {
        id: partida.duplaBAtleta1Id,
        nome: partida.nomeDuplaBAtleta1,
        lado: 'Direita',
        destaque: partida.duplaBAtleta1Id === atletaLogadoId
      },
      {
        id: partida.duplaBAtleta2Id,
        nome: partida.nomeDuplaBAtleta2,
        lado: 'Esquerda',
        destaque: partida.duplaBAtleta2Id === atletaLogadoId
      }
    ]
  };
}

function obterResultadoAtleta(partida, atletaLogadoId) {
  const estaNaDuplaA = partida.duplaAAtleta1Id === atletaLogadoId || partida.duplaAAtleta2Id === atletaLogadoId;
  const estaNaDuplaB = partida.duplaBAtleta1Id === atletaLogadoId || partida.duplaBAtleta2Id === atletaLogadoId;

  if (Number(partida.status) !== 2) {
    return { texto: 'Jogo agendado', classe: 'tag-status-alerta' };
  }

  if (!partida.duplaVencedoraId) {
    return { texto: 'Sem vencedora', classe: 'tag-status-alerta' };
  }

  const venceu = (estaNaDuplaA && partida.duplaVencedoraId === partida.duplaAId)
    || (estaNaDuplaB && partida.duplaVencedoraId === partida.duplaBId);

  return venceu
    ? { texto: 'Vitória', classe: 'tag-status-sucesso' }
    : { texto: 'Derrota', classe: 'tag-status-erro' };
}

function ordenarPartidas(partidas) {
  return [...partidas].sort((a, b) => {
    const dataA = new Date(a.dataPartida || a.dataCriacao || 0).getTime();
    const dataB = new Date(b.dataPartida || b.dataCriacao || 0).getTime();
    return dataB - dataA;
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
          setPartidas(ordenarPartidas(lista || []));
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
        pendentes: acumulado.pendentes + (Number(partida.status) !== 2 ? 1 : 0)
      };
    }, { jogos: 0, vitorias: 0, derrotas: 0, pendentes: 0 });
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
          <div>
            <span>Agendados</span>
            <strong>{resumo.pendentes}</strong>
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
        <div className="lista-cartoes meus-jogos-lista">
          {partidas.map((partida) => {
            const atletas = obterAtletasPartida(partida, atletaLogadoId);
            const resultado = obterResultadoAtleta(partida, atletaLogadoId);
            const duplaAVencedora = partida.duplaVencedoraId && partida.duplaVencedoraId === partida.duplaAId;
            const duplaBVencedora = partida.duplaVencedoraId && partida.duplaVencedoraId === partida.duplaBId;

            return (
              <article key={partida.id} className="cartao-lista meus-jogos-card">
                <div className="meus-jogos-card-topo">
                  <div>
                    <h3>{partida.nomeCategoria || 'Sem categoria'}</h3>
                    <p>{partida.dataPartida ? formatarDataHora(partida.dataPartida) : 'Data a definir'}</p>
                    {partida.faseCampeonato && <p>{partida.faseCampeonato}</p>}
                  </div>
                  <div className="meus-jogos-status">
                    <span className={`tag-status ${resultado.classe}`}>{resultado.texto}</span>
                    <span className={`tag-status ${obterClasseStatusPartida(partida.status)}`}>
                      {obterNomeStatusPartida(partida.status)}
                    </span>
                  </div>
                </div>

                <div className="meus-jogos-confronto">
                  <div className={`meus-jogos-dupla ${duplaAVencedora ? 'vencedora' : ''}`}>
                    <span>Dupla 1</span>
                    <strong>{partida.nomeDuplaA}</strong>
                    {atletas.duplaA.map((atleta) => (
                      <div key={`${partida.id}-a-${atleta.lado}`} className={atleta.destaque ? 'atleta-logado' : ''}>
                        <small>{atleta.lado}</small>
                        <span>{atleta.nome || 'A definir'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="meus-jogos-placar">
                    <strong>{Number(partida.status) === 2 ? partida.placarDuplaA : '-'}</strong>
                    <span>x</span>
                    <strong>{Number(partida.status) === 2 ? partida.placarDuplaB : '-'}</strong>
                  </div>

                  <div className={`meus-jogos-dupla ${duplaBVencedora ? 'vencedora' : ''}`}>
                    <span>Dupla 2</span>
                    <strong>{partida.nomeDuplaB}</strong>
                    {atletas.duplaB.map((atleta) => (
                      <div key={`${partida.id}-b-${atleta.lado}`} className={atleta.destaque ? 'atleta-logado' : ''}>
                        <small>{atleta.lado}</small>
                        <span>{atleta.nome || 'A definir'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="meus-jogos-card-rodape">
                  <span className={`tag-status ${obterClasseStatusAprovacao(partida.statusAprovacao)}`}>
                    {obterNomeStatusAprovacao(partida.statusAprovacao)}
                  </span>
                  <span>{partida.nomeCriadoPorUsuario ? `Registrada por ${partida.nomeCriadoPorUsuario}` : 'Origem não informada'}</span>
                  {partida.observacoes && <span>{partida.observacoes}</span>}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
