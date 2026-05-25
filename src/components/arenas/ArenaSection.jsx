export function ArenaSection({ titulo, descricao, children, placeholder }) {
  const conteudo = children ?? (placeholder ? <div className="arena-placeholder">{placeholder}</div> : null);

  return (
    <section className="arena-section">
      <div className="arena-section__header">
        <div>
          <p className="arena-section__eyebrow">{titulo}</p>
          {descricao && <p className="arena-section__descricao">{descricao}</p>}
        </div>
      </div>

      {conteudo}
    </section>
  );
}
