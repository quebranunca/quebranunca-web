import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginService } from "../../services/AuthService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await loginService(email, password);
      console.log("Login realizado com sucesso:", result);
      // Você pode armazenar o token aqui se quiser
      navigate("/home"); // ✅ Redireciona para a Home
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black">
      <img
        src="/logo.svg"
        alt="QuebraNunca Logo"
        className="w-[100px] h-[100px] mb-8 rounded-xl shadow-md"
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm bg-white p-6 rounded-xl shadow-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Acesse sua conta</h1>

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
          Entrar
        </button>

        <div className="text-center text-sm text-gray-600">
          <Link to="/register" className="underline block mb-2">
            Criar Conta
          </Link>
          <button
            type="button"
            className="underline text-sm"
            onClick={() => alert("Funcionalidade em desenvolvimento")}
          >
            Esqueci minha senha
          </button>
        </div>
      </form>
    </div>
  );
}