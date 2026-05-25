import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

function obterErro(campo, erros) {
  return erros?.[campo] || '';
}

export function ArenaAdminForm({ form, onChange, onSubmit, erros = {}, enviando = false, mensagemSucesso = '', mensagemErro = '' }) {
  return (
    <form className="arena-admin-form" onSubmit={onSubmit}>
      <div className="arena-admin-form__grid">
        <label className="campo-formulario">
          <span>Nome da arena *</span>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={onChange}
            placeholder="Ex.: Arena do Vale"
          />
          {obterErro('nome', erros) && <small>{obterErro('nome', erros)}</small>}
        </label>

        <label className="campo-formulario">
          <span>Tipo de arena *</span>
          <select name="tipoArena" value={form.tipoArena} onChange={onChange}>
            <option value="">Selecione</option>
            <option value="1">Praia</option>
            <option value="2">Rede na praia</option>
            <option value="3">Arena privada</option>
            <option value="4">Clube</option>
            <option value="5">Escola</option>
            <option value="6">Centro de treinamento</option>
            <option value="7">Espaço de associados</option>
            <option value="8">Local temporário</option>
            <option value="9">Outro</option>
          </select>
          {obterErro('tipoArena', erros) && <small>{obterErro('tipoArena', erros)}</small>}
        </label>

        <label className="campo-formulario campo-formulario--full">
          <span>Descrição</span>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={onChange}
            rows={4}
            placeholder="Descreva a arena, ambiente e foco esportivo"
          />
        </label>

        <label className="campo-formulario">
          <span>Endereço</span>
          <input
            type="text"
            name="endereco"
            value={form.endereco}
            onChange={onChange}
            placeholder="Rua, número e complemento"
          />
        </label>

        <label className="campo-formulario">
          <span>Endereço resumido</span>
          <input
            type="text"
            name="enderecoResumo"
            value={form.enderecoResumo}
            onChange={onChange}
            placeholder="Ex.: Praia da Barra"
          />
        </label>

        <label className="campo-formulario">
          <span>Cidade</span>
          <input
            type="text"
            name="cidade"
            value={form.cidade}
            onChange={onChange}
            placeholder="Cidade"
          />
        </label>

        <label className="campo-formulario">
          <span>Estado</span>
          <input
            type="text"
            name="estado"
            value={form.estado}
            onChange={onChange}
            placeholder="Estado"
          />
        </label>

        <label className="campo-formulario">
          <span>Latitude</span>
          <input
            type="number"
            step="0.000001"
            name="latitude"
            value={form.latitude}
            onChange={onChange}
            placeholder="-23.5505"
          />
        </label>

        <label className="campo-formulario">
          <span>Longitude</span>
          <input
            type="number"
            step="0.000001"
            name="longitude"
            value={form.longitude}
            onChange={onChange}
            placeholder="-46.6333"
          />
        </label>

        <label className="campo-formulario">
          <span>WhatsApp</span>
          <input
            type="text"
            name="whatsapp"
            value={form.whatsapp}
            onChange={onChange}
            placeholder="(11) 99999-0000"
          />
        </label>

        <label className="campo-formulario">
          <span>Instagram</span>
          <input
            type="text"
            name="instagram"
            value={form.instagram}
            onChange={onChange}
            placeholder="@nomearenas"
          />
        </label>

        <label className="campo-formulario">
          <span>Site</span>
          <input
            type="url"
            name="site"
            value={form.site}
            onChange={onChange}
            placeholder="https://"
          />
        </label>

        <label className="campo-formulario">
          <span>Quantidade de espaços</span>
          <input
            type="number"
            min="0"
            name="quantidadeEspacos"
            value={form.quantidadeEspacos}
            onChange={onChange}
          />
        </label>

        <label className="campo-formulario campo-formulario--check">
          <input
            type="checkbox"
            name="possuiIluminacao"
            checked={form.possuiIluminacao}
            onChange={onChange}
          />
          <span>Possui iluminação</span>
        </label>

        <label className="campo-formulario campo-formulario--check">
          <input
            type="checkbox"
            name="possuiVestiario"
            checked={form.possuiVestiario}
            onChange={onChange}
          />
          <span>Possui vestiário</span>
        </label>

        <label className="campo-formulario campo-formulario--check">
          <input
            type="checkbox"
            name="possuiEstacionamento"
            checked={form.possuiEstacionamento}
            onChange={onChange}
          />
          <span>Possui estacionamento</span>
        </label>
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

      <div className="arena-admin-form__acoes">
        <button type="submit" className="botao-primario" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
