import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConteudoBotao } from '../components/ConteudoBotao';
import { AtletaPerfilLink } from '../components/AtletaPerfilLink';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { EmailDomainSuggestions } from '../components/formularios/EmailDomainSuggestions';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { extrairMensagemErro } from '../utils/erros';
import { formatarData, normalizarDataParaApi, paraInputData } from '../utils/formatacao';
import { nomeNivelAtleta, opcoesNivelAtleta } from '../utils/niveisAtleta';
import { rolarParaElemento, rolarParaTopo } from '../utils/rolagem';
import { PERFIS_USUARIO, ehAdministrador, ehOrganizador } from '../utils/perfis';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import { scrollFocusedInputIntoView } from '../utils/tecladoMobile';

const estadoInicial = {
  nome: '',
  apelido: '',
  telefone: '',
  email: '',
  instagram: '',
  cpf: '',
  bairro: '',
  cidade: '',
  estado: '',
  cadastroPendente: false,
  nivel: '',
  lado: '3',
  dataNascimento: ''
};

const lados = [
  { valor: '1', rotulo: 'Direito' },
  { valor: '2', rotulo: 'Esquerdo' },
  { valor: '3', rotulo: 'Ambos' }
];

export function PaginaAtletas() {
  const { usuario, estadoAcesso } = useAutenticacao();
  const usuarioAtivo = estadoAcesso === ESTADOS_ACESSO.ativo;
  const usuarioAdministrador = ehAdministrador(usuario);
  const usuarioOrganizador = ehOrganizador(usuario);
  const usuarioGestorAtletas = usuarioAtivo && (usuarioAdministrador || usuarioOrganizador);
  const [params] = useSearchParams();
  const [atletas, setAtletas] = useState([]);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [atletaEdicaoId, setAtletaEdicaoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const formularioRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    carregarAtletas();
  }, [usuarioGestorAtletas, usuarioOrganizador]);

  useEffect(() => {
    const atletaId = params.get('atletaId');
    if (!atletaId || atletas.length === 0) {
      return;
    }

    const atleta = atletas.find((item) => item.id === atletaId);
    if (atleta) {
      iniciarEdicao(atleta);
    }
  }, [atletas, params]);

  async function carregarAtletas() {
    setCarregando(true);
    setErro('');

    try {
      const lista = await atletasServico.listar({
        somenteInscritosMinhasCompeticoes: usuarioOrganizador,
        dadosGerenciais: usuarioGestorAtletas
      });
      setAtletas(lista);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function iniciarEdicao(atleta) {
    setFormularioAberto(true);
    setAtletaEdicaoId(atleta.id);
    setFormulario({
      nome: atleta.nome || '',
      apelido: atleta.apelido || '',
      telefone: atleta.telefone || '',
      email: atleta.email || '',
      instagram: atleta.instagram || '',
      cpf: atleta.cpf || '',
      bairro: atleta.bairro || '',
      cidade: atleta.cidade || '',
      estado: atleta.estado || '',
      cadastroPendente: Boolean(atleta.cadastroPendente),
      nivel: atleta.nivel ? String(atleta.nivel) : '',
      lado: String(atleta.lado || 3),
      dataNascimento: paraInputData(atleta.dataNascimento)
    });
    setTimeout(() => rolarParaElemento(formularioRef.current), 0);
  }

  function cancelarEdicao() {
    setFormularioAberto(false);
    setAtletaEdicaoId(null);
    setFormulario(estadoInicial);
  }

  function abrirFormulario() {
    setAtletaEdicaoId(null);
    setFormulario(estadoInicial);
    setFormularioAberto(true);
    setTimeout(() => rolarParaElemento(formularioRef.current), 0);
  }

  function podeEditarAtleta(atleta) {
    if (!usuarioAtivo || !usuario) {
      return false;
    }

    return usuarioGestorAtletas && (
      usuarioAdministrador ||
      atleta.usuarioCriadorId === usuario.id ||
      atleta.id === usuario.atletaId
    );
  }

  function podeExcluirAtleta() {
    return usuarioAtivo && Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro('');
    setSalvando(true);

    const dados = {
      nome: formulario.nome,
      apelido: formulario.apelido.trim() || null,
      telefone: formulario.telefone.trim() || null,
      email: formulario.email.trim() || null,
      instagram: formulario.instagram.trim() || null,
      cpf: formulario.cpf.trim() || null,
      bairro: formulario.bairro.trim() || null,
      cidade: formulario.cidade.trim() || null,
      estado: formulario.estado.trim() || null,
      cadastroPendente: Boolean(formulario.cadastroPendente),
      nivel: formulario.nivel ? Number(formulario.nivel) : null,
      lado: Number(formulario.lado),
      dataNascimento: normalizarDataParaApi(formulario.dataNascimento)
    };

    try {
      if (atletaEdicaoId) {
        await atletasServico.atualizar(atletaEdicaoId, dados);
      } else {
        await atletasServico.criar(dados);
      }

      cancelarEdicao();
      await carregarAtletas();
      rolarParaTopo();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function removerAtleta(id) {
    const confirmar = window.confirm('Deseja realmente remover este atleta?');
    if (!confirmar) {
      return;
    }

    try {
      await atletasServico.remover(id);
      await carregarAtletas();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    }
  }

  return (
    <section className="pagina">
      <div className="cabecalho-pagina">
        <h2>Atletas</h2>
        <p>
          {usuarioOrganizador
            ? 'Veja os atletas com inscrição ativa em competições criadas por você.'
            : 'Cadastre atletas com nome completo. Quando o cadastro não estiver pendente, informe ao menos um identificador.'}
        </p>
      </div>

      {usuarioGestorAtletas && !formularioAberto && (
        <div className="acoes-item campo-largo">
          <button type="button" className="botao-primario" onClick={abrirFormulario}>
            Novo atleta
          </button>
        </div>
      )}

      {formularioAberto && (
        <form ref={formularioRef} className="formulario-grid" onSubmit={aoSubmeter}>
          <label>
            Nome completo
            <input
              type="text"
              autoComplete="name"
              enterKeyHint="next"
              value={formulario.nome}
              onChange={(evento) => atualizarCampo('nome', evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              required
            />
          </label>

          <label>
            Apelido
            <input
              type="text"
              autoComplete="nickname"
              enterKeyHint="next"
              value={formulario.apelido}
              onChange={(evento) => atualizarCampo('apelido', evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
            />
          </label>

          <label>
            Telefone
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              value={formulario.telefone}
              onChange={(evento) => atualizarCampo('telefone', evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
            />
          </label>

          <label>
            E-mail
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              value={formulario.email}
              onChange={(evento) => atualizarCampo('email', evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
            />
            <EmailDomainSuggestions
              valor={formulario.email}
              onChange={(valor) => atualizarCampo('email', valor)}
              inputRef={emailRef}
            />
          </label>

          <label>
            Instagram
            <input
              type="text"
              value={formulario.instagram}
              onChange={(evento) => atualizarCampo('instagram', evento.target.value)}
            />
          </label>

          <label>
            CPF
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="next"
              value={formulario.cpf}
              onChange={(evento) => atualizarCampo('cpf', evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
            />
          </label>

          <label>
            Nível
            <select
              value={formulario.nivel}
              onChange={(evento) => atualizarCampo('nivel', evento.target.value)}
            >
              <option value="">Selecione</option>
              {opcoesNivelAtleta.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          </label>

        <label>
          Bairro
          <input
            type="text"
            value={formulario.bairro}
            onChange={(evento) => atualizarCampo('bairro', evento.target.value)}
          />
        </label>

        <label>
          Cidade
          <input
            type="text"
            value={formulario.cidade}
            onChange={(evento) => atualizarCampo('cidade', evento.target.value)}
          />
        </label>

        <label>
          Estado
          <input
            type="text"
            value={formulario.estado}
            onChange={(evento) => atualizarCampo('estado', evento.target.value)}
          />
        </label>

        <label className="campo-checkbox">
          <input
            type="checkbox"
            checked={formulario.cadastroPendente}
            onChange={(evento) => atualizarCampo('cadastroPendente', evento.target.checked)}
          />
          <span>Cadastro pendente</span>
        </label>

        <label>
          Lado
          <select
            value={formulario.lado}
            onChange={(evento) => atualizarCampo('lado', evento.target.value)}
            required
          >
            {lados.map((lado) => (
              <option key={lado.valor} value={lado.valor}>
                {lado.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label>
          Data de nascimento
          <input
            type="date"
            value={formulario.dataNascimento}
            onChange={(evento) => atualizarCampo('dataNascimento', evento.target.value)}
          />
        </label>

          <div className="acoes-formulario campo-largo">
            <button type="submit" className="botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>

            <button type="button" className="botao-secundario" onClick={cancelarEdicao}>
              <ConteudoBotao icone="cancelar" texto={atletaEdicaoId ? 'Cancelar' : 'Fechar'} />
            </button>
          </div>
        </form>
      )}

      {erro && <p className="texto-erro">{erro}</p>}

      {carregando ? (
        <p>Carregando atletas...</p>
      ) : (
        <div className="lista-cartoes">
          {atletas.map((atleta) => (
            <article key={atleta.id} className="cartao-lista">
              <div>
                <div className="atleta-lista-identidade">
                  <AvatarUsuario
                    nome={obterNomeExibicaoAtleta(atleta)}
                    fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                    tamanho="sm"
                    className="atleta-lista-avatar"
                  />
                  <h3>
                    <AtletaPerfilLink atleta={atleta} className="atleta-nome-link">
                      {obterNomeExibicaoAtleta(atleta)}
                    </AtletaPerfilLink>
                  </h3>
                </div>
                <p>Apelido: {atleta.apelido || '-'}</p>
                {podeEditarAtleta(atleta) && atleta.telefone && <p>Telefone: {atleta.telefone}</p>}
                {podeEditarAtleta(atleta) && atleta.email && <p>E-mail: {atleta.email}</p>}
                <p>Instagram: {atleta.instagram || '-'}</p>
                {podeEditarAtleta(atleta) && atleta.cpf && <p>CPF: {atleta.cpf}</p>}
                <p>Nível: {nomeNivelAtleta(atleta.nivel)}</p>
                <p>Bairro: {atleta.bairro || '-'}</p>
                <p>Cidade: {atleta.cidade || '-'}</p>
                <p>Estado: {atleta.estado || '-'}</p>
                <p>Status: {atleta.cadastroPendente ? 'Cadastro pendente' : 'Cadastro completo'}</p>
                <p>Lado: {lados.find((lado) => Number(lado.valor) === atleta.lado)?.rotulo || '-'}</p>
                {podeEditarAtleta(atleta) && <p>Nascimento: {formatarData(atleta.dataNascimento)}</p>}
                <p>Criado por: {atleta.nomeUsuarioCriador || '-'}</p>
                <p>Criado em: {formatarData(atleta.dataCriacao)}</p>
              </div>

              {(podeEditarAtleta(atleta) || podeExcluirAtleta()) && (
                <div className="acoes-item">
                  {podeEditarAtleta(atleta) && (
                    <button type="button" className="botao-secundario botao-editar" onClick={() => iniciarEdicao(atleta)}>
                      Editar
                    </button>
                  )}
                  {podeExcluirAtleta() && (
                    <button type="button" className="botao-perigo" onClick={() => removerAtleta(atleta.id)}>
                      Excluir
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}

          {atletas.length === 0 && (
            <p>{usuarioOrganizador ? 'Nenhum atleta inscrito em competições criadas por você.' : 'Nenhum atleta cadastrado.'}</p>
          )}
        </div>
      )}
    </section>
  );
}
