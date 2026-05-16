export function PlacarDuplaEditavel({
  label,
  atletaDireita,
  atletaEsquerda,
  pontos,
  onChangeAtletaDireita,
  onChangeAtletaEsquerda,
  onChangePontos,
  primeiroCampoRef,
  disabled = false
}) {
  return (
    <section className="secao-dupla-partida">
      <div className="secao-dupla-partida-cabecalho">
        <strong>{label}</strong>
      </div>

      <label>
        Atleta lado direito
        <input
          ref={primeiroCampoRef}
          type="text"
          value={atletaDireita}
          onChange={(evento) => onChangeAtletaDireita(evento.target.value)}
          placeholder="Nome ou apelido"
          autoComplete="off"
          disabled={disabled}
        />
      </label>

      <label>
        Atleta lado esquerdo
        <input
          type="text"
          value={atletaEsquerda}
          onChange={(evento) => onChangeAtletaEsquerda(evento.target.value)}
          placeholder="Nome ou apelido"
          autoComplete="off"
          disabled={disabled}
        />
      </label>

      <label>
        Pontos
        <input
          type="number"
          min={0}
          value={pontos}
          onChange={(evento) => onChangePontos(evento.target.value)}
          disabled={disabled}
        />
      </label>
    </section>
  );
}
