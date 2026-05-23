import axios from 'axios';

function normalizarUrlBase(url) {
  if (!url) {
    return url;
  }

  return url.trim().replace(/\/+$/, '');
}

function normalizarApiBaseUrl(url) {
  const urlNormalizada = normalizarUrlBase(url);

  if (!urlNormalizada || urlNormalizada.endsWith('/api')) {
    return urlNormalizada;
  }

  return `${urlNormalizada}/api`;
}

const apiUrl = import.meta.env.VITE_API_URL;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

let baseURL = '/api';

if (apiBaseUrl) {
  baseURL = normalizarApiBaseUrl(apiBaseUrl);
} else if (apiUrl) {
  baseURL = normalizarApiBaseUrl(apiUrl);
}

export const http = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let manipuladorNaoAutorizado = null;

http.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config;
});

http.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro?.response?.status === 401 && typeof manipuladorNaoAutorizado === 'function') {
      manipuladorNaoAutorizado();
    }

    return Promise.reject(erro);
  }
);

export function definirManipuladorNaoAutorizado(manipulador) {
  manipuladorNaoAutorizado = manipulador;
}

export function definirTokenAutorizacao(token) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}
