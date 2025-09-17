import axios from 'axios';

// Configuração da API - usar backend local ou modo offline
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:5000/api'
  : 'https://rivalis-backend.onrender.com/api'; // URL do Render

// Debug: mostrar qual URL está sendo usada
console.log('🔗 Enhanced API Base URL:', API_BASE_URL);
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
      // Token inválido ou expirado - limpar dados locais
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Verificar se é erro de conexão
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('❌ Enhanced API - Erro de conexão com o backend:', error.message);
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

// Serviços de API
export const authAPI = {
  register: (userData: { name: string; email: string; password: string }) =>
    api.post('/auth/register', userData),
  
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  verify: () => api.get('/auth/verify'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const championshipAPI = {
  getAll: () => api.get('/championships'),
  
  getById: (id: string) => api.get(`/championships/${id}`),
  
  create: (data: {
    name: string;
    sport: string;
    format?: string;
    description?: string;
    maxTeams?: number;
    settings?: any;
  }) => api.post('/championships', data),
  
  update: (id: string, data: any) => api.put(`/championships/${id}`, data),
  
  delete: (id: string) => api.delete(`/championships/${id}`),
};

export const teamAPI = {
  create: (data: {
    name: string;
    color?: string;
    championshipId: string;
  }) => api.post('/teams', data),
  
  update: (id: string, data: any) => api.put(`/teams/${id}`, data),
  
  delete: (id: string) => api.delete(`/teams/${id}`),
  
  getByChampionship: (championshipId: string) =>
    api.get(`/championships/${championshipId}/teams`),
};

export const playerAPI = {
  create: (data: {
    name: string;
    position?: string;
    number?: number;
    teamId: string;
  }) => api.post('/players', data),
  
  update: (id: string, data: any) => api.put(`/players/${id}`, data),
  
  delete: (id: string) => api.delete(`/players/${id}`),
  
  getByTeam: (teamId: string) => api.get(`/teams/${teamId}/players`),
};

export const gameAPI = {
  create: (data: {
    homeTeamId: string;
    awayTeamId: string;
    championshipId: string;
    scheduledDate?: string;
    round?: number;
  }) => api.post('/games', data),
  
  updateResult: (id: string, data: {
    homeScore: number;
    awayScore: number;
    events?: any[];
    statistics?: any;
  }) => api.put(`/games/${id}/result`, data),
  
  update: (id: string, data: any) => api.put(`/games/${id}`, data),
  
  delete: (id: string) => api.delete(`/games/${id}`),
  
  getByChampionship: (championshipId: string) =>
    api.get(`/championships/${championshipId}/games`),
};

export default api;