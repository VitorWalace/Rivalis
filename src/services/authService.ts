import api from './api';
import type { User } from '../types/index.ts';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response: any = await api.post('/auth/login', data);
      
      if (response.success) {
        // Salvar token e dados do usuário
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('🔗 Fazendo requisição POST para /auth/register');
      console.log('📦 Dados sendo enviados:', { ...data, password: '[HIDDEN]' });
      
      const response: any = await api.post('/auth/register', data);
      console.log('✅ Resposta recebida do servidor:', response);
      
      if (response.success) {
        // Salvar token e dados do usuário
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('💾 Token e dados de usuário salvos no localStorage');
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Erro detalhado no authService.register:');
      console.error('❌ Error objeto:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  }

  async getCurrentUser(): Promise<{ success: boolean; data: { user: User } }> {
    try {
      return await api.get('/auth/me');
    } catch (error: any) {
      throw error;
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response: any = await api.post('/auth/logout');
      
      // Limpar dados locais
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  // Verificar se o usuário está logado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Obter dados do usuário do localStorage
  getCurrentUserFromStorage(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Obter token do localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

export const authService = new AuthService();