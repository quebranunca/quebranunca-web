import { LogoQNF } from '../branding/LogoQNF';

export function CompartilhamentoCardBase({
  refProp,
  etiqueta,
  titulo = 'QuebraNunca Futevôlei',
  destaque,
  subtitulo,
  children,
  rodapeTitulo = 'QuebraNunca Futevôlei',
  rodapeTexto = '@quebranuncaftv · quebranunca.com.br',
  className = ''
}) {
  return (
    <article ref={refProp} className={`arte-compartilhamento-partida arte-compartilhamento-card ${className}`}>
      <div className="arte-partida-brilho" />

      <header className="arte-partida-topo">
        <LogoQNF variante="light" className="arte-partida-logo" />
        <div>
          <span>{etiqueta}</span>
          <strong>{titulo}</strong>
        </div>
      </header>

      {(destaque || subtitulo) && (
        <section className="arte-partida-grupo">
          {subtitulo && <span>{subtitulo}</span>}
          {destaque && <strong>{destaque}</strong>}
        </section>
      )}

      {children}

      <footer className="arte-partida-rodape">
        <strong>{rodapeTitulo}</strong>
        <span>{rodapeTexto}</span>
      </footer>
    </article>
  );
}
