import { FaExternalLinkAlt, FaInstagram, FaWhatsapp } from 'react-icons/fa';

function prefixarInstagram(valor) {
  if (!valor) {
    return '';
  }

  const texto = String(valor).trim();
  if (!texto) {
    return '';
  }

  if (/^https?:\/\//i.test(texto)) {
    return texto;
  }

  if (texto.startsWith('@')) {
    return `https://instagram.com/${texto}`;
  }

  return `https://instagram.com/${texto.replace(/^\//, '')}`;
}

function prefixarWhatsapp(valor) {
  if (!valor) {
    return '';
  }

  const texto = String(valor).trim();
  if (!texto) {
    return '';
  }

  if (/^https?:\/\//i.test(texto)) {
    return texto;
  }

  const somenteDigitos = texto.replace(/\D/g, '');
  if (!somenteDigitos) {
    return '';
  }

  return `https://wa.me/${somenteDigitos}`;
}

function formatarTextoContato(valor) {
  if (!valor) {
    return '';
  }

  const texto = String(valor).trim();
  if (!texto) {
    return '';
  }

  if (texto.startsWith('@')) {
    return texto;
  }

  if (/^https?:\/\//i.test(texto)) {
    return texto.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  return texto;
}

export function ArenaContatoActions({ instagram, whatsapp, site }) {
  const instagramUrl = prefixarInstagram(instagram);
  const whatsappUrl = prefixarWhatsapp(whatsapp);

  return (
    <div className="arena-contato-actions">
      {whatsappUrl && (
        <a
          className="botao-primario arena-contato-action"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWhatsapp aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
      )}

      {instagramUrl && (
        <a
          className="botao-secundario arena-contato-action"
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram aria-hidden="true" />
          <span>{formatarTextoContato(instagram)}</span>
        </a>
      )}

      {site && (
        <a
          className="botao-secundario arena-contato-action"
          href={site}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaExternalLinkAlt aria-hidden="true" />
          <span>Site</span>
        </a>
      )}
    </div>
  );
}
