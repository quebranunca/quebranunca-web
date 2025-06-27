import styles from '../styles/Navbar.module.css';
import logo from '../../public/logo.svg'; 

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <a href="/home">
          <img src={logo} alt="QNF" className={styles.logo} />
        </a>
        <div className={styles.links}>
          <a href="/registrar-jogo" className={styles.link}>Registrar Jogo</a>
          <a href="/perfil" className={styles.link}>Perfil</a>
          <button onClick={handleLogout} className={styles.logout}>Sair</button>
        </div>
      </div>
    </nav>
  );
}
