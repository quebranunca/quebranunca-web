import { Link } from 'react-router-dom';
import logoLiga from '../../assets/logo-liga.svg';

const mensagemCadastro = 'A criação de conta acontece por convite. Entre para continuar ou solicite seu acesso.';

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-brand">
        <img src={logoLiga} alt="QNF" />
        <div>
          <strong>QuebraNunca</strong>
          <p>Transformando partidas de futevôlei em ranking, estatísticas e história.</p>
        </div>
      </div>

      <nav aria-label="Links públicos">
        <Link to="/">Início</Link>
        <Link to="/ranking">Rankings</Link>
        <a href="/#grupos">Grupos</a>
        <Link to="/competicoes">Campeonatos</Link>
        <Link to="/login">Entrar</Link>
        <Link to="/login" state={{ mensagem: mensagemCadastro }}>Criar Conta</Link>
      </nav>

      <nav aria-label="Links institucionais">
        <a href="https://www.quebranunca.com/quebranunca" target="_blank" rel="noreferrer">Instagram</a>
        <a href="mailto:contato@quebranunca.com.br">Contato</a>
        <a href="/#termos">Termos</a>
        <a href="/#privacidade">Privacidade</a>
      </nav>
    </footer>
  );
}
