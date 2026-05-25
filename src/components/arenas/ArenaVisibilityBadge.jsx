export function ArenaVisibilityBadge({ publica, fallback = 'Sem visibilidade' }) {
  if (publica === true) {
    return <span className="arena-badge arena-badge--status arena-badge--publica">Pública</span>;
  }

  if (publica === false) {
    return <span className="arena-badge arena-badge--status arena-badge--privada">Privada</span>;
  }

  return <span className="arena-badge arena-badge--status arena-badge--indefinido">{fallback}</span>;
}
