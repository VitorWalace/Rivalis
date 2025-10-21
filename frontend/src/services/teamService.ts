import api from './api';
import { Team } from '../types';

export const teamService = {
  // Criar time
  createTeam: async (championshipId: string, teamData: Partial<Team>) => {
    try {
      const response = await api.post('/teams', { ...teamData, championshipId });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar time:', error);
      throw error;
    }
  },

  // Atualizar time
  updateTeam: async (championshipId: string, teamId: string, teamData: Partial<Team>) => {
    try {
      const response = await api.put(`/teams/${teamId}`, teamData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar time:', error);
      throw error;
    }
  },

  // Deletar time
  deleteTeam: async (championshipId: string, teamId: string) => {
    try {
      const response = await api.delete(`/teams/${teamId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao deletar time:', error);
      throw error;
    }
  },

  // Buscar times de um campeonato
  getTeams: async (championshipId: string) => {
    try {
      const response = await api.get(`/teams/championship/${championshipId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar times:', error);
      throw error;
    }
  },
};
