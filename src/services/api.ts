import axios from 'axios';

// Configuração da API - sempre usa Railway em produção
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:5000/api'
  : 'https://rivalis-production.up.railway.app/api';

// Debug: mostrar qual URL está sendo usada
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Hostname:', window.location.hostname);

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      // Token inválido ou expirado - apenas limpar dados locais
      // Não forçar redirecionamento aqui para evitar loops
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Verificar se é erro de conexão
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
      return Promise.reject({
        success: false,
        message: 'Erro de conexão com o servidor. Verifique sua conexão com a internet.',
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