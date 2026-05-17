import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaEnvelope, FaUserPlus } from 'react-icons/fa';
import { solicitacoesAcessoServico } from '../../services/solicitacoesAcessoServico';
import { extrairMensagemErro } from '../../utils/erros';

export function SolicitacaoAcessoAccordion() {
  const [expandido, setExpandido] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro('');
    setMensagem('');
    setCarregando(true);

    try {
      const resposta = await solicitacoesAcessoServico.criar({
        nome,
        email
      });

      setMensagem(resposta.mensagem || 'Solicitação enviada com sucesso.');
      setNome('');
      setEmail('');
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <article className={`solicitacao-acesso-card ${expandido ? 'expandido' : ''}`}>
      <button
        type="button"
        className="solicitacao-acesso-resumo"
        onClick={() => setExpandido((valor) => !valor)}
        aria-expanded={expandido}
      >
        <span className="solicitacao-acesso-icone">
          <FaUserPlus aria-hidden="true" />
        </span>
        <span>
          <strong>Ainda não tem acesso?</strong>
          <small>Solicite um convite para entrar na plataforma.</small>
        </span>
        {expandido ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
      </button>

      <div className="solicitacao-acesso-conteudo" aria-hidden={!expandido}>
        <form onSubmit={aoSubmeter} className="solicitacao-acesso-form">
          <p>
            Informe seu nome e e-mail para solicitar acesso. Quando seu acesso for liberado,
            você receberá um convite para concluir seu cadastro.
          </p>

          <label className="campo-login-icone">
            Nome
            <span>
              <FaUserPlus aria-hidden="true" />
              <input
                type="text"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </span>
          </label>

          <label className="campo-login-icone">
            E-mail
            <span>
              <FaEnvelope aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="voce@email.com"
                required
              />
            </span>
          </label>

          {erro && <p className="texto-erro">{erro}</p>}
          {mensagem && <p className="texto-sucesso">{mensagem}</p>}

          <button type="submit" className="botao-secundario solicitacao-acesso-botao" disabled={carregando}>
            {carregando ? 'Enviando solicitação...' : 'Solicitar convite'}
          </button>

          <small className="solicitacao-acesso-observacao">
            Sua solicitação não cria uma conta. Você receberá um convite quando seu acesso for liberado.
          </small>
        </form>
      </div>
    </article>
  );
}
