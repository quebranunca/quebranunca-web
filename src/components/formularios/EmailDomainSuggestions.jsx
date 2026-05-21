import { appendEmailDomain, dominiosEmailRapidos, deveExibirAtalhosEmail, focusNextField } from '../../utils/tecladoMobile';

export function EmailDomainSuggestions({
  valor,
  onChange,
  inputRef,
  proximoRef,
  className = ''
}) {
  if (!deveExibirAtalhosEmail(valor)) {
    return null;
  }

  function aplicarDominio(dominio) {
    onChange(appendEmailDomain(valor, dominio));
    if (proximoRef) {
      focusNextField(proximoRef);
      return;
    }

    focusNextField(inputRef);
  }

  return (
    <div className={`atalhos-email ${className}`.trim()} aria-label="Atalhos de domínio de e-mail">
      {dominiosEmailRapidos.map((dominio) => (
        <button
          key={dominio}
          type="button"
          className="atalho-email-botao"
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => aplicarDominio(dominio)}
        >
          {dominio}
        </button>
      ))}
    </div>
  );
}
