import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CriarGrupoFluxo } from './CriarGrupoFluxo';

export function CriarGrupoFluxoModal({
  aberto,
  onFechar,
  onCriado
}) {
  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    document.documentElement.classList.add('criar-grupo-wizard-aberto');
    document.body.classList.add('criar-grupo-wizard-aberto');

    return () => {
      document.documentElement.classList.remove('criar-grupo-wizard-aberto');
      document.body.classList.remove('criar-grupo-wizard-aberto');
    };
  }, [aberto]);

  if (!aberto) {
    return null;
  }

  return createPortal(
    <div className="modal-sobreposicao criar-grupo-sobreposicao" role="presentation">
      <CriarGrupoFluxo
        modoExibicao="modal"
        onFechar={onFechar}
        onCriado={onCriado}
      />
    </div>,
    document.body
  );
}
