import { useEffect, useRef, useState } from 'react';
import {
  FaCheck,
  FaChevronLeft,
  FaClipboardCheck,
  FaImage,
  FaRedo,
  FaTimes,
  FaTrophy,
  FaUserFriends
} from 'react-icons/fa';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
import { CompartilharPartidaBotao } from './CompartilharPartidaBotao';
import { aoPressionarEnterParaProximo, blurActiveElement, focusNextField, scrollFocusedInputIntoView } from '../../utils/tecladoMobile';

function obterValorCampo(dados, campo) {
  return campo.split('.').reduce((valor, parte) => valor?.[parte], dados) ?? '';
}

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
}

function formatarIdPartida(partida) {
  const id = partida?.id || partida?.partidaId;
  return id ? `#QNB-${String(id).slice(0, 8).toUpperCase()}` : '#QNB';
}

function obterVencedora(dados) {
  const pontos1 = Number(dados.dupla1.pontos);
  const pontos2 = Number(dados.dupla2.pontos);

  if (dados.dupla1.pontos === '' || dados.dupla2.pontos === '' || pontos1 === pontos2) {
    return '';
  }

  return pontos1 > pontos2 ? 'dupla1' : 'dupla2';
}

function IconeEtapa({ tipo }) {
  if (tipo === 'summary') {
    return <FaClipboardCheck aria-hidden="true" />;
  }

  return <FaUserFriends aria-hidden="true" />;
}

function Progresso({ etapas, indiceEtapa }) {
  return (
    <div className="registrar-partida-novo-progresso" aria-label={`Momento ${indiceEtapa + 1} de ${etapas.length}`}>
      <div className="registrar-partida-novo-pontos" aria-hidden="true">
        {etapas.map((etapa, indice) => (
          <span key={etapa.id} className={indice <= indiceEtapa ? 'ativo' : ''} />
        ))}
      </div>
      <small>{indiceEtapa + 1} de {etapas.length}</small>
    </div>
  );
}

function HeaderModal({ etapas, indiceEtapa, etapaAtual, salvando, onVoltar, onFechar, sucesso }) {
  const podeVoltar = indiceEtapa > 0 && !salvando && !sucesso;

  return (
    <header className="registrar-partida-novo-header">
      <button
        type="button"
        className="registrar-partida-novo-icone-botao"
        onClick={onVoltar}
        disabled={!podeVoltar}
        aria-label="Voltar para editar"
      >
        <FaChevronLeft aria-hidden="true" />
      </button>

      <div className="registrar-partida-novo-header-centro">
        <strong id="registrar-partida-novo-titulo">Registrar partida</strong>
        {!sucesso && (
          <>
            <span>{etapaAtual.titulo}</span>
            <Progresso etapas={etapas} indiceEtapa={indiceEtapa} />
          </>
        )}
      </div>

      <button
        type="button"
        className="registrar-partida-novo-icone-botao"
        onClick={onFechar}
        disabled={salvando}
        aria-label="Fechar registro de partida"
      >
        <FaTimes aria-hidden="true" />
      </button>
    </header>
  );
}

function montarDetalhesAtleta(atleta) {
  const detalhes = [];

  if (atleta?.apelido) {
    detalhes.push(`@${atleta.apelido}`);
  }

  if (atleta?.categoria) {
    detalhes.push(atleta.categoria);
  }

  if (atleta?.nomeCategoria) {
    detalhes.push(atleta.nomeCategoria);
  }

  if (atleta?.grupo) {
    detalhes.push(atleta.grupo);
  }

  if (atleta?.nomeGrupo) {
    detalhes.push(atleta.nomeGrupo);
  }

  if (atleta?.cidade || atleta?.estado) {
    detalhes.push([atleta.cidade, atleta.estado].filter(Boolean).join('/'));
  }

  if (Number.isFinite(atleta?.posicaoRanking)) {
    detalhes.push(`${atleta.posicaoRanking}º ranking`);
  }

  if (Number.isFinite(atleta?.quantidadeJogos)) {
    detalhes.push(`${atleta.quantidadeJogos} jogos`);
  }

  return detalhes.length > 0 ? detalhes.join(' • ') : 'Atleta QuebraNunca';
}

function AutocompleteAtleta({
  campo,
  rotulo,
  placeholder,
  dados,
  selecao,
  sugestoes,
  buscando,
  inputRef,
  proximoRef,
  onAlterarCampo,
  onSelecionarAtleta
}) {
  const valor = obterValorCampo(dados, campo);
  const sugestoesCampo = sugestoes[campo] || [];

  return (
    <label className="registrar-partida-novo-campo">
      <span>{rotulo}</span>
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="next"
        value={valor}
        onChange={(evento) => onAlterarCampo(campo, evento.target.value)}
        onFocus={scrollFocusedInputIntoView}
        onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(proximoRef))}
        placeholder={placeholder}
        autoComplete="off"
      />

      {selecao?.id && (
        <small className="registrar-partida-novo-selecionado">
          Selecionado: {selecao.apelido || selecao.nome}
        </small>
      )}

      {(sugestoesCampo.length > 0 || buscando) && (
        <div className="registrar-partida-novo-sugestoes" role="listbox">
          {buscando && <span className="registrar-partida-novo-sugestao-status">Buscando atletas...</span>}
          {sugestoesCampo.map((atleta) => (
            <button
              type="button"
              key={`${campo}-${atleta.id}`}
              className="registrar-partida-novo-sugestao"
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => {
                onSelecionarAtleta(campo, atleta);
                focusNextField(proximoRef);
              }}
            >
              <AvatarUsuario
                nome={atleta.apelido || atleta.nome}
                fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                tamanho="sm"
                className="registrar-partida-novo-avatar"
              />
              <span>
                <strong>{atleta.nome}</strong>
                <small>{montarDetalhesAtleta(atleta)}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function DuplaRegistro({ numero, dados, selecoes, sugestoes, campoBuscando, inputRef, inputRef2, proximoRef1, proximoRef2, vencedora, onAlterarCampo, onSelecionarAtleta }) {
  const prefixo = numero === 1 ? 'dupla1' : 'dupla2';
  const ganhou = vencedora === prefixo;

  return (
    <section className={`registrar-partida-novo-dupla-card ${ganhou ? 'vencedora' : ''}`}>
      <div className="registrar-partida-novo-dupla-topo">
        <span>Dupla {numero}</span>
        {ganhou && <strong><FaTrophy aria-hidden="true" /> Vencendo</strong>}
      </div>
      <div className="registrar-partida-novo-campos">
        <AutocompleteAtleta
          campo={`${prefixo}.atletaDireita`}
          rotulo="Atleta 1"
          placeholder="Nome ou apelido"
          dados={dados}
          selecao={selecoes[`${prefixo}.atletaDireita`]}
          sugestoes={sugestoes}
          buscando={campoBuscando === `${prefixo}.atletaDireita`}
          inputRef={inputRef}
          proximoRef={proximoRef1}
          onAlterarCampo={onAlterarCampo}
          onSelecionarAtleta={onSelecionarAtleta}
        />
        <AutocompleteAtleta
          campo={`${prefixo}.atletaEsquerda`}
          rotulo="Atleta 2"
          placeholder="Nome ou apelido"
          dados={dados}
          selecao={selecoes[`${prefixo}.atletaEsquerda`]}
          sugestoes={sugestoes}
          buscando={campoBuscando === `${prefixo}.atletaEsquerda`}
          inputRef={inputRef2}
          proximoRef={proximoRef2}
          onAlterarCampo={onAlterarCampo}
          onSelecionarAtleta={onSelecionarAtleta}
        />
      </div>
    </section>
  );
}

function PlacarCentral({ dados, placar1Ref, placar2Ref, onAlterarCampo, onRevisar }) {
  function alterarPlacar(campo, valor) {
    onAlterarCampo(campo, valor);

    const valorLimpo = String(valor || '').replace(/\D/g, '').slice(0, 2);
    if (campo === 'dupla1.pontos' && valorLimpo.length === 2) {
      window.setTimeout(() => placar2Ref.current?.focus(), 0);
    }

    if (campo === 'dupla2.pontos' && valorLimpo.length === 2) {
      window.setTimeout(() => onRevisar?.(), 80);
    }
  }

  return (
    <section className="registrar-partida-novo-placar-central" aria-label="Placar da partida">
      <span>Placar</span>
      <div className="registrar-partida-novo-placar">
        <label>
          <small>Dupla 1</small>
          <input
            ref={placar1Ref}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            enterKeyHint="next"
            value={dados.dupla1.pontos}
            onChange={(evento) => alterarPlacar('dupla1.pontos', evento.target.value)}
            onFocus={scrollFocusedInputIntoView}
            onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(placar2Ref))}
            placeholder="0"
            aria-label="Pontos da Dupla 1"
          />
        </label>
        <strong aria-hidden="true">x</strong>
        <label>
          <small>Dupla 2</small>
          <input
            ref={placar2Ref}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            enterKeyHint="done"
            value={dados.dupla2.pontos}
            onChange={(evento) => alterarPlacar('dupla2.pontos', evento.target.value)}
            onFocus={scrollFocusedInputIntoView}
            onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, onRevisar)}
            placeholder="0"
            aria-label="Pontos da Dupla 2"
          />
        </label>
      </div>
    </section>
  );
}

function RegistroUnico(props) {
  const [opcoesAbertas, setOpcoesAbertas] = useState(false);
  const vencedor = obterVencedora(props.dados);

  return (
    <section className="registrar-partida-novo-etapa registrar-partida-novo-registro">
      <div className="registrar-partida-novo-intro">
        <span className="registrar-partida-novo-kicker">Registro rápido</span>
        <h3>Atletas e placar</h3>
        <p>Informe as duas duplas, registre o placar e revise antes de salvar.</p>
      </div>

      <div className="registrar-partida-novo-registro-grid">
        <DuplaRegistro
          numero={1}
          vencedora={vencedor}
          {...props}
          inputRef={props.atletaRefs.dupla1Atleta1}
          inputRef2={props.atletaRefs.dupla1Atleta2}
          proximoRef1={props.atletaRefs.dupla1Atleta2}
          proximoRef2={props.atletaRefs.dupla2Atleta1}
        />
        <PlacarCentral
          dados={props.dados}
          placar1Ref={props.placar1Ref}
          placar2Ref={props.placar2Ref}
          onAlterarCampo={props.onAlterarCampo}
          onRevisar={props.onRevisar}
        />
        <DuplaRegistro
          numero={2}
          vencedora={vencedor}
          {...props}
          inputRef={props.atletaRefs.dupla2Atleta1}
          inputRef2={props.atletaRefs.dupla2Atleta2}
          proximoRef1={props.atletaRefs.dupla2Atleta2}
          proximoRef2={props.placar1Ref}
        />
      </div>

      <details
        className="registrar-partida-novo-opcoes"
        open={opcoesAbertas}
        onToggle={(evento) => setOpcoesAbertas(evento.currentTarget.open)}
      >
        <summary>Opções da partida</summary>
        <div>
          <span>Data e hora</span>
          <strong>Agora</strong>
        </div>
        {props.resumo?.contexto?.grupoId && (
          <div>
            <span>Grupo</span>
            <strong>Selecionado</strong>
          </div>
        )}
        {props.resumo?.contexto?.categoriaId && (
          <div>
            <span>Categoria</span>
            <strong>Selecionada</strong>
          </div>
        )}
      </details>

      <button type="button" className="botao-link botao-fechar-teclado" onClick={blurActiveElement}>
        Fechar teclado
      </button>
    </section>
  );
}

function ResumoDupla({ titulo, atletas, destaque }) {
  return (
    <div className={`registrar-partida-novo-resumo-dupla ${destaque ? 'vencedora' : ''}`}>
      <span>{titulo}</span>
      {atletas.map((atleta, indice) => (
        <strong key={`${titulo}-${indice}`}>{atleta || 'Atleta pendente'}</strong>
      ))}
    </div>
  );
}

function RevisaoRapida({ resumo, dados, salvando, onEditar, onSalvar }) {
  const contexto = resumo.contexto || {};
  const vencedora = obterVencedora(dados);

  return (
    <section className="registrar-partida-novo-revisao" aria-label="Revisão rápida da partida">
      <div className="registrar-partida-novo-sheet">
        <div className="registrar-partida-novo-intro">
          <span className="registrar-partida-novo-kicker">Revisão</span>
          <h3>Conferir partida</h3>
          <p>Confira atletas e placar antes de salvar.</p>
        </div>

        <div className="registrar-partida-novo-resumo-card">
          <ResumoDupla titulo="Dupla 1" atletas={resumo.dupla1} destaque={vencedora === 'dupla1'} />
          <div className="registrar-partida-novo-resumo-placar">
            <strong>{resumo.placar.dupla1 || 0}</strong>
            <span>x</span>
            <strong>{resumo.placar.dupla2 || 0}</strong>
          </div>
          <ResumoDupla titulo="Dupla 2" atletas={resumo.dupla2} destaque={vencedora === 'dupla2'} />
        </div>

        <div className="registrar-partida-novo-meta-lista">
          <div className="registrar-partida-novo-meta">
            <span>Data e hora</span>
            <strong>{formatarData(resumo.data)}</strong>
          </div>
          {contexto.grupoId && (
            <div className="registrar-partida-novo-meta">
              <span>Grupo</span>
              <strong>Selecionado</strong>
            </div>
          )}
          {contexto.categoriaId && (
            <div className="registrar-partida-novo-meta">
              <span>Categoria</span>
              <strong>Selecionada</strong>
            </div>
          )}
        </div>

        <div className="registrar-partida-novo-acoes registrar-partida-novo-acoes-revisao">
          <button type="button" className="botao-secundario" onClick={onEditar} disabled={salvando}>
            Editar
          </button>
          <button type="button" className="botao-primario" onClick={onSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar partida'}
          </button>
        </div>
      </div>
    </section>
  );
}

function TelaSucesso({ sucesso, onAdicionarMidia, onVerPartida, onRegistrarRevanche, onRegistrarNovaPartida, onFechar }) {
  const resumo = sucesso?.resumo;
  const partidaId = sucesso?.partida?.id;

  return (
    <section className="registrar-partida-novo-sucesso">
      <div className="registrar-partida-novo-check">
        <FaCheck aria-hidden="true" />
      </div>
      <span className="registrar-partida-novo-kicker">Partida registrada</span>
      <h3>Partida salva</h3>
      <p>Agora você pode compartilhar, anexar mídia ou registrar outra partida.</p>

      {resumo && (
        <div className="registrar-partida-novo-resumo-card">
          <ResumoDupla titulo="Dupla 1" atletas={resumo.dupla1} />
          <div className="registrar-partida-novo-resumo-placar">
            <strong>{resumo.placar.dupla1}</strong>
            <span>x</span>
            <strong>{resumo.placar.dupla2}</strong>
          </div>
          <ResumoDupla titulo="Dupla 2" atletas={resumo.dupla2} />
        </div>
      )}

      <div className="registrar-partida-novo-meta registrar-partida-novo-meta-sucesso">
        <span>{formatarIdPartida(sucesso?.partida)}</span>
        <strong>{formatarData(resumo?.salvoEm || new Date())}</strong>
      </div>

      <div className="registrar-partida-novo-acoes registrar-partida-novo-acoes-sucesso">
        {partidaId && <CompartilharPartidaBotao partidaId={partidaId} />}
        <button type="button" className="botao-primario" onClick={onAdicionarMidia}>
          <FaImage aria-hidden="true" />
          Adicionar foto ou vídeo
        </button>
        <button type="button" className="botao-secundario" onClick={onVerPartida}>
          Ver partida
        </button>
        <button type="button" className="botao-secundario" onClick={onRegistrarRevanche}>
          <FaRedo aria-hidden="true" />
          Repetir última partida
        </button>
        <button type="button" className="botao-link" onClick={onRegistrarNovaPartida}>
          Registrar nova partida
        </button>
        <button type="button" className="botao-link" onClick={onFechar}>
          Continuar depois
        </button>
      </div>
    </section>
  );
}

function Stepper({ etapas, indiceEtapa }) {
  return (
    <nav className="registrar-partida-novo-stepper" aria-label="Momentos do registro">
      {etapas.map((etapa, indice) => (
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
      <span className={`registrar-partida-novo-stepper-item ${Boolean(indiceEtapa > etapas.length - 1) ? 'ativo' : ''}`}>
        <FaCheck aria-hidden="true" />
        <small>Pós-registro</small>
      </span>
    </nav>
  );
}

export function RegistrarPartidaNovoModal({
  aberto,
  etapas,
  etapaAtual,
  indiceEtapa,
  dados,
  selecoes,
  resumo,
  sucesso,
  sugestoes,
  campoBuscando,
  erro,
  salvando,
  revisando,
  onAlterarCampo,
  onSelecionarAtleta,
  onConfirmarEtapa,
  onVoltar,
  onRevisar,
  onFechar,
  onAdicionarMidia,
  onVerPartida,
  onRegistrarRevanche,
  onRegistrarNovaPartida
}) {
  const campoRef = useRef(null);
  const dupla1Atleta2Ref = useRef(null);
  const dupla2Atleta1Ref = useRef(null);
  const dupla2Atleta2Ref = useRef(null);
  const atletaRefs = {
    dupla1Atleta1: campoRef,
    dupla1Atleta2: dupla1Atleta2Ref,
    dupla2Atleta1: dupla2Atleta1Ref,
    dupla2Atleta2: dupla2Atleta2Ref
  };
  const placar1Ref = useRef(null);
  const placar2Ref = useRef(null);

  useEffect(() => {
    if (aberto && !sucesso && !revisando) {
      campoRef.current?.focus();
    }
  }, [aberto, revisando, sucesso]);

  if (!aberto) {
    return null;
  }

  return (
    <div className="modal-sobreposicao registrar-partida-novo-sobreposicao" role="presentation">
      <section
        className="modal-conteudo registrar-partida-novo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registrar-partida-novo-titulo"
      >
        <HeaderModal
          etapas={etapas}
          indiceEtapa={indiceEtapa}
          etapaAtual={etapaAtual}
          salvando={salvando}
          onVoltar={onVoltar}
          onFechar={onFechar}
          sucesso={sucesso}
        />

        {sucesso ? (
          <TelaSucesso
            sucesso={sucesso}
            onAdicionarMidia={onAdicionarMidia}
            onVerPartida={onVerPartida}
            onRegistrarRevanche={onRegistrarRevanche}
            onRegistrarNovaPartida={onRegistrarNovaPartida}
            onFechar={onFechar}
          />
        ) : (
          <form className="registrar-partida-novo-formulario" onSubmit={onConfirmarEtapa}>
            <main className="registrar-partida-novo-corpo">
              {erro && <p className="texto-erro registrar-partida-novo-erro">{erro}</p>}
              {revisando ? (
                <RevisaoRapida
                  resumo={resumo}
                  dados={dados}
                  salvando={salvando}
                  onEditar={onVoltar}
                  onSalvar={onConfirmarEtapa}
                />
              ) : (
                <RegistroUnico
                  dados={dados}
                  selecoes={selecoes}
                  resumo={resumo}
                  sugestoes={sugestoes}
                  campoBuscando={campoBuscando}
                  inputRef={campoRef}
                  atletaRefs={atletaRefs}
                  placar1Ref={placar1Ref}
                  placar2Ref={placar2Ref}
                  onAlterarCampo={onAlterarCampo}
                  onSelecionarAtleta={onSelecionarAtleta}
                  onRevisar={onRevisar}
                />
              )}
            </main>

            {!revisando && (
              <div className="registrar-partida-novo-acoes">
                <button type="submit" className="botao-primario" disabled={salvando}>
                  Revisar partida
                </button>
              </div>
            )}

            <Stepper etapas={etapas} indiceEtapa={indiceEtapa} />
          </form>
        )}
      </section>
    </div>
  );
}
