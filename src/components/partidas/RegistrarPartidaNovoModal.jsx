import { useEffect, useRef } from 'react';
import {
  FaCheck,
  FaChevronLeft,
  FaClipboardCheck,
  FaImage,
  FaTimes,
  FaTrophy,
  FaUserFriends
} from 'react-icons/fa';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';

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

function Progresso({ etapas, indiceEtapa }) {
  return (
    <div className="registrar-partida-novo-progresso" aria-label={`Etapa ${indiceEtapa + 1} de ${etapas.length}`}>
      <div className="registrar-partida-novo-pontos" aria-hidden="true">
        {etapas.map((etapa, indice) => (
          <span
            key={etapa.id}
            className={indice <= indiceEtapa ? 'ativo' : ''}
          />
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
        aria-label="Voltar etapa"
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

function AutocompleteAtleta({
  campo,
  rotulo,
  placeholder,
  dados,
  selecao,
  sugestoes,
  buscando,
  inputRef,
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
        type="text"
        value={valor}
        onChange={(evento) => onAlterarCampo(campo, evento.target.value)}
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
              onClick={() => onSelecionarAtleta(campo, atleta)}
            >
              <AvatarUsuario
                nome={atleta.apelido || atleta.nome}
                fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                tamanho="sm"
                className="registrar-partida-novo-avatar"
              />
              <span>
                <strong>{atleta.nome}</strong>
                <small>
                  {atleta.apelido ? `@${atleta.apelido}` : 'Atleta QuebraNunca'}
                  {(atleta.cidade || atleta.estado) && ` • ${[atleta.cidade, atleta.estado].filter(Boolean).join('/')}`}
                  {Number.isFinite(atleta.quantidadeJogos) && ` • ${atleta.quantidadeJogos} jogos`}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function EtapaDupla({ numero, dados, selecoes, sugestoes, campoBuscando, inputRef, onAlterarCampo, onSelecionarAtleta }) {
  const prefixo = numero === 1 ? 'dupla1' : 'dupla2';
  const titulo = numero === 1 ? 'Monte sua dupla' : 'Informe a dupla adversária';
  const descricao = numero === 1
    ? 'Escolha os dois atletas da sua dupla para registrar o jogo com menos toques.'
    : 'Busque pelos nomes ou apelidos para evitar duplicidade de atletas.';

  return (
    <section className="registrar-partida-novo-etapa">
      <div className="registrar-partida-novo-intro">
        <span className="registrar-partida-novo-kicker">Dupla {numero}</span>
        <h3>{titulo}</h3>
        <p>{descricao}</p>
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
          onAlterarCampo={onAlterarCampo}
          onSelecionarAtleta={onSelecionarAtleta}
        />
      </div>
    </section>
  );
}

function EtapaPlacar({ dados, inputRef, onAlterarCampo }) {
  return (
    <section className="registrar-partida-novo-etapa registrar-partida-novo-etapa-placar">
      <div className="registrar-partida-novo-intro">
        <span className="registrar-partida-novo-kicker">Placar</span>
        <h3>Resultado final</h3>
        <p>Use o teclado numérico para registrar rapidamente a pontuação da partida.</p>
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
            value={dados.dupla1.pontos}
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
            value={dados.dupla2.pontos}
            onChange={(evento) => onAlterarCampo('dupla2.pontos', evento.target.value)}
            placeholder="0"
          />
        </label>
      </div>      
    </section>
  );
}

function ResumoDupla({ titulo, atletas }) {
  return (
    <div className="registrar-partida-novo-resumo-dupla">
      <span>{titulo}</span>
      {atletas.map((atleta, indice) => (
        <strong key={`${titulo}-${indice}`}>{atleta || 'Atleta pendente'}</strong>
      ))}
    </div>
  );
}

function EtapaResumo({ resumo, confirmar = false }) {
  const contexto = resumo.contexto || {};

  return (
    <section className="registrar-partida-novo-etapa">
      <div className="registrar-partida-novo-intro">
        <span className="registrar-partida-novo-kicker">{confirmar ? 'Confirmar' : 'Resumo'}</span>
        <h3>{confirmar ? 'Tudo pronto para salvar' : 'Revise a partida'}</h3>
        <p>{confirmar ? 'A partida será enviada para as estatísticas, rankings e pendências quando necessário.' : 'Confira atletas e placar antes de continuar.'}</p>
      </div>

      <div className="registrar-partida-novo-resumo-card">
        <ResumoDupla titulo="Dupla 1" atletas={resumo.dupla1} />
        <div className="registrar-partida-novo-resumo-placar">
          <strong>{resumo.placar.dupla1 || 0}</strong>
          <span>x</span>
          <strong>{resumo.placar.dupla2 || 0}</strong>
        </div>
        <ResumoDupla titulo="Dupla 2" atletas={resumo.dupla2} />
      </div>

      <div className="registrar-partida-novo-meta">
        <span>Data e hora</span>
        <strong>{formatarData(resumo.data)}</strong>
      </div>

      {(contexto.grupoId || contexto.categoriaId) && (
        <div className="registrar-partida-novo-meta">
          <span>Contexto</span>
          <strong>{contexto.categoriaId ? 'Categoria selecionada' : 'Grupo selecionado'}</strong>
        </div>
      )}
    </section>
  );
}

function TelaSucesso({ sucesso, onAdicionarMidia, onVerPartida, onRegistrarRevanche, onFechar }) {
  const resumo = sucesso?.resumo;

  return (
    <section className="registrar-partida-novo-sucesso">
      <div className="registrar-partida-novo-check">
        <FaCheck aria-hidden="true" />
      </div>
      <span className="registrar-partida-novo-kicker">Partida registrada</span>
      <h3>Partida salva com sucesso!</h3>
      <p>Sua partida foi registrada e já está disponível nas estatísticas e rankings.</p>

      {resumo && (
        <div className="registrar-partida-novo-resumo-card">
          <ResumoDupla titulo="Sua dupla" atletas={resumo.dupla1} />
          <div className="registrar-partida-novo-resumo-placar">
            <strong>{resumo.placar.dupla1}</strong>
            <span>x</span>
            <strong>{resumo.placar.dupla2}</strong>
          </div>
          <ResumoDupla titulo="Dupla adversária" atletas={resumo.dupla2} />
        </div>
      )}

      <div className="registrar-partida-novo-meta registrar-partida-novo-meta-sucesso">
        <span>{formatarIdPartida(sucesso?.partida)}</span>
        <strong>{formatarData(resumo?.salvoEm || new Date())}</strong>
      </div>

      <div className="registrar-partida-novo-acoes registrar-partida-novo-acoes-sucesso">
        <button type="button" className="botao-primario" onClick={onAdicionarMidia}>
          <FaImage aria-hidden="true" />
          Adicionar foto ou vídeo
        </button>
        <button type="button" className="botao-primario" onClick={onVerPartida}>
          Ver partida
        </button>
        <button type="button" className="botao-secundario" onClick={onRegistrarRevanche}>
          Registrar revanche
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
    <nav className="registrar-partida-novo-stepper" aria-label="Etapas do registro">
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
  etapaFinal,
  onAlterarCampo,
  onSelecionarAtleta,
  onConfirmarEtapa,
  onVoltar,
  onFechar,
  onAdicionarMidia,
  onVerPartida,
  onRegistrarRevanche
}) {
  const campoRef = useRef(null);

  useEffect(() => {
    if (aberto && !sucesso) {
      campoRef.current?.focus();
    }
  }, [aberto, indiceEtapa, sucesso]);

  if (!aberto) {
    return null;
  }

  function renderizarEtapa() {
    if (etapaAtual.id === 'dupla1') {
      return (
        <EtapaDupla
          numero={1}
          dados={dados}
          selecoes={selecoes}
          sugestoes={sugestoes}
          campoBuscando={campoBuscando}
          inputRef={campoRef}
          onAlterarCampo={onAlterarCampo}
          onSelecionarAtleta={onSelecionarAtleta}
        />
      );
    }

    if (etapaAtual.id === 'dupla2') {
      return (
        <EtapaDupla
          numero={2}
          dados={dados}
          selecoes={selecoes}
          sugestoes={sugestoes}
          campoBuscando={campoBuscando}
          inputRef={campoRef}
          onAlterarCampo={onAlterarCampo}
          onSelecionarAtleta={onSelecionarAtleta}
        />
      );
    }

    if (etapaAtual.id === 'placar') {
      return <EtapaPlacar dados={dados} inputRef={campoRef} onAlterarCampo={onAlterarCampo} />;
    }

    if (etapaAtual.id === 'confirmar') {
      return <EtapaResumo resumo={resumo} confirmar />;
    }

    return <EtapaResumo resumo={resumo} />;
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
            onFechar={onFechar}
          />
        ) : (
          <form className="registrar-partida-novo-formulario" onSubmit={onConfirmarEtapa}>
            <main className="registrar-partida-novo-corpo">
              {erro && <p className="texto-erro registrar-partida-novo-erro">{erro}</p>}
              {renderizarEtapa()}
            </main>

            <div className="registrar-partida-novo-acoes">
              <button type="submit" className="botao-primario" disabled={salvando}>
                {etapaFinal ? (salvando ? 'Salvando...' : 'Salvar partida') : 'Continuar'}
              </button>
            </div>

            <Stepper etapas={etapas} indiceEtapa={indiceEtapa} />
          </form>
        )}
      </section>
    </div>
  );
}
