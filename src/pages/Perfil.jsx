import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import styles from "../styles/Perfil.module.css";

export default function Perfil() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    axios.get("/api/jogadores/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setEmail(res.data.email);
        setNome(res.data.nome || "");
      })
      .catch(() => setMensagem("Erro ao carregar perfil."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("accessToken");

    try {
      await axios.patch("/api/jogadores/me", { nome }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/registrar-jogo");
    } catch {
      setMensagem("Erro ao salvar perfil.");
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

   return (
    <>
      <Navbar />
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.card}>
          <h1 className={styles.title}>Perfil do Jogador</h1>

          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            disabled
            className={styles.input}
          />

          <label className={styles.label}>Nome (opcional)</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite seu nome"
            className={styles.input}
          />

          <button type="submit" className={styles.button}>
            Próximo
          </button>

          {mensagem && <p className={styles.message}>{mensagem}</p>}
        </form>
      </div>
    </>
  );
}