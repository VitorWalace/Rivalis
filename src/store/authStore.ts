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
  updateUser: (userData: Partial<User>) => void;
  initializeAuth: () => void;
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
          const response = await authService.login(data);
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Erro ao fazer login',
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

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      initializeAuth: () => {
        const user = authService.getCurrentUserFromStorage();
        const isAuthenticated = authService.isAuthenticated();
        
        set({
          user,
          isAuthenticated,
        });
      },
    }),
    {
      name: 'rivalis-auth',
    }
  )
);