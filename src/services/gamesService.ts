import api from './api';
import type { Game } from '../types';

export interface CreateGameData {
  championshipId: string;
  homeTeamId: string;
  awayTeamId: string;
  round: number;
  venue?: string;
  scheduledAt?: Date;
}

export interface UpdateGameData {
  homeTeamId?: string;
  awayTeamId?: string;
  round?: number;
  venue?: string;
  scheduledAt?: Date;
  homeScore?: number;
  awayScore?: number;
}

export interface UpdateGameStatusData {
  status: 'scheduled' | 'live' | 'paused' | 'finished' | 'cancelled' | 'pending';
}

export interface FinishGameData {
  homeScore: number;
  awayScore: number;
}

export const gamesService = {
  // Criar novo jogo
  async createGame(data: CreateGameData) {
    const response = await api.post('/games', data);
    return response; // interceptor já retornou response.data
  },

  // Buscar jogos por campeonato
  async getGamesByChampionship(championshipId: string) {
    const response = await api.get(`/games/championship/${championshipId}`);
    return response;
  },

  // Buscar jogo por ID
  async getGameById(gameId: string) {
    const response = await api.get(`/games/${gameId}`);
    return response;
  },

  // Atualizar jogo
  async updateGame(gameId: string, data: UpdateGameData) {
    const response = await api.put(`/games/${gameId}`, data);
    return response;
  },

  // Atualizar status do jogo
  async updateGameStatus(gameId: string, data: UpdateGameStatusData) {
    const response = await api.patch(`/games/${gameId}/status`, data);
    return response;
  },

  // Finalizar jogo
  async finishGame(gameId: string, data: FinishGameData) {
    const response = await api.post(`/games/${gameId}/finish`, data);
    return response;
  },

  // Deletar jogo
  async deleteGame(gameId: string) {
    const response = await api.delete(`/games/${gameId}`);
    return response;
  },

  // Buscar todos os jogos do usuário
  async getAllUserGames() {
    // Será implementado no backend se necessário
    // Por enquanto, buscamos via campeonatos
    const response = await api.get('/championships');
    // Pelo contrato atual, o interceptor retorna o objeto já "data"
    // Estrutura esperada: { success: true, data: { championships: [...] } }
  const championships = (response as any)?.data?.championships || [];
    
    // Coletar todos os jogos de todos os campeonatos
    const allGames: any[] = [];
    championships.forEach((championship: any) => {
      if (championship.games) {
        championship.games.forEach((game: Game) => {
          allGames.push({
            ...game,
            championship
          });
        });
      }
    });
    
    return {
      success: true,
      data: { games: allGames }
    };
  },

  // Gerar rodada automaticamente
  async generateRound(championshipId: string) {
    const response = await api.post(`/games/generate-round/${championshipId}`);
    return response;
  }
};