import api from './api';

export const teamsAPI = {
  // Criar time
  async createTeam(championshipId: string, teamData: { name: string; color?: string }) {
    const response = await api.post('/teams', {
      championshipId,
      ...teamData
    });
    return response.data;
  },

  // Buscar times por campeonato
  async getTeamsByChampionship(championshipId: string) {
    const response = await api.get(`/teams/championship/${championshipId}`);
    return response.data;
  },

  // Buscar time por ID
  async getTeamById(teamId: string) {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },

  // Atualizar time
  async updateTeam(teamId: string, teamData: { name: string; color?: string }) {
    const response = await api.put(`/teams/${teamId}`, teamData);
    return response.data;
  },

  // Deletar time
  async deleteTeam(teamId: string) {
    const response = await api.delete(`/teams/${teamId}`);
    return response.data;
  }
};