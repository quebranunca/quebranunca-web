export function PlacarDupla({
  label,
  atletas,
  placar,
  vencedor = false
}) {
  return (
    <div className="dupla-linha">
      {label && <span className="dupla-label">{label}</span>}

      <div className={`dupla-conteudo ${vencedor ? 'vencedor' : ''}`}>
        <div className="dupla-nome">
          {atletas}
        </div>

        <div className="dupla-placar">
          {placar}
        </div>
      </div>
    </div>
  );
}