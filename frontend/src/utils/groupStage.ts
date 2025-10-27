import type { Championship, Game, Team } from '../types';

export type GroupResultToken = 'W' | 'D' | 'L';

export interface GroupStandingRow {
  teamId: string;
  teamName: string;
  logo?: string;
  color?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  recentResults: GroupResultToken[];
}

export interface GroupStageGroup {
  label: string;
  standings: GroupStandingRow[];
  upcomingMatches: Game[];
  matches: Game[];
}

export interface GroupStageContext {
  groups: GroupStageGroup[];
  groupMatches: Game[];
  knockoutMatches: Game[];
  qualifiersPerGroup: number;
  isGroupStageComplete: boolean;
  firstKnockoutRound?: number;
}

const FINISHED_STATUSES = new Set(['finalizado', 'finished']);

const extractStageLabel = (game: Game): string => {
  const stage = game.stage ?? (game as any).group ?? '';
  return String(stage);
};

const isGroupStageGame = (game: Game): boolean => {
  const stageLabel = extractStageLabel(game).toLowerCase();
  return stageLabel.startsWith('grupo');
};

const isFinished = (game: Game): boolean => {
  if (game.homeScore === null || game.homeScore === undefined) return false;
  if (game.awayScore === null || game.awayScore === undefined) return false;
  if (game.status && FINISHED_STATUSES.has(game.status)) return true;
  return true;
};

const compareStandings = (a: GroupStandingRow, b: GroupStandingRow) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.teamName.localeCompare(b.teamName, 'pt-BR');
};

const cloneRecent = (recent: GroupResultToken[]): GroupResultToken[] => {
  if (recent.length <= 5) return [...recent];
  return recent.slice(recent.length - 5);
};

export function buildGroupStageContext(championship?: Championship | null): GroupStageContext | null {
  if (!championship) {
    return null;
  }

  const format = championship.format || '';
  const isGroupFormat = ['grupos', 'groupstageknockout', 'group_stage_knockout', 'group_knockout'].includes(
    format.toLowerCase()
  );

  if (!isGroupFormat) {
    return null;
  }

  const teams = championship.teams || [];
  const games = championship.games || [];
  if (games.length === 0 || teams.length === 0) {
    return null;
  }

  const groupMatches = games.filter(isGroupStageGame);
  if (groupMatches.length === 0) {
    return null;
  }

  const knockoutMatches = games.filter((game) => !isGroupStageGame(game));

  const teamsById = new Map<string, Team>();
  teams.forEach((team) => {
    teamsById.set(team.id, team);
  });

  const groupBuckets = new Map<string, { matches: Game[]; teamIds: Set<string> }>();
  groupMatches.forEach((match) => {
  const label = extractStageLabel(match) || 'Grupo';
    if (!groupBuckets.has(label)) {
      groupBuckets.set(label, { matches: [], teamIds: new Set() });
    }
    const bucket = groupBuckets.get(label)!;
    bucket.matches.push(match);
    if (match.homeTeamId) bucket.teamIds.add(match.homeTeamId);
    if (!match.homeTeamId && match.homeTeam?.id) bucket.teamIds.add(match.homeTeam.id);
    if (match.awayTeamId) bucket.teamIds.add(match.awayTeamId);
    if (!match.awayTeamId && match.awayTeam?.id) bucket.teamIds.add(match.awayTeam.id);
  });

  const groups: GroupStageGroup[] = [];

  groupBuckets.forEach((bucket, label) => {
    const standingsMap = new Map<string, GroupStandingRow>();

    bucket.teamIds.forEach((teamId) => {
      const team = teamsById.get(teamId);
      if (!team) return;
      standingsMap.set(teamId, {
        teamId,
        teamName: team.name,
        logo: team.logo,
        color: team.color,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        recentResults: [],
      });
    });

    const orderedMatches = [...bucket.matches].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      return (a.round || 0) - (b.round || 0);
    });

    orderedMatches.forEach((match) => {
      const homeId = match.homeTeamId || match.homeTeam?.id;
      const awayId = match.awayTeamId || match.awayTeam?.id;
      if (!homeId || !awayId) {
        return;
      }

      const homeStats = standingsMap.get(homeId);
      const awayStats = standingsMap.get(awayId);
      if (!homeStats || !awayStats) return;

      if (!isFinished(match)) {
        return;
      }

      const homeScore = match.homeScore ?? 0;
      const awayScore = match.awayScore ?? 0;

      homeStats.played += 1;
      awayStats.played += 1;
      homeStats.goalsFor += homeScore;
      homeStats.goalsAgainst += awayScore;
      awayStats.goalsFor += awayScore;
      awayStats.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        homeStats.wins += 1;
        homeStats.points += 3;
        homeStats.recentResults.push('W');
        awayStats.losses += 1;
        awayStats.recentResults.push('L');
      } else if (homeScore < awayScore) {
        awayStats.wins += 1;
        awayStats.points += 3;
        awayStats.recentResults.push('W');
        homeStats.losses += 1;
        homeStats.recentResults.push('L');
      } else {
        homeStats.draws += 1;
        awayStats.draws += 1;
        homeStats.points += 1;
        awayStats.points += 1;
        homeStats.recentResults.push('D');
        awayStats.recentResults.push('D');
      }
    });

    const standings = Array.from(standingsMap.values()).map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
      recentResults: cloneRecent(row.recentResults),
    }));

    standings.sort(compareStandings);

    const upcomingMatches = bucket.matches.filter((match) => !isFinished(match)).sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
      if (dateA !== dateB) return dateA - dateB;
      return (a.round || 0) - (b.round || 0);
    });

    groups.push({
      label,
      standings,
      upcomingMatches,
      matches: bucket.matches,
    });
  });

  groups.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  const isGroupStageComplete = groupMatches.every((match) => isFinished(match));

  let qualifiersPerGroup = 0;
  let firstKnockoutRound: number | undefined;
  if (knockoutMatches.length > 0 && groups.length > 0) {
    const rounds = knockoutMatches
      .map((match) => match.round || Number.MAX_SAFE_INTEGER)
      .filter((round) => Number.isFinite(round))
      .sort((a, b) => a - b);
    if (rounds.length > 0) {
      firstKnockoutRound = rounds[0];
      const matchesAtFirstRound = knockoutMatches.filter((match) => (match.round || Number.MAX_SAFE_INTEGER) === firstKnockoutRound);
      const slots = matchesAtFirstRound.length * 2;
      if (slots > 0) {
        qualifiersPerGroup = Math.max(1, Math.floor(slots / groups.length));
      }
    }
  }

  return {
    groups,
    groupMatches,
    knockoutMatches,
    qualifiersPerGroup,
    isGroupStageComplete,
    firstKnockoutRound,
  };
}
