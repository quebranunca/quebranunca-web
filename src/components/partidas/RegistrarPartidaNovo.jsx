import { useState } from 'react';
import { RegistrarPartidaNovoContainer } from '../../containers/partidas/RegistrarPartidaNovoContainer';
import './registrar-partida-novo.css';

export function RegistrarPartidaNovo() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button type="button" className="botao-primario" onClick={() => setAberto(true)}>
        Registrar partida
      </button>

      {aberto && (
        <RegistrarPartidaNovoContainer onFechar={() => setAberto(false)} />
      )}
    </>
  );
}
