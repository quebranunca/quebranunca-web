import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCheck,
  FaChevronLeft,
  FaClipboardCheck,
  FaTimes,
  FaTrophy,
  FaUserFriends
} from 'react-icons/fa';
import { AvatarUsuario } from '../AvatarUsuario';
import './registrar-partida-novo.css';
import './minhas-partidas-registradas.css';

const ETAPAS = [
  { id: 'introducao', titulo: 'Resumo', icone: 'summary' },
  { id: 'dupla1Atleta1', titulo: 'D1 atleta 1', icone: 'atleta' },
  { id: 'dupla1Atleta2', titulo: 'D1 atleta 2', icone: 'atleta' },
  { id: 'dupla2Atleta1', titulo: 'D2 atleta 1', icone: 'atleta' },
  { id: 'dupla2Atleta2', titulo: 'D2 atleta 2', icone: 'atleta' },
  { id: 'placar', titulo: 'Placar', icone: 'score' },
  { id: 'revisao', titulo: 'Revisão', icone: 'check' }
];

function criarFormulario(partida) {
  return {
    dupla1: {
      atletaDireita: partida?.nomeDuplaAAtleta1 || '',
      atletaEsquerda: partida?.nomeDuplaAAtleta2 || '',
      pontos: String(partida?.placarDuplaA ?? '')
    },
    dupla2: {
      atletaDireita: partida?.nomeDuplaBAtleta1 || '',
      atletaEsquerda: partida?.nomeDuplaBAtleta2 || '',
      pontos: String(partida?.placarDuplaB ?? '')
    }
  };
}

function limparTexto(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ');
}

function validarFormulario(formulario) {
  const nomes = [
    formulario.dupla1.atletaDireita,
    formulario.dupla1.atletaEsquerda,
    formulario.dupla2.atletaDireita,
    formulario.dupla2.atletaEsquerda
  ];

  if (nomes.some((nome) => !limparTexto(nome))) {
    return 'Informe os quatro atletas da partida.';
  }

  const pontosDupla1 = Number(formulario.dupla1.pontos);
  const pontosDupla2 = Number(formulario.dupla2.pontos);

  if (!Number.isFinite(pontosDupla1) || !Number.isFinite(pontosDupla2) || pontosDupla1 < 0 || pontosDupla2 < 0) {
    return 'Informe pontos numéricos maiores ou iguais a zero.';
  }

  if (pontosDupla1 === pontosDupla2) {
    return 'Não existe empate no futevôlei. Ajuste o placar antes de salvar.';
  }

  return '';
}

function validarEtapa(formulario, etapaId) {
  const camposPorEtapa = {
    dupla1Atleta1: formulario.dupla1.atletaDireita,
    dupla1Atleta2: formulario.dupla1.atletaEsquerda,
    dupla2Atleta1: formulario.dupla2.atletaDireita,
    dupla2Atleta2: formulario.dupla2.atletaEsquerda
  };

  if (camposPorEtapa[etapaId] !== undefined && !limparTexto(camposPorEtapa[etapaId])) {
    return 'Informe o atleta antes de continuar.';
  }

  if (etapaId === 'placar') {
    const pontosDupla1 = Number(formulario.dupla1.pontos);
    const pontosDupla2 = Number(formulario.dupla2.pontos);

    if (!Number.isFinite(pontosDupla1) || !Number.isFinite(pontosDupla2) || pontosDupla1 < 0 || pontosDupla2 < 0) {
      return 'Informe pontos numéricos maiores ou iguais a zero.';
    }

    if (pontosDupla1 === pontosDupla2) {
      return 'Não existe empate no futevôlei. Ajuste o placar antes de salvar.';
    }
  }

  return '';
}

function criarPayload(partida, formulario) {
  const atletaPayload = (id, nomeOriginal, nomeAtual) => {
    const nomeLimpo = limparTexto(nomeAtual);
    const manteveMesmoNome = limparTexto(nomeOriginal) === nomeLimpo;

    return {
      atletaId: manteveMesmoNome ? id || null : null,
      nome: nomeLimpo
    };
  };
  const duplaAAtleta1 = atletaPayload(partida.duplaAAtleta1Id, partida.nomeDuplaAAtleta1, formulario.dupla1.atletaDireita);
  const duplaAAtleta2 = atletaPayload(partida.duplaAAtleta2Id, partida.nomeDuplaAAtleta2, formulario.dupla1.atletaEsquerda);
  const duplaBAtleta1 = atletaPayload(partida.duplaBAtleta1Id, partida.nomeDuplaBAtleta1, formulario.dupla2.atletaDireita);
  const duplaBAtleta2 = atletaPayload(partida.duplaBAtleta2Id, partida.nomeDuplaBAtleta2, formulario.dupla2.atletaEsquerda);

  return {
    duplaAAtleta1Id: duplaAAtleta1.atletaId,
    duplaAAtleta1Nome: duplaAAtleta1.nome,
    duplaAAtleta2Id: duplaAAtleta2.atletaId,
    duplaAAtleta2Nome: duplaAAtleta2.nome,
    duplaBAtleta1Id: duplaBAtleta1.atletaId,
    duplaBAtleta1Nome: duplaBAtleta1.nome,
    duplaBAtleta2Id: duplaBAtleta2.atletaId,
    duplaBAtleta2Nome: duplaBAtleta2.nome,
    placarDuplaA: Number(formulario.dupla1.pontos),
    placarDuplaB: Number(formulario.dupla2.pontos)
  };
}

function obterValorCampo(formulario, campo) {
  return campo.split('.').reduce((valor, parte) => valor?.[parte], formulario) ?? '';
}

function formatarData(data) {
  if (!data) {
    return 'Data preservada';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(data));
}

function formatarIdPartida(partida) {
  return partida?.id ? `#QNB-${String(partida.id).slice(0, 8).toUpperCase()}` : '#QNB';
}

function atualizarValorCampo(formulario, campo, valor) {
  const [dupla, propriedade] = campo.split('.');
  return {
    ...formulario,
    [dupla]: {
      ...formulario[dupla],
      [propriedade]: valor
    }
  };
}

function montarResumo(formulario, partida) {
  return {
    dupla1: [formulario.dupla1.atletaDireita, formulario.dupla1.atletaEsquerda],
    dupla2: [formulario.dupla2.atletaDireita, formulario.dupla2.atletaEsquerda],
    placar: {
      dupla1: formulario.dupla1.pontos,
      dupla2: formulario.dupla2.pontos
    },
    data: partida?.dataPartida || partida?.dataCriacao,
    contexto: partida?.nomeCategoria || partida?.nomeGrupo || 'Contexto preservado'
  };
}

function IconeEtapa({ tipo }) {
  if (tipo === 'score') {
    return <FaTrophy aria-hidden="true" />;
  }

  if (tipo === 'summary') {
    return <FaClipboardCheck aria-hidden="true" />;
  }

  if (tipo === 'check') {
    return <FaCheck aria-hidden="true" />;
  }

  return <FaUserFriends aria-hidden="true" />;
}

function Progresso({ indiceEtapa }) {
  return (
    <div className="registrar-partida-novo-progresso" aria-label={`Etapa ${indiceEtapa + 1} de ${ETAPAS.length}`}>
      <div className="registrar-partida-novo-pontos" aria-hidden="true">
        {ETAPAS.map((etapa, indice) => (
          <span key={etapa.id} className={indice <= indiceEtapa ? 'ativo' : ''} />
        ))}
      </div>
      <small>{indiceEtapa + 1} de {ETAPAS.length}</small>
    </div>
  );
}

function HeaderModal({ indiceEtapa, etapaAtual, salvando, sucesso, onVoltar, onFechar }) {
  const podeVoltar = indiceEtapa > 0 && !salvando && !sucesso;

  return (
    <header className="registrar-partida-novo-header">
      <button
        type="button"
        className="registrar-partida-novo-icone-botao"
        onClick={onVoltar}
        disabled={!podeVoltar}
        aria-label="Voltar etapa"
      >
        <FaChevronLeft aria-hidden="true" />
      </button>

      <div className="registrar-partida-novo-header-centro">
        <strong id="editar-partida-registrada-titulo">Editar partida</strong>
        {!sucesso && (
          <>
            <span>{etapaAtual.titulo}</span>
            <Progresso indiceEtapa={indiceEtapa} />
          </>
        )}
      </div>

      <button
        type="button"
        className="registrar-partida-novo-icone-botao"
        onClick={onFechar}
        disabled={salvando}
        aria-label="Fechar edição de partida"
      >
        <FaTimes aria-hidden="true" />
      </button>
    </header>
  );
}

function ResumoDupla({ titulo, atletas }) {
  return (
    <div className="registrar-partida-novo-resumo-dupla">
      <span>{titulo}</span>
      {atletas.map((atleta, indice) => (
        <strong key={`${titulo}-${indice}`}>{limparTexto(atleta) || 'Atleta pendente'}</strong>
      ))}
    </div>
  );
}

function ResumoCard({ resumo }) {
  return (
    <div className="registrar-partida-novo-resumo-card">
      <ResumoDupla titulo="Dupla 1" atletas={resumo.dupla1} />
      <div className="registrar-partida-novo-resumo-placar">
        <strong>{resumo.placar.dupla1 || 0}</strong>
        <span>x</span>
        <strong>{resumo.placar.dupla2 || 0}</strong>
      </div>
      <ResumoDupla titulo="Dupla 2" atletas={resumo.dupla2} />
    </div>
  );
}

function EtapaIntroducao({ resumo }) {
  return (
    <section className="registrar-partida-novo-etapa">
      <div className="registrar-partida-novo-intro">
        <span className="registrar-partida-novo-kicker">Partida existente</span>
        <h3>Revise antes de alterar</h3>
        <p>Você pode ajustar apenas atletas e placar. Grupo, competição, categoria, data, status e aprovação serão preservados.</p>
      </div>

      <ResumoCard resumo={resumo} />

      <div className="registrar-partida-novo-meta">
        <span>Data</span>
        <strong>{formatarData(resumo.data)}</strong>
      </div>
      <div className="registrar-partida-novo-meta">
        <span>Contexto</span>
        <strong>{resumo.contexto}</strong>
      </div>
    </section>
  );
}

function EtapaAtleta({ formulario, campo, rotulo, titulo, descricao, inputRef, onAlterarCampo }) {
  const valor = obterValorCampo(formulario, campo);

  return (
    <section className="registrar-partida-novo-etapa">
      <div className="registrar-partida-novo-intro">
        <span className="registrar-partida-novo-kicker">{rotulo}</span>
        <h3>{titulo}</h3>
        <p>{descricao}</p>
      </div>

      <label className="registrar-partida-novo-campo">
        <span>Nome completo</span>
        <input
          ref={inputRef}
          type="text"
          value={valor}
          onChange={(evento) => onAlterarCampo(campo, evento.target.value)}
          placeholder="Nome ou apelido"
          autoComplete="off"
        />
      </label>

      <div className="editar-partida-atleta-preview">
        <AvatarUsuario
          nome={valor}
          tamanho="sm"
          className="registrar-partida-novo-avatar"
        />
        <strong>{limparTexto(valor) || 'Atleta pendente'}</strong>
      </div>
    </section>
  );
}

function EtapaPlacar({ formulario, inputRef, onAlterarCampo }) {
  return (
    <section className="registrar-partida-novo-etapa registrar-partida-novo-etapa-placar">
      <div className="registrar-partida-novo-intro">
        <span className="registrar-partida-novo-kicker">Placar</span>
        <h3>Resultado final</h3>
        <p>Use o teclado numérico no mobile. A API valida a regra da competição ou o padrão QNF.</p>
      </div>

      <div className="registrar-partida-novo-placar">
        <label>
          <span>Dupla 1</span>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            value={formulario.dupla1.pontos}
            onChange={(evento) => onAlterarCampo('dupla1.pontos', evento.target.value)}
            placeholder="0"
          />
        </label>
        <strong aria-hidden="true">x</strong>
        <label>
          <span>Dupla 2</span>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            value={formulario.dupla2.pontos}
            onChange={(evento) => onAlterarCampo('dupla2.pontos', evento.target.value)}
            placeholder="0"
          />
        </label>
      </div>

      <div className="registrar-partida-novo-regras">
        <span>Pontuação mínima: regra da competição ou padrão QNF</span>
        <span>Diferença mínima: regra da competição ou padrão QNF</span>
        <span>Empate: não permitido</span>
      </div>
    </section>
  );
}

function EtapaRevisao({ resumo }) {
  return (
    <section className="registrar-partida-novo-etapa">
      <div className="registrar-partida-novo-intro">
        <span className="registrar-partida-novo-kicker">Revisão final</span>
        <h3>Salvar alterações</h3>
        <p>Confira os dados que serão persistidos. As estatísticas, rankings e pendências seguem o processamento atual da plataforma.</p>
      </div>

      <ResumoCard resumo={resumo} />

      <div className="registrar-partida-novo-meta">
        <span>Campos preservados</span>
        <strong>Grupo, categoria, data e status</strong>
      </div>
    </section>
  );
}

function TelaSucesso({ partida, resumo, onFechar }) {
  return (
    <section className="registrar-partida-novo-sucesso">
      <div className="registrar-partida-novo-check">
        <FaCheck aria-hidden="true" />
      </div>
      <span className="registrar-partida-novo-kicker">Partida atualizada</span>
      <h3>Alterações salvas com sucesso!</h3>
      <p>A partida foi atualizada e continua disponível nas estatísticas e rankings.</p>

      <ResumoCard resumo={resumo} />

      <div className="registrar-partida-novo-meta registrar-partida-novo-meta-sucesso">
        <span>{formatarIdPartida(partida)}</span>
        <strong>{formatarData(new Date())}</strong>
      </div>

      <div className="registrar-partida-novo-acoes registrar-partida-novo-acoes-sucesso">
        <button type="button" className="botao-primario" onClick={onFechar}>
          Concluir
        </button>
      </div>
    </section>
  );
}

function Stepper({ indiceEtapa }) {
  return (
    <nav className="registrar-partida-novo-stepper editar-partida-registrada-stepper" aria-label="Etapas da edição">
      {ETAPAS.map((etapa, indice) => (
        <span
          key={etapa.id}
          className={[
            'registrar-partida-novo-stepper-item',
            indice === indiceEtapa ? 'ativo' : '',
            indice < indiceEtapa ? 'concluido' : ''
          ].filter(Boolean).join(' ')}
        >
          <IconeEtapa tipo={etapa.icone} />
          <small>{etapa.titulo}</small>
        </span>
      ))}
    </nav>
  );
}

export function EditarPartidaRegistradaModal({ partida, salvando, erro, onSalvar, onFechar }) {
  const [formulario, setFormulario] = useState(() => criarFormulario(partida));
  const [erroValidacao, setErroValidacao] = useState('');
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [sucesso, setSucesso] = useState(false);
  const campoRef = useRef(null);

  useEffect(() => {
    setFormulario(criarFormulario(partida));
    setErroValidacao('');
    setIndiceEtapa(0);
    setSucesso(false);
  }, [partida]);

  useEffect(() => {
    if (!sucesso) {
      campoRef.current?.focus();
    }
  }, [indiceEtapa, sucesso]);

  const mensagemErro = erroValidacao || erro;
  const etapaAtual = ETAPAS[indiceEtapa];
  const etapaFinal = etapaAtual.id === 'revisao';
  const resumo = useMemo(() => montarResumo(formulario, partida), [formulario, partida]);

  function alterarCampo(campo, valor) {
    setErroValidacao('');
    setFormulario((anterior) => atualizarValorCampo(anterior, campo, valor));
  }

  function voltarEtapa() {
    setErroValidacao('');
    setIndiceEtapa((indice) => Math.max(0, indice - 1));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();

    const erroAtual = etapaFinal ? validarFormulario(formulario) : validarEtapa(formulario, etapaAtual.id);
    if (erroAtual) {
      setErroValidacao(erroAtual);
      return;
    }

    if (!etapaFinal) {
      setIndiceEtapa((indice) => Math.min(ETAPAS.length - 1, indice + 1));
      return;
    }

    try {
      await onSalvar(criarPayload(partida, formulario));
      setSucesso(true);
    } catch {
      // A página chamadora centraliza a mensagem de erro exibida no modal.
    }
  }

  if (!partida) {
    return null;
  }

  function renderizarEtapa() {
    if (etapaAtual.id === 'introducao') {
      return <EtapaIntroducao resumo={resumo} />;
    }

    if (etapaAtual.id === 'dupla1Atleta1') {
      return (
        <EtapaAtleta
          formulario={formulario}
          campo="dupla1.atletaDireita"
          rotulo="Dupla 1"
          titulo="Editar atleta 1"
          descricao="Atualize o primeiro atleta da dupla 1 mantendo a partida no mesmo contexto."
          inputRef={campoRef}
          onAlterarCampo={alterarCampo}
        />
      );
    }

    if (etapaAtual.id === 'dupla1Atleta2') {
      return (
        <EtapaAtleta
          formulario={formulario}
          campo="dupla1.atletaEsquerda"
          rotulo="Dupla 1"
          titulo="Editar atleta 2"
          descricao="Informe o segundo atleta da dupla 1."
          inputRef={campoRef}
          onAlterarCampo={alterarCampo}
        />
      );
    }

    if (etapaAtual.id === 'dupla2Atleta1') {
      return (
        <EtapaAtleta
          formulario={formulario}
          campo="dupla2.atletaDireita"
          rotulo="Dupla 2"
          titulo="Editar atleta 1"
          descricao="Atualize o primeiro atleta da dupla adversária."
          inputRef={campoRef}
          onAlterarCampo={alterarCampo}
        />
      );
    }

    if (etapaAtual.id === 'dupla2Atleta2') {
      return (
        <EtapaAtleta
          formulario={formulario}
          campo="dupla2.atletaEsquerda"
          rotulo="Dupla 2"
          titulo="Editar atleta 2"
          descricao="Informe o segundo atleta da dupla adversária."
          inputRef={campoRef}
          onAlterarCampo={alterarCampo}
        />
      );
    }

    if (etapaAtual.id === 'placar') {
      return <EtapaPlacar formulario={formulario} inputRef={campoRef} onAlterarCampo={alterarCampo} />;
    }

    return <EtapaRevisao resumo={resumo} />;
  }

  return (
    <div className="modal-sobreposicao registrar-partida-novo-sobreposicao" role="presentation">
      <section
        className="modal-conteudo registrar-partida-novo-modal editar-partida-registrada-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-partida-registrada-titulo"
      >
        <HeaderModal
          indiceEtapa={indiceEtapa}
          etapaAtual={etapaAtual}
          salvando={salvando}
          sucesso={sucesso}
          onVoltar={voltarEtapa}
          onFechar={onFechar}
        />

        {sucesso ? (
          <TelaSucesso partida={partida} resumo={resumo} onFechar={onFechar} />
        ) : (
          <form className="registrar-partida-novo-formulario" onSubmit={aoSubmeter}>
            <main className="registrar-partida-novo-corpo">
              {mensagemErro && <p className="texto-erro registrar-partida-novo-erro">{mensagemErro}</p>}
              {renderizarEtapa()}
            </main>

            <div className="registrar-partida-novo-acoes editar-partida-registrada-acoes">
              <button type="button" className="botao-secundario" onClick={onFechar} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="botao-primario" disabled={salvando}>
                {etapaFinal ? (salvando ? 'Salvando...' : 'Salvar alterações') : 'Continuar'}
              </button>
            </div>

            <Stepper indiceEtapa={indiceEtapa} />
          </form>
        )}
      </section>
    </div>
  );
}
