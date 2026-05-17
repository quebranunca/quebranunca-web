import { useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';

export function HeaderBackButton({
  mostrarTexto = true,
  rotaFallback = '/app',
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
      className="botao-terciario botao-voltar header-back-button"
      onClick={aoVoltar}
      aria-label={rotulo}
      title={rotulo}
    >
      <span className="botao-voltar-icone" aria-hidden="true">
        <FaChevronLeft />
      </span>
      {mostrarTexto && <span>{rotulo}</span>}
    </button>
  );
}

export function BotaoVoltar(props) {
  return <HeaderBackButton {...props} />;
}
