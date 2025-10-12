import axios from 'axios';

// Configuração da API - backend real deployado
// Usar variável de ambiente VITE_API_URL ou fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:5000/api`
    : 'https://rivalis-production.up.railway.app/api'); // Fallback para Railway

// Debug: mostrar qual URL está sendo usada
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Hostname:', window.location.hostname);
console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL);

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Timeout maior para primeira conexão
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