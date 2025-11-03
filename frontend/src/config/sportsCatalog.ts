import type {
  MetricDefinition,
  SportDefinition,
  SportId,
  TournamentFormat,
} from '../types/index.ts';

const SPORT_ALIAS_MAP: Record<string, SportId> = {
  futsal: 'futsal',
  futebol: 'futsal',
  football: 'futsal',
  soccer: 'futsal',
  basketball: 'basketball',
  basquete: 'basketball',
  handball: 'handball',
  handebol: 'handball',
  volleyball: 'volleyball',
  volei: 'volleyball',
  'voleibol': 'volleyball',
  chess: 'chess',
  xadrez: 'chess',
  'table-tennis': 'table-tennis',
  'table tennis': 'table-tennis',
  tenis_mesa: 'table-tennis',
  'tenis de mesa': 'table-tennis',
};

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
        { id: 'assists', label: 'Assistências', unit: 'assistências', valueType: 'count', higherIsBetter: true },
        { id: 'saves', label: 'Defesas', unit: 'defesas', valueType: 'count', higherIsBetter: true },
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
    description: 'Esporte coletivo decidido em sets, com equipes de seis jogadores.',
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
    id: 'table-tennis',
    name: 'Tênis de Mesa',
    category: 'team',
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
    id: 'chess',
    name: 'Xadrez',
    category: 'team',
    icon: '♟️',
    description: 'Disputas estratégicas em tabuleiro com ritmo clássico ou rápido.',
    participantStructure: {
      type: 'individual',
      individualLabel: 'Jogador',
      individualLabelPlural: 'Jogadores',
      rosterSize: { min: 1, max: 6 },
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
        { id: 'wins', label: 'Vitórias', unit: 'partidas', valueType: 'count', higherIsBetter: true },
        { id: 'draws', label: 'Empates', unit: 'partidas', valueType: 'count', higherIsBetter: true },
      ],
      allowsDraw: true,
      outcomePoints: { win: 1, draw: 0.5, loss: 0 },
      notes: 'Pontuação padrão FIDE com 1 ponto por vitória e 0,5 por empate.',
    },
    matchFormat: {
      durationType: 'time',
      regulationPeriods: [{ label: 'Partida', minutes: 60 }],
      notes: 'O tempo pode variar conforme a categoria (clássico, rápido ou blitz).',
    },
    competitionStructure: {
      recommendedFormats: ['league', 'groupStageKnockout', 'knockout'],
      supportsGroupStage: true,
      supportsLeague: true,
      supportsKnockout: true,
    },
    performanceMetrics: [
      buildMetric({ id: 'points', label: 'Pontos', unit: 'pontos', valueType: 'count' }),
      buildMetric({ id: 'wins', label: 'Vitórias', unit: 'partidas', valueType: 'count' }),
      buildMetric({ id: 'draws', label: 'Empates', unit: 'partidas', valueType: 'count' }),
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

export const normalizeSportId = (sportId?: string | SportId | null): SportId | undefined => {
  if (!sportId) {
    return undefined;
  }

  const normalizedKey = sportId.toString().trim().toLowerCase();
  if (SPORT_ALIAS_MAP[normalizedKey]) {
    return SPORT_ALIAS_MAP[normalizedKey];
  }

  const directMatch = SPORTS_CATALOG.find((sport) => sport.id === normalizedKey);
  return directMatch ? directMatch.id : undefined;
};

const pluralizePortuguese = (label: string) => {
  if (!label) return label;
  if (label.endsWith('ão')) return `${label.slice(0, -2)}ões`;
  if (label.endsWith('m')) return `${label.slice(0, -1)}ns`;
  if (label.endsWith('l')) return `${label.slice(0, -1)}is`;
  if (label.endsWith('r')) return `${label.slice(0, -1)}res`;
  if (label.endsWith('s')) return label;
  if (label.endsWith('z')) return `${label}es`;
  if (label.endsWith('x')) return `${label}es`;
  if (label.endsWith('ista')) return `${label}s`;
  if (label.endsWith('a')) return `${label}s`;
  if (label.endsWith('e')) return `${label}s`;
  if (label.endsWith('o')) return `${label}s`;
  return `${label}s`;
};

export const formatParticipantLabel = (sportId: SportId | string, options?: { plural?: boolean }) => {
  const plural = options?.plural ?? false;
  const definition = getSportDefinition(sportId as SportId);
  if (!definition) {
    return plural ? 'Participantes' : 'Participante';
  }

  const structure = definition.participantStructure;
  if (structure.type === 'team') {
    return plural ? 'Times' : 'Time';
  }

  const baseSingular = structure.individualLabel ?? 'Atleta';
  if (!plural) {
    return baseSingular;
  }

  if (structure.individualLabelPlural) {
    return structure.individualLabelPlural;
  }

  return pluralizePortuguese(baseSingular);
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

export const getSportParticipantType = (sportId?: SportId | string): 'team' | 'individual' | 'hybrid' => {
  if (!sportId) return 'team';
  const definition = getSportDefinition(sportId as SportId);
  return definition?.participantStructure.type ?? 'team';
};

export const isTeamSport = (sportId?: SportId | string): boolean => {
  return getSportParticipantType(sportId) === 'team';
};

export const isIndividualSport = (sportId?: SportId | string): boolean => {
  return getSportParticipantType(sportId) === 'individual';
};

export const getSportActionLabel = (sportId?: SportId | string, action: 'add' | 'manage' | 'list' = 'add'): string => {
  const isTeam = isTeamSport(sportId);
  const participantLabel = formatParticipantLabel(sportId || '', { plural: action !== 'add' });
  
  switch (action) {
    case 'add':
      return isTeam ? `Adicionar Time` : `Adicionar Jogador`;
    case 'manage':
      return isTeam ? `Gerenciar Times` : `Gerenciar Jogadores`;
    case 'list':
      return participantLabel;
    default:
      return participantLabel;
  }
};
