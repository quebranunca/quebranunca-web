import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [redirecionarParaPerfil, setRedirecionarParaPerfil] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");

    if (!token) {
      setPermitido(false);
      setLoading(false);
      return;
    }

    axios.get("/api/jogadores/me", {
      headers: { Authorization: `Bearer ${token}`}
    })
      .then(res => {
        const semNome = !res.data.nome;

        if (semNome && location.pathname !== "/perfil") {
          setPermitido(false);
        } else {
          setPermitido(true);
        }
      })
      .catch((err) => {
        console.error("Erro /me", err);
        setPermitido(false);
      })
      .finally(() => setLoading(false));
  }, [location.pathname]);

  if (loading) return <div className="p-4">Verificando autenticação...</div>;
  if (!permitido) return <Navigate to="/login" />;

  return children;
}