import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { partidasServico } from '../services/partidasServico';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import {
  obterAtletasPartida,
  obterClasseStatusAprovacao,
  obterClasseStatusPartida,
  obterNomeStatusAprovacao,
  obterNomeStatusPartida,
  obterResultadoAtleta,
  ordenarPartidasRecentes,
  STATUS_PARTIDA
} from '../utils/partidas';

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
          setPartidas(ordenarPartidasRecentes(lista || []));
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
        pendentes: acumulado.pendentes + (Number(partida.status) !== STATUS_PARTIDA.encerrada ? 1 : 0)
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
                    <strong>{Number(partida.status) === STATUS_PARTIDA.encerrada ? partida.placarDuplaA : '-'}</strong>
                    <span>x</span>
                    <strong>{Number(partida.status) === STATUS_PARTIDA.encerrada ? partida.placarDuplaB : '-'}</strong>
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
