import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../services/http';

export function NotificacoesBotao({ autenticado }) {
  const navegar = useNavigate();
  const [temPendencia, setTemPendencia] = useState(false);

  useEffect(() => {
    async function carregarPendencias() {
      if (!autenticado) {
        setTemPendencia(false);
        return;
      }

      try {
        const resposta = await http.get('/pendencias/existe');
        setTemPendencia(resposta.data === true);
      } catch (erro) {
        console.error('Erro ao carregar notificações.', erro);
        setTemPendencia(false);
      }
    }

    carregarPendencias();
  }, [autenticado]);

  function aoAbrirPendencias() {
    navegar('/app/pendencias');
  }

  return (
    <button
      type="button"
      className={`botao-terciario botao-topo-icone botao-notificacoes-topo ${
        temPendencia ? 'tem-notificacao' : ''
      }`}
      onClick={aoAbrirPendencias}
    >
      <span className="icone-notificacao">
        <svg viewBox="0 0 24 24" className="icone-svg" aria-hidden="true">
          <path
            d="M18 8a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2V8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>

        {temPendencia && <span className="indicador-alerta" />}
      </span>
    </button>
  );
}