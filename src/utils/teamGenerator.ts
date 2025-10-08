import type { Team } from '../types';

export const AUTO_TEAM_GENERATION_LIMIT = 10;
export const DEFAULT_PLAYERS_PER_TEAM = 7;
const PLAYER_POSITIONS = ['Goleiro', 'Defensor', 'Meio-campo', 'Atacante'] as const;

const createRuntimeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createPlayerStats = () => ({
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  matchesPlayed: 0,
  games: 0,
  wins: 0,
  losses: 0,
  draws: 0,
});

const createTeamStats = () => ({
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
  games: 0,
  position: 0,
});

type ChampionshipLike = {
  id: string;
  teams?: Team[];
  maxTeams?: number | string;
};

type GenerationContext = {
  existingTeams: Team[];
  allowableCount: number;
  canGenerate: boolean;
  nextOrder: number;
};

const buildGeneratedPlayer = (params: {
  teamId: string;
  teamOrder: number;
  playerIndex: number;
}) => {
  const { teamId, teamOrder, playerIndex } = params;
  const jerseyNumber = playerIndex + 1;
  const position = PLAYER_POSITIONS[playerIndex % PLAYER_POSITIONS.length];

  return {
    id: createRuntimeId(),
    name: `Jogador ${teamOrder}-${jerseyNumber}`,
    number: jerseyNumber,
    position,
    teamId,
    stats: createPlayerStats(),
    achievements: [],
    xp: 0,
    level: 1,
  } as unknown as Team['players'][number];
};

const buildGeneratedTeam = (params: {
  championshipId: string;
  teamOrder: number;
}): Team => {
  const { championshipId, teamOrder } = params;
  const teamId = createRuntimeId();

  const players = Array.from({ length: DEFAULT_PLAYERS_PER_TEAM }, (_, playerIndex) =>
    buildGeneratedPlayer({ teamId, teamOrder, playerIndex })
  ) as Team['players'];

  return {
    id: teamId,
    name: `Time Teste ${teamOrder}`,
    championshipId,
    players,
    stats: createTeamStats(),
    logo: undefined,
  } as Team;
};

export const evaluateGenerationCapacity = (championship: ChampionshipLike): GenerationContext => {
  const existingTeams = championship.teams ?? [];
  const rawMaxTeams = championship.maxTeams;
  const parsedMaxTeams =
    typeof rawMaxTeams === 'number'
      ? rawMaxTeams
      : typeof rawMaxTeams === 'string'
      ? Number.parseInt(rawMaxTeams, 10)
      : undefined;

  const maxTeamsAllowed = Number.isFinite(parsedMaxTeams) && (parsedMaxTeams ?? 0) > 0 ? parsedMaxTeams! : Infinity;
  const remainingSlots = Math.max(maxTeamsAllowed - existingTeams.length, 0);
  const effectiveSlots = Number.isFinite(remainingSlots) ? remainingSlots : AUTO_TEAM_GENERATION_LIMIT;
  const allowableCount = Math.min(AUTO_TEAM_GENERATION_LIMIT, effectiveSlots);

  return {
    existingTeams,
    allowableCount,
    canGenerate: allowableCount > 0,
    nextOrder: existingTeams.length + 1,
  };
};

export const generateTeamsForTesting = (championship: ChampionshipLike) => {
  const context = evaluateGenerationCapacity(championship);

  if (!context.canGenerate) {
    return { generatedTeams: [] as Team[], context };
  }

  const generatedTeams = Array.from({ length: context.allowableCount }, (_, index) =>
    buildGeneratedTeam({
      championshipId: championship.id,
      teamOrder: context.nextOrder + index,
    })
  );

  return { generatedTeams, context };
};

export type { GenerationContext };
