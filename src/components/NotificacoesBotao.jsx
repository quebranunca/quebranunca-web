import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { EVENTO_PENDENCIAS_ATUALIZADAS, pendenciasServico } from '../services/pendenciasServico';

export function NotificacoesBotao({ autenticado, resumo }) {
  const navegar = useNavigate();
  const [resumoCarregado, setResumoCarregado] = useState(null);
  const resumoControlado = resumo !== undefined;
  const resumoAtual = resumoControlado ? resumo : resumoCarregado;
  const totalPendencias = Number(resumoAtual?.total || 0);
  const temPendencia = totalPendencias > 0;

  useEffect(() => {
    async function carregarPendencias() {
      if (!autenticado || resumoControlado) {
        setResumoCarregado(null);
        return;
      }

      try {
        setResumoCarregado(await pendenciasServico.obterResumo());
      } catch (erro) {
        console.error('Erro ao carregar notificações.', erro);
        setResumoCarregado(null);
      }
    }

    carregarPendencias();

    if (!autenticado || resumoControlado) {
      return undefined;
    }

    window.addEventListener(EVENTO_PENDENCIAS_ATUALIZADAS, carregarPendencias);
    return () => window.removeEventListener(EVENTO_PENDENCIAS_ATUALIZADAS, carregarPendencias);
  }, [autenticado, resumoControlado]);

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
      aria-label={temPendencia ? `Abrir ${totalPendencias} pendência(s)` : 'Abrir pendências'}
      title="Pendências"
    >
      <span className="icone-notificacao" aria-hidden="true">
        <FaBell />

        {temPendencia && (
          <span className="indicador-alerta" aria-hidden="true">
            {totalPendencias > 99 ? '99+' : totalPendencias}
          </span>
        )}
      </span>
    </button>
  );
}
