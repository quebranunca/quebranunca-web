export function PublicFooter() {
  const links = [
    { href: 'https://www.quebranunca.com/quebranunca', label: 'Instagram', externo: true },
    { href: 'mailto:contato@quebranunca.com.br', label: 'Contato' },
    { href: '/#termos', label: 'Termos' },
    { href: '/privacidade', label: 'Privacidade' }
  ];

  return (
    <footer className="public-footer">
      <nav aria-label="Links institucionais">
        <ul className="public-footer-links">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.externo ? '_blank' : undefined}
                rel={link.externo ? 'noreferrer' : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p>© 2026 QuebraNunca</p>
    </footer>
  );
}
