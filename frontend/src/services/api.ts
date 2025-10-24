import axios from 'axios';

// Configuração da API - backend real deployado
// Preferir VITE_API_URL; em ambiente local, usar 5001 como padrão (backend costuma cair nessa porta)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const LOCAL_DEFAULT_PORT = '5001';
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isLocal
    ? `http://${window.location.hostname}:${LOCAL_DEFAULT_PORT}/api`
    : 'https://rivalis-production.up.railway.app/api'); // Fallback para Railway

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
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado - limpar dados locais
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Verificar se é erro de conexão
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('❌ Erro de conexão com o backend:', error.message);
      return Promise.reject({
        success: false,
        message: 'Não foi possível conectar ao servidor. Tente novamente em alguns minutos.',
      });
    }
    
    // Retornar os dados do erro se disponível
    const errorData = error.response?.data;
    if (errorData) {
      return Promise.reject(errorData);
    }
    
    return Promise.reject({
      success: false,
      message: error.message || 'Erro de conexão',
    });
  }
);

export default api;