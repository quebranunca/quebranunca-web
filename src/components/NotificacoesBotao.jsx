import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { http } from '../services/http';

export function NotificacoesBotao({ autenticado, contador = null }) {
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
      aria-label={temPendencia ? 'Abrir pendências e notificações' : 'Abrir notificações'}
      title="Pendências"
    >
      <span className="icone-notificacao" aria-hidden="true">
        <FaBell />

        {temPendencia && (
          <span className="indicador-alerta">
            {contador ? contador : ''}
          </span>
        )}
      </span>
    </button>
  );
}
