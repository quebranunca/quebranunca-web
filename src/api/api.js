import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5129/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.endsWith("/auth/login") &&
      !original.url.endsWith("/auth/refresh")
    ) {
      original._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        sessionStorage.setItem("accessToken", data.accessToken);
        original.headers["Authorization"] = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        sessionStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;