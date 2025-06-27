import { useState } from "react";
import { forgotPassword } from "../auth/authService";
import styles from "../styles/ForgotPassword.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await forgotPassword(email);
      setSuccessMessage("Instruções enviadas para o e-mail informado.");
    } catch (error) {
      const errorText = error?.response?.data?.message || "Erro ao enviar instruções.";
      setErrorMessage(errorText);
    }
  };

  return (
    <div className={styles.container}>
      <img src="/logo.svg" alt="QuebraNunca Logo" className={styles.logo} />

      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>Esqueci minha senha</h1>

        <input
          type="email"
          placeholder="Seu e-mail"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" className={styles.button}>
          Enviar
        </button>
        
        {successMessage && <p className={styles.success}>{successMessage}</p>}
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </form>
    </div>
  );
}