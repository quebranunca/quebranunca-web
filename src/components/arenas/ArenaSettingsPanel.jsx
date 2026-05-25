import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export function ArenaSettingsPanel({ arena, onAtivar, onDesativar, onTornarPublica, onTornarPrivada, enviando = false, mensagemSucesso = '', mensagemErro = '' }) {
  return (
    <section className="arena-admin-settings">
      <h3>Configurações rápidas</h3>
      <p className="arena-admin-settings__descricao">
        Gerencie o estado operacional da arena e a visibilidade do perfil sem sair deste painel.
      </p>

      <div className="arena-admin-settings__grid">
        <div className="arena-admin-settings__item">
          <div>
            <p className="arena-admin-settings__label">Status</p>
            <strong>{arena?.ativa ? 'Ativa' : 'Inativa'}</strong>
          </div>
          <button
            type="button"
            className={arena?.ativa ? 'botao-secundario' : 'botao-primario'}
            onClick={arena?.ativa ? onDesativar : onAtivar}
            disabled={enviando}
          >
            {arena?.ativa ? 'Desativar arena' : 'Ativar arena'}
          </button>
        </div>

        <div className="arena-admin-settings__item">
          <div>
            <p className="arena-admin-settings__label">Visibilidade</p>
            <strong>{arena?.publica ? 'Pública' : 'Privada'}</strong>
          </div>
          <button
            type="button"
            className={arena?.publica ? 'botao-secundario' : 'botao-primario'}
            onClick={arena?.publica ? onTornarPrivada : onTornarPublica}
            disabled={enviando}
          >
            {arena?.publica ? 'Tornar privada' : 'Tornar pública'}
          </button>
        </div>
      </div>

      <div className="arena-admin-form__mensagens">
        {mensagemSucesso && (
          <p className="arena-admin-form__mensagem arena-admin-form__mensagem--sucesso">
            <FaCheckCircle aria-hidden="true" />
            <span>{mensagemSucesso}</span>
          </p>
        )}

        {mensagemErro && (
          <p className="arena-admin-form__mensagem arena-admin-form__mensagem--erro">
            <FaExclamationTriangle aria-hidden="true" />
            <span>{mensagemErro}</span>
          </p>
        )}
      </div>
    </section>
  );
}
