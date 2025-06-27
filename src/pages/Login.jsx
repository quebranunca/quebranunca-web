import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import axios from "axios";
import styles from "../styles/Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);

      const token = sessionStorage.getItem("accessToken");
      const res = await axios.get("/api/jogadores/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.data.nome) {
        navigate("/perfil");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Erro ao fazer login.");
    }
  };

  return (
    <div className={styles.container}>
      <img src="/logo.svg" alt="QuebraNunca Logo" className={styles.logo} />

      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>Acesse sua conta</h1>

        <input
          type="email"
          placeholder="Email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Senha"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.button}>
          Entrar
        </button>

        <div className={styles.links}>
          <Link to="/register" className={styles.link}>
            Criar Conta
          </Link>
          <Link to="/forgot-password" className={styles.link}>
            Esqueci minha senha
          </Link>
        </div>
      </form>
    </div>
  );
}
