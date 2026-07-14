import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaBan, FaChevronLeft, FaEdit, FaRegTrashAlt, FaTimes, FaTrophy } from 'react-icons/fa';
import { AppHero } from '../components/AppHero';
import { CompartilharPartidaBotao } from '../components/partidas/CompartilharPartidaBotao';
import { partidasServico } from '../services/partidasServico';
import { formatarDataHoraCurta } from '../utils/formatacao';
import {
  obterNomeGrupoPartidaExibicao,
  obterNomeStatusAprovacao,
  obterNomeStatusPartida
} from '../utils/partidas';

const MOTIVOS_CANCELAMENTO_PARTIDA = [
  { valor: 1, rotulo: 'Partida duplicada' },
  { valor: 2, rotulo: 'Jogo não aconteceu' },
  { valor: 3, rotulo: 'Atletas incorretos' },
  { valor: 4, rotulo: 'Resultado incorreto' },
  { valor: 5, rotulo: 'Grupo incorreto' },
  { valor: 6, rotulo: 'Outro motivo' }
];

const MOTIVO_OUTRO = 6;

function obterPermissoes(partida) {
  return partida?.permissoes || {
    podeEditar: Boolean(partida?.podeEditar),
    podeCancelar: Boolean(partida?.podeCancelar),
    podeExcluirDefinitivamente: Boolean(partida?.podeExcluirDefinitivamente),
    podeSolicitarCancelamento: Boolean(partida?.podeSolicitarCancelamento),
    podeResponderCancelamento: Boolean(partida?.podeResponderCancelamento),
    podeCancelarSolicitacao: Boolean(partida?.podeCancelarSolicitacao)
  };
}

function obterMensagemErro(erro, fallback = 'Não foi possível concluir a ação agora.') {
  const status = erro?.response?.status;
  if (status === 403) {
    return 'Você não possui permissão para realizar esta ação.';
  }

  if (status === 404) {
    return 'Partida não encontrada.';
  }

  if (status === 409) {
    return 'Os dados foram atualizados por outro usuário. Recarregue a partida e tente novamente.';
  }

  if (typeof erro?.response?.data === 'string' && erro.response.data.trim()) {
    return erro.response.data;
  }

  return erro?.response?.data?.mensagem || fallback;
}

function obterNomesDupla(partida, lado) {
  const prefixo = lado === 'A' ? 'duplaA' : 'duplaB';
  return [
    partida?.[`${prefixo}Atleta1Id`] ? partida?.[`nome${prefixo[0].toUpperCase()}${prefixo.slice(1)}Atleta1`] : partida?.[`nome${prefixo[0].toUpperCase()}${prefixo.slice(1)}Atleta1`],
    partida?.[`${prefixo}Atleta2Id`] ? partida?.[`nome${prefixo[0].toUpperCase()}${prefixo.slice(1)}Atleta2`] : partida?.[`nome${prefixo[0].toUpperCase()}${prefixo.slice(1)}Atleta2`]
  ].filter(Boolean);
}

function obterResultadoResumo(partida) {
  if (!partida) {
    return 'Resultado indisponível';
  }

  if (partida.possuiPlacarDetalhado && partida.placarDuplaA !== null && partida.placarDuplaB !== null) {
    return `${partida.placarDuplaA} x ${partida.placarDuplaB}`;
  }

  if (partida.nomeDuplaVencedora) {
    return `Vencedora: ${partida.nomeDuplaVencedora}`;
  }

  return 'Sem placar';
}

function obterMotivoSolicitacao(solicitacao) {
  if (solicitacao?.motivoTexto) {
    return solicitacao.motivoTexto;
  }

  return MOTIVOS_CANCELAMENTO_PARTIDA.find((item) => item.valor === Number(solicitacao?.motivo))?.rotulo || 'Motivo não informado';
}

export function PaginaPartidaDetalhe() {
  const { partidaId } = useParams();
  const navigate = useNavigate();
  const [partida, setPartida] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [modal, setModal] = useState(null);
  const [processando, setProcessando] = useState(false);

  const permissoes = useMemo(() => obterPermissoes(partida), [partida]);
  const solicitacao = partida?.solicitacaoCancelamento;

  async function carregarPartida() {
    if (!partidaId) {
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const dados = await partidasServico.obterPorId(partidaId);
      setPartida(dados);
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível carregar esta partida.'));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPartida();
  }, [partidaId]);

  async function executarAcao(acao, payload) {
    setProcessando(true);
    setErro('');

    try {
      if (acao === 'cancelar') {
        const atualizada = await partidasServico.cancelarPartida(partidaId, payload.motivo);
        setPartida(atualizada);
        setMensagem('Partida cancelada com sucesso.');
      } else if (acao === 'excluir') {
        await partidasServico.excluirPartidaDefinitivamente(partidaId, payload.motivo);
        navigate('/minhas-partidas', { replace: true, state: { mensagem: 'Partida excluída definitivamente.' } });
        return;
      } else if (acao === 'solicitar') {
        await partidasServico.solicitarCancelamentoPartida(partidaId, payload);
        setMensagem('Solicitação enviada! Os atletas da dupla adversária já podem responder.');
        await carregarPartida();
      } else if (acao === 'aprovar') {
        await partidasServico.aprovarCancelamentoPartida(partidaId, solicitacao.id);
        setMensagem('Partida cancelada com sucesso.');
        await carregarPartida();
      } else if (acao === 'recusar') {
        await partidasServico.recusarCancelamentoPartida(partidaId, solicitacao.id);
        setMensagem('Solicitação de cancelamento recusada.');
        await carregarPartida();
      } else if (acao === 'cancelarSolicitacao') {
        await partidasServico.cancelarSolicitacaoCancelamento(partidaId, solicitacao.id);
        setMensagem('Solicitação de cancelamento cancelada.');
        await carregarPartida();
      }

      setModal(null);
    } catch (error) {
      setErro(obterMensagemErro(error));
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <main className="pagina-partida-detalhe">
        <div className="partida-detalhe-skeleton" aria-label="Carregando detalhes da partida" />
      </main>
    );
  }

  if (erro && !partida) {
    return (
      <main className="pagina-partida-detalhe">
        <button type="button" className="botao-secundario botao-compacto" onClick={() => navigate(-1)}>
          <FaChevronLeft aria-hidden="true" />
          Voltar
        </button>
        <section className="partida-detalhe-estado">
          <strong>{erro}</strong>
          <button type="button" className="botao-primario" onClick={carregarPartida}>
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="pagina-partida-detalhe">
      <AppHero
        eyebrow={partida?.cancelada ? 'Partida cancelada' : 'Partida'}
        title="Detalhes da partida"
        subtitle="Resultado, atletas e estatísticas."
        badge={obterNomeGrupoPartidaExibicao(partida?.nomeGrupo)}
        actions={
          <button type="button" className="botao-secundario botao-compacto partida-detalhe-voltar-hero" onClick={() => navigate(-1)} aria-label="Voltar">
            <FaChevronLeft aria-hidden="true" />
            <span>Voltar</span>
          </button>
        }
      />

      {mensagem && <p className="partida-detalhe-feedback sucesso">{mensagem}</p>}
      {erro && <p className="partida-detalhe-feedback erro">{erro}</p>}

      <section className={`partida-detalhe-card principal ${partida?.cancelada ? 'cancelada' : ''}`}>
        <div className="partida-detalhe-card-topo">
          <div>
            <span>Status</span>
            <strong>{partida?.cancelada ? 'Cancelada' : obterNomeStatusPartida(partida?.status)}</strong>
          </div>
          <span className={`partida-detalhe-badge ${partida?.cancelada ? 'perigo' : 'neutro'}`}>
            {partida?.cancelada ? 'Cancelada' : obterNomeStatusAprovacao(partida?.statusAprovacao)}
          </span>
        </div>

        <div className="partida-detalhe-resultado">
          <DuplaDetalhe titulo="Dupla A" nomes={obterNomesDupla(partida, 'A')} vencedora={partida?.duplaVencedora === 1 || partida?.duplaVencedoraId === partida?.duplaAId} />
          <div className="partida-detalhe-placar">
            <strong>{obterResultadoResumo(partida)}</strong>
            <span>{partida?.possuiPlacarDetalhado ? 'Placar' : 'Resultado'}</span>
          </div>
          <DuplaDetalhe titulo="Dupla B" nomes={obterNomesDupla(partida, 'B')} vencedora={partida?.duplaVencedora === 2 || partida?.duplaVencedoraId === partida?.duplaBId} />
        </div>
      </section>

      {partida?.cancelamentoPendente && (
        <section className="partida-detalhe-card pendente">
          <div className="partida-detalhe-section-title">
            <strong>Cancelamento pendente</strong>
            <span>Aguardando aprovação da dupla adversária.</span>
          </div>
          <dl className="partida-detalhe-lista">
            <div>
              <dt>Solicitante</dt>
              <dd>{solicitacao?.nomeSolicitante || 'Não informado'}</dd>
            </div>
            <div>
              <dt>Motivo</dt>
              <dd>{obterMotivoSolicitacao(solicitacao)}</dd>
            </div>
          </dl>
          <div className="partida-detalhe-acoes">
            {permissoes.podeCancelarSolicitacao && (
              <button type="button" className="botao-secundario" onClick={() => setModal({ tipo: 'cancelarSolicitacao' })}>
                Cancelar solicitação
              </button>
            )}
            {permissoes.podeResponderCancelamento && (
              <>
                <button type="button" className="botao-perigo discreto" onClick={() => setModal({ tipo: 'recusar' })}>
                  Recusar
                </button>
                <button type="button" className="botao-primario" onClick={() => setModal({ tipo: 'aprovar' })}>
                  Aprovar cancelamento
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {partida?.cancelada && (
        <section className="partida-detalhe-card cancelada-info">
          <strong>Esta partida foi cancelada</strong>
          <p>Ela permanece no histórico, mas não conta para rankings, scouts, sequências ou Pontos QN.</p>
          <span>Cancelada em {formatarDataHoraCurta(partida.canceladaEm)}</span>
        </section>
      )}

      <section className="partida-detalhe-card">
        <div className="partida-detalhe-section-title">
          <strong>Informações</strong>
        </div>
        <dl className="partida-detalhe-lista">
          <div>
            <dt>Data da partida</dt>
            <dd>{formatarDataHoraCurta(partida?.dataPartida || partida?.dataCriacao)}</dd>
          </div>
          <div>
            <dt>Registrada por</dt>
            <dd>{partida?.nomeCriadoPorUsuario || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Data de registro</dt>
            <dd>{formatarDataHoraCurta(partida?.dataCriacao)}</dd>
          </div>
          <div>
            <dt>Pendências</dt>
            <dd>{partida?.quantidadeAtletasPendentes ? `${partida.quantidadeAtletasPendentes} pendência(s)` : 'Sem pendências'}</dd>
          </div>
        </dl>
      </section>

      <section className="partida-detalhe-card">
        <div className="partida-detalhe-section-title">
          <strong>Histórico</strong>
        </div>
        {partida?.historico?.length ? (
          <ol className="partida-detalhe-historico">
            {partida.historico.map((item) => (
              <li key={item.id}>
                <strong>{item.acao}</strong>
                <span>{formatarDataHoraCurta(item.dataHoraUtc)}</span>
                {item.motivo && <small>{item.motivo}</small>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="partida-detalhe-vazio">Nenhum evento de auditoria registrado para esta partida.</p>
        )}
      </section>

      <section className="partida-detalhe-card acoes">
        <div className="partida-detalhe-section-title">
          <strong>Ações</strong>
          <span>As permissões são calculadas pela API.</span>
        </div>
        <div className="partida-detalhe-acoes">
          {permissoes.podeEditar && !partida?.cancelada && (
            <Link className="botao-secundario" to={`/partidas/registrar?partidaId=${partida.id}`}>
              <FaEdit aria-hidden="true" />
              Editar
            </Link>
          )}
          {!partida?.cancelada && (
            <CompartilharPartidaBotao partidaId={partida.id} registradoPor={partida.nomeCriadoPorUsuario} />
          )}
          {permissoes.podeSolicitarCancelamento && !partida?.cancelada && !partida?.cancelamentoPendente && (
            <button type="button" className="botao-terciario" onClick={() => setModal({ tipo: 'solicitar' })}>
              <FaBan aria-hidden="true" />
              Solicitar cancelamento
            </button>
          )}
          {permissoes.podeCancelar && !partida?.cancelada && (
            <button type="button" className="botao-perigo discreto" onClick={() => setModal({ tipo: 'cancelar' })}>
              <FaBan aria-hidden="true" />
              Cancelar partida
            </button>
          )}
          {permissoes.podeExcluirDefinitivamente && (
            <button type="button" className="botao-perigo" onClick={() => setModal({ tipo: 'excluir' })}>
              <FaRegTrashAlt aria-hidden="true" />
              Excluir definitivamente
            </button>
          )}
        </div>
      </section>

      {modal?.tipo === 'solicitar' && (
        <SolicitacaoCancelamentoModal
          processando={processando}
          onCancelar={() => setModal(null)}
          onConfirmar={(payload) => executarAcao('solicitar', payload)}
        />
      )}

      {['cancelar', 'excluir'].includes(modal?.tipo) && (
        <MotivoAcaoPartidaModal
          tipo={modal.tipo}
          processando={processando}
          onCancelar={() => setModal(null)}
          onConfirmar={(motivo) => executarAcao(modal.tipo, { motivo })}
        />
      )}

      {['aprovar', 'recusar', 'cancelarSolicitacao'].includes(modal?.tipo) && (
        <ConfirmacaoSimplesModal
          tipo={modal.tipo}
          processando={processando}
          onCancelar={() => setModal(null)}
          onConfirmar={() => executarAcao(modal.tipo)}
        />
      )}
    </main>
  );
}

function DuplaDetalhe({ titulo, nomes, vencedora }) {
  return (
    <div className={`partida-detalhe-dupla ${vencedora ? 'vencedora' : ''}`}>
      <span>{titulo}</span>
      <strong>{nomes.join(' / ') || 'A definir'}</strong>
      {vencedora && (
        <small>
          <FaTrophy aria-hidden="true" />
          Vencedora
        </small>
      )}
    </div>
  );
}

function MotivoAcaoPartidaModal({ tipo, processando, onCancelar, onConfirmar }) {
  const [motivo, setMotivo] = useState('');
  const motivoValido = motivo.trim().length > 0 && motivo.trim().length <= 200;
  const exclusao = tipo === 'excluir';

  return (
    <div className="modal-backdrop partida-detalhe-modal-backdrop" role="presentation" onClick={processando ? undefined : onCancelar}>
      <article className="modal-conteudo partida-detalhe-modal" role="dialog" aria-modal="true" aria-label={exclusao ? 'Excluir definitivamente' : 'Cancelar partida'} onClick={(evento) => evento.stopPropagation()}>
        <header className="partida-detalhe-modal-topo">
          <div>
            <strong>{exclusao ? 'Excluir definitivamente?' : 'Cancelar partida?'}</strong>
            <p>
              {exclusao
                ? 'A partida será removida das telas da aplicação. O histórico de auditoria será preservado.'
                : 'A partida continuará no histórico, mas deixará de contar em rankings, scouts e Pontos QN.'}
            </p>
          </div>
          <button type="button" onClick={onCancelar} aria-label="Fechar" disabled={processando}>
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        <label className="partida-detalhe-campo">
          <span>Motivo obrigatório</span>
          <textarea
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            maxLength={200}
            placeholder={exclusao ? 'Informe por que esta partida será excluída...' : 'Informe por que esta partida será cancelada...'}
            disabled={processando}
          />
          <small>{motivo.length}/200</small>
        </label>

        <div className="partida-detalhe-modal-acoes">
          <button type="button" className="botao-secundario" onClick={onCancelar} disabled={processando}>
            Voltar
          </button>
          <button type="button" className="botao-perigo" onClick={() => onConfirmar(motivo.trim())} disabled={!motivoValido || processando}>
            {processando ? 'Processando...' : exclusao ? 'Excluir definitivamente' : 'Cancelar partida'}
          </button>
        </div>
      </article>
    </div>
  );
}

function SolicitacaoCancelamentoModal({ processando, onCancelar, onConfirmar }) {
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const motivoNumerico = Number(motivo);
  const observacaoObrigatoria = motivoNumerico === MOTIVO_OUTRO;
  const motivoValido = MOTIVOS_CANCELAMENTO_PARTIDA.some((item) => item.valor === motivoNumerico);
  const observacaoValida = !observacaoObrigatoria || observacao.trim().length > 0;

  function confirmar() {
    if (!motivoValido) {
      setErro('Informe o motivo do cancelamento.');
      return;
    }

    if (!observacaoValida) {
      setErro('Descreva o motivo do cancelamento.');
      return;
    }

    setErro('');
    onConfirmar({
      motivo: motivoNumerico,
      observacao: observacao.trim() || null
    });
  }

  return (
    <div className="modal-backdrop partida-detalhe-modal-backdrop" role="presentation" onClick={processando ? undefined : onCancelar}>
      <article className="modal-conteudo partida-detalhe-modal" role="dialog" aria-modal="true" aria-label="Solicitar cancelamento" onClick={(evento) => evento.stopPropagation()}>
        <header className="partida-detalhe-modal-topo">
          <div>
            <strong>Solicitar cancelamento</strong>
            <p>A partida só será cancelada após a aprovação de pelo menos um atleta do outro time.</p>
          </div>
          <button type="button" onClick={onCancelar} aria-label="Fechar" disabled={processando}>
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        <label className="partida-detalhe-campo">
          <span>Motivo do cancelamento</span>
          <select value={motivo} onChange={(evento) => setMotivo(evento.target.value)} disabled={processando}>
            <option value="">Selecione</option>
            {MOTIVOS_CANCELAMENTO_PARTIDA.map((item) => (
              <option key={item.valor} value={item.valor}>{item.rotulo}</option>
            ))}
          </select>
        </label>

        <label className="partida-detalhe-campo">
          <span>Observação</span>
          <textarea
            value={observacao}
            onChange={(evento) => setObservacao(evento.target.value)}
            maxLength={200}
            placeholder="Conte mais detalhes sobre o motivo..."
            disabled={processando}
          />
          <small>{observacao.length}/200</small>
        </label>

        {erro && <p className="texto-erro">{erro}</p>}

        <div className="partida-detalhe-modal-acoes">
          <button type="button" className="botao-secundario" onClick={onCancelar} disabled={processando}>
            Voltar
          </button>
          <button type="button" className="botao-primario" onClick={confirmar} disabled={processando}>
            {processando ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </div>
      </article>
    </div>
  );
}

function ConfirmacaoSimplesModal({ tipo, processando, onCancelar, onConfirmar }) {
  const textos = {
    aprovar: {
      titulo: 'Aprovar cancelamento?',
      texto: 'Após a aprovação, esta partida deixará de contar nos rankings, scouts e benefícios.',
      acao: 'Aprovar cancelamento',
      classe: 'botao-primario'
    },
    recusar: {
      titulo: 'Recusar cancelamento?',
      texto: 'A solicitação será encerrada e a partida continuará válida normalmente.',
      acao: 'Recusar solicitação',
      classe: 'botao-perigo'
    },
    cancelarSolicitacao: {
      titulo: 'Cancelar solicitação?',
      texto: 'A partida continuará válida e a dupla adversária não precisará mais responder.',
      acao: 'Cancelar solicitação',
      classe: 'botao-perigo'
    }
  }[tipo];

  return (
    <div className="modal-backdrop partida-detalhe-modal-backdrop" role="presentation" onClick={processando ? undefined : onCancelar}>
      <article className="modal-conteudo partida-detalhe-modal" role="dialog" aria-modal="true" aria-label={textos.titulo} onClick={(evento) => evento.stopPropagation()}>
        <header className="partida-detalhe-modal-topo">
          <div>
            <strong>{textos.titulo}</strong>
            <p>{textos.texto}</p>
          </div>
          <button type="button" onClick={onCancelar} aria-label="Fechar" disabled={processando}>
            <FaTimes aria-hidden="true" />
          </button>
        </header>
        <div className="partida-detalhe-modal-acoes">
          <button type="button" className="botao-secundario" onClick={onCancelar} disabled={processando}>
            Voltar
          </button>
          <button type="button" className={textos.classe} onClick={onConfirmar} disabled={processando}>
            {processando ? 'Processando...' : textos.acao}
          </button>
        </div>
      </article>
    </div>
  );
}
