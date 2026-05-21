export function ConfirmarDuplicidadePartidaModal({
  mensagem,
  salvando,
  onCancelar,
  onConfirmar
}) {
  return (
    <div className="modal-sobreposicao" role="presentation">
      <section
        className="modal-conteudo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-duplicidade-partida-titulo"
      >
        <div className="modal-cabecalho">
          <div>
            <h3 id="confirmar-duplicidade-partida-titulo">Possível partida duplicada</h3>
            <p>{mensagem}</p>
          </div>
        </div>

        <div className="acoes-formulario">
          <button type="button" className="botao-secundario" onClick={onCancelar} disabled={salvando}>
            Não, revisar
          </button>
          <button type="button" className="botao-primario" onClick={onConfirmar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Sim, registrar'}
          </button>
        </div>
      </section>
    </div>
  );
}
