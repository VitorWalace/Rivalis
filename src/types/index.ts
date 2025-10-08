export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  userId?: string;
  stats: PlayerStats;
  achievements: Achievement[];
  xp: number;
  avatar?: string;
}

export interface PlayerStats {
  games: number;
  goals: number;
  assists: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface Team {
  id: string;
  name: string;
  championshipId: string;
  players: Player[];
  stats: TeamStats;
  logo?: string;
}

export interface TeamStats {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

export interface Championship {
  id: string;
  name: string;
  sport: 'football' | 'futsal';
  adminId: string;
  description?: string;
  format?: 'groupStageKnockout' | 'league' | 'knockout' | string;
  visibility?: 'public' | 'private' | 'inviteOnly';
  maxParticipants?: number;
  currentParticipants?: number;
  teams: Team[];
  games: Game[];
  status: 'draft' | 'active' | 'finished';
  createdAt: Date;
  startDate?: Date;
  registrationDeadline?: Date;
  hasEntryFee?: boolean;
  entryFee?: number;
  prizePool?: number;
  prizeDistribution?: string;
  endDate?: Date;
}

export interface Game {
  id: string;
  championshipId: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: 'pending' | 'finished';
  goals: Goal[];
  playedAt?: Date;
}

export interface Goal {
  id: string;
  gameId: string;
  playerId: string;
  teamId: string;
  assistPlayerId?: string;
  minute?: number;
  type: 'goal' | 'own_goal' | 'penalty';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'goal' | 'assist' | 'game' | 'special';
  condition: string;
  xpReward: number;
  unlockedAt?: Date;
}

export type SportType = 'football' | 'futsal';

export interface CreateChampionshipData {
  name: string;
  sport: SportType;
  teams: string[];
  players: Record<string, string[]>;
}