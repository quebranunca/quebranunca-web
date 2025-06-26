import axios from "axios";

// Permite configurar a URL da API via variável de ambiente.
export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://18.215.124.246/api";

export async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    return response.data; // { accessToken, refreshToken, user }
  } catch (error) {
    throw error.response?.data?.message || "Erro ao fazer login";
  }
}

export async function register(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Erro ao criar conta";
  }
}
