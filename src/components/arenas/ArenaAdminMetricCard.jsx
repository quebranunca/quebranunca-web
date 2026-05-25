export function ArenaAdminMetricCard({ rotulo, valor, descricao }) {
  return (
    <article className="arena-admin-metric-card">
      <p className="arena-admin-metric-card__rotulo">{rotulo}</p>
      <h3>{valor}</h3>
      {descricao && <p className="arena-admin-metric-card__descricao">{descricao}</p>}
    </article>
  );
}
