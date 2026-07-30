import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type LoginData, type RegisterData } from '../services/authService';
import type { User } from '../types/index.ts';
import { useChampionshipStore } from './championshipStore';

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
          
          // Limpar dados do usuário anterior ANTES de fazer login
          localStorage.removeItem('rivalis-championships');
          useChampionshipStore.getState().clearChampionships();
          
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
            
            // Buscar campeonatos do novo usuário logo após login
            console.log('🔄 Buscando campeonatos do usuário após login...');
            useChampionshipStore.getState().fetchUserChampionships();
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
          console.log('🔄 Iniciando registro de usuário:', data.email);
          console.log('🌐 API URL que será chamada:', import.meta.env.VITE_API_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
              ? `http://${window.location.hostname}:5000/api`
              : 'https://rivalis-production.up.railway.app/api'));
          
          // Limpar dados do usuário anterior ANTES de registrar
          localStorage.removeItem('rivalis-championships');
          useChampionshipStore.getState().clearChampionships();
            
          const response = await authService.register(data);
          console.log('✅ Resposta do servidor para registro:', response);
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            console.log('✅ Usuário registrado com sucesso');
            
            // Buscar campeonatos do novo usuário (será vazio, mas garante sincronização)
            console.log('🔄 Inicializando lista de campeonatos do novo usuário...');
            useChampionshipStore.getState().fetchUserChampionships();
          }
        } catch (error: any) {
          console.error('❌ Erro detalhado no registro:', error);
          console.error('❌ Stack trace:', error.stack);
          console.error('❌ Response data:', error.response?.data);
          
          const errorMessage = error.message || 'Erro ao criar conta';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
          
          // Limpar TODOS os dados do localStorage relacionados ao usuário
          localStorage.removeItem('rivalis-championships');
          
          // Limpar o estado do championshipStore
          useChampionshipStore.getState().clearChampionships();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Mesmo se der erro, limpar estado local
          localStorage.removeItem('rivalis-championships');
          useChampionshipStore.getState().clearChampionships();
          
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
          
          // Limpar dados antigos se não houver token
          localStorage.removeItem('rivalis-championships');
          useChampionshipStore.getState().clearChampionships();
          
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

        // Confiar de imediato na sessão salva no navegador: o usuário chega ao
        // dashboard sem depender da resposta do servidor. A validação abaixo só
        // refina esse estado.
        const cachedUser = authService.getCurrentUserFromStorage();
        if (cachedUser) {
          set({ user: cachedUser, isAuthenticated: true, isLoading: false, error: null });
        }

        const dropSession = (motivo: string) => {
          console.log(`❌ ${motivo} — encerrando sessão`);
          authService.logout();
          localStorage.removeItem('rivalis-championships');
          useChampionshipStore.getState().clearChampionships();
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        };

        try {
          const response = await authService.getCurrentUser();
          if (response.success) {
            console.log('✅ Token válido, usuário autenticado:', response.data.user);
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            dropSession('Token inválido');
          }
        } catch (error: any) {
          // Distinguir "servidor inalcançável" de "token rejeitado". Antes, qualquer
          // falha aqui deslogava o usuário — então com o backend fora do ar ninguém
          // conseguia entrar no dashboard.
          if (error?.isNetworkError) {
            console.warn('⚠️ Servidor inacessível — mantendo a sessão salva no navegador.');
            set({ isLoading: false, error: null });
          } else if (error?.status === 401 || error?.status === 403) {
            dropSession('Token expirado ou sem permissão');
          } else {
            console.warn('⚠️ Falha inesperada ao validar o token — mantendo sessão:', error);
            set({ isLoading: false, error: null });
          }
        }

        // Sincronizar sessão entre abas/janelas: ouvir mudanças no localStorage (token/usuario)
        try {
          const w = window as any;
          if (!w.__rivalisAuthStorageListener) {
            w.__rivalisAuthStorageListener = true;
            window.addEventListener('storage', async (ev: StorageEvent) => {
              if (!ev.key || (ev.key !== 'token' && ev.key !== 'user')) return;
              console.log('🔁 Storage alterado:', ev.key, '— atualizando sessão');

              const newToken = authService.getToken();
              if (!newToken) {
                // Saiu em outra aba: limpar tudo aqui também
                localStorage.removeItem('rivalis-championships');
                useChampionshipStore.getState().clearChampionships();
                set({ user: null, isAuthenticated: false, isLoading: false, error: null });
                return;
              }

              // Token presente (login/conta trocada em outra aba): validar e aplicar
              try {
                const me = await authService.getCurrentUser();
                if (me.success) {
                  set({ user: me.data.user, isAuthenticated: true, isLoading: false, error: null });
                  // Recarregar campeonatos do novo usuário para evitar criar itens no usuário errado
                  await useChampionshipStore.getState().fetchUserChampionships();
                } else {
                  // Caso algo esteja inconsistente, tratar como logout
                  localStorage.removeItem('rivalis-championships');
                  useChampionshipStore.getState().clearChampionships();
                  set({ user: null, isAuthenticated: false, isLoading: false, error: null });
                }
              } catch (e: any) {
                // Servidor fora do ar não é motivo para deslogar: usar o usuário salvo.
                if (e?.isNetworkError) {
                  const local = authService.getCurrentUserFromStorage();
                  if (local) {
                    set({ user: local, isAuthenticated: true, isLoading: false, error: null });
                    return;
                  }
                }
                localStorage.removeItem('rivalis-championships');
                useChampionshipStore.getState().clearChampionships();
                set({ user: null, isAuthenticated: false, isLoading: false, error: null });
              }
            });
          }
        } catch (e) {
          console.warn('ℹ️ Não foi possível registrar listener de storage (ambiente não-browser?)');
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