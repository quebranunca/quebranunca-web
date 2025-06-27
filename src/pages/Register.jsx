import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/Register.module.css";
import API_URL from '../api/api';

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post(`${API_URL}/auth/register`, { email, password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao criar conta");
    }
  };

  return (
    <div className={styles.container}>
      <img src="/logo.svg" alt="QuebraNunca Logo" className={styles.logo} />
     
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>Criar Conta</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.button}>
          Criar Conta
        </button>

        <p className={styles.links}>
          Já tem uma conta? <Link to="/login" className={styles.link}>Entrar</Link>
        </p>
      </form>
    </div>
  );
}