import { useNavigate } from 'react-router-dom';

export function BotaoVoltar({
  mostrarTexto = true,
  rotaFallback = '/',
  fallback,
  rotulo = 'Voltar'
}) {
  const navegar = useNavigate();
  const destinoFallback = fallback || rotaFallback;

  function aoVoltar() {
    const indiceHistorico = window.history.state?.idx;

    if (typeof indiceHistorico === 'number' && indiceHistorico > 0) {
      navegar(-1);
      return;
    }

    navegar(destinoFallback);
  }

  return (
    <button
      type="button"
      className="botao-terciario botao-voltar"
      onClick={aoVoltar}
      aria-label={rotulo}
      title={rotulo}
    >
      <span className="botao-voltar-icone" aria-hidden="true">&larr;</span>
      {mostrarTexto && <span>{rotulo}</span>}
    </button>
  );
}
