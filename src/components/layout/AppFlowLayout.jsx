import './app-flow-layout.css';

export function AppFlowLayout({ header, children, className = '' }) {
  return (
    <section className={`pagina app-flow-page ${className}`.trim()}>
      {header}
      <div className="app-flow-page__body">{children}</div>
    </section>
  );
}

export function AppFlowActions({ children, className = '' }) {
  return (
    <div className={`app-flow-actions ${className}`.trim()}>
      {children}
    </div>
  );
}
