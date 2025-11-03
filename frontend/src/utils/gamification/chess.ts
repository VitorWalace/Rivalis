import type { Player, Team } from '../../types';

export type ChessGamificationResult =
  | { status: 'in-progress' }
  | { status: 'checkmate'; winner: 'w' | 'b' }
  | { status: 'draw'; reason: string }
  | { status: 'resignation'; winner: 'w' | 'b' }
  | { status: 'time'; winner: 'w' | 'b' };

export interface ChessGamificationMove {
  color: 'w' | 'b';
  captured?: string;
  check?: boolean;
  checkmate?: boolean;
  timestamp?: number;
}

export interface ChessClockSnapshot {
  initial: { w: number; b: number };
  final: { w: number; b: number };
  increment: number;
}

export interface ChessGamificationContext {
  result: ChessGamificationResult;
  moves: ChessGamificationMove[];
  clocks: ChessClockSnapshot;
  teams: {
    white: { team: Team; player?: Player | null };
    black: { team: Team; player?: Player | null };
  };
}

export interface ChessAchievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

type SideColor = 'w' | 'b';

interface SideStats {
  moves: number;
  captures: number;
  checks: number;
  deliveredMate: boolean;
}

interface ChessAchievementDefinition extends ChessAchievement {
  condition: (args: {
    color: SideColor;
    opponent: SideColor;
    stats: Record<SideColor, SideStats>;
    context: ChessGamificationContext;
  }) => boolean;
}

export interface ChessGamificationSideSummary {
  color: 'white' | 'black';
  teamName: string;
  playerName: string;
  totalXp: number;
  baseXp: number;
  bonuses: Array<{ label: string; xp: number }>;
  achievementsUnlocked: ChessAchievement[];
  existingAchievementNames: string[];
}

export interface ChessGamificationSummary {
  match: {
    totalMoves: number;
    totalPlys: number;
    durationSeconds: number | null;
    resultLabel: string;
  };
  sides: {
    white: ChessGamificationSideSummary;
    black: ChessGamificationSideSummary;
  };
  notifications: Array<{
    color: 'white' | 'black';
    message: string;
    xp: number;
    achievements: ChessAchievement[];
  }>;
}

const CHESS_ACHIEVEMENTS: ChessAchievementDefinition[] = [
  {
    id: 'chess_checkmate_master',
    name: 'Xeque-Mate Magistral',
    description: 'Vença por xeque-mate.',
    xp: 85,
    rarity: 'epic',
    condition: ({ color, context }) =>
      context.result.status === 'checkmate' && context.result.winner === color,
  },
  {
    id: 'chess_speed_attack',
    name: 'Ataque Relâmpago',
    description: 'Decida a partida em até 25 movimentos.',
    xp: 60,
    rarity: 'rare',
    condition: ({ color, context, stats }) =>
      context.result.status !== 'draw' &&
      context.result.status !== 'in-progress' &&
      context.result.winner === color &&
      stats[color].moves <= 25,
  },
  {
    id: 'chess_time_guardian',
    name: 'Guardião do Tempo',
    description: 'Termine com mais de 60% do tempo inicial disponível.',
    xp: 45,
    rarity: 'rare',
    condition: ({ color, context }) => {
      const initial = context.clocks.initial[color];
      if (initial <= 0) return false;
      const remaining = context.clocks.final[color];
      return remaining >= initial * 0.6;
    },
  },
  {
    id: 'chess_piece_hunter',
    name: 'Caçador de Peças',
    description: 'Capture ao menos 8 peças adversárias.',
    xp: 35,
    rarity: 'common',
    condition: ({ color, stats }) => stats[color].captures >= 8,
  },
  {
    id: 'chess_pressure_cooker',
    name: 'Pressão Constante',
    description: 'Forçe 6 ou mais cheques durante a partida.',
    xp: 40,
    rarity: 'rare',
    condition: ({ color, stats }) => stats[color].checks >= 6,
  },
  {
    id: 'chess_iron_wall',
    name: 'Resiliência de Ferro',
    description: 'Garanta um empate após 80 lances totais.',
    xp: 55,
    rarity: 'epic',
    condition: ({ context }) =>
      context.result.status === 'draw' && context.moves.length >= 80,
  },
  {
    id: 'chess_comeback',
    name: 'Virada Épica',
    description: 'Vença mesmo capturando menos peças que o adversário.',
    xp: 75,
    rarity: 'epic',
    condition: ({ color, opponent, context, stats }) =>
      context.result.status !== 'draw' &&
      context.result.status !== 'in-progress' &&
      context.result.winner === color &&
      stats[color].captures < stats[opponent].captures,
  },
];

const collectStats = (moves: ChessGamificationMove[]): Record<SideColor, SideStats> => {
  const stats: Record<SideColor, SideStats> = {
    w: { moves: 0, captures: 0, checks: 0, deliveredMate: false },
    b: { moves: 0, captures: 0, checks: 0, deliveredMate: false },
  };

  moves.forEach((move) => {
    const bucket = stats[move.color];
    bucket.moves += 1;
    if (move.captured) {
      bucket.captures += 1;
    }
    if (move.check) {
      bucket.checks += 1;
    }
    if (move.checkmate) {
      bucket.deliveredMate = true;
    }
  });

  return stats;
};

const formatResultLabel = (context: ChessGamificationContext): string => {
  const { result, teams } = context;
  const whiteName = teams.white.player?.name ?? teams.white.team.name;
  const blackName = teams.black.player?.name ?? teams.black.team.name;

  switch (result.status) {
    case 'checkmate':
      return `Xeque-mate: ${result.winner === 'w' ? whiteName : blackName}`;
    case 'resignation':
      return `Abandono: ${result.winner === 'w' ? whiteName : blackName}`;
    case 'time':
      return `Tempo esgotado: ${result.winner === 'w' ? whiteName : blackName}`;
    case 'draw':
      return `Empate (${result.reason})`;
    default:
      return 'Partida em andamento';
  }
};

const buildSideSummary = (
  color: SideColor,
  context: ChessGamificationContext,
  stats: Record<SideColor, SideStats>,
  totalPlys: number,
  durationSeconds: number | null
): ChessGamificationSideSummary => {
  const sideKey = color === 'w' ? 'white' : 'black';
  const teamData = context.teams[sideKey];
  const player = teamData.player ?? null;
  const playerName = player?.name ?? teamData.team.name;
  const participationXp = 40;

  const existingAchievementNames = new Set(
    (player?.achievements ?? []).map((achievement) => achievement.name.toLowerCase())
  );

  const summary: ChessGamificationSideSummary = {
    color: sideKey,
    teamName: teamData.team.name,
    playerName,
    totalXp: participationXp,
    baseXp: participationXp,
    bonuses: [
      {
        label: 'Participação na partida',
        xp: participationXp,
      },
    ],
    achievementsUnlocked: [],
    existingAchievementNames: Array.from(existingAchievementNames),
  };

  const addBonus = (label: string, xp: number) => {
    if (xp === 0) return;
    summary.bonuses.push({ label, xp });
    summary.totalXp += xp;
  };

  const opponentColor: SideColor = color === 'w' ? 'b' : 'w';

  if (context.result.status === 'draw') {
    addBonus('Empate batalhado', 60);
  } else if (context.result.status !== 'in-progress') {
    if (context.result.winner === color) {
      addBonus('Vitória', 120);
    } else {
      addBonus('Partida disputada', 35);
    }
  }

  CHESS_ACHIEVEMENTS.forEach((achievement) => {
    if (existingAchievementNames.has(achievement.name.toLowerCase())) {
      return;
    }

    const unlocked = achievement.condition({
      color,
      opponent: opponentColor,
      stats,
      context,
    });

    if (unlocked) {
      summary.achievementsUnlocked.push(achievement);
      summary.totalXp += achievement.xp;
    }
  });

  // Pequenos bônus contextuais opcionais
  if (durationSeconds !== null && durationSeconds <= 15 * 60 && context.result.status !== 'draw') {
    addBonus('Conclusão acelerada', 20);
  }

  if (totalPlys >= 100) {
    addBonus('Maratona estratégica', 25);
  }

  return summary;
};

export function calculateChessGamification(
  context: ChessGamificationContext
): ChessGamificationSummary | null {
  if (context.result.status === 'in-progress') {
    return null;
  }

  const stats = collectStats(context.moves);
  const totalPlys = context.moves.length;
  const totalMoves = Math.ceil(totalPlys / 2);
  const firstTimestamp = context.moves[0]?.timestamp ?? null;
  const lastTimestamp = context.moves[context.moves.length - 1]?.timestamp ?? null;
  const durationSeconds =
    firstTimestamp !== null && lastTimestamp !== null
      ? Math.max(0, Math.round((lastTimestamp - firstTimestamp) / 1000))
      : null;

  const whiteSummary = buildSideSummary('w', context, stats, totalPlys, durationSeconds);
  const blackSummary = buildSideSummary('b', context, stats, totalPlys, durationSeconds);

  const notifications: ChessGamificationSummary['notifications'] = [];

  if (whiteSummary.achievementsUnlocked.length > 0) {
    notifications.push({
      color: 'white',
      message: `♘ ${whiteSummary.playerName} desbloqueou ${whiteSummary.achievementsUnlocked.length} conquista(s)!`,
      xp: whiteSummary.totalXp,
      achievements: whiteSummary.achievementsUnlocked,
    });
  }

  if (blackSummary.achievementsUnlocked.length > 0) {
    notifications.push({
      color: 'black',
      message: `♞ ${blackSummary.playerName} desbloqueou ${blackSummary.achievementsUnlocked.length} conquista(s)!`,
      xp: blackSummary.totalXp,
      achievements: blackSummary.achievementsUnlocked,
    });
  }

  return {
    match: {
      totalMoves,
      totalPlys,
      durationSeconds,
      resultLabel: formatResultLabel(context),
    },
    sides: {
      white: whiteSummary,
      black: blackSummary,
    },
    notifications,
  };
}
