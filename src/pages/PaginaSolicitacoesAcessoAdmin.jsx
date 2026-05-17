import { useEffect, useMemo, useState } from 'react';
import { FaCheck, FaEnvelope, FaTimes, FaUserPlus } from 'react-icons/fa';
import { solicitacoesAcessoServico } from '../services/solicitacoesAcessoServico';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';

const STATUS_SOLICITACAO = {
  1: { nome: 'Pendente', classe: 'pendente' },
  2: { nome: 'Aprovado', classe: 'aprovado' },
  3: { nome: 'Rejeitado', classe: 'rejeitado' },
  4: { nome: 'Convite enviado', classe: 'convite-enviado' },
  5: { nome: 'Cadastro concluído', classe: 'concluido' }
};

function obterStatus(status) {
  return STATUS_SOLICITACAO[Number(status)] || { nome: 'Desconhecido', classe: 'neutro' };
}

export function PaginaSolicitacoesAcessoAdmin() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const resumo = useMemo(() => {
    const pendentes = solicitacoes.filter((item) => Number(item.status) === 1).length;
    const convites = solicitacoes.filter((item) => Number(item.status) === 4).length;
    return {
      total: solicitacoes.length,
      pendentes,
      convites
    };
  }, [solicitacoes]);

  async function carregarSolicitacoes() {
    setCarregando(true);
    setErro('');

    try {
      const lista = await solicitacoesAcessoServico.listarAdmin();
      setSolicitacoes(lista);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function executarAcao(id, acao, mensagemSucesso) {
    setErro('');
    setMensagem('');
    setProcessandoId(id);

    try {
      await acao(id);
      await carregarSolicitacoes();
      setMensagem(mensagemSucesso);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <section className="pagina admin-solicitacoes">
      <article className="cartao admin-hero">
        <div>
          <span className="admin-eyebrow">Administração</span>
          <h3>Solicitações de acesso</h3>
          <p>Aprove pedidos e envie convites sem abrir cadastro público.</p>
        </div>
        <div className="admin-hero-icone">
          <FaUserPlus aria-hidden="true" />
        </div>
      </article>

      <div className="admin-resumo-grid">
        <article className="admin-resumo-card">
          <span>Total</span>
          <strong>{resumo.total}</strong>
        </article>
        <article className="admin-resumo-card destaque">
          <span>Pendentes</span>
          <strong>{resumo.pendentes}</strong>
        </article>
        <article className="admin-resumo-card">
          <span>Convites</span>
          <strong>{resumo.convites}</strong>
        </article>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}

      <div className="admin-lista-solicitacoes">
        {carregando && <p className="admin-estado">Carregando solicitações...</p>}

        {!carregando && solicitacoes.length === 0 && (
          <article className="cartao admin-estado">
            <strong>Nenhuma solicitação encontrada.</strong>
            <p>Novos pedidos feitos na tela de login aparecerão aqui.</p>
          </article>
        )}

        {!carregando && solicitacoes.map((solicitacao) => {
          const status = obterStatus(solicitacao.status);
          const podeAprovarOuRejeitar = Number(solicitacao.status) === 1;
          const podeEnviarConvite = [1, 2].includes(Number(solicitacao.status));
          const processando = processandoId === solicitacao.id;

          return (
            <article key={solicitacao.id} className="cartao admin-solicitacao-card">
              <div className="admin-solicitacao-topo">
                <div>
                  <h3>{solicitacao.nome}</h3>
                  <p>{solicitacao.email}</p>
                </div>
                <span className={`admin-status ${status.classe}`}>{status.nome}</span>
              </div>

              <div className="admin-solicitacao-meta">
                <span>Criado em {formatarDataHora(solicitacao.dataCriacao)}</span>
                <span>Atualizado em {formatarDataHora(solicitacao.dataAtualizacao)}</span>
              </div>

              <div className="admin-solicitacao-acoes">
                {podeAprovarOuRejeitar && (
                  <>
                    <button
                      type="button"
                      className="botao-secundario"
                      onClick={() => executarAcao(
                        solicitacao.id,
                        solicitacoesAcessoServico.aprovar,
                        'Solicitação aprovada com sucesso.'
                      )}
                      disabled={processando}
                    >
                      <FaCheck aria-hidden="true" />
                      {processando ? 'Processando...' : 'Aprovar'}
                    </button>
                    <button
                      type="button"
                      className="botao-secundario botao-perigo-discreto"
                      onClick={() => executarAcao(
                        solicitacao.id,
                        solicitacoesAcessoServico.rejeitar,
                        'Solicitação rejeitada com sucesso.'
                      )}
                      disabled={processando}
                    >
                      <FaTimes aria-hidden="true" />
                      Rejeitar
                    </button>
                  </>
                )}

                {podeEnviarConvite && (
                  <button
                    type="button"
                    className="botao-primario"
                    onClick={() => executarAcao(
                      solicitacao.id,
                      solicitacoesAcessoServico.enviarConvite,
                      'Convite gerado e solicitação atualizada.'
                    )}
                    disabled={processando}
                  >
                    <FaEnvelope aria-hidden="true" />
                    {processando ? 'Enviando...' : 'Enviar convite'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
