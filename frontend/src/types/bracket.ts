import type { Team } from './index';

export type MatchStatus = 'pending' | 'scheduled' | 'live' | 'finished' | 'locked';

export interface BracketMatch {
  id: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  winner?: Team;
  nextMatchId?: string;
  dependsOn?: string[]; // IDs das partidas anteriores que definem os times
  round: number; // Número da rodada/fase (1 = final, 2 = semi, 3 = quartas, etc.)
  position: number; // Posição dentro da rodada
  scheduledDate?: Date | string;
  location?: string;
}

export interface Phase {
  name: string; // "Final", "Semifinal", "Quartas de Final", etc.
  displayName: string; // "🏆 FINAL", "🥇 SEMIFINAL", etc.
  round: number; // 1, 2, 3, 4, etc.
  matches: BracketMatch[];
  isCompleted: boolean;
  isCurrent: boolean;
  totalMatches: number;
  completedMatches: number;
}

export interface BracketNode {
  match: BracketMatch;
  children?: [BracketNode | null, BracketNode | null];
  level: number; // Nível na árvore (0 = final, 1 = semi, etc.)
  position: number;
}

export type ViewMode = 'list' | 'bracket';

export interface BracketViewProps {
  phases: Phase[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  championshipId: string;
}
