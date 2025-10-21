import type { Team } from '../types';

export interface GeneratedMatch {
  homeTeamId: string;
  awayTeamId: string;
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
  const matches: GeneratedMatch[] = [];
  const n = teams.length;

  if (n < 2) {
    throw new Error('São necessários pelo menos 2 times para gerar partidas');
  }

  // Se número ímpar, adiciona placeholder "BYE"
  const participants = n % 2 === 0 ? [...teams] : [...teams, null];
  const rounds = participants.length - 1;
  const matchesPerRound = participants.length / 2;

  for (let round = 0; round < rounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = (round + match) % (participants.length - 1);
      const awayIdx = (participants.length - 1 - match + round) % (participants.length - 1);

      const homeTeam = homeIdx === participants.length - 1 
        ? participants[participants.length - 1] 
        : participants[homeIdx];
      const awayTeam = awayIdx === participants.length - 1 
        ? participants[participants.length - 1] 
        : participants[awayIdx];

      // Pula se algum time for "BYE"
      if (homeTeam && awayTeam) {
        matches.push({
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          round: round + 1,
          homeScore: null,
          awayScore: null,
          status: 'scheduled',
        });
      }
    }
  }

  // Se ida e volta, duplica invertendo mandos
  if (doubleRound) {
    const secondRound = matches.map((match) => ({
      homeTeamId: match.awayTeamId,
      awayTeamId: match.homeTeamId,
      round: match.round + rounds,
      homeScore: null,
      awayScore: null,
      status: 'scheduled' as const,
    }));
    matches.push(...secondRound);
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
export function generateKnockout(teams: Team[]): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];

  if (teams.length < 2) {
    throw new Error('São necessários pelo menos 2 times para gerar partidas');
  }

  // Calcula próxima potência de 2
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const byes = bracketSize - teams.length;

  // Embaralha times para sorteio aleatório
  const shuffled = [...teams].sort(() => Math.random() - 0.5);

  // Monta bracket com BYEs
  const bracket: (Team | null)[] = [
    ...shuffled,
    ...Array(byes).fill(null),
  ];

  let round = 1;
  let currentRound = bracket;

  while (currentRound.length > 1) {
    const nextRound: (Team | null)[] = [];
    const stageName = getKnockoutStageName(currentRound.length);

    for (let i = 0; i < currentRound.length; i += 2) {
      const team1 = currentRound[i];
      const team2 = currentRound[i + 1];

      // Se ambos são válidos, cria partida
      if (team1 && team2) {
        matches.push({
          homeTeamId: team1.id,
          awayTeamId: team2.id,
          round,
          group: stageName,
          homeScore: null,
          awayScore: null,
          status: 'scheduled',
        });
        nextRound.push(null); // Vencedor ainda indefinido
      } else {
        // Time passa direto (BYE)
        nextRound.push(team1 || team2);
      }
    }

    currentRound = nextRound;
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
