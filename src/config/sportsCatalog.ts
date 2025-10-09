import type {
  MetricDefinition,
  SportDefinition,
  SportId,
  TournamentFormat,
} from '../types/index.ts';

const buildMetric = (
  metric: Omit<MetricDefinition, 'id'> & { id: MetricDefinition['id'] }
): MetricDefinition => ({
  higherIsBetter: true,
  ...metric,
});

const sharedFormats = {
  leagueKnockout: ['league', 'groupStageKnockout', 'knockout'] as TournamentFormat[],
};

export const SPORTS_CATALOG: SportDefinition[] = [
  {
    id: 'futsal',
    name: 'Futsal',
    category: 'team',
    icon: '⚽',
    description: 'Esporte coletivo indoor com equipes de 5 jogadores e partidas de alta intensidade.',
    participantStructure: {
      type: 'team',
      playersPerSide: { min: 5, max: 5 },
      rosterSize: { min: 8, max: 14 },
      substitutesAllowed: true,
    },
    scoring: {
      primaryMetric: {
        id: 'goals',
        label: 'Gols',
        unit: 'gols',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        {
          id: 'assists',
          label: 'Assistências',
          unit: 'assistências',
          valueType: 'count',
          higherIsBetter: true,
        },
        {
          id: 'saves',
          label: 'Defesas',
          unit: 'defesas',
          valueType: 'count',
          higherIsBetter: true,
        },
      ],
      allowsDraw: true,
      outcomePoints: { win: 3, draw: 1, loss: 0 },
    },
    matchFormat: {
      durationType: 'time',
      regulationPeriods: [
        { label: '1º Tempo', minutes: 20 },
        { label: '2º Tempo', minutes: 20 },
      ],
      timeCapMinutes: 40,
      notes: 'Intervalo de 10 minutos e possibilidade de prorrogação em fases decisivas.',
    },
    competitionStructure: {
      recommendedFormats: sharedFormats.leagueKnockout,
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'goals', label: 'Gols', unit: 'gols', valueType: 'count' }),
      buildMetric({ id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count' }),
      { id: 'yellow_cards', label: 'Cartões Amarelos', unit: 'cartões', valueType: 'count', higherIsBetter: false },
      { id: 'red_cards', label: 'Cartões Vermelhos', unit: 'cartões', valueType: 'count', higherIsBetter: false },
    ],
  },
  {
    id: 'football',
    name: 'Futebol de Campo',
    category: 'team',
    icon: '🏟️',
    description: 'Modalidade outdoor com 11 jogadores por equipe e partidas de 90 minutos.',
    participantStructure: {
      type: 'team',
      playersPerSide: { min: 11, max: 11 },
      rosterSize: { min: 15, max: 23 },
      substitutesAllowed: true,
    },
    scoring: {
      primaryMetric: {
        id: 'goals',
        label: 'Gols',
        unit: 'gols',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        {
          id: 'assists',
          label: 'Assistências',
          unit: 'assistências',
          valueType: 'count',
          higherIsBetter: true,
        },
        {
          id: 'clean_sheets',
          label: 'Jogos sem sofrer gols',
          unit: 'partidas',
          valueType: 'count',
          higherIsBetter: true,
        },
      ],
      allowsDraw: true,
      outcomePoints: { win: 3, draw: 1, loss: 0 },
    },
    matchFormat: {
      durationType: 'time',
      regulationPeriods: [
        { label: '1º Tempo', minutes: 45 },
        { label: '2º Tempo', minutes: 45 },
      ],
      timeCapMinutes: 90,
      notes: 'Prorrogação em dois tempos de 15 minutos e disputa de pênaltis quando necessário.',
    },
    competitionStructure: {
      recommendedFormats: sharedFormats.leagueKnockout,
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'goals', label: 'Gols', unit: 'gols', valueType: 'count' }),
      buildMetric({ id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count' }),
      { id: 'clean_sheets', label: 'Clean Sheets', unit: 'partidas', valueType: 'count', higherIsBetter: true },
    ],
  },
  {
    id: 'society',
    name: 'Futebol Society',
    category: 'team',
    icon: '🥅',
    description: 'Versão reduzida do futebol tradicional com equipes de 7 jogadores e campo sintético.',
    participantStructure: {
      type: 'team',
      playersPerSide: { min: 7, max: 7 },
      rosterSize: { min: 10, max: 15 },
      substitutesAllowed: true,
    },
    scoring: {
      primaryMetric: {
        id: 'goals',
        label: 'Gols',
        unit: 'gols',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count', higherIsBetter: true },
        { id: 'saves', label: 'Defesas', unit: 'defesas', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: true,
      outcomePoints: { win: 3, draw: 1, loss: 0 },
    },
    matchFormat: {
      durationType: 'time',
      regulationPeriods: [
        { label: '1º Tempo', minutes: 25 },
        { label: '2º Tempo', minutes: 25 },
      ],
      timeCapMinutes: 50,
      notes: 'Tempos reduzidos com possibilidade de prorrogação ou shootouts em finais.',
    },
    competitionStructure: {
      recommendedFormats: sharedFormats.leagueKnockout,
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'goals', label: 'Gols', unit: 'gols', valueType: 'count' }),
      buildMetric({ id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count' }),
      { id: 'saves', label: 'Defesas', unit: 'defesas', valueType: 'count', higherIsBetter: true },
    ],
  },
  {
    id: 'beach-soccer',
    name: 'Futebol de Areia',
    category: 'team',
    icon: '🏖️',
    description: 'Modalidade disputada na areia com partidas dinâmicas de 5 jogadores por lado.',
    participantStructure: {
      type: 'team',
      playersPerSide: { min: 5, max: 5 },
      rosterSize: { min: 8, max: 12 },
      substitutesAllowed: true,
    },
    scoring: {
      primaryMetric: {
        id: 'goals',
        label: 'Gols',
        unit: 'gols',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count', higherIsBetter: true },
        { id: 'saves', label: 'Defesas', unit: 'defesas', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: false,
      outcomePoints: { win: 3, loss: 0 },
      notes: 'Empates são resolvidos com prorrogação de 3 minutos e disputa de pênaltis.',
    },
    matchFormat: {
      durationType: 'time',
      regulationPeriods: [
        { label: '1º Período', minutes: 12 },
        { label: '2º Período', minutes: 12 },
        { label: '3º Período', minutes: 12 },
      ],
      timeCapMinutes: 36,
      notes: 'Quadro de areia com trocas ilimitadas e ritmo acelerado.',
    },
    competitionStructure: {
      recommendedFormats: sharedFormats.leagueKnockout,
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'goals', label: 'Gols', unit: 'gols', valueType: 'count' }),
      buildMetric({ id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count' }),
      buildMetric({ id: 'saves', label: 'Defesas', unit: 'defesas', valueType: 'count' }),
    ],
  },
  {
    id: 'basketball',
    name: 'Basquete',
    category: 'team',
    icon: '🏀',
    description: 'Esporte coletivo com pontuação por cestas e partidas divididas em quartos.',
    participantStructure: {
      type: 'team',
      playersPerSide: { min: 5, max: 5 },
      rosterSize: { min: 8, max: 12 },
      substitutesAllowed: true,
    },
    scoring: {
      primaryMetric: {
        id: 'points',
        label: 'Pontos',
        unit: 'pontos',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'rebounds', label: 'Rebotes', unit: 'rebotes', valueType: 'count', higherIsBetter: true },
        { id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count', higherIsBetter: true },
        { id: 'steals', label: 'Roubos de bola', unit: 'roubos', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: false,
      outcomePoints: { win: 2, loss: 1 },
    },
    matchFormat: {
      durationType: 'time',
      regulationPeriods: [
        { label: '1º Quarto', minutes: 10 },
        { label: '2º Quarto', minutes: 10 },
        { label: '3º Quarto', minutes: 10 },
        { label: '4º Quarto', minutes: 10 },
      ],
      timeCapMinutes: 40,
      notes: 'Prorrogação de 5 minutos até definição do vencedor.',
    },
    competitionStructure: {
      recommendedFormats: ['league', 'groupStageKnockout', 'knockout'],
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'points', label: 'Pontos', unit: 'pontos', valueType: 'count' }),
      buildMetric({ id: 'rebounds', label: 'Rebotes', unit: 'rebotes', valueType: 'count' }),
      buildMetric({ id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count' }),
      buildMetric({ id: 'steals', label: 'Roubos', unit: 'roubos', valueType: 'count' }),
    ],
  },
  {
    id: 'handball',
    name: 'Handebol',
    category: 'team',
    icon: '🤾',
    description: 'Esporte coletivo indoor com partidas de alta pontuação e contato intenso.',
    participantStructure: {
      type: 'team',
      playersPerSide: { min: 7, max: 7 },
      rosterSize: { min: 10, max: 16 },
      substitutesAllowed: true,
    },
    scoring: {
      primaryMetric: {
        id: 'goals',
        label: 'Gols',
        unit: 'gols',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count', higherIsBetter: true },
        { id: 'saves', label: 'Defesas', unit: 'defesas', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: true,
      outcomePoints: { win: 2, draw: 1, loss: 0 },
    },
    matchFormat: {
      durationType: 'time',
      regulationPeriods: [
        { label: '1º Tempo', minutes: 30 },
        { label: '2º Tempo', minutes: 30 },
      ],
      timeCapMinutes: 60,
      notes: 'Prorrogação em dois tempos de 5 minutos e decisão por 7 metros se necessário.',
    },
    competitionStructure: {
      recommendedFormats: sharedFormats.leagueKnockout,
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'goals', label: 'Gols', unit: 'gols', valueType: 'count' }),
      buildMetric({ id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count' }),
      buildMetric({ id: 'saves', label: 'Defesas', unit: 'defesas', valueType: 'count' }),
    ],
  },
  {
    id: 'volleyball',
    name: 'Vôlei',
    category: 'team',
    icon: '🏐',
    description: 'Esporte coletivo decididos em sets, com equipes de seis jogadores.',
    participantStructure: {
      type: 'team',
      playersPerSide: { min: 6, max: 6 },
      rosterSize: { min: 8, max: 14 },
      substitutesAllowed: true,
    },
    scoring: {
      primaryMetric: {
        id: 'sets_won',
        label: 'Sets vencidos',
        unit: 'sets',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'points', label: 'Pontos', unit: 'pontos', valueType: 'count', higherIsBetter: true },
        { id: 'aces', label: 'Aces', unit: 'aces', valueType: 'count', higherIsBetter: true },
        { id: 'blocks', label: 'Bloqueios', unit: 'bloqueios', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: false,
      outcomePoints: { win: 3, loss: 0 },
    },
    matchFormat: {
      durationType: 'sets',
      sets: { bestOf: 5, pointsToWin: 25, winBy: 2 },
      notes: 'Tie-break disputado em 15 pontos com diferença mínima de 2.',
    },
    competitionStructure: {
      recommendedFormats: ['league', 'groupStageKnockout', 'knockout'],
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'aces', label: 'Aces', unit: 'aces', valueType: 'count' }),
      buildMetric({ id: 'blocks', label: 'Bloqueios', unit: 'bloqueios', valueType: 'count' }),
      buildMetric({ id: 'digs', label: 'Defesas', unit: 'defesas', valueType: 'count' }),
    ],
  },
  {
    id: 'beach-volleyball',
    name: 'Vôlei de Praia',
    category: 'team',
    icon: '🏝️',
    description: 'Disputas em duplas na areia com sets de rally point e grande exigência física.',
    participantStructure: {
      type: 'team',
      playersPerSide: { min: 2, max: 2 },
      rosterSize: { min: 2, max: 3 },
      substitutesAllowed: false,
    },
    scoring: {
      primaryMetric: {
        id: 'sets_won',
        label: 'Sets vencidos',
        unit: 'sets',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'points', label: 'Pontos', unit: 'pontos', valueType: 'count', higherIsBetter: true },
        { id: 'aces', label: 'Aces', unit: 'aces', valueType: 'count', higherIsBetter: true },
        { id: 'blocks', label: 'Bloqueios', unit: 'bloqueios', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: false,
      outcomePoints: { win: 3, loss: 0 },
      notes: 'Empates são resolvidos no tie-break de 15 pontos com diferença mínima de 2.',
    },
    matchFormat: {
      durationType: 'sets',
      sets: { bestOf: 3, pointsToWin: 21, winBy: 2 },
      notes: 'Tie-break decidido em 15 pontos com rally-point scoring.',
    },
    competitionStructure: {
      recommendedFormats: ['league', 'groupStageKnockout', 'knockout'],
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'aces', label: 'Aces', unit: 'aces', valueType: 'count' }),
      buildMetric({ id: 'blocks', label: 'Bloqueios', unit: 'bloqueios', valueType: 'count' }),
      buildMetric({ id: 'digs', label: 'Defesas', unit: 'defesas', valueType: 'count' }),
    ],
  },
  {
    id: 'tennis',
    name: 'Tênis',
    category: 'individual',
    icon: '🎾',
    description: 'Esporte individual ou em duplas decidido por sets e games.',
    participantStructure: {
      type: 'hybrid',
      individualLabel: 'Tenista',
      playersPerSide: { min: 1, max: 2 },
      rosterSize: { min: 1, max: 2 },
    },
    scoring: {
      primaryMetric: {
        id: 'sets_won',
        label: 'Sets vencidos',
        unit: 'sets',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'aces', label: 'Aces', unit: 'aces', valueType: 'count', higherIsBetter: true },
        { id: 'double_faults', label: 'Duplas faltas', unit: 'erros', valueType: 'count', higherIsBetter: false },
        { id: 'winners', label: 'Winners', unit: 'winners', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: false,
      outcomePoints: { win: 1, loss: 0 },
    },
    matchFormat: {
      durationType: 'sets',
      sets: { bestOf: 3, pointsToWin: 6, winBy: 2 },
      notes: 'Tie-break em 7 pontos (win by 2) e possibilidade de formato melhor de 5 em finais.',
    },
    competitionStructure: {
      recommendedFormats: ['knockout', 'groupStageKnockout', 'timeTrial'],
      supportsGroupStage: true,
      supportsLeague: false,
      supportsKnockout: true,
      supportsTimeTrial: false,
    },
    performanceMetrics: [
      buildMetric({ id: 'aces', label: 'Aces', unit: 'aces', valueType: 'count' }),
      buildMetric({ id: 'winners', label: 'Winners', unit: 'winners', valueType: 'count' }),
      { id: 'double_faults', label: 'Duplas faltas', unit: 'erros', valueType: 'count', higherIsBetter: false },
    ],
  },
  {
    id: 'table-tennis',
    name: 'Tênis de Mesa',
    category: 'individual',
    icon: '🏓',
    description: 'Disputas rápidas em mesas com rallies curtos e alta precisão técnica.',
    participantStructure: {
      type: 'hybrid',
      individualLabel: 'Mesatenista',
      playersPerSide: { min: 1, max: 2 },
      rosterSize: { min: 1, max: 3 },
    },
    scoring: {
      primaryMetric: {
        id: 'sets_won',
        label: 'Sets vencidos',
        unit: 'sets',
        valueType: 'count',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'points', label: 'Pontos', unit: 'pontos', valueType: 'count', higherIsBetter: true },
        { id: 'aces', label: 'Saques vencedores', unit: 'saques', valueType: 'count', higherIsBetter: true },
        { id: 'errors_forced', label: 'Erros forçados', unit: 'erros', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: false,
      outcomePoints: { win: 1, loss: 0 },
      notes: 'Sets disputados até 11 pontos com diferença mínima de 2.',
    },
    matchFormat: {
      durationType: 'sets',
      sets: { bestOf: 5, pointsToWin: 11, winBy: 2 },
      notes: 'Finais podem ser disputadas em melhor de 7 sets.',
    },
    competitionStructure: {
      recommendedFormats: ['league', 'groupStageKnockout', 'knockout'],
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'points', label: 'Pontos', unit: 'pontos', valueType: 'count' }),
      buildMetric({ id: 'aces', label: 'Saques vencedores', unit: 'saques', valueType: 'count' }),
      { id: 'unforced_errors', label: 'Erros não forçados', unit: 'erros', valueType: 'count', higherIsBetter: false },
    ],
  },
  {
    id: 'swimming',
    name: 'Natação',
    category: 'individual',
    icon: '🏊',
    description: 'Provas individuais ou de revezamento decididas pelo menor tempo.',
    participantStructure: {
      type: 'individual',
      individualLabel: 'Nadador',
      playersPerSide: { min: 1, max: 4 },
      rosterSize: { min: 1, max: 6 },
    },
    scoring: {
      primaryMetric: {
        id: 'time',
        label: 'Tempo total',
        unit: 'segundos',
        valueType: 'time',
        higherIsBetter: false,
      },
      allowsDraw: true,
      secondaryMetrics: [
        { id: 'reaction_time', label: 'Tempo de reação', unit: 'segundos', valueType: 'time', higherIsBetter: false },
      ],
    },
    matchFormat: {
      durationType: 'time',
      regulationPeriods: [{ label: 'Prova', minutes: 0 }],
      notes: 'Estrutura baseada em baterias classificatórias e finais.',
    },
    competitionStructure: {
      recommendedFormats: ['heats', 'timeTrial'],
      supportsGroupStage: false,
      supportsLeague: false,
      supportsKnockout: false,
      supportsHeats: true,
      supportsTimeTrial: true,
    },
    performanceMetrics: [
      { id: 'time', label: 'Tempo', unit: 'segundos', valueType: 'time', higherIsBetter: false },
      { id: 'reaction_time', label: 'Tempo de reação', unit: 'segundos', valueType: 'time', higherIsBetter: false },
      { id: 'laps', label: 'Parciais por volta', unit: 'voltas', valueType: 'time', higherIsBetter: false },
    ],
  },
  {
    id: 'athletics',
    name: 'Atletismo',
    category: 'individual',
    icon: '🏃',
    description: 'Provas de pista, campo e combinadas com métricas de tempo, distância ou pontuação.',
    participantStructure: {
      type: 'individual',
      individualLabel: 'Atleta',
      rosterSize: { min: 1, max: 12 },
    },
    scoring: {
      primaryMetric: {
        id: 'result',
        label: 'Resultado Oficial',
        unit: 'tempo/distância',
        valueType: 'custom',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'time', label: 'Tempo', unit: 'segundos', valueType: 'time', higherIsBetter: false },
        { id: 'distance', label: 'Distância', unit: 'metros', valueType: 'distance', higherIsBetter: true },
      ],
      allowsDraw: true,
      notes: 'Dependendo da prova, melhor marca ou menor tempo define o vencedor.',
    },
    matchFormat: {
      durationType: 'aggregate',
      notes: 'Estrutura flexível para baterias, finais e multi-eventos (ex: decatlo).',
    },
    competitionStructure: {
      recommendedFormats: ['heats', 'timeTrial'],
      supportsGroupStage: false,
      supportsLeague: false,
      supportsKnockout: false,
      supportsHeats: true,
      supportsTimeTrial: true,
    },
    performanceMetrics: [
      { id: 'time', label: 'Tempo', unit: 'segundos', valueType: 'time', higherIsBetter: false },
      { id: 'distance', label: 'Distância', unit: 'metros', valueType: 'distance', higherIsBetter: true },
      { id: 'points', label: 'Pontuação', unit: 'pontos', valueType: 'score', higherIsBetter: true },
    ],
  },
  {
    id: 'skate',
    name: 'Skate Street/Park',
    category: 'individual',
    icon: '🛹',
    description: 'Provas de runs avaliados por juízes, focadas em estilo, dificuldade e consistência.',
    participantStructure: {
      type: 'individual',
      individualLabel: 'Skatista',
      rosterSize: { min: 1, max: 4 },
    },
    scoring: {
      primaryMetric: {
        id: 'total_score',
        label: 'Pontuação total',
        unit: 'pontos',
        valueType: 'score',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'best_trick', label: 'Melhor manobra', unit: 'pontos', valueType: 'score', higherIsBetter: true },
        { id: 'consistency', label: 'Consistência', unit: 'pontos', valueType: 'score', higherIsBetter: true },
      ],
      allowsDraw: true,
      outcomePoints: { win: 3, draw: 1, loss: 0 },
      notes: 'Pontuações agregadas de múltiplas baterias e runs avaliadas por juízes.',
    },
    matchFormat: {
      durationType: 'aggregate',
      notes: 'Cada atleta realiza múltiplos runs; melhores notas compõem o resultado final.',
    },
    competitionStructure: {
      recommendedFormats: ['timeTrial', 'knockout'],
      supportsGroupStage: false,
      supportsLeague: false,
      supportsKnockout: true,
      supportsTimeTrial: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'total_score', label: 'Pontuação', unit: 'pontos', valueType: 'score' }),
      buildMetric({ id: 'best_trick', label: 'Melhor manobra', unit: 'pontos', valueType: 'score' }),
      buildMetric({ id: 'consistency', label: 'Consistência', unit: 'pontos', valueType: 'score' }),
    ],
  },
  {
    id: 'mma',
    name: 'MMA',
    category: 'individual',
    icon: '🥋',
    description: 'Combates 1x1 divididos em rounds, decididos por nocaute, finalização ou decisão.',
    participantStructure: {
      type: 'individual',
      individualLabel: 'Lutador',
      playersPerSide: { min: 1, max: 1 },
      rosterSize: { min: 1, max: 3 },
    },
    scoring: {
      primaryMetric: {
        id: 'result',
        label: 'Resultado da luta',
        unit: 'resultado',
        valueType: 'custom',
        higherIsBetter: true,
      },
      secondaryMetrics: [
        { id: 'rounds_won', label: 'Rounds vencidos', unit: 'rounds', valueType: 'count', higherIsBetter: true },
        { id: 'significant_strikes', label: 'Golpes significativos', unit: 'golpes', valueType: 'count', higherIsBetter: true },
        { id: 'takedowns', label: 'Quedas', unit: 'quedas', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: true,
      outcomePoints: { win: 3, draw: 1, loss: 0 },
    },
    matchFormat: {
      durationType: 'rounds',
      rounds: { count: 3, durationMinutes: 5 },
      notes: 'Lutas principais podem ter 5 rounds. Intervalo de 1 minuto entre rounds.',
    },
    competitionStructure: {
      recommendedFormats: ['knockout', 'league'],
      supportsGroupStage: false,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'rounds_won', label: 'Rounds vencidos', unit: 'rounds', valueType: 'count' }),
      buildMetric({ id: 'significant_strikes', label: 'Golpes significativos', unit: 'golpes', valueType: 'count' }),
      buildMetric({ id: 'takedowns', label: 'Quedas', unit: 'quedas', valueType: 'count' }),
    ],
  },
];

export const DEFAULT_SPORT_ID: SportId = 'futsal';

export const getSportDefinition = (sportId: SportId | string): SportDefinition | undefined =>
  SPORTS_CATALOG.find((sport) => sport.id === sportId);

export const listSportsByCategory = () => {
  return SPORTS_CATALOG.reduce<Record<string, SportDefinition[]>>((acc, sport) => {
    const key = sport.category;
    acc[key] = acc[key] ? [...acc[key], sport] : [sport];
    return acc;
  }, {});
};

export const formatParticipantLabel = (sportId: SportId | string) => {
  const definition = getSportDefinition(sportId as SportId);
  if (!definition) return 'Participantes';

  const structure = definition.participantStructure;
  if (structure.type === 'team') {
    return 'Times';
  }
  if (structure.type === 'individual') {
    return structure.individualLabel ?? 'Atletas';
  }
  return structure.individualLabel ? `${structure.individualLabel}s` : 'Participantes';
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const getSportDisplayName = (sportId?: SportId | string) => {
  if (!sportId) return 'Modalidade';
  const definition = getSportDefinition(sportId as SportId);
  if (definition) return definition.name;
  return capitalize(String(sportId));
};

export const getSportIcon = (sportId?: SportId | string) => {
  const definition = sportId ? getSportDefinition(sportId as SportId) : undefined;
  return definition?.icon ?? '🏆';
};
