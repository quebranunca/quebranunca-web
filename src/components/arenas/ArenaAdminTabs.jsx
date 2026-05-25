export function ArenaAdminTabs({ abas, abaAtual, onSelecionar }) {
  return (
    <div className="arena-admin-tabs" role="tablist" aria-label="Abas do dashboard administrativo da arena">
      {abas.map((aba) => (
        <button
          key={aba.id}
          type="button"
          role="tab"
          aria-selected={abaAtual === aba.id}
          className={`arena-admin-tab ${abaAtual === aba.id ? 'arena-admin-tab--ativo' : ''}`}
          onClick={() => onSelecionar(aba.id)}
        >
          {aba.rotulo}
        </button>
      ))}
    </div>
  );
}
