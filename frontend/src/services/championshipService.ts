import api from './api';
import type { Championship } from '../types/index.ts';

export interface CreateChampionshipData {
  name: string;
  sport: string;
  format: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
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
const parseDate = (value?: string | Date | null) => {
  if (!value) return undefined;
  const dateValue = value instanceof Date ? value : new Date(value);
  return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
};

const sanitizePositionKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const normalizePositionForSport = (sport?: string, position?: string | null) => {
  if (!position) {
    return undefined;
  }

  const trimmed = String(position).trim();
  if (!trimmed) {
    return undefined;
  }

  if ((sport ?? '').toLowerCase() !== 'futsal') {
    return trimmed;
  }

  const lookupKey = sanitizePositionKey(trimmed);
  const futsalMap: Record<string, string> = {
    goleiro: 'Goleiro',
    defensor: 'Fixo',
    defesa: 'Fixo',
    zagueiro: 'Fixo',
    fixo: 'Fixo',
    meiocampo: 'Ala',
    meiocampista: 'Ala',
    meiocamp: 'Ala',
    ala: 'Ala',
    meia: 'Ala',
    atacante: 'Pivo',
    pivo: 'Pivo',
    centroavante: 'Pivo',
  };

  return futsalMap[lookupKey] ?? trimmed;
};

const mapTeamPlayerPositions = (sport?: string, team?: any) => {
  if (!team || !Array.isArray(team.players)) {
    return team;
  }

  const normalizedPlayers = team.players.map((player: any) => {
    const normalizedPosition = normalizePositionForSport(sport, player.position);
    return normalizedPosition && normalizedPosition !== player.position
      ? { ...player, position: normalizedPosition }
      : player;
  });

  const playersChanged = normalizedPlayers.some((player: any, index: number) => player !== team.players[index]);
  return playersChanged ? { ...team, players: normalizedPlayers } : team;
};

const mapTeamsPlayerPositions = (sport?: string, teams?: any[]) => {
  if (!Array.isArray(teams)) {
    return [];
  }

  return teams.map((team) => mapTeamPlayerPositions(sport, team));
};

const mapGamesTeamPositions = (sport?: string, games?: any[]) => {
  if (!Array.isArray(games)) {
    return [];
  }

  return games.map((game) => {
    if (!game || (!game.homeTeam && !game.awayTeam)) {
      return game;
    }

    const mappedHome = mapTeamPlayerPositions(sport, game.homeTeam);
    const mappedAway = mapTeamPlayerPositions(sport, game.awayTeam);

    if (mappedHome === game.homeTeam && mappedAway === game.awayTeam) {
      return game;
    }

    return {
      ...game,
      ...(mappedHome !== game.homeTeam ? { homeTeam: mappedHome } : {}),
      ...(mappedAway !== game.awayTeam ? { awayTeam: mappedAway } : {}),
    };
  });
};
const mapChampionshipFromBackend = (championship: any): Championship => {
  // Mapear status do backend para frontend
  const statusMap: Record<string, Championship['status']> = {
    'rascunho': 'draft',
    'ativo': 'active',
    'finalizado': 'finished',
    'cancelado': 'finished', // Mapear cancelado para finished
  };

  // Mapear sport do backend para frontend
  const sportMap: Record<string, Championship['sport']> = {
    'futsal': 'futsal',
    'xadrez': 'chess',
    'chess': 'chess',
    'basketball': 'basketball',
    'basquete': 'basketball',
    'volleyball': 'volleyball',
    'volei': 'volleyball',
    'handball': 'handball',
  };

  return {
    ...championship,
    // Por padrão, considere ativo para evitar exibir "Em preparação" sem necessidade
    status: statusMap[championship.status] || 'active',
  sport: (sportMap[championship.sport] || championship.sport) as Championship['sport'],
    startDate: parseDate(championship.startDate),
    endDate: parseDate(championship.endDate),
    createdAt: parseDate(championship.createdAt) ?? new Date(),
    registrationDeadline: parseDate(championship.registrationDeadline),
    teams: Array.isArray(championship.teams) ? championship.teams : [],
    games: Array.isArray(championship.games) ? championship.games : [],
  };
};

export const championshipService = {
  // Listar campeonatos públicos (todos os usuários)
  getPublicChampionships: async (): Promise<{ success: boolean; data: { championships: Championship[] } }> => {
    const response: any = await api.get('/championships/all');
    if (response.success && response.data.championships) {
      response.data.championships = response.data.championships.map(mapChampionshipFromBackend);
    }
    return response;
  },
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
      const mapped = mapChampionshipFromBackend(response.data.championship);
      // Esta rota só retorna dados quando o usuário logado é o criador.
      // Para habilitar todas as ações de edição no frontend, marcamos isOwner como true.
      response.data.championship = { ...mapped, isOwner: true } as Championship;
    }
    
    return response;
  },
  // Buscar campeonato público por ID (sem restrição de proprietário)
  getPublicChampionshipById: async (id: string): Promise<{ success: boolean; data: { championship: Championship } }> => {
    const response: any = await api.get(`/championships/all/${id}`);
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
  const validSports = ['football', 'basketball', 'volleyball', 'handball', 'futsal', 'chess'];
    const sport = validSports.includes(data.sport) ? data.sport : 'football';
    
    // O validador aceita: 'league', 'knockout', 'group_knockout'
    const formatMap: Record<string, string> = {
      'single-elimination': 'knockout',
  'double-elimination': 'knockout',
  'groups-and-playoffs': 'group_knockout',
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

