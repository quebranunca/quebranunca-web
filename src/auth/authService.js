import axios from "axios";
import api from '../api/api';

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  sessionStorage.setItem("accessToken", data.accessToken);
  return data;
}

export async function logout() {
  await api.post("/auth/logout");
  sessionStorage.removeItem("accessToken");
}

export async function forgotPassword(email) {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Erro ao solicitar recuperação de senha.";
  }
}

export async function register(email, password) {
  const { data } = await api.post("/auth/register", { email, password });
  return response.data;
}