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

export function obterApiBaseUrl() {
  return http.defaults.baseURL || '/api';
}

export function resolverUrlRecurso(url) {
  const valor = typeof url === 'string' ? url.trim() : '';
  if (!valor) {
    return '';
  }

  if (/^(blob:|data:image\/)/i.test(valor)) {
    return valor;
  }

  try {
    const origemPagina = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const origemApi = new URL(http.defaults.baseURL || '/api', origemPagina).origin;
    const urlResolvida = new URL(valor, `${origemApi}/`);

    return ['http:', 'https:'].includes(urlResolvida.protocol) ? urlResolvida.href : '';
  } catch {
    return '';
  }
}

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
