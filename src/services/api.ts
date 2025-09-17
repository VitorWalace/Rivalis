import axios from 'axios';

// Configuração da API - usar backend local ou modo offline
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:5000/api'
  : 'https://rivalis-backend-production.up.railway.app/api'; // Será atualizado quando o backend for deployado

// Debug: mostrar qual URL está sendo usada
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Hostname:', window.location.hostname);

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Aumentar timeout
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Verificar se é erro de conexão - implementar modo offline/demo
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR' || !error.response) {
      console.warn('⚠️ Backend indisponível, ativando modo demo');
      
      // Se for login, simular sucesso
      if (error.config?.url?.includes('/auth/login')) {
        const demoUser = {
          id: 1,
          name: 'Usuário Demo',
          email: 'demo@rivalis.com'
        };
        
        // Salvar no localStorage para simular login
        localStorage.setItem('token', 'demo-token-offline');
        localStorage.setItem('user', JSON.stringify(demoUser));
        
        return Promise.resolve({
          success: true,
          message: 'Login realizado com sucesso (modo demonstração)',
          token: 'demo-token-offline',
          user: demoUser
        });
      }
      
      // Se for registro, simular sucesso
      if (error.config?.url?.includes('/auth/register')) {
        return Promise.resolve({
          success: true,
          message: 'Conta criada com sucesso (modo demonstração - backend será conectado em breve)',
          user: {
            id: 1,
            name: 'Usuário Demo', 
            email: 'demo@rivalis.com'
          }
        });
      }
      
      // Para outras rotas, usar dados do localStorage ou retornar vazio
      return Promise.resolve({
        success: true,
        data: [],
        message: 'Modo demonstração ativo - O backend está sendo configurado e estará disponível em breve'
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