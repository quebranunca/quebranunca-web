import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerService } from "../../services/AuthService";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await registerService(email, password);
      console.log("Conta criada com sucesso:", result);
      alert("Conta criada com sucesso! Faça login para continuar.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erro ao criar conta");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-yellow-400">
      <img src="/logo.svg" alt="QuebraNunca Logo" className="w-32 mb-8" />

           <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm bg-white p-6 rounded-xl shadow-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Criar Conta</h1>

        <input
          type="email"
          placeholder="Email"
          className="border p-3 rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          className="border p-3 rounded mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <button
          type="submit"
          className="bg-black text-white py-3 rounded hover:bg-gray-800 transition mb-3"
        >
          Criar Conta
        </button>

        <div className="text-center text-sm text-gray-600">
          Já tem uma conta? <Link to="/login" className="underline">Entrar</Link>
        </div>
      </form>
    </div>
  );
}
