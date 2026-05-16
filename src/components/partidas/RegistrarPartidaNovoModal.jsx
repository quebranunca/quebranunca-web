import { useEffect, useRef } from 'react';

function obterValorCampo(dados, campo) {
  return campo.split('.').reduce((valor, parte) => valor?.[parte], dados) ?? '';
}

export function RegistrarPartidaNovoModal({
  aberto,
  etapa,
  totalEtapas,
  dados,
  erro,
  salvando,
  etapaFinal,
  onAlterarCampo,
  onConfirmarEtapa,
  onVoltar,
  onFechar
}) {
  const campoRef = useRef(null);

  useEffect(() => {
    if (aberto) {
      campoRef.current?.focus();
    }
  }, [aberto, etapa.indice]);

  if (!aberto) {
    return null;
  }

  const valorCampo = etapa.campo ? obterValorCampo(dados, etapa.campo) : '';
  const podeVoltar = etapa.indice > 0 && !salvando;

  return (
    <div className="modal-sobreposicao registrar-partida-novo-sobreposicao" role="presentation">
      <section
        className="modal-conteudo registrar-partida-novo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registrar-partida-novo-titulo"
      >
        <button
          type="button"
          className="registrar-partida-novo-fechar"
          onClick={onFechar}
          disabled={salvando}
          aria-label="Fechar registro de partida"
        >
          <span>Fechar</span>
          <strong aria-hidden="true">×</strong>
        </button>

        <div className="modal-cabecalho registrar-partida-novo-cabecalho">
          <div>
            <h3 id="registrar-partida-novo-titulo">{etapa.titulo}</h3>
            {etapa.descricao && <p>{etapa.descricao}</p>}
          </div>
        </div>

        <form className="registrar-partida-novo-formulario" onSubmit={onConfirmarEtapa}>
          {erro && <p className="texto-erro">{erro}</p>}

          <label>
            {etapa.rotulo}
            <input
              ref={campoRef}
              type={etapa.tipo === 'numero' ? 'number' : 'text'}
              min={etapa.tipo === 'numero' ? 0 : undefined}
              value={valorCampo}
              onChange={(evento) => onAlterarCampo(etapa.campo, evento.target.value)}
              placeholder={etapa.placeholder}
              autoComplete="off"
            />
          </label>

          <div className="acoes-formulario registrar-partida-novo-acoes">
            <button type="submit" className="botao-primario" disabled={salvando}>
              {etapaFinal ? (salvando ? 'Salvando...' : 'Salvar jogo') : 'Confirmar'}
            </button>
            {podeVoltar && (
              <button
                type="button"
                className="botao-secundario"
                onClick={onVoltar}
                disabled={salvando}
              >
                Voltar
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
