import api from './api';
import type { Championship } from '../types/index.ts';

export interface CreateChampionshipData {
  name: string;
  sport: string;
  format: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  maxTeams?: number;
}

export interface UpdateChampionshipData {
  name?: string;
  sport?: string;
  format?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  maxTeams?: number;
  status?: Championship['status'];
}

// Mapear dados do backend para o formato esperado pelo frontend
const mapChampionshipFromBackend = (championship: any): Championship => {
  // Mapear status do backend para frontend
  const statusMap: Record<string, Championship['status']> = {
    'rascunho': 'draft',
    'ativo': 'active',
    'finalizado': 'finished',
    'cancelado': 'finished', // Mapear cancelado para finished
  };

  // Mapear sport do backend para frontend
  const sportMap: Record<string, string> = {
    'futebol': 'football',
    'futsal': 'futsal',
    'basquete': 'basketball',
    'volei': 'volleyball',
  };

  return {
    ...championship,
    status: statusMap[championship.status] || 'draft',
    sport: sportMap[championship.sport] || championship.sport,
  };
};

export const championshipService = {
  // Listar campeonatos do usuário logado
  getUserChampionships: async (): Promise<{ success: boolean; data: { championships: Championship[] } }> => {
    const response: any = await api.get('/championships');
    
    // Mapear todos os campeonatos
    if (response.success && response.data.championships) {
      response.data.championships = response.data.championships.map(mapChampionshipFromBackend);
    }
    
    return response;
  },

  // Buscar campeonato por ID
  getChampionshipById: async (id: string): Promise<{ success: boolean; data: { championship: Championship } }> => {
    const response: any = await api.get(`/championships/${id}`);
    
    // Mapear o campeonato retornado
    if (response.success && response.data.championship) {
      response.data.championship = mapChampionshipFromBackend(response.data.championship);
    }
    
    return response;
  },

  // Criar novo campeonato
  createChampionship: async (data: CreateChampionshipData): Promise<{ success: boolean; data: { championship: Championship } }> => {
    // Os valores já vêm corretos do championshipStore, apenas precisamos garantir
    // que sport e format estejam nos valores aceitos pelo validador do backend
    
    // O validador aceita: 'football', 'basketball', 'volleyball', 'handball', 'futsal'
    const validSports = ['football', 'basketball', 'volleyball', 'handball', 'futsal'];
    const sport = validSports.includes(data.sport) ? data.sport : 'football';
    
    // O validador aceita: 'league', 'knockout', 'group_knockout'
    const formatMap: Record<string, string> = {
      'single-elimination': 'knockout',
      'double-elimination': 'knockout',
      'round-robin': 'league',
      'league': 'league',
      'knockout': 'knockout',
      'group_knockout': 'group_knockout',
    };
    
    const format = formatMap[data.format] || 'league';

    const backendData = {
      ...data,
      sport,
      format,
    };

    console.log('📤 Dados finais enviados ao backend:', backendData);

    const response: any = await api.post('/championships', backendData);
    
    // Mapear o campeonato criado
    if (response.success && response.data.championship) {
      response.data.championship = mapChampionshipFromBackend(response.data.championship);
    }
    
    return response;
  },

  // Atualizar campeonato
  updateChampionship: async (id: string, data: UpdateChampionshipData): Promise<{ success: boolean; data: { championship: Championship } }> => {
    const response: any = await api.put(`/championships/${id}`, data);
    
    // Mapear o campeonato atualizado
    if (response.success && response.data.championship) {
      response.data.championship = mapChampionshipFromBackend(response.data.championship);
    }
    
    return response;
  },

  // Deletar campeonato
  deleteChampionship: async (id: string): Promise<{ success: boolean; message: string }> => {
    return await api.delete(`/championships/${id}`);
  },
};
