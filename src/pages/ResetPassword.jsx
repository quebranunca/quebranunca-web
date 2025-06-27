import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import API_URL from "../api/api";
import styles from "../styles/ResetPassword.module.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axios.post(`${API_URL}/auth/reset-password?token=${token}`, { newPassword });

      setMessage("Senha atualizada com sucesso! Você será redirecionado para o login.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao redefinir senha.");
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <p>Token inválido ou ausente.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Redefinir Senha</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}
          <button type="submit" className={styles.button}>
            Atualizar Senha
          </button>
        </form>
      </div>
    </div>
  );
}