import axios from "axios";

const API_URL = "http://18.215.124.246/api"; 

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