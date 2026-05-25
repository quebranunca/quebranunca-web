export function ArenaEmptyState({ titulo, descricao, acao }) {
  return (
    <section className="arena-empty-state">
      <h3>{titulo}</h3>
      <p>{descricao}</p>
      {acao}
    </section>
  );
}
