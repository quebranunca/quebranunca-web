import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterGame from "./pages/RegisterGame";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Perfil from "./pages/Perfil";

export default function App() {
  return (
    <Routes>
      {/* redirect raiz pra login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* rotas protegidas */}
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/novo-jogo" element={
        <ProtectedRoute>
          <RegisterGame />
        </ProtectedRoute>
      } />
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      } />

      {/* qualquer outra url volta pro início */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}