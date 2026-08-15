import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ConfirmacaoContext = createContext(null);

const configuracaoPadrao = {
  titulo: 'Confirmar ação',
  mensagem: 'Deseja continuar?',
  textoCancelar: 'Cancelar',
  textoConfirmar: 'Confirmar',
  variante: 'perigo'
};

function normalizarMensagem(opcoes) {
  if (typeof opcoes === 'string') {
    return { mensagem: opcoes };
  }

  return opcoes || {};
}

export function ConfirmacaoProvider({ children }) {
  const [confirmacao, setConfirmacao] = useState(null);
  const resolverRef = useRef(null);

  const fechar = useCallback((resultado) => {
    resolverRef.current?.(resultado);
    resolverRef.current = null;
    setConfirmacao(null);
  }, []);

  const confirmar = useCallback((opcoes) => {
    const proximaConfirmacao = {
      ...configuracaoPadrao,
      ...normalizarMensagem(opcoes)
    };

    return new Promise((resolve) => {
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setConfirmacao(proximaConfirmacao);
    });
  }, []);

  useEffect(() => {
    if (!confirmacao) {
      return undefined;
    }

    function aoPressionarTecla(evento) {
      if (evento.key === 'Escape') {
        fechar(false);
      }
    }

    window.addEventListener('keydown', aoPressionarTecla);
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [confirmacao, fechar]);

  useEffect(() => () => {
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  const valor = useMemo(() => ({ confirmar }), [confirmar]);

  return (
    <ConfirmacaoContext.Provider value={valor}>
      {children}

      {confirmacao && (
        <div className="confirmacao-app-sobreposicao" role="presentation" onClick={() => fechar(false)}>
          <article
            className={`confirmacao-app-modal confirmacao-app-modal--${confirmacao.variante}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmacao-app-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <span className="confirmacao-app-icone" aria-hidden="true">
              !
            </span>

            <div className="confirmacao-app-corpo">
              <h3 id="confirmacao-app-titulo">{confirmacao.titulo}</h3>
              <p>{confirmacao.mensagem}</p>
            </div>

            <div className="confirmacao-app-acoes">
              <button type="button" className="botao-secundario" onClick={() => fechar(false)}>
                {confirmacao.textoCancelar}
              </button>
              <button
                type="button"
                className={confirmacao.variante === 'perigo' ? 'botao-perigo' : 'botao-primario'}
                onClick={() => fechar(true)}
              >
                {confirmacao.textoConfirmar}
              </button>
            </div>
          </article>
        </div>
      )}
    </ConfirmacaoContext.Provider>
  );
}

export function useConfirmacao() {
  const contexto = useContext(ConfirmacaoContext);

  if (contexto) {
    return contexto;
  }

  return {
    confirmar: async (opcoes) => {
      const { mensagem } = {
        ...configuracaoPadrao,
        ...normalizarMensagem(opcoes)
      };

      return window.confirm(mensagem);
    }
  };
}
