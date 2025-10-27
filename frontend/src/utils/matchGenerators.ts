import type { Team } from '../types';

export interface GeneratedMatch {
  homeTeamId: string | null; // null indica participante ainda indefinido
  awayTeamId: string | null; // null indica participante ainda indefinido
  round: number;
  group?: string;
  homeScore: null;
  awayScore: null;
  status: 'scheduled';
}

export interface GroupInfo {
  name: string;
  teams: Team[];
}

export interface GroupsPlayoffsResult {
  matches: GeneratedMatch[];
  groups: GroupInfo[];
}

/**
 * Gera partidas no formato Round-Robin (todos contra todos)
 */
export function generateRoundRobin(
  teams: Team[],
  doubleRound: boolean = false
): GeneratedMatch[] {
  if (teams.length < 2) {
    throw new Error('São necessários pelo menos 2 times para gerar partidas');
  }

  const rotating: Array<Team | null> = [...teams];
  let hasPlaceholder = false;

  if (rotating.length % 2 !== 0) {
    rotating.push(null);
    hasPlaceholder = true;
  }

  const totalRounds = rotating.length - 1;
  const halfSize = rotating.length / 2;
  const matches: GeneratedMatch[] = [];

  for (let round = 0; round < totalRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const home = rotating[i];
      const away = rotating[rotating.length - 1 - i];

      if (!home || !away) {
        continue;
      }

      const shouldSwapHomeAway = !hasPlaceholder && round % 2 === 1;

      const fixtureHome = shouldSwapHomeAway ? away : home;
      const fixtureAway = shouldSwapHomeAway ? home : away;

      matches.push({
        homeTeamId: fixtureHome.id,
        awayTeamId: fixtureAway.id,
        round: round + 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
      });
    }

    const tail = rotating.pop();
    if (tail !== undefined) {
      rotating.splice(1, 0, tail);
    }
  }

  if (doubleRound) {
    const mirrored = matches.map((match) => ({
      homeTeamId: match.awayTeamId,
      awayTeamId: match.homeTeamId,
      round: match.round + totalRounds,
      homeScore: null,
      awayScore: null,
      status: 'scheduled' as const,
    }));
    matches.push(...mirrored);
  }

  return matches;
}

/**
 * Retorna o nome da fase do mata-mata baseado no número de times
 */
export function getKnockoutStageName(teamsInRound: number): string {
  switch (teamsInRound) {
    case 2:
      return 'Final';
    case 4:
      return 'Semifinal';
    case 8:
      return 'Quartas de final';
    case 16:
      return 'Oitavas de final';
    case 32:
      return 'Fase de 32';
    default:
      return `Fase de ${teamsInRound}`;
  }
}

/**
 * Gera partidas no formato Mata-Mata (eliminação simples)
 */
const isPowerOfTwo = (value: number) => value > 0 && (value & (value - 1)) === 0;

export function generateKnockout(teams: Team[]): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];

  if (teams.length < 2) {
    throw new Error('São necessários pelo menos 2 times para gerar partidas');
  }

  if (!isPowerOfTwo(teams.length)) {
    throw new Error('Formato mata-mata requer 2, 4, 8, 16... times. Ajuste a quantidade de participantes.');
  }

  const shuffled = [...teams].sort(() => Math.random() - 0.5);

  let round = 1;
  let currentTeams: (Team | null)[] = [...shuffled];

  while (currentTeams.length > 1) {
    const stageName = getKnockoutStageName(currentTeams.length);
    const matchCount = currentTeams.length / 2;
    const nextRound: (Team | null)[] = Array(matchCount).fill(null);

    for (let i = 0; i < matchCount; i++) {
      const homeTeam = currentTeams[i * 2];
      const awayTeam = currentTeams[i * 2 + 1];

      matches.push({
        homeTeamId: homeTeam ? homeTeam.id : null,
        awayTeamId: awayTeam ? awayTeam.id : null,
        round,
        group: stageName,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
      });
    }

    currentTeams = nextRound;
    round++;
  }

  return matches;
}

/**
 * Gera partidas no formato Grupos + Mata-Mata
 */
export function generateGroupsAndPlayoffs(
  teams: Team[],
  numGroups: number,
  qualifyPerGroup: number
): GroupsPlayoffsResult {
  const matches: GeneratedMatch[] = [];
  const groupsInfo: GroupInfo[] = [];

  if (teams.length < numGroups * 2) {
    throw new Error(`São necessários pelo menos ${numGroups * 2} times para ${numGroups} grupos`);
  }

  if (teams.length % numGroups !== 0) {
    throw new Error('O número de times deve ser divisível pelo número de grupos');
  }

  const teamsPerGroup = teams.length / numGroups;

  if (qualifyPerGroup >= teamsPerGroup) {
    throw new Error('Classificados por grupo deve ser menor que times por grupo');
  }

  // Embaralha e distribui times nos grupos
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const groups: Team[][] = Array.from({ length: numGroups }, () => []);

  shuffled.forEach((team, index) => {
    groups[index % numGroups].push(team);
  });

  // Gera round-robin dentro de cada grupo e salva informações dos grupos
  groups.forEach((group, groupIndex) => {
    const groupLetter = String.fromCharCode(65 + groupIndex); // A, B, C, D...
    const groupName = `Grupo ${groupLetter}`;
    
    // Salva informações do grupo
    groupsInfo.push({
      name: groupName,
      teams: group,
    });
    
    const groupMatches = generateRoundRobin(group, false);

    groupMatches.forEach((match) => {
      matches.push({
        ...match,
        group: groupName,
      });
    });
  });

  // Simula classificação (pega os N primeiros de cada grupo)
  const qualified: Team[] = [];
  for (let i = 0; i < qualifyPerGroup; i++) {
    groups.forEach((group) => {
      if (group[i]) qualified.push(group[i]);
    });
  }

  const qualifiedCount = qualified.length;

  if (!isPowerOfTwo(qualifiedCount)) {
    throw new Error('Número de times classificados para o mata-mata deve ser uma potência de 2 (2, 4, 8, 16...).');
  }

  // Gera mata-mata com classificados
  const playoffMatches = generateKnockout(qualified);
  const maxGroupRound = Math.max(...matches.map((m) => m.round));

  playoffMatches.forEach((match) => {
    matches.push({
      ...match,
      round: match.round + maxGroupRound,
    });
  });

  return {
    matches,
    groups: groupsInfo,
  };
}
