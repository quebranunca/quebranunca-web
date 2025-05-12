import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./features/home/Home";
import Login from "./features/login/Login";
import Register from "./features/register/Register";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}