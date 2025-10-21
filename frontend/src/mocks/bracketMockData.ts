import type { BracketMatch, Phase } from '../types/bracket';
import type { Team } from '../types';

/**
 * Times de exemplo para demonstração
 */
export const mockTeams: Team[] = [
  {
    id: 'team1',
    name: 'Relâmpago FC',
    logo: '⚡',
    championshipId: 'mock-championship',
    players: [],
    stats: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 1,
    },
  },
  {
    id: 'team2',
    name: 'Dragões Unidos',
    logo: '🐉',
    championshipId: 'mock-championship',
    players: [],
    stats: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 2,
    },
  },
  {
    id: 'team3',
    name: 'Águias Douradas',
    logo: '🦅',
    championshipId: 'mock-championship',
    players: [],
    stats: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 3,
    },
  },
  {
    id: 'team4',
    name: 'Leões da Serra',
    logo: '🦁',
    championshipId: 'mock-championship',
    players: [],
    stats: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 4,
    },
  },
  {
    id: 'team5',
    name: 'Tigres FC',
    logo: '🐯',
    championshipId: 'mock-championship',
    players: [],
    stats: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 5,
    },
  },
  {
    id: 'team6',
    name: 'Panteras Negras',
    logo: '🐆',
    championshipId: 'mock-championship',
    players: [],
    stats: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 6,
    },
  },
  {
    id: 'team7',
    name: 'Falcões FC',
    logo: '🦅',
    championshipId: 'mock-championship',
    players: [],
    stats: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 7,
    },
  },
  {
    id: 'team8',
    name: 'Lobos do Norte',
    logo: '🐺',
    championshipId: 'mock-championship',
    players: [],
    stats: {
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 8,
    },
  },
];

/**
 * Partidas de exemplo para campeonato de 8 times (Quartas + Semi + Final)
 */
export const mockKnockoutMatches: BracketMatch[] = [
  // QUARTAS DE FINAL (round 3)
  {
    id: 'match1',
    homeTeam: mockTeams[0],
    awayTeam: mockTeams[1],
    homeScore: 3,
    awayScore: 1,
    status: 'finished',
    winner: mockTeams[0],
    round: 3,
    position: 0,
    nextMatchId: 'match5',
    scheduledDate: new Date('2025-10-25T14:00:00'),
    location: 'Ginásio Municipal',
  },
  {
    id: 'match2',
    homeTeam: mockTeams[2],
    awayTeam: mockTeams[3],
    homeScore: 2,
    awayScore: 2,
    status: 'finished',
    winner: mockTeams[2], // Venceu nos pênaltis
    round: 3,
    position: 1,
    nextMatchId: 'match5',
    scheduledDate: new Date('2025-10-25T16:00:00'),
    location: 'Arena Central',
  },
  {
    id: 'match3',
    homeTeam: mockTeams[4],
    awayTeam: mockTeams[5],
    homeScore: 1,
    awayScore: 0,
    status: 'finished',
    winner: mockTeams[4],
    round: 3,
    position: 2,
    nextMatchId: 'match6',
    scheduledDate: new Date('2025-10-25T18:00:00'),
    location: 'Ginásio Municipal',
  },
  {
    id: 'match4',
    homeTeam: mockTeams[6],
    awayTeam: mockTeams[7],
    status: 'live',
    homeScore: 2,
    awayScore: 1,
    round: 3,
    position: 3,
    nextMatchId: 'match6',
    scheduledDate: new Date('2025-10-25T20:00:00'),
    location: 'Arena Central',
  },
  
  // SEMIFINAIS (round 2)
  {
    id: 'match5',
    homeTeam: mockTeams[0], // Vencedor match1
    awayTeam: mockTeams[2], // Vencedor match2
    status: 'scheduled',
    round: 2,
    position: 0,
    dependsOn: ['match1', 'match2'],
    nextMatchId: 'match7',
    scheduledDate: new Date('2025-11-01T15:00:00'),
    location: 'Estádio Principal',
  },
  {
    id: 'match6',
    homeTeam: mockTeams[4], // Vencedor match3
    awayTeam: null, // Aguardando match4
    status: 'locked',
    round: 2,
    position: 1,
    dependsOn: ['match3', 'match4'],
    nextMatchId: 'match7',
    scheduledDate: new Date('2025-11-01T18:00:00'),
    location: 'Estádio Principal',
  },
  
  // FINAL (round 1)
  {
    id: 'match7',
    homeTeam: null,
    awayTeam: null,
    status: 'locked',
    round: 1,
    position: 0,
    dependsOn: ['match5', 'match6'],
    scheduledDate: new Date('2025-11-08T16:00:00'),
    location: '🏆 Estádio Olímpico',
  },
];

/**
 * Exemplo de campeonato de 16 times (Oitavas + Quartas + Semi + Final)
 */
export const mockLargeKnockoutMatches: BracketMatch[] = [
  // OITAVAS DE FINAL (round 4) - 8 partidas
  // ... (seria muito longo, mas seguiria o mesmo padrão)
];

/**
 * Função para obter fases mockadas agrupadas
 */
export const getMockPhases = (): Phase[] => {
  // Agrupar manualmente para exemplo
  const quartas: Phase = {
    name: 'Quartas de Final',
    displayName: '🥈 QUARTAS DE FINAL',
    round: 3,
    matches: mockKnockoutMatches.filter(m => m.round === 3),
    isCompleted: false,
    isCurrent: true,
    totalMatches: 4,
    completedMatches: 3,
  };

  const semis: Phase = {
    name: 'Semifinal',
    displayName: '🥇 SEMIFINAL',
    round: 2,
    matches: mockKnockoutMatches.filter(m => m.round === 2),
    isCompleted: false,
    isCurrent: false,
    totalMatches: 2,
    completedMatches: 0,
  };

  const final: Phase = {
    name: 'Final',
    displayName: '🏆 FINAL',
    round: 1,
    matches: mockKnockoutMatches.filter(m => m.round === 1),
    isCompleted: false,
    isCurrent: false,
    totalMatches: 1,
    completedMatches: 0,
  };

  return [final, semis, quartas]; // Ordem decrescente (como esperado)
};

/**
 * Exemplo de uso:
 * 
 * import { getMockPhases } from '@/mocks/bracketMockData';
 * import KnockoutBracket from '@/components/KnockoutBracket';
 * 
 * function DemoPage() {
 *   const phases = getMockPhases();
 *   
 *   return (
 *     <KnockoutBracket
 *       phases={phases}
 *       onMatchClick={(match) => console.log(match)}
 *     />
 *   );
 * }
 */
