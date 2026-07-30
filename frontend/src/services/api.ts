import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';

// Configuração da API - backend real deployado
// Preferir VITE_API_URL; em ambiente local, usar 5001 como padrão (backend costuma cair nessa porta)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const LOCAL_DEFAULT_PORT = '5001';
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isLocal
    ? `http://${window.location.hostname}:${LOCAL_DEFAULT_PORT}/api`
    : 'https://rivalis-production.up.railway.app/api'); // Fallback para Railway

// Sem VITE_API_URL em produção o app cai num host de fallback que pode não existir
// mais, e a falha aparece como um genérico "erro de conexão". Deixar explícito.
if (!import.meta.env.VITE_API_URL && !isLocal) {
  console.error(
    '⚠️ VITE_API_URL não configurada! Defina-a nas variáveis de ambiente do deploy ' +
    `(ex.: Vercel > Settings > Environment Variables) apontando para o backend. Usando fallback: ${API_BASE_URL}`
  );
}

// Debug: mostrar qual URL está sendo usada
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Hostname:', window.location.hostname);
console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL);

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Timeout mais curto para evitar travar splash em caso de porta errada
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryableConfig = AxiosRequestConfig & { __retryCount?: number };

const RETRYABLE_ERROR_CODES = new Set(['ECONNABORTED', 'ECONNREFUSED', 'ERR_NETWORK', 'NETWORK_ERROR']);
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRY_ATTEMPTS = 1;
const MAX_TIMEOUT_MS = 30000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Interceptador para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para tratar respostas e erros
api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError | any) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado - limpar dados locais
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    const config = error.config as RetryableConfig | undefined;
    const errorCode = (error as AxiosError)?.code;
    const status = error.response?.status;

    if (config) {
      const currentRetry = config.__retryCount || 0;
      const shouldRetry = currentRetry < MAX_RETRY_ATTEMPTS && (
        (errorCode && RETRYABLE_ERROR_CODES.has(errorCode)) ||
        (status && RETRYABLE_STATUS.has(status))
      );

      if (shouldRetry) {
        const nextRetry = currentRetry + 1;
        config.__retryCount = nextRetry;

        const currentTimeout = typeof config.timeout === 'number' ? config.timeout : 10000;
        const increasedTimeout = Math.min(currentTimeout + 10000, MAX_TIMEOUT_MS);
        config.timeout = increasedTimeout;

        await delay(500 * nextRetry);
        return api.request(config);
      }
    }
    
    // Verificar se é erro de conexão
    if (errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK' || errorCode === 'NETWORK_ERROR' || errorCode === 'ECONNABORTED' || !error.response) {
      console.error('❌ Erro de conexão com o backend:', error.message);
      return Promise.reject({
        success: false,
        // Sinaliza "servidor inalcançável", e não "credencial inválida". Quem trata
        // o erro precisa distinguir os dois para não derrubar a sessão do usuário.
        isNetworkError: true,
        message: 'Não foi possível conectar ao servidor. Tente novamente em alguns minutos.',
      });
    }

    // Retornar os dados do erro se disponível, preservando o status HTTP
    const errorData = error.response?.data;
    if (errorData && typeof errorData === 'object') {
      return Promise.reject({ ...errorData, status });
    }
    if (errorData) {
      return Promise.reject({ success: false, status, message: String(errorData) });
    }

    return Promise.reject({
      success: false,
      status,
      message: error.message || 'Erro de conexão',
    });
  }
);

export default api;