export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export type SportCategory = 'team' | 'individual';

export type TournamentFormat =
  | 'groupStageKnockout'
  | 'league'
  | 'knockout'
  | 'heats'
  | 'timeTrial';

export type SportId =
  | 'futsal'
  | 'basketball'
  | 'handball'
  | 'volleyball'
  | 'chess'
  | 'table-tennis';

export type MetricValueType = 'count' | 'time' | 'distance' | 'score' | 'custom';

export interface MetricDefinition {
  id: string;
  label: string;
  description?: string;
  unit: string;
  valueType: MetricValueType;
  higherIsBetter?: boolean;
  defaultValue?: number;
  icon?: string;
}

export interface SportScoringRules {
  primaryMetric: MetricDefinition;
  secondaryMetrics?: MetricDefinition[];
  allowsDraw: boolean;
  outcomePoints?: {
    win: number;
    draw?: number;
    loss?: number;
  };
  notes?: string;
}

export interface SportMatchFormat {
  durationType: 'time' | 'sets' | 'rounds' | 'aggregate' | 'distance';
  regulationPeriods?: Array<{ label: string; minutes: number }>;
  sets?: { bestOf: number; pointsToWin: number; winBy?: number };
  rounds?: { count: number; durationMinutes?: number };
  timeCapMinutes?: number;
  distanceTargetMeters?: number;
  notes?: string;
}

export interface SportParticipantStructure {
  type: 'team' | 'individual' | 'hybrid';
  playersPerSide?: { min: number; max: number };
  rosterSize?: { min: number; max: number };
  substitutesAllowed?: boolean;
  individualLabel?: string;
}

export interface SportCompetitionStructure {
  recommendedFormats: TournamentFormat[];
  supportsGroupStage: boolean;
  supportsLeague: boolean;
  supportsKnockout: boolean;
  supportsHeats?: boolean;
  supportsTimeTrial?: boolean;
  notes?: string;
}

export interface SportDefinition {
  id: SportId;
  name: string;
  category: SportCategory;
  description?: string;
  participantStructure: SportParticipantStructure;
  scoring: SportScoringRules;
  matchFormat: SportMatchFormat;
  competitionStructure: SportCompetitionStructure;
  performanceMetrics: MetricDefinition[];
  icon?: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  userId?: string;
  number?: number;
  position?: string;
  stats: PlayerStats;
  achievements: Achievement[];
  xp: number;
  avatar?: string;
  level?: number;
  metrics?: Record<string, number>;
}

export interface PlayerStats {
  games: number;
  goals: number;
  assists: number;
  wins: number;
  losses: number;
  draws: number;
  yellowCards?: number;
  redCards?: number;
  matchesPlayed?: number;
  metrics?: Record<string, number>;
}

export interface Team {
  id: string;
  name: string;
  championshipId: string;
  players: Player[];
  stats: TeamStats;
  logo?: string;
  metrics?: Record<string, number>;
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
  metrics?: Record<string, number>;
}

export interface Championship {
  id: string;
  name: string;
  sport: SportId;
  adminId: string;
  description?: string;
  location?: string;
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
  sportConfig?: SportDefinition;
  sportCategory?: SportCategory;
  matchFormatConfig?: Partial<SportMatchFormat>;
  scoringConfig?: Partial<SportScoringRules>;
  performanceMetricsConfig?: MetricDefinition[];
}

export type GameStatus =
  | 'pending'
  | 'scheduled'
  | 'in-progress'
  | 'finished'
  | 'postponed';

export interface GoalEvent {
  id: string;
  type: 'goal';
  teamId: string;
  playerId?: string;
  minute?: number;
  assistPlayerId?: string;
}

export interface CardEvent {
  id: string;
  type: 'card';
  card: 'yellow' | 'red';
  teamId: string;
  playerId?: string;
  minute?: number;
  reason?: string;
}

export type MatchEvent = GoalEvent | CardEvent;

export interface Game {
  id: string;
  championshipId: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?: number;
  awayScore?: number;
  status: GameStatus;
  goals?: Goal[];
  events?: MatchEvent[];
  playedAt?: Date;
  date?: string;
  location?: string;
  stage?: string;
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

export type SportType =
  | 'futsal'
  | 'basketball'
  | 'handball'
  | 'volleyball'
  | 'chess'
  | 'table-tennis';

export interface CreateChampionshipData {
  name: string;
  sport: SportType;
  teams: string[];
  players: Record<string, string[]>;
}

export type MatchEventType = MatchEvent['type'];