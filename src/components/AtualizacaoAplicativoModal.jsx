import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { versaoServico } from '../services/versaoServico';
import { VERSAO_APP } from '../config/versao';

function normalizarVersao(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function AtualizacaoAplicativoModal() {
  const location = useLocation();
  const [atualizacaoDisponivel, setAtualizacaoDisponivel] = useState(false);
  const verificandoRef = useRef(false);
  const ultimaVerificacaoRef = useRef(0);

  useEffect(() => {
    let ativo = true;

    async function verificarVersao() {
      if (verificandoRef.current || atualizacaoDisponivel) {
        return;
      }

      const agora = Date.now();
      if (ultimaVerificacaoRef.current && agora - ultimaVerificacaoRef.current < 60 * 1000) {
        return;
      }

      verificandoRef.current = true;
      ultimaVerificacaoRef.current = agora;

      try {
        const resposta = await versaoServico.obterAtual();
        const versaoApi = normalizarVersao(resposta?.version);
        const versaoFrontend = normalizarVersao(VERSAO_APP);

        if (ativo && versaoApi && versaoFrontend && versaoApi !== versaoFrontend) {
          setAtualizacaoDisponivel(true);
        }
      } catch {
        // A checagem de versão não deve bloquear navegação quando a API estiver indisponível.
      } finally {
        verificandoRef.current = false;
      }
    }

    verificarVersao();

    return () => {
      ativo = false;
    };
  }, [atualizacaoDisponivel, location.pathname, location.search]);

  if (!atualizacaoDisponivel) {
    return null;
  }

  return (
    <div className="modal-sobreposicao atualizacao-app-sobreposicao" role="presentation">
      <section
        className="modal-conteudo atualizacao-app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atualizacao-app-titulo"
      >
        <div className="modal-cabecalho">
          <div>
            <h3 id="atualizacao-app-titulo">Atualização disponível</h3>
            <p>Uma nova versão da plataforma está disponível.</p>
          </div>
        </div>

        <button type="button" className="botao-primario" onClick={() => window.location.reload()}>
          Atualizar agora
        </button>
      </section>
    </div>
  );
}
