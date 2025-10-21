import type { BracketMatch, Phase, BracketNode } from '../types/bracket';

/**
 * Nomes das fases baseados no número de times
 */
export const getPhaseDisplayName = (round: number): { name: string; displayName: string } => {
  const roundsFromFinal = round;
  
  const phaseNames: Record<number, { name: string; displayName: string }> = {
    1: { name: 'Final', displayName: '🏆 FINAL' },
    2: { name: 'Semifinal', displayName: '🥇 SEMIFINAL' },
    3: { name: 'Quartas de Final', displayName: '🥈 QUARTAS DE FINAL' },
    4: { name: 'Oitavas de Final', displayName: '🥉 OITAVAS DE FINAL' },
    5: { name: 'Dezesseis Avos', displayName: '⚡ DEZESSEIS AVOS' },
    6: { name: 'Trinta e Dois Avos', displayName: '⚡ TRINTA E DOIS AVOS' },
  };

  return phaseNames[roundsFromFinal] || { 
    name: `Rodada ${round}`, 
    displayName: `⚡ RODADA ${round}` 
  };
};

/**
 * Agrupa partidas por fase/rodada
 */
export const groupMatchesByPhase = (matches: BracketMatch[]): Phase[] => {
  if (!matches || matches.length === 0) return [];

  // Agrupar por round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, BracketMatch[]>);

  // Determinar total de rounds
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  // Criar fases
  const phases: Phase[] = rounds.map((round) => {
    const roundMatches = matchesByRound[round];
    const { name, displayName } = getPhaseDisplayName(round);
    
    const completedMatches = roundMatches.filter(m => m.status === 'finished').length;
    const isCompleted = completedMatches === roundMatches.length;
    
    // Fase atual é a primeira não completa
    const isCurrent = !isCompleted && rounds.filter(r => {
      const rMatches = matchesByRound[r];
      const rCompleted = rMatches.filter(m => m.status === 'finished').length;
      return rCompleted < rMatches.length;
    })[0] === round;

    return {
      name,
      displayName,
      round,
      matches: roundMatches.sort((a, b) => a.position - b.position),
      isCompleted,
      isCurrent,
      totalMatches: roundMatches.length,
      completedMatches,
    };
  });

  return phases.sort((a, b) => b.round - a.round); // Ordem decrescente (Final primeiro)
};

/**
 * Calcula o progresso geral do campeonato
 */
export const calculateBracketProgress = (phases: Phase[]): { 
  percentage: number; 
  currentPhase: Phase | null;
  completedPhases: number;
  totalPhases: number;
} => {
  if (phases.length === 0) {
    return { percentage: 0, currentPhase: null, completedPhases: 0, totalPhases: 0 };
  }

  const completedPhases = phases.filter(p => p.isCompleted).length;
  const currentPhase = phases.find(p => p.isCurrent) || null;
  const totalPhases = phases.length;
  
  const percentage = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  return { percentage, currentPhase, completedPhases, totalPhases };
};

/**
 * Constrói árvore de bracket para visualização
 */
export const buildBracketTree = (matches: BracketMatch[]): BracketNode | null => {
  if (!matches || matches.length === 0) return null;

  // Encontrar a final (round 1)
  const finalMatch = matches.find(m => m.round === 1);
  if (!finalMatch) return null;

  const buildNode = (match: BracketMatch, level: number): BracketNode => {
    const node: BracketNode = {
      match,
      level,
      position: match.position,
    };

    // Encontrar partidas que alimentam esta
    if (match.dependsOn && match.dependsOn.length > 0) {
      const childMatches = matches.filter(m => match.dependsOn?.includes(m.id));
      if (childMatches.length > 0) {
        node.children = [
          childMatches[0] ? buildNode(childMatches[0], level + 1) : null,
          childMatches[1] ? buildNode(childMatches[1], level + 1) : null,
        ];
      }
    }

    return node;
  };

  return buildNode(finalMatch, 0);
};

/**
 * Determina o status visual de uma partida
 */
export const getMatchStatusInfo = (match: BracketMatch): {
  label: string;
  color: string;
  icon: string;
} => {
  switch (match.status) {
    case 'finished':
      return {
        label: 'Finalizada',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: '✅',
      };
    case 'live':
      return {
        label: 'Ao Vivo',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: '🔴',
      };
    case 'scheduled':
      return {
        label: 'Agendada',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: '🕐',
      };
    case 'locked':
      return {
        label: 'Aguardando',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: '🔒',
      };
    default:
      return {
        label: 'Pendente',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: '⏳',
      };
  }
};

/**
 * Formata data de forma amigável
 */
export const formatMatchDate = (date?: Date | string): string => {
  if (!date) return 'A definir';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return d.toLocaleDateString('pt-BR', options);
};

/**
 * Gera partidas de mata-mata baseado em times
 */
export const generateKnockoutMatches = (teamIds: string[], startDate?: Date): BracketMatch[] => {
  const numTeams = teamIds.length;
  
  // Verificar se é potência de 2
  if (!Number.isInteger(Math.log2(numTeams))) {
    throw new Error('Número de times deve ser potência de 2 (4, 8, 16, 32, etc.)');
  }

  const matches: BracketMatch[] = [];
  const totalRounds = Math.log2(numTeams);
  
  let matchIdCounter = 1;
  let currentDate = startDate || new Date();

  // Criar primeira rodada
  for (let i = 0; i < numTeams / 2; i++) {
    matches.push({
      id: `match-${matchIdCounter++}`,
      homeTeam: null, // Será preenchido com dados reais
      awayTeam: null,
      status: 'scheduled',
      round: totalRounds,
      position: i,
      scheduledDate: new Date(currentDate),
    });
  }

  // Criar rodadas subsequentes
  for (let round = totalRounds - 1; round >= 1; round--) {
    const matchesInRound = Math.pow(2, round - 1);
    const previousRoundStart = matches.length - Math.pow(2, round);
    
    for (let i = 0; i < matchesInRound; i++) {
      const dependsOn = [
        matches[previousRoundStart + i * 2].id,
        matches[previousRoundStart + i * 2 + 1].id,
      ];

      currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 dias

      matches.push({
        id: `match-${matchIdCounter++}`,
        homeTeam: null,
        awayTeam: null,
        status: 'locked',
        round,
        position: i,
        dependsOn,
        nextMatchId: round > 1 ? `match-${matchIdCounter + Math.floor(i / 2)}` : undefined,
        scheduledDate: new Date(currentDate),
      });
    }
  }

  return matches;
};
