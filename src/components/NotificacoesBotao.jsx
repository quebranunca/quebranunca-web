import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../services/http';

export function NotificacoesBotao({ autenticado }) {
  const navegar = useNavigate();
  const [totalPendencias, setTotalPendencias] = useState(0);

  useEffect(() => {
    async function carregarPendencias() {
      if (!autenticado) {
        setTotalPendencias(0);
        return;
      }

      try {
        const resposta = await http.get('/pendencias');
        const dados = resposta.data ?? [];

        setTotalPendencias(Array.isArray(dados) ? dados.length : 0);
      } catch (erro) {
        console.error('Erro ao carregar notificações.', erro);
        setTotalPendencias(0);
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
            totalPendencias > 0 ? 'tem-notificacao' : ''
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
            {totalPendencias > 0 && (
            <span className="indicador-alerta">!</span>
            )}
        </span>

        {totalPendencias > 0 && (
            <span className="badge-notificacoes-topo">
            {totalPendencias > 99 ? '99+' : totalPendencias}
            </span>
        )}
    </button>
  );
}