import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type LoginData, type RegisterData } from '../services/authService';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  resetLoading: () => void;
  updateUser: (userData: Partial<User>) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('Fazendo requisição de login para:', data.email);
          const response = await authService.login(data);
          console.log('Resposta do servidor:', response);
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            console.log('Login bem-sucedido, usuário autenticado');
          } else {
            // Caso o servidor retorne success: false
            set({
              error: response.message || 'Credenciais inválidas',
              isLoading: false,
            });
            throw new Error(response.message || 'Credenciais inválidas');
          }
        } catch (error: any) {
          console.error('Erro no login:', error);
          const errorMessage = error.message || 'Erro ao fazer login';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.register(data);
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Erro ao criar conta',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Mesmo se der erro, limpar estado local
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),

      resetLoading: () => set({ isLoading: false }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      initializeAuth: async () => {
        console.log('🔄 Inicializando autenticação...');
        
        // Primeiro verificar se existe token
        const token = authService.getToken();
        
        if (!token) {
          console.log('❌ Nenhum token encontrado');
          // Sem token, não está autenticado
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        console.log('🔑 Token encontrado, validando com servidor...');
        
        // Se tem token, validar com o servidor
        try {
          const response = await authService.getCurrentUser();
          if (response.success) {
            console.log('✅ Token válido, usuário autenticado:', response.data.user);
            // Token válido, usuário autenticado
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            console.log('❌ Token inválido, limpando dados');
            // Token inválido, limpar dados
            authService.logout();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error('💥 Erro na validação do token:', error);
          // Erro na validação, considerar não autenticado
          authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
    }),
    {
      name: 'rivalis-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Não persistir isLoading e error
      }),
      // Corrigir datas ao carregar do localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.user?.createdAt) {
          state.user.createdAt = new Date(state.user.createdAt);
        }
      },
    }
  )
);