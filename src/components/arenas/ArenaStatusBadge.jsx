export function ArenaStatusBadge({ ativa, fallback = 'Sem status' }) {
  if (ativa === true) {
    return <span className="arena-badge arena-badge--status arena-badge--ativo">Ativa</span>;
  }

  if (ativa === false) {
    return <span className="arena-badge arena-badge--status arena-badge--inativo">Inativa</span>;
  }

  return <span className="arena-badge arena-badge--status arena-badge--indefinido">{fallback}</span>;
}
