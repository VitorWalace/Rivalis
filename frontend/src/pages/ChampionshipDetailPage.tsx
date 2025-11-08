import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PencilSquareIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore.ts';
import { useConfirm } from '../store/confirmStore';
import { useMatchEditor } from '../store/matchEditorStore';
import { toast } from 'react-hot-toast';
import MatchGenerator from '../components/MatchGenerator.tsx';
import KnockoutBracket from '../components/KnockoutBracket';
import GroupStageDashboard from '../components/GroupStageDashboard';
import { groupMatchesByPhase } from '../utils/bracketHelpers';
import { teamService } from '../services/teamService';
import { championshipService } from '../services/championshipService';
import api from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';
import { buildGroupStageContext, type GroupStageContext } from '../utils/groupStage.ts';
import type {
  Championship,
  Game,
  GameStatus,
  MatchEvent,
  Player,
  PlayerStats,
  SportDefinition,
  Team,
} from '../types/index.ts';
import {
  DEFAULT_SPORT_ID,
  SPORTS_CATALOG,
  getSportDefinition,
  getSportDisplayName,
  getSportIcon,
  formatParticipantLabel,
  getSportActionLabel,
  isTeamSport,
} from '../config/sportsCatalog.ts';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_ID_MAP } from '../utils/achievements.ts';

const mergeSportDefinitions = (
  base: SportDefinition,
  override?: Partial<SportDefinition>
): SportDefinition => {
  if (!override) {
    return base;
  }

  return {
    ...base,
    ...override,
    participantStructure: {
      ...base.participantStructure,
      ...override.participantStructure,
    },
    scoring: {
      ...base.scoring,
      ...override.scoring,
      primaryMetric: {
        ...base.scoring.primaryMetric,
        ...(override.scoring?.primaryMetric ?? {}),
      },
      secondaryMetrics: override.scoring?.secondaryMetrics ?? base.scoring.secondaryMetrics,
      outcomePoints: (() => {
        const baseOutcome = base.scoring.outcomePoints;
        const overrideOutcome = override.scoring?.outcomePoints;
        if (!baseOutcome && !overrideOutcome) {
          return undefined;
        }
        return {
          win: overrideOutcome?.win ?? baseOutcome?.win ?? 0,
          draw: overrideOutcome?.draw ?? baseOutcome?.draw,
          loss: overrideOutcome?.loss ?? baseOutcome?.loss,
        };
      })(),
    },
    matchFormat: {
      ...base.matchFormat,
      ...override.matchFormat,
    },
    competitionStructure: {
      ...base.competitionStructure,
      ...override.competitionStructure,
      recommendedFormats:
        override.competitionStructure?.recommendedFormats ??
        base.competitionStructure.recommendedFormats,
    },
    performanceMetrics: override.performanceMetrics ?? base.performanceMetrics,
  };
};

type ChampionshipDetailTab = 'overview' | 'teams' | 'games' | 'stats' | 'xp';
type GameSection = { key: string; stageLabel?: string; round: number; matches: Game[] };
type ChessResultCode = 'W' | 'D' | 'L';

const CHESS_RESULT_LABEL: Record<ChessResultCode, string> = {
  W: 'V',
  D: 'E',
  L: 'D',
};

const CHESS_RESULT_BADGE: Record<ChessResultCode, string> = {
  W: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  D: 'bg-slate-100 text-slate-700 border border-slate-200',
  L: 'bg-rose-100 text-rose-700 border border-rose-200',
};

type AggregatedPlayerStats = {
  games: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

const formatChessPoints = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return Number(value.toFixed(1)).toString();
};

const getLevelDetails = (rawXp: number | string | null | undefined) => {
  const xp = Number(rawXp ?? 0);
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;
  const currentLevelBase = (level - 1) * 100;
  const denominator = nextLevelXp - currentLevelBase;
  const rawProgress = denominator > 0 ? ((xp - currentLevelBase) / denominator) * 100 : 0;

  return {
    xp,
    level,
    nextLevelXp,
    currentLevelBase,
    progress: Number.isFinite(rawProgress) ? Math.min(100, Math.max(0, rawProgress)) : 0,
  };
};

const getTabItems = (
  sportId?: string
): ReadonlyArray<{ id: ChampionshipDetailTab; label: string; icon: typeof TrophyIcon }> => {
  const participantLabel = formatParticipantLabel(sportId || '');
  return [
    { id: 'overview', label: 'Visão Geral', icon: TrophyIcon },
    { id: 'teams', label: participantLabel, icon: UserGroupIcon },
    { id: 'games', label: 'Partidas', icon: CalendarIcon },
    { id: 'stats', label: 'Estatísticas', icon: ChartBarIcon },
    { id: 'xp', label: 'Ranking XP', icon: ArrowTrendingUpIcon },
  ];
};

const createEventId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const DEFAULT_TEAM_COLOR = '#3B82F6';
const TEAM_COLOR_PALETTE = [
  '#3B82F6', // azul
  '#10B981', // verde
  '#F97316', // laranja
  '#6366F1', // roxo
  '#EC4899', // rosa
  '#0EA5E9', // ciano
  '#FACC15', // amarelo
  '#14B8A6', // verde água
  '#A855F7', // violeta
  '#EF4444', // vermelho
];

const pickTeamColor = (existingTeams: Team[] = []): string => {
  const used = new Set(
    existingTeams
      .map((team) => team.color)
      .filter((color): color is string => Boolean(color))
      .map((color) => color.toUpperCase())
  );

  const paletteMatch = TEAM_COLOR_PALETTE.find((color) => !used.has(color.toUpperCase()));
  if (paletteMatch) {
    return paletteMatch;
  }

  // Fallback: generate a random color not yet used (attempt up to 20 tries)
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const random = `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')}`
      .toUpperCase();
    if (!used.has(random)) {
      return random;
    }
  }

  return DEFAULT_TEAM_COLOR;
};

const MAX_LOGO_BASE64_LENGTH = 65000;
const MAX_LOGO_DIMENSION = 256;
const LOGO_DIMENSION_MIN = 64;
const LOGO_COMPRESSION_QUALITIES = [0.8, 0.65, 0.5];

const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
    image.src = src;
  });

const processTeamLogoFile = async (file: File): Promise<string> => {
  const baseDataUrl = await readFileAsDataURL(file);
  if (baseDataUrl.length <= MAX_LOGO_BASE64_LENGTH) {
    return baseDataUrl;
  }

  const image = await loadImage(baseDataUrl);
  const longestSide = Math.max(image.width, image.height);
  const initialScale = longestSide > MAX_LOGO_DIMENSION ? MAX_LOGO_DIMENSION / longestSide : 1;
  const dimensionSteps: number[] = [];

  let currentDimension = Math.max(Math.round(longestSide * initialScale), LOGO_DIMENSION_MIN);
  while (currentDimension >= LOGO_DIMENSION_MIN) {
    dimensionSteps.push(currentDimension);
    currentDimension = Math.floor(currentDimension * 0.85);
  }

  for (const dimension of dimensionSteps) {
    const scaleFactor = dimension / Math.max(image.width, image.height);
    const width = Math.max(32, Math.round(image.width * scaleFactor));
    const height = Math.max(32, Math.round(image.height * scaleFactor));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      break;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of LOGO_COMPRESSION_QUALITIES) {
      const jpegData = canvas.toDataURL('image/jpeg', quality);
      if (jpegData.length <= MAX_LOGO_BASE64_LENGTH) {
        return jpegData;
      }
    }

    const pngData = canvas.toDataURL('image/png');
    if (pngData.length <= MAX_LOGO_BASE64_LENGTH) {
      return pngData;
    }
  }

  throw new Error('Logo muito grande. Utilize uma imagem com até 256px ou menor.');
};

export default function ChampionshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCurrentChampionship, deleteChampionship, updateChampionship, updateGame } = useChampionshipStore();
  const { createMatch } = useMatchEditor();

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [activeTab, setActiveTab] = useState<ChampionshipDetailTab>('games');

  // Cadastro de times
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamPlayers, setTeamPlayers] = useState<Array<{ name: string; number: string; position: string; avatar?: string }>>([]);
  const [currentPlayer, setCurrentPlayer] = useState({ name: '', number: '', position: 'Atacante', avatar: '' });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Cadastro de partidas
  const [showGameForm, setShowGameForm] = useState(false);
  const [showMatchGenerator, setShowMatchGenerator] = useState(false);
  const [gameMode, setGameMode] = useState<'manual' | 'auto'>('manual');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameLocation, setGameLocation] = useState('');
  const [gameStage, setGameStage] = useState('');
  const [gameRound, setGameRound] = useState(1);

  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingHomeScore, setEditingHomeScore] = useState<number>(0);
  const [editingAwayScore, setEditingAwayScore] = useState<number>(0);
  const [editingStatus, setEditingStatus] = useState<GameStatus>('scheduled');
  const [editingEvents, setEditingEvents] = useState<MatchEvent[]>([]);
  const [selectedTeamForEvent, setSelectedTeamForEvent] = useState<'home' | 'away'>('home');
  const [selectedEventType, setSelectedEventType] = useState<'goal' | 'card'>('goal');
  const [selectedCardType, setSelectedCardType] = useState<'yellow' | 'red'>('yellow');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [assistingPlayerId, setAssistingPlayerId] = useState('');
  const [eventMinute, setEventMinute] = useState('');
  const [eventReason, setEventReason] = useState('');

  // Visualização das partidas
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());
  const [matchFilter, setMatchFilter] = useState<'all' | 'scheduled' | 'finished'>('all');
  const [isLoadingChampionship, setIsLoadingChampionship] = useState(false);

  // Modais de elenco e estatísticas
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [selectedTeamRoster, setSelectedTeamRoster] = useState<Team | null>(null);
  const [showTeamStatsModal, setShowTeamStatsModal] = useState(false);
  const [selectedTeamStats, setSelectedTeamStats] = useState<Team | null>(null);

  // Estatísticas gerais
  const [championshipStats, setChampionshipStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showPlayerProfileModal, setShowPlayerProfileModal] = useState(false);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<any>(null);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Navegação entre grupos e mata-mata
  const [showGroupRounds, setShowGroupRounds] = useState(true);
  const knockoutBracketRef = useRef<HTMLDivElement | null>(null);
  const previousShouldEmphasizeRef = useRef(false);

  const groupStageContext = useMemo<GroupStageContext | null>(
    () => buildGroupStageContext(championship),
    [championship]
  );

  const shouldEmphasizeKnockout = useMemo(() => {
    if (!groupStageContext) {
      return false;
    }
    if (!groupStageContext.isGroupStageComplete) {
      return false;
    }
    return groupStageContext.knockoutMatches.length > 0;
  }, [groupStageContext]);

  const confirm = useConfirm();

  const allPlayersInChampionship = useMemo(() => {
    const mergedPlayers = new Map<string, any>();

    const upsertPlayer = (playerData: any, teamData?: Team) => {
      if (!playerData) {
        return;
      }

      const key = playerData.id ?? `${playerData.name ?? 'desconhecido'}-${playerData.teamId ?? 'na'}`;
      const existing = mergedPlayers.get(key) || {};
      
      // Debug
      if (playerData.name) {
        console.log(`🔄 Merge ${playerData.name}:`, {
          playerData_gamesPlayed: playerData.gamesPlayed,
          playerData_wins: playerData.wins,
          existing_gamesPlayed: existing.gamesPlayed,
          existing_wins: existing.wins,
        });
      }
      const sanitizedTeam =
        playerData.team ??
        (teamData
          ? {
              id: teamData.id,
              name: teamData.name,
              color: teamData.color,
              logo: teamData.logo,
            }
          : existing.team);

      // Construir objeto mesclado preservando estatísticas
      const merged = {
        ...existing,
        ...playerData,
        team: sanitizedTeam,
        achievements: Array.isArray(playerData.achievements)
          ? playerData.achievements
          : existing.achievements ?? [],
        xp: Number(playerData.xp ?? existing.xp ?? 0),
        // Preservar estatísticas: usar playerData se existir (mesmo que seja 0), senão usar existing
        gamesPlayed: playerData.gamesPlayed !== undefined ? Number(playerData.gamesPlayed) : (existing.gamesPlayed !== undefined ? Number(existing.gamesPlayed) : 0),
        goals: playerData.goals !== undefined ? Number(playerData.goals) : (existing.goals !== undefined ? Number(existing.goals) : 0),
        assists: playerData.assists !== undefined ? Number(playerData.assists) : (existing.assists !== undefined ? Number(existing.assists) : 0),
        wins: playerData.wins !== undefined ? Number(playerData.wins) : (existing.wins !== undefined ? Number(existing.wins) : 0),
        yellowCards: playerData.yellowCards !== undefined ? Number(playerData.yellowCards) : (existing.yellowCards !== undefined ? Number(existing.yellowCards) : 0),
        redCards: playerData.redCards !== undefined ? Number(playerData.redCards) : (existing.redCards !== undefined ? Number(existing.redCards) : 0),
      };
      
      mergedPlayers.set(key, merged);
    };

    // IMPORTANTE: Processar topXP primeiro pois vem direto do banco com todos os campos
    (championshipStats?.topXP ?? []).forEach((player: any) => {
      upsertPlayer(player);
    });

    // Depois processar jogadores dos times (podem ter dados parciais)
    (championship?.teams ?? []).forEach((team) => {
      (team.players ?? []).forEach((player) => {
        upsertPlayer(player, team);
      });
    });

    return Array.from(mergedPlayers.values());
  }, [championship, championshipStats?.topXP]);

  const handleOpenPlayerProfile = useCallback((playerData: any) => {
    if (!playerData) {
      return;
    }
    setSelectedPlayerProfile(playerData);
    setShowPlayerProfileModal(true);
  }, []);

  const handleClosePlayerProfile = useCallback(() => {
    setShowPlayerProfileModal(false);
    setSelectedPlayerProfile(null);
  }, []);

  const handleCloseAchievementsModal = useCallback(() => {
    setShowAchievementsModal(false);
  }, []);

  // Buscar campeonato do backend ao carregar a página
  useEffect(() => {
    const loadChampionship = async () => {
      if (!id) return;

      setIsLoadingChampionship(true);
      try {
        console.log('🔄 Buscando campeonato do backend (owner route):', id);
        const response = await championshipService.getChampionshipById(id);
        console.log('✅ Campeonato carregado (owner):', response.data.championship);
        console.log('📊 Partidas carregadas:', response.data.championship?.games?.length || 0);
        setChampionship(response.data.championship);
        setCurrentChampionship(response.data.championship);
      } catch (error: any) {
        const status = error?.response?.status;
        console.warn('⚠️ Falha na rota owner, tentando público. Status:', status);
        try {
          const publicResp = await championshipService.getPublicChampionshipById(id);
          console.log('✅ Campeonato carregado (public):', publicResp.data.championship);
          setChampionship(publicResp.data.championship);
          setCurrentChampionship(publicResp.data.championship);
        } catch (err2) {
          console.error('❌ Erro ao buscar campeonato (público e privado):', err2);
          toast.error('Erro ao carregar campeonato');
          navigate('/championships');
        }
      } finally {
        setIsLoadingChampionship(false);
      }
    };

    loadChampionship();
  }, [id, navigate, setCurrentChampionship]);

  useEffect(() => {
    const previous = previousShouldEmphasizeRef.current;
    if (shouldEmphasizeKnockout && !previous) {
      setShowGroupRounds(false);
    } else if (!shouldEmphasizeKnockout && previous) {
      setShowGroupRounds(true);
    }
    previousShouldEmphasizeRef.current = shouldEmphasizeKnockout;
  }, [shouldEmphasizeKnockout]);

  useEffect(() => {
    if (!shouldEmphasizeKnockout) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      knockoutBracketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [shouldEmphasizeKnockout]);

  // Função para normalizar dados das estatísticas
  const normalizeStatsData = (data: any) => {
    try {
      // Backend pode enviar goalsByType como array; normalizar para objeto
      const rawGoalsByType = data?.summary?.goalsByType;
      const goalsByTypeObj = Array.isArray(rawGoalsByType)
        ? rawGoalsByType.reduce((acc: Record<string, number>, item: any) => {
            const key = String(item?.type ?? '').toLowerCase();
            const count = Number(item?.count ?? 0);
            if (key) acc[key] = count;
            return acc;
          }, {} as Record<string, number>)
        : (rawGoalsByType || {});

      return {
        topScorers: Array.isArray(data?.topScorers) ? data.topScorers : [],
        topAssisters: Array.isArray(data?.topAssisters) ? data.topAssisters : [],
        fairPlay: Array.isArray(data?.fairPlay) ? data.fairPlay : [],
        topXP: Array.isArray(data?.topXP) ? data.topXP : [],
        summary: {
          totalGoals: data?.summary?.totalGoals || 0,
          totalGames: data?.summary?.totalGames || 0,
          totalPlayers: data?.summary?.totalPlayers || 0,
          avgGoalsPerGame: Number(data?.summary?.avgGoalsPerGame || 0),
          totalYellowCards: data?.summary?.totalYellowCards || 0,
          totalRedCards: data?.summary?.totalRedCards || 0,
          goalsByType: goalsByTypeObj
        }
      };
    } catch (error) {
      console.error('❌ Erro ao normalizar dados:', error);
      return null;
    }
  };

  // UI: linha de barra para visualização simples de proporções
  const BarRow = ({
    label,
    value,
    total,
    colorClass,
    bgClass,
  }: {
    label: string;
    value: number;
    total: number;
    colorClass: string;
    bgClass: string;
  }) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="rounded-lg border border-slate-100 p-3" aria-label={`${label}: ${value} (${pct}%)`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${bgClass}`}></span>
            <span className="text-sm font-medium text-slate-700">{label}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-900">{value}</span>
            <span className="text-slate-500">({pct}%)</span>
          </div>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    );
  };

  // Carregar estatísticas quando a aba de stats estiver ativa
  useEffect(() => {
    const loadStats = async () => {
      if (!id || activeTab !== 'stats') return;

      setIsLoadingStats(true);
      try {
        console.log('📊 Buscando estatísticas do campeonato:', id);
        const response = await api.get(`/championships/${id}/stats`);
        console.log('✅ Estatísticas carregadas:', response);
        
        // Normalizar os dados antes de salvar no state
        const normalizedData = normalizeStatsData(response);
        console.log('✅ Dados normalizados:', normalizedData);
        setChampionshipStats(normalizedData);
      } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        toast.error('Erro ao carregar estatísticas');
        setChampionshipStats(null);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [id, activeTab]);

  const sportDefinition = useMemo(() => {
    const fallbackDefinition = (getSportDefinition(DEFAULT_SPORT_ID) ?? SPORTS_CATALOG[0]) as SportDefinition;
    const catalogDefinition = getSportDefinition(championship?.sport ?? DEFAULT_SPORT_ID) ?? fallbackDefinition;
    return mergeSportDefinitions(catalogDefinition, championship?.sportConfig ?? undefined);
  }, [championship?.sport, championship?.sportConfig]);

  const sportDisplayName = useMemo(
    () => getSportDisplayName(championship?.sport) ?? 'Esporte',
    [championship?.sport]
  );
  const sportIcon = useMemo(() => getSportIcon(championship?.sport) ?? '🏆', [championship?.sport]);
  const primaryMetricLabel = sportDefinition?.scoring.primaryMetric.label ?? 'Pontuação';
  const supportsGoalEvents = sportDefinition?.scoring.primaryMetric.id === 'goals';
  const isChessChampionship = championship?.sport === 'chess';

  const chessStandings = useMemo(() => {
    if (!isChessChampionship) {
      return null;
    }

    const winPoints = Number(sportDefinition?.scoring?.outcomePoints?.win ?? 1);
    const drawPoints = Number(
      sportDefinition?.scoring?.outcomePoints?.draw ?? (sportDefinition?.scoring?.allowsDraw ? winPoints / 2 : 0)
    );
    const lossPoints = Number(sportDefinition?.scoring?.outcomePoints?.loss ?? 0);

    const standingsMap = new Map<
      string,
      {
        team: Team;
        teamId: string;
        player: Player | null;
        games: number;
        wins: number;
        draws: number;
        losses: number;
        points: number;
        history: ChessResultCode[];
      }
    >();

    (championship?.teams ?? []).forEach((team) => {
      standingsMap.set(team.id, {
        team,
        teamId: team.id,
        player: null,
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        history: [],
      });
    });

    const totals = {
      finishedGames: 0,
      draws: 0,
      whiteWins: 0,
      blackWins: 0,
    };

    const finishedStatuses = new Set<GameStatus>(['finished', 'finalizado']);

    const getTimestamp = (game: Game) => {
      const candidates = [
        game.playedAt,
        game.date,
        (game as any)?.scheduledAt,
        (game as any)?.createdAt,
        (game as any)?.updatedAt,
      ];
      for (const candidate of candidates) {
        if (!candidate) continue;
        const asDate = candidate instanceof Date ? candidate : new Date(candidate as string);
        const value = asDate.getTime();
        if (!Number.isNaN(value)) {
          return value;
        }
      }
      return 0;
    };

    const sortedGames = [...(championship?.games ?? [])].sort((a, b) => getTimestamp(a) - getTimestamp(b));

    sortedGames.forEach((game) => {
      const homeEntry = game.homeTeamId ? standingsMap.get(game.homeTeamId) : undefined;
      const awayEntry = game.awayTeamId ? standingsMap.get(game.awayTeamId) : undefined;

      if (!homeEntry || !awayEntry) {
        return;
      }

      const hasScores = typeof game.homeScore === 'number' && typeof game.awayScore === 'number';
      const isCompleted =
        finishedStatuses.has(game.status) ||
        (hasScores && (
          Number(game.homeScore ?? 0) > 0 ||
          Number(game.awayScore ?? 0) > 0 ||
          (Array.isArray(game.events) && game.events.length > 0) ||
          Boolean((game as any)?.playedAt)
        ));

      if (!isCompleted || !hasScores) {
        return;
      }

      const homeScore = Number(game.homeScore ?? 0);
      const awayScore = Number(game.awayScore ?? 0);

      homeEntry.games += 1;
      awayEntry.games += 1;

      if (homeScore === awayScore) {
        homeEntry.draws += 1;
        awayEntry.draws += 1;
        homeEntry.points += drawPoints;
        awayEntry.points += drawPoints;
        homeEntry.history.push('D');
        awayEntry.history.push('D');
        totals.draws += 1;
      } else if (homeScore > awayScore) {
        homeEntry.wins += 1;
        awayEntry.losses += 1;
        homeEntry.points += winPoints;
        awayEntry.points += lossPoints;
        homeEntry.history.push('W');
        awayEntry.history.push('L');
        totals.whiteWins += 1;
      } else {
        homeEntry.losses += 1;
        awayEntry.wins += 1;
        homeEntry.points += lossPoints;
        awayEntry.points += winPoints;
        homeEntry.history.push('L');
        awayEntry.history.push('W');
        totals.blackWins += 1;
      }

      totals.finishedGames += 1;
    });

    const standings = Array.from(standingsMap.values()).map((entry) => {
      const history = entry.history;
      const lastResult = history[history.length - 1] ?? null;
      let streak: { type: ChessResultCode; length: number } | null = null;
      if (lastResult) {
        let length = 0;
        for (let i = history.length - 1; i >= 0; i -= 1) {
          if (history[i] === lastResult) {
            length += 1;
          } else {
            break;
          }
        }
        streak = { type: lastResult, length };
      }

      const maxPointsPerGame = winPoints > 0 ? winPoints : 1;
      const points = Number(entry.points.toFixed(2));
      const winRate = entry.games > 0 ? entry.wins / entry.games : 0;
      const performance = entry.games > 0 ? points / (entry.games * maxPointsPerGame) : 0;

      return {
        ...entry,
        points,
        winRate,
        performance,
        recentForm: history.slice(-5),
        streak,
      };
    });

    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.draws !== a.draws) return b.draws - a.draws;
      if (b.games !== a.games) return b.games - a.games;
      return a.team.name.localeCompare(b.team.name);
    });

    return {
      standings,
      totals,
      winPointsPerGame: winPoints,
    };
  }, [championship?.games, championship?.teams, isChessChampionship, sportDefinition?.scoring]);

  const chessStandingsData = chessStandings?.standings ?? [];
  const chessTotals = chessStandings?.totals ?? {
    finishedGames: 0,
    draws: 0,
    whiteWins: 0,
    blackWins: 0,
  };
  const chessWinPointsPerGame = chessStandings?.winPointsPerGame ?? 1;
  const chessDrawPoints = sportDefinition?.scoring?.allowsDraw
    ? Number(sportDefinition?.scoring?.outcomePoints?.draw ?? chessWinPointsPerGame / 2)
    : 0;
  const hasChessStandings = chessStandingsData.length > 0;
  const chessDrawRate = chessTotals.finishedGames > 0 ? (chessTotals.draws / chessTotals.finishedGames) * 100 : 0;
  const chessVictories = chessTotals.whiteWins + chessTotals.blackWins;
  const chessUndefeatedPlayers = chessStandingsData.filter((entry) => entry.losses === 0 && entry.games > 0).length;
  const chessAveragePoints = chessStandingsData.length > 0
    ? chessStandingsData.reduce((sum, entry) => sum + entry.points, 0) / chessStandingsData.length
    : 0;

  // Estatísticas de time derivadas diretamente dos jogos finalizados
  const computeTeamStatsFromGames = useCallback((teamId: string) => {
    const games = championship?.games || [];
    const finishedStatuses = new Set<GameStatus>(['finished', 'finalizado']);
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let gamesPlayed = 0;

    for (const g of games) {
      if (!g) continue;
      const hasScores = g.homeScore !== undefined && g.awayScore !== undefined;
      // Considera como concluída se: status finalizado OU há placares definidos e há algum indício de jogo realizado
      const isCompleted = finishedStatuses.has(g.status) || (
        hasScores && (
          // marcou gols ou registrou eventos ou possui data de realização
          (Number(g.homeScore) > 0 || Number(g.awayScore) > 0) ||
          (Array.isArray(g.events) && g.events.length > 0) ||
          !!g.playedAt
        )
      );
      if (!isCompleted) continue;
      if (!hasScores) continue;
      const isHome = g.homeTeamId === teamId;
      const isAway = g.awayTeamId === teamId;
      if (!isHome && !isAway) continue;

      const homeScore = Number(g.homeScore ?? 0);
      const awayScore = Number(g.awayScore ?? 0);
      const teamFor = isHome ? homeScore : awayScore;
      const teamAgainst = isHome ? awayScore : homeScore;

      goalsFor += teamFor;
      goalsAgainst += teamAgainst;
      gamesPlayed += 1;

      if (homeScore === awayScore) {
        draws += 1;
      } else {
        const teamWon = (isHome && homeScore > awayScore) || (isAway && awayScore > homeScore);
        if (teamWon) wins += 1; else losses += 1;
      }
    }

    const outcome = sportDefinition?.scoring?.outcomePoints;
    const winPts = outcome?.win ?? 3;
    const drawPts = outcome?.draw ?? (sportDefinition?.scoring?.allowsDraw ? 1 : 0);
    const lossPts = outcome?.loss ?? 0;
    const points = wins * winPts + draws * drawPts + losses * lossPts;
    const avgGoals = gamesPlayed > 0 ? goalsFor / gamesPlayed : 0;

    return {
      games: gamesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points,
      avgGoals,
    };
  }, [championship?.games, sportDefinition?.scoring]);

  const teamsById = useMemo(() => {
    const map = new Map<string, Team>();
    (championship?.teams ?? []).forEach((team: Team) => {
      map.set(team.id, team);
    });
    return map;
  }, [championship?.teams]);

  // Aggregate player-level stats from the recorded games so the roster modal reflects live data.
  const playerStatsById = useMemo(() => {
    type InternalEntry = AggregatedPlayerStats & { appearances: Set<string> };

    const stats = new Map<string, InternalEntry>();

    const ensureEntry = (playerId: string): InternalEntry => {
      let entry = stats.get(playerId);
      if (!entry) {
        entry = {
          games: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: new Set<string>(),
        };
        stats.set(playerId, entry);
      }
      return entry;
    };

    const markAppearance = (playerId: string | undefined | null, gameKey: string) => {
      if (!playerId) {
        return;
      }
      const entry = ensureEntry(playerId);
      if (!entry.appearances.has(gameKey)) {
        entry.appearances.add(gameKey);
        entry.games += 1;
      }
    };

    const addGoal = (
      playerId: string | undefined | null,
      gameKey: string,
      goalType?: string | null
    ) => {
      if (!playerId) {
        return;
      }
      if (goalType === 'own_goal') {
        markAppearance(playerId, gameKey);
        return;
      }
      const entry = ensureEntry(playerId);
      entry.goals += 1;
      markAppearance(playerId, gameKey);
    };

    const addAssist = (playerId: string | undefined | null, gameKey: string) => {
      if (!playerId) {
        return;
      }
      const entry = ensureEntry(playerId);
      entry.assists += 1;
      markAppearance(playerId, gameKey);
    };

    const addYellowCard = (playerId: string | undefined | null, gameKey: string) => {
      if (!playerId) {
        return;
      }
      const entry = ensureEntry(playerId);
      entry.yellowCards += 1;
      markAppearance(playerId, gameKey);
    };

    const addRedCard = (playerId: string | undefined | null, gameKey: string) => {
      if (!playerId) {
        return;
      }
      const entry = ensureEntry(playerId);
      entry.redCards += 1;
      markAppearance(playerId, gameKey);
    };

    (championship?.games ?? []).forEach((game) => {
      if (!game) {
        return;
      }

      const processedGoalIds = new Set<string>();
      const gameKey =
        game.id ??
        `${game.homeTeamId ?? 'home'}-${game.awayTeamId ?? 'away'}-${game.round ?? '0'}-${game.date ?? ''}`;

      const events: any[] = Array.isArray(game.events) ? [...game.events] : [];

      events.forEach((event: any) => {
        if (!event) {
          return;
        }

        switch (event.type) {
          case 'goal': {
            const goalId = event.id ?? `${gameKey}-goal-${event.playerId ?? 'unknown'}-${event.minute ?? 'na'}`;
            if (!processedGoalIds.has(goalId)) {
              processedGoalIds.add(goalId);
              addGoal(event.playerId, gameKey, event.goalType);
              if (event.assistPlayerId) {
                addAssist(event.assistPlayerId, gameKey);
              }
            }
            break;
          }
          case 'assist': {
            addAssist(event.playerId, gameKey);
            break;
          }
          case 'card': {
            if (event.card === 'yellow') {
              addYellowCard(event.playerId, gameKey);
            } else if (event.card === 'red') {
              addRedCard(event.playerId, gameKey);
            }
            break;
          }
          case 'yellow_card': {
            addYellowCard(event.playerId, gameKey);
            break;
          }
          case 'red_card': {
            addRedCard(event.playerId, gameKey);
            break;
          }
          case 'substitution': {
            markAppearance(event.playerInId, gameKey);
            markAppearance(event.playerOutId, gameKey);
            break;
          }
          default: {
            if (event.playerId) {
              markAppearance(event.playerId, gameKey);
            }
            break;
          }
        }
      });

      if (Array.isArray(game.goals)) {
        game.goals.forEach((goal) => {
          if (!goal) {
            return;
          }
          const goalId = goal.id ?? `${gameKey}-goal-${goal.playerId ?? 'unknown'}-${goal.minute ?? 'na'}`;
          if (processedGoalIds.has(goalId)) {
            return;
          }
          processedGoalIds.add(goalId);
          addGoal(goal.playerId, gameKey, goal.type);
          if (goal.assistPlayerId) {
            addAssist(goal.assistPlayerId, gameKey);
          }
        });
      }
    });

    const result = new Map<string, AggregatedPlayerStats>();
    stats.forEach((entry, playerId) => {
      result.set(playerId, {
        games: entry.games,
        goals: entry.goals,
        assists: entry.assists,
        yellowCards: entry.yellowCards,
        redCards: entry.redCards,
      });
    });

    return result;
  }, [championship?.games]);

  type TeamPerformanceEntry = {
    team: Team;
    games: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    avgGoals: number;
    goalDifference: number;
    goalsForPerGame: number;
    goalsAgainstPerGame: number;
  };

  const teamPerformanceLeaders = useMemo<TeamPerformanceEntry[]>(() => {
    if (!championship?.teams || championship.teams.length === 0) {
      return [];
    }

    return championship.teams.map((team) => {
      const stats = computeTeamStatsFromGames(team.id);
      const goalsForPerGame = stats.games > 0 ? stats.goalsFor / stats.games : 0;
      const goalsAgainstPerGame = stats.games > 0 ? stats.goalsAgainst / stats.games : 0;
      const goalDifference = stats.goalsFor - stats.goalsAgainst;

      return {
        team,
        ...stats,
        goalDifference,
        goalsForPerGame,
        goalsAgainstPerGame,
      };
    });
  }, [championship?.teams, computeTeamStatsFromGames]);

  const bestAttackTeams = useMemo(() => {
    return teamPerformanceLeaders
      .filter((entry) => entry.games > 0)
      .slice()
      .sort((a, b) => {
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
        return b.goalDifference - a.goalDifference;
      })
      .slice(0, 5);
  }, [teamPerformanceLeaders]);

  const bestDefenseTeams = useMemo(() => {
    return teamPerformanceLeaders
      .filter((entry) => entry.games > 0)
      .slice()
      .sort((a, b) => {
        if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return b.goalDifference - a.goalDifference;
      })
      .slice(0, 5);
  }, [teamPerformanceLeaders]);

  const availablePlayers = useMemo<Player[]>(() => {
    if (!editingGame) return [];
    const teamId = selectedTeamForEvent === 'home' ? editingGame.homeTeamId : editingGame.awayTeamId;
    if (!teamId) return [];
    const team = teamsById.get(teamId);
    return team?.players ?? [];
  }, [editingGame, selectedTeamForEvent, teamsById]);

  const assistCandidates = useMemo<Player[]>(() => {
    if (!supportsGoalEvents) return [];
    return availablePlayers.filter((player) => player.id !== selectedPlayerId);
  }, [availablePlayers, selectedPlayerId, supportsGoalEvents]);

  const sortedEditingEvents = useMemo(() => {
    return [...editingEvents].sort((a, b) => {
      const minuteA = typeof a.minute === 'number' ? a.minute : Number.POSITIVE_INFINITY;
      const minuteB = typeof b.minute === 'number' ? b.minute : Number.POSITIVE_INFINITY;
      if (minuteA !== minuteB) {
        return minuteA - minuteB;
      }
      return a.id.localeCompare(b.id);
    });
  }, [editingEvents]);

  const formatPlayerLabel = useCallback((player: Player | undefined) => {
    if (!player) {
      return 'Jogador';
    }
    const { number: jerseyNumber } = (player as unknown as { number?: number | string });
    if (jerseyNumber !== undefined && jerseyNumber !== null && jerseyNumber !== '') {
      return `#${jerseyNumber} ${player.name}`;
    }
    return player.name;
  }, []);

  const getPlayerLabel = useCallback(
    (teamId: string, playerId?: string) => {
      if (!playerId) {
        return 'Jogador';
      }
      const team = teamsById.get(teamId);
      const player = team?.players?.find((item) => item.id === playerId);
      return formatPlayerLabel(player);
    },
    [formatPlayerLabel, teamsById]
  );

  const resetEventForm = useCallback(() => {
    setSelectedPlayerId('');
    setAssistingPlayerId('');
    setEventMinute('');
    setEventReason('');
  }, []);

  const addEventToEditingGame = useCallback(() => {
    if (!editingGame || !championship) {
      return;
    }

    const teamId = selectedTeamForEvent === 'home' ? editingGame.homeTeamId : editingGame.awayTeamId;
    if (!teamId) {
      toast.error(isTeamSport(championship.sport) ? 'Selecione um time válido para o evento.' : 'Selecione um jogador válido para o evento.');
      return;
    }

    if (availablePlayers.length === 0) {
      toast.error('Cadastre jogadores para registrar eventos.');
      return;
    }

    if (!selectedPlayerId) {
      toast.error('Escolha o jogador relacionado ao evento.');
      return;
    }

    const minuteValue = eventMinute.trim() === '' ? undefined : Number.parseInt(eventMinute, 10);
    if (eventMinute.trim() !== '' && Number.isNaN(minuteValue)) {
      toast.error('Informe um minuto válido.');
      return;
    }

    let newEvent: MatchEvent;
    if (selectedEventType === 'goal') {
      newEvent = {
        id: createEventId(),
        type: 'goal',
        teamId,
        playerId: selectedPlayerId,
        minute: minuteValue,
        assistPlayerId: assistingPlayerId || undefined,
      };
    } else {
      newEvent = {
        id: createEventId(),
        type: 'card',
        teamId,
        playerId: selectedPlayerId,
        minute: minuteValue,
        card: selectedCardType,
        reason: eventReason || undefined,
      };
    }

    setEditingEvents((previous) => [...previous, newEvent]);
    resetEventForm();
  }, [availablePlayers, assistingPlayerId, editingGame, eventMinute, eventReason, resetEventForm, selectedCardType, selectedEventType, selectedPlayerId, selectedTeamForEvent]);

  const removeEventFromEditingGame = useCallback((eventId: string) => {
    setEditingEvents((previous) => previous.filter((event) => event.id !== eventId));
  }, []);

  const handleCloseEditGameModal = useCallback(() => {
    setShowEditGameModal(false);
    setEditingGame(null);
    setEditingEvents([]);
    setSelectedTeamForEvent('home');
    setSelectedEventType('goal');
    setSelectedCardType('yellow');
    resetEventForm();
  }, [resetEventForm]);

  const handleSaveEditedGame = useCallback(() => {
    if (!editingGame) {
      return;
    }

    const updatedGame: Game = {
      ...editingGame,
      homeScore: editingHomeScore,
      awayScore: editingAwayScore,
      status: editingStatus,
      events: editingEvents,
    };

    setChampionship((previous) => {
      if (!previous) {
        return previous;
      }
      const updatedGames = previous.games.map((game) =>
        game.id === updatedGame.id ? updatedGame : game
      );
      return { ...previous, games: updatedGames };
    });

    updateGame(editingGame.id, {
      homeScore: editingHomeScore,
      awayScore: editingAwayScore,
      status: editingStatus,
      events: editingEvents,
    });

    toast.success('Partida atualizada com sucesso!');
    handleCloseEditGameModal();
  }, [editingAwayScore, editingEvents, editingGame, editingHomeScore, editingStatus, handleCloseEditGameModal, updateGame]);

  const handleDelete = () => {
    if (!championship) {
      return;
    }
    deleteChampionship(championship.id);
    toast.success('Campeonato excluído com sucesso');
    navigate('/championships');
  };

  const handleTeamLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      e.target.value = '';
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 4MB');
      e.target.value = '';
      return;
    }

    try {
      const processed = await processTeamLogoFile(file);
      if (processed.length > MAX_LOGO_BASE64_LENGTH) {
        toast.error('A imagem ainda está muito grande. Use um arquivo menor.');
        return;
      }
      setTeamLogo(processed);
    } catch (error: any) {
      console.error('Erro ao processar logo do time:', error);
      toast.error(error?.message || 'Não foi possível processar a imagem');
    } finally {
      e.target.value = '';
    }
  };

  const handlePlayerAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPlayer({ ...currentPlayer, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlayer = () => {
    if (currentPlayer.name && currentPlayer.number) {
      setTeamPlayers([...teamPlayers, currentPlayer]);
      setCurrentPlayer({ name: '', number: '', position: 'Atacante', avatar: '' });
      toast.success('Jogador adicionado!');
    }
  };

  const handleRemovePlayer = (index: number) => {
    setTeamPlayers((previous) => previous.filter((_, playerIndex) => playerIndex !== index));
  };

  const normalizeStageLabel = (stage?: string | null) => (stage ?? '').trim();

  const stripDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Prioritize labeled stages (grupos, quartas, final, etc.) so UI follows tournament progression
  const getStagePriority = (stageLabel?: string) => {
    if (!stageLabel) {
      return 120;
    }

    const normalized = stripDiacritics(stageLabel).toLowerCase();

    if (normalized.includes('grupo')) return 40;
    if (normalized.includes('classificat') || normalized.includes('qualificat')) return 60;
    if (normalized.includes('oitava')) return 200;
    if (normalized.includes('playoff') || normalized.includes('play-off')) return 250;
    if (normalized.includes('quart')) return 300;
    if (normalized.includes('semi')) return 400;
    if (normalized.includes('terceir') || normalized.includes('3o') || normalized.includes('3º')) return 450;
    if (normalized.includes('finalissima')) return 550;
    if (normalized.includes('final') || normalized.includes('decis')) return 500;

    return 350;
  };

  const filteredGameSections = useMemo<GameSection[]>(() => {
  const games = (championship?.games ?? []) as Game[];
    if (games.length === 0) {
      return [] as GameSection[];
    }

    const grouped = new Map<string, { stageLabel?: string; round: number; matches: Game[] }>();

  games.forEach((game: Game) => {
      const round = game.round || 1;
      const stageLabel = normalizeStageLabel(game.stage);
      const key = stageLabel ? `${stageLabel.toLowerCase()}__${round}` : `round__${round}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          stageLabel: stageLabel || undefined,
          round,
          matches: [],
        });
      }

      grouped.get(key)!.matches.push(game);
    });

  const matchesPassFilter = (game: Game): boolean => {
      if (matchFilter === 'all') return true;
      if (matchFilter === 'scheduled') return game.status === 'scheduled';

      if (matchFilter === 'finished') {
        const hasScores = game.homeScore !== undefined && game.awayScore !== undefined;
        const isCompleted =
          game.status === 'finalizado' ||
          game.status === 'finished' ||
          (hasScores && (
            Number(game.homeScore) > 0 ||
            Number(game.awayScore) > 0 ||
            (Array.isArray(game.events) && game.events.length > 0) ||
            !!game.playedAt
          ));
        return isCompleted;
      }

      return true;
    };

    return Array.from(grouped.entries())
      .map(([key, section]) => ({
        key,
        stageLabel: section.stageLabel,
        round: section.round,
        matches: section.matches.filter(matchesPassFilter),
      }))
      .filter((section) => section.matches.length > 0)
      .sort((a, b) => {
        const priorityDiff = getStagePriority(a.stageLabel) - getStagePriority(b.stageLabel);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        if (a.stageLabel && b.stageLabel) {
          const normalizedA = stripDiacritics(a.stageLabel).toLowerCase();
          const normalizedB = stripDiacritics(b.stageLabel).toLowerCase();
          const labelComparison = normalizedA.localeCompare(normalizedB);
          if (labelComparison !== 0) {
            return labelComparison;
          }
        }

        return a.round - b.round;
      });
  }, [championship?.games, matchFilter]);

  useEffect(() => {
    if (filteredGameSections.length === 0) {
      setExpandedSections(new Set());
      return;
    }

    setExpandedSections((previous: Set<string>) => {
      if (previous.size === 0) {
        return new Set([filteredGameSections[0].key]);
      }

      const next = new Set<string>();
      filteredGameSections.forEach((section: GameSection) => {
        if (previous.has(section.key)) {
          next.add(section.key);
        }
      });

      if (next.size === 0) {
        next.add(filteredGameSections[0].key);
      }

      return next;
    });
  }, [filteredGameSections]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((previous: Set<string>) => {
      const next = new Set(previous);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  const getStatusBadge = (status: GameStatus) => {
    const statusConfig: Record<string, { color: string; icon: string; text: string }> = {
      scheduled: { color: 'bg-green-100 text-green-800 border-green-200', icon: '🕐', text: 'Agendada' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳', text: 'Pendente' },
      'in-progress': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '⚽', text: 'Em Andamento' },
      finished: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '✅', text: 'Finalizada' },
      finalizado: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '✅', text: 'Finalizada' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', text: 'Cancelada' },
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    
    return (
      <span className={`${config.color} border text-xs px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1.5`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatMatchDate = (date?: string) => {
    if (!date) return 'Data não definida';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!championship || isLoadingChampionship) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/70 px-8 py-10 shadow-xl shadow-slate-950/40 backdrop-blur">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
          <p className="text-sm text-slate-300">Carregando campeonato...</p>
        </div>
      </div>
    );
  }

  const handleCreateTeam = async () => {
    if (!championship) {
      return;
    }

    if (!teamName.trim()) {
      toast.error(isTeamSport(championship.sport) ? 'Digite o nome do time' : 'Digite o nome do jogador');
      return;
    }

    const assignedColor = pickTeamColor(championship.teams || []);

    const newTeamData: Partial<Team> & { players: any[] } = {
      name: teamName,
      logo: teamLogo,
      color: assignedColor,
      players: teamPlayers.map((p) => ({
        name: p.name,
        number: parseInt(p.number || '0', 10),
        position: p.position,
        avatar: p.avatar,
      })) as any[],
    };

    try {
      const response: any = await teamService.createTeam(championship.id, newTeamData);

      if (response.success && response.data.team) {
        const teamsResponse: any = await teamService.getTeams(championship.id);

        if (teamsResponse.success && teamsResponse.data.teams) {
          const updatedTeams: Team[] = teamsResponse.data.teams;
          updateChampionship(championship.id, { teams: updatedTeams });
          setChampionship((prev) => (prev ? { ...prev, teams: updatedTeams } : null));
        }

    setTeamName('');
    setTeamLogo('');
        setTeamPlayers([]);
        setCurrentPlayer({ name: '', number: '', position: 'Atacante', avatar: '' });
        setShowTeamForm(false);
        toast.success(isTeamSport(championship.sport) ? 'Time criado com sucesso!' : 'Jogador criado com sucesso!');
        setActiveTab('teams');
      }
    } catch (error: any) {
      console.error('Erro ao criar time:', error);
      const errorMessage = typeof error?.message === 'string' ? error.message : error?.response?.data?.message;
      toast.error(errorMessage || 'Erro ao criar time');
    }
  };

  const handleCreateManualGame = () => {
    if (!championship) {
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      toast.error(isTeamSport(championship.sport) ? 'Selecione os dois times' : 'Selecione os dois jogadores');
      return;
    }
    if (homeTeamId === awayTeamId) {
      toast.error(isTeamSport(championship.sport) ? 'Selecione times diferentes' : 'Selecione jogadores diferentes');
      return;
    }

    const homeTeam = championship.teams.find((team) => team.id === homeTeamId);
    const awayTeam = championship.teams.find((team) => team.id === awayTeamId);

    const newGame: Game = {
      id: Date.now().toString(),
      championshipId: championship.id,
      homeTeamId,
      awayTeamId,
      homeTeamName: homeTeam?.name || '',
      awayTeamName: awayTeam?.name || '',
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
      round: gameRound,
      date: gameDate || undefined,
      location: gameLocation || undefined,
      stage: gameStage || undefined,
    };

    const updatedGames: Game[] = [...(championship.games ?? []), newGame];
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });

    // Reset
    setHomeTeamId('');
    setAwayTeamId('');
    setGameDate('');
    setGameLocation('');
    setGameStage('');
    toast.success('Partida criada com sucesso!');
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!championship) {
      return;
    }

    try {
      const ok = await confirm({
        title: 'Excluir partida',
        message: 'Tem certeza que deseja excluir esta partida? Esta ação não pode ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        tone: 'danger',
      });
      if (!ok) return;
      // Chama o backend para deletar a partida
      await api.delete(`/games/${gameId}`);
      
      // Atualiza o estado local após sucesso
    const updatedGames = championship.games.filter((game: Game) => game.id !== gameId);
      updateChampionship(championship.id, { games: updatedGames });
      setChampionship({ ...championship, games: updatedGames });
      toast.success('Partida excluída');
    } catch (error: any) {
      console.error('Erro ao excluir partida:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir partida');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!championship) {
      return;
    }
    
    // Buscar o nome do time
  const team = championship.teams?.find((teamItem: Team) => teamItem.id === teamId);
    const teamName = team?.name || 'este time';
    
    // Confirmar exclusão via modal global
    const ok = await confirm({
      title: 'Excluir time',
      message: `Tem certeza que deseja excluir o time "${teamName}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      tone: 'danger',
    });
    if (!ok) return;
    
    // Verificar se o time está em alguma partida (se houver partidas)
    if (championship.games && championship.games.length > 0) {
      const teamInGames = championship.games.some(
        (game: Game) => game.homeTeamId === teamId || game.awayTeamId === teamId
      );
      
      if (teamInGames) {
        toast.error('Não é possível excluir um time que está em partidas agendadas');
        return;
      }
    }

    try {
      // Deletar no backend
      await teamService.deleteTeam(championship.id, teamId);
      
      // Buscar lista atualizada de times do backend
  const teamsResponse: any = await teamService.getTeams(championship.id);
      
      if (teamsResponse.success && teamsResponse.data.teams) {
        const updatedTeams: Team[] = teamsResponse.data.teams;
        
        // Atualizar o store
        updateChampionship(championship.id, { teams: updatedTeams });
        
        // Forçar atualização imediata do estado local
        setChampionship(prev => prev ? { ...prev, teams: updatedTeams } : null);
      }
      
      toast.success('Time excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir time:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir time');
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamLogo(team.logo || '');
    setTeamPlayers(
      team.players.map(p => ({
        name: p.name,
        number: p.number?.toString() || '',
        position: p.position || 'Atacante',
        avatar: p.avatar || ''
      }))
    );
    setShowTeamForm(true);
  };

  const handleSaveEditedTeam = async () => {
    if (!championship || !editingTeam) {
      return;
    }

    if (!teamName.trim()) {
      toast.error(isTeamSport(championship.sport) ? 'Digite o nome do time' : 'Digite o nome do jogador');
      return;
    }

    const teamData: Partial<Team> & { players: any[] } = {
      name: teamName,
      logo: teamLogo,
      color: editingTeam?.color ?? DEFAULT_TEAM_COLOR,
      players: teamPlayers.map((p) => ({
        name: p.name,
        number: Number(p.number),
        position: p.position,
        avatar: p.avatar,
      })) as any[],
    };

    try {
      // Atualizar no backend
  const response: any = await teamService.updateTeam(championship.id, editingTeam.id, teamData);
      
      if (response.success && response.data.team) {
        // Buscar lista atualizada de times do backend
  const teamsResponse: any = await teamService.getTeams(championship.id);
        
        if (teamsResponse.success && teamsResponse.data.teams) {
          const updatedTeams: Team[] = teamsResponse.data.teams;
          
          // Atualizar o store
          updateChampionship(championship.id, { teams: updatedTeams });
          
          // Forçar atualização imediata do estado local
          setChampionship(prev => prev ? { ...prev, teams: updatedTeams } : null);
        }
        
        setShowTeamForm(false);
        setEditingTeam(null);
        setTeamName('');
        setTeamLogo('');
        setTeamPlayers([]);
        toast.success(isTeamSport(championship.sport) ? 'Time atualizado com sucesso!' : 'Jogador atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar time:', error);
      const primaryMessage = typeof error?.message === 'string' ? error.message : undefined;
      const apiMsg = error?.response?.data?.message;
      const details = error?.response?.data?.errors?.[0]?.message;
      toast.error(primaryMessage || details || apiMsg || 'Erro ao atualizar time');
    }
  };

  const handleEditGame = (game: Game) => {
    if (!championship) return;
    
    // Mapear SportId para SportType
    const sportTypeMap: Record<string, 'volei' | 'basquete' | 'futsal' | 'handebol' | 'tenis_mesa' | 'xadrez'> = {
      'volleyball': 'volei',
      'basketball': 'basquete',
      'futsal': 'futsal',
      'handball': 'handebol',
      'table-tennis': 'tenis_mesa',
      'chess': 'xadrez',
    };
    
    const sportType = sportTypeMap[championship.sport] || 'volei';
    
    // Criar a partida no editor store
    createMatch({
      sport: sportType,
      homeTeam: game.homeTeamName || 'Time Casa',
      awayTeam: game.awayTeamName || 'Time Visitante',
      championship: championship.name || '',
      date: game.date || new Date().toISOString().split('T')[0],
    }, championship.id, game.id); // Passar o championshipId e gameId
    
    // Navegar para o editor
    navigate('/match-editor');
  };

  // Generate test data: 8 teams with 10 players each
  const handleGenerateTestData = async () => {
    if (!championship) {
      toast.error('Campeonato não encontrado');
      return;
    }

    try {
      console.log('🎯 Gerando dados de teste no backend...');
      console.log('📋 Championship ID:', championship.id);
      
      toast.loading('Gerando 8 times no backend...', {
        id: 'generating-test-data',
      });

      const teamNames = [
        'Águias FC', 'Leões United', 'Tigres SC', 'Falcões EC', 
        'Panteras FC', 'Lobos AC', 'Dragões FC', 'Tubarões SC'
      ];

      const teamColors = [
        '#FF5733', '#33FF57', '#3357FF', '#FF33F5', 
        '#F5FF33', '#33FFF5', '#FF8C33', '#8C33FF'
      ];

      const firstNames = [
        'João', 'Pedro', 'Lucas', 'Matheus', 'Gabriel', 'Rafael', 'Bruno', 'Diego', 'Carlos', 'André',
        'Felipe', 'Thiago', 'Rodrigo', 'Leonardo', 'Marcelo', 'Fernando', 'Ricardo', 'Paulo', 'Vitor', 'Daniel'
      ];

      const lastNames = [
        'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Pereira', 'Rodrigues', 'Almeida', 'Nascimento',
        'Ferreira', 'Araújo', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Mendes'
      ];

      const savedTeams: Team[] = [];
      const teamErrors: string[] = [];

      // Criar times no backend
      for (let i = 0; i < 8; i++) {
        try {
          console.log(`📤 Criando time ${i + 1}/8:`, teamNames[i]);

          // Criar time no backend
          const teamResponse = await api.post('/teams', {
            championshipId: championship.id,
            name: teamNames[i],
            color: teamColors[i],
            logo: undefined,
          });

          const createdTeam = teamResponse.data.team;
          console.log(`✅ Time ${i + 1}/8 criado:`, createdTeam);

          // Criar 10 jogadores para cada time
          const teamPlayers: Player[] = [];
          const playerErrors: string[] = [];
          
          for (let j = 0; j < 10; j++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const playerName = `${firstName} ${lastName}`;
            const playerNumber = j + 1;
            const position = j === 0 ? 'Goleiro' : j <= 4 ? 'Defensor' : j <= 7 ? 'Meio-campo' : 'Atacante';

            try {
              // Criar jogador no backend
              const playerResponse = await api.post('/players', {
                teamId: createdTeam.id,
                name: playerName,
                number: playerNumber,
                position: position,
              });

              teamPlayers.push(playerResponse.data.player);
              console.log(`  ✅ Jogador ${j + 1}/10 criado: ${playerName}`);
            } catch (error: any) {
              const errorMsg = error?.response?.data?.message || error?.message || 'Erro desconhecido';
              console.error(`  ❌ Erro ao criar jogador ${j + 1}:`, error?.response?.data);
              playerErrors.push(`Jogador ${j + 1} (${playerName}): ${errorMsg}`);
            }
          }

          if (playerErrors.length > 0) {
            console.warn(`⚠️ Time ${teamNames[i]} criado com ${playerErrors.length} erros nos jogadores`);
          }

          // Adicionar time com jogadores à lista
          savedTeams.push({
            id: createdTeam.id,
            name: createdTeam.name,
            championshipId: championship.id,
            logo: createdTeam.logo,
            players: teamPlayers,
            stats: {
              games: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0,
              position: 0,
            }
          });

        } catch (error: any) {
          const errorMsg = error?.response?.data?.message || error?.message || 'Erro desconhecido';
          console.error(`❌ Erro ao criar time ${i + 1} (${teamNames[i]}):`, error?.response?.data);
          teamErrors.push(`Time ${i + 1} (${teamNames[i]}): ${errorMsg}`);
        }
      }

      // Atualizar estado local
      const updatedChampionship = {
        ...championship,
        teams: [...(championship.teams || []), ...savedTeams]
      };

      updateChampionship(championship.id, { teams: updatedChampionship.teams });
      setChampionship(updatedChampionship);
      
      // Toast final
      if (savedTeams.length === 8) {
        toast.success(`🎉 ${savedTeams.length} times salvos no banco de dados!`, {
          id: 'generating-test-data',
          duration: 4000,
        });
      } else if (savedTeams.length > 0) {
        toast.success(`⚠️ ${savedTeams.length}/8 times salvos. ${teamErrors.length} erros.`, {
          id: 'generating-test-data',
          duration: 6000,
        });
        console.error('❌ Erros ao criar times:', teamErrors);
      } else {
        toast.error(`❌ Nenhum time foi criado. Verifique o console.`, {
          id: 'generating-test-data',
          duration: 6000,
        });
        console.error('❌ Todos os erros:', teamErrors);
      }

      console.log(`✅ Total: ${savedTeams.length} times gerados com sucesso`);
    } catch (error: any) {
      console.error('Erro ao gerar dados de teste:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      toast.error(`Erro ao gerar dados de teste: ${errorMsg}`, {
        id: 'generating-test-data',
      });
    }
  };

  // Handle automatic match generation
  const handleGenerateMatches = async (matches: any[], format: 'round-robin' | 'knockout' | 'groups-playoffs') => {
    if (!championship) {
      toast.error('Campeonato não encontrado');
      return;
    }

    if (!matches || matches.length === 0) {
      toast.error('Nenhuma partida para gerar');
      return;
    }

    try {
      console.log(`🎯 Salvando ${matches.length} partidas no backend (formato: ${format})...`);
      console.log('🔍 Primeira partida:', matches[0]);
      
      // Mapear formato do gerador para formato do championship (BACKEND)
      // Backend espera: 'pontos-corridos', 'eliminatorias', 'grupos'
      const championshipFormat = format === 'knockout' ? 'eliminatorias' : format === 'round-robin' ? 'pontos-corridos' : 'grupos';
      console.log(`📝 Atualizando formato do campeonato para: ${championshipFormat}`);
      
      // ⭐ ATUALIZAR FORMATO DO CAMPEONATO PRIMEIRO (ANTES DE SALVAR PARTIDAS)
      try {
        toast.loading('Atualizando formato do campeonato...', { id: 'saving-games' });
        
        // Enviar formato direto sem mapeamento (backend não faz mapeamento para 'eliminatorias')
        await api.put(`/championships/${championship.id}`, {
          format: championshipFormat
        });
        console.log(`✅ Formato do campeonato atualizado para: ${championshipFormat}`);
        
        // Atualizar estado local imediatamente
        const updatedChamp = {
          ...championship,
          format: championshipFormat as any
        };
        setChampionship(updatedChamp);
        updateChampionship(championship.id, { format: championshipFormat as any });
      } catch (error) {
        console.error('❌ Erro ao atualizar formato do campeonato:', error);
        toast.error('Erro ao atualizar formato do campeonato', { id: 'saving-games' });
        return; // Para a execução se falhar
      }
      
      // Toast de progresso
      toast.loading(`Salvando ${matches.length} partidas no backend...`, {
        id: 'saving-games',
      });

      // Salvar cada partida no backend
      const savedGames: Game[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const stageLabel = match.group || match.stage || undefined;
        
        try {
          console.log(`📤 Enviando partida ${i + 1}:`, {
            championshipId: championship.id,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            round: match.round || 1,
            venue: match.location || '',
            scheduledAt: match.date ? new Date(match.date).toISOString() : null,
            stage: stageLabel,
          });

          // Criar partida no backend (permite null para BYE)
          const response = await api.post('/games', {
            championshipId: championship.id,
            homeTeamId: match.homeTeamId, // Pode ser null (BYE)
            awayTeamId: match.awayTeamId, // Pode ser null (BYE)
            round: match.round || 1,
            venue: match.location || '',
            scheduledAt: match.date ? new Date(match.date).toISOString() : null,
            stage: stageLabel,
          });

          console.log(`📥 Resposta da partida ${i + 1}:`, response.data);

          // Adicionar dados extras do frontend
          const homeTeam = match.homeTeamId ? championship.teams?.find(t => t.id === match.homeTeamId) : null;
          const awayTeam = match.awayTeamId ? championship.teams?.find(t => t.id === match.awayTeamId) : null;

          const gameData = response.data.game;
          savedGames.push({
            id: gameData.id, // UUID do backend
            championshipId: championship.id,
            homeTeamId: match.homeTeamId || undefined,
            awayTeamId: match.awayTeamId || undefined,
            homeTeamName: homeTeam?.name || gameData.homeTeam?.name || 'BYE',
            awayTeamName: awayTeam?.name || gameData.awayTeam?.name || 'BYE',
            round: match.round,
            date: match.date,
            location: match.location || '',
            homeScore: undefined,
            awayScore: undefined,
            status: 'scheduled' as GameStatus,
            stage: stageLabel,
          });

          console.log(`✅ Partida ${i + 1}/${matches.length} salva:`, gameData.id);
        } catch (error: any) {
          const errorMsg = error?.response?.data?.message || error?.message || 'Erro desconhecido';
          console.error(`❌ Erro ao salvar partida ${i + 1}:`, error);
          console.error(`❌ Detalhes do erro:`, error?.response?.data);
          errors.push(`Partida ${i + 1}: ${errorMsg}`);
          // Continua salvando as outras partidas mesmo se uma falhar
        }
      }

      // Atualizar estado local com partidas salvas
      const updatedChampionship = {
        ...championship,
        format: championshipFormat as any, // Formato já foi atualizado no backend
        games: [...(championship.games || []), ...savedGames]
      };

      updateChampionship(championship.id, { games: updatedChampionship.games, format: championshipFormat as any });
      setChampionship(updatedChampionship);

      // Toast de sucesso ou aviso
      if (savedGames.length === matches.length) {
        toast.success(`🎉 ${savedGames.length} partidas salvas no banco de dados!`, {
          id: 'saving-games',
          duration: 4000,
        });
      } else if (savedGames.length > 0) {
        toast.success(`⚠️ ${savedGames.length}/${matches.length} partidas salvas. ${errors.length} erros.`, {
          id: 'saving-games',
          duration: 6000,
        });
        console.error('❌ Erros encontrados:', errors);
      } else {
        toast.error(`❌ Nenhuma partida foi salva. Verifique o console.`, {
          id: 'saving-games',
          duration: 6000,
        });
        console.error('❌ Todos os erros:', errors);
      }

      console.log(`✅ Total de ${savedGames.length} partidas salvas com sucesso`);
    } catch (error: any) {
      console.error('Erro ao gerar partidas:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      toast.error(`Erro ao gerar partidas: ${errorMsg}`, {
        id: 'saving-games',
      });
    }
  };

  // Helper to get status-based gradient
  const getStatusGradient = () => {
    switch (championship.status) {
      case 'draft':
        return 'from-blue-500/15 via-slate-900 to-slate-950';
      case 'active':
        return 'from-emerald-500/15 via-slate-900 to-slate-950';
      case 'finished':
        return 'from-slate-500/15 via-slate-900 to-slate-950';
      default:
        return 'from-blue-500/15 via-slate-900 to-slate-950';
    }
  };

  const getStatusColor = () => {
    switch (championship.status) {
      case 'draft':
        return 'border border-blue-400/40 bg-blue-500/15 text-blue-100';
      case 'active':
        return 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-100';
      case 'finished':
        return 'border border-slate-400/40 bg-slate-500/15 text-slate-200';
      default:
        return 'border border-blue-400/40 bg-blue-500/15 text-blue-100';
    }
  };

  return (
    <div className="championship-detail relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_65%)]" />
      <div className="relative">
      {/* Hero Section */}
      <div className={`border-b border-white/10 bg-gradient-to-br ${getStatusGradient()} pb-2 pt-6`}
      >
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to="/championships"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-300/60 hover:bg-blue-500/20 hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar para Campeonatos
          </Link>

          {/* Hero Content */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: Icon + Title + Metadata */}
            <div className="flex flex-1 flex-col gap-6 sm:flex-row">
              {/* Sport Icon */}
              <div className="flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-5xl text-white shadow-xl shadow-blue-500/10">
                  {sportIcon}
                </div>
              </div>

              {/* Title & Info */}
              <div className="min-w-0">
                <h1 className="mb-3 text-4xl font-bold text-white">
                  {championship.name}
                </h1>

                {/* Inline Badges */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-medium text-slate-100 backdrop-blur">
                    {sportDisplayName}
                  </span>
                  {championship.format && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1.5 text-sm font-medium text-blue-100 backdrop-blur">
                      <TrophyIcon className="h-4 w-4" />
                      {championship.format === 'groups-and-playoffs' ? 'Grupos + Playoffs' :
                       championship.format === 'round-robin' ? 'Pontos Corridos' :
                       championship.format === 'single-elimination' ? 'Eliminação Simples' :
                       championship.format}
                    </span>
                  )}
                  {championship.visibility && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/15 px-3 py-1.5 text-sm font-medium text-purple-100 backdrop-blur">
                      {championship.visibility === 'public' ? '🌐 Público' : championship.visibility === 'private' ? '🔒 Privado' : '📧 Apenas Convite'}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold backdrop-blur ${getStatusColor()}`}>
                    {championship.status === 'draft' ? '📝 Rascunho' :
                     championship.status === 'active' ? '⚡ Em Andamento' :
                     championship.status === 'finished' ? '🏁 Finalizado' :
                     championship.status}
                  </span>
                </div>

                {/* Metadata Chips (owner, location, dates, participants) */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200 sm:text-sm">
                  {/* Owner Chip */}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-slate-100 backdrop-blur whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M10 2a5 5 0 00-3.536 8.536c.12.12.219.26.292.415L8.5 13h3l1.744-2.049c.073-.155.172-.295.292-.415A5 5 0 0010 2zm-3 14a3 3 0 013-3h0a3 3 0 013 3v1H7v-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{championship?.isOwner === false ? (championship?.creator?.name || 'Desconhecido') : 'Você'}</span>
                  </span>
                  {/* Location Chip */}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-slate-100 backdrop-blur whitespace-nowrap">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="max-w-[220px] truncate font-medium">{championship.location || 'Local não especificado'}</span>
                  </span>
                  {/* Dates Chip */}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-slate-100 backdrop-blur whitespace-nowrap">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="font-medium">
                      {championship.startDate ? new Date(championship.startDate).toLocaleDateString('pt-BR') : 'Data não definida'}
                      {championship.endDate && ` - ${new Date(championship.endDate).toLocaleDateString('pt-BR')}`}
                    </span>
                  </span>
                  {/* Participants Chip */}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-slate-100 backdrop-blur whitespace-nowrap">
                    <UsersIcon className="h-4 w-4" />
                    <span className="font-medium">
                      {championship.maxParticipants ? `Máx. ${championship.maxParticipants} ${formatParticipantLabel(championship.sport).toLowerCase()}` : 'Sem limite de participantes'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons (somente dono) */}
            {championship?.isOwner === true && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={handleGenerateTestData}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-purple-500/40 via-purple-500/30 to-pink-500/40 px-5 py-3 font-medium text-white shadow-lg shadow-purple-900/40 transition hover:-translate-y-0.5 hover:shadow-purple-900/60"
                title="Gera 8 times com 10 jogadores cada para testes"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Gerar Dados de Teste
              </button>
              <Link
                to={`/championship/${championship.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-medium text-slate-100 transition hover:border-blue-300/60 hover:bg-blue-500/20 hover:text-white"
              >
                <PencilIcon className="h-4 w-4" />
                Editar
              </Link>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Excluir Campeonato',
                    message: `Tem certeza que deseja excluir o campeonato "${championship?.name}"? Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.`,
                    confirmText: 'Excluir Permanentemente',
                    cancelText: 'Cancelar',
                    tone: 'danger',
                  });
                  if (ok) handleDelete();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 px-5 py-3 font-medium text-rose-100 transition hover:border-red-300/80 hover:bg-red-500/25"
              >
                <TrashIcon className="h-4 w-4" />
                Excluir
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Stats Cards Grid */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Participants Card */}
          <div className="card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl border border-blue-400/40 bg-blue-500/20 p-3 text-blue-200">
                <UserGroupIcon className="h-8 w-8" />
              </div>
            </div>
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
              {formatParticipantLabel(championship.sport)}
            </p>
            <p className="text-3xl font-bold text-white">
              {championship.teams?.length || 0}
            </p>
          </div>

          {/* Games Card */}
          <div className="card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 p-3 text-emerald-200">
                <CalendarIcon className="h-8 w-8" />
              </div>
            </div>
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Partidas</p>
            <p className="text-3xl font-bold text-white">
              {championship.games?.length || 0}
            </p>
          </div>

          {/* Players Card */}
          <div className="card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl border border-purple-400/40 bg-purple-500/20 p-3 text-purple-200">
                <UsersIcon className="h-8 w-8" />
              </div>
            </div>
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Jogadores</p>
            <p className="text-3xl font-bold text-white">
              {championship.teams.reduce<number>(
                (accumulator, team) => accumulator + team.players.length,
                0
              )}
            </p>
          </div>

          {/* Status Card */}
          <div className="card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/20 p-3 text-amber-200">
                <TrophyIcon className="h-8 w-8" />
              </div>
            </div>
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Status</p>
            <p className="text-lg font-semibold capitalize text-white">
              {championship.status === 'draft' ? 'Rascunho' :
               championship.status === 'active' ? 'Em Andamento' :
               championship.status === 'finished' ? 'Finalizado' :
               championship.status}
            </p>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="card overflow-hidden">
          <div className="border-b border-white/10">
            <nav className="flex" role="tablist">
              {getTabItems(championship.sport).map((tab) => {
                const isActive = activeTab === tab.id;
                const itemCount = 
                  tab.id === 'teams' ? championship.teams?.length || 0 :
                  tab.id === 'games' ? championship.games?.length || 0 :
                  null;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={isActive}
                    className={`group relative flex items-center gap-2.5 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-200 ${
                      isActive
                        ? 'border-b-2 border-blue-400 bg-blue-500/10 text-blue-100'
                        : 'border-b-2 border-transparent text-slate-400 hover:border-white/20 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <tab.icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110 text-blue-200' : 'text-slate-400 group-hover:scale-105 group-hover:text-slate-200'}`} />
                    <span>{tab.label}</span>
                    {itemCount !== null && (
                      <span className={`ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive 
                          ? 'border border-blue-300/40 bg-blue-500/20 text-blue-100' 
                          : 'border border-white/10 bg-white/10 text-slate-300 group-hover:border-white/20 group-hover:text-slate-100'
                      }`}>
                        {itemCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-white/5 p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Description Card (if exists) */}
                {championship.description && (
                  <div className="card bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="rounded-lg border border-blue-400/40 bg-blue-500/20 p-2 text-blue-100">
                        <InformationCircleIcon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Sobre o Campeonato</h3>
                    </div>
                    <p className="leading-relaxed text-slate-200/90 pl-11">{championship.description}</p>
                  </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Information Card */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                      <InformationCircleIcon className="h-5 w-5 text-blue-200" />
                      Informações Gerais
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <MapPinIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-300" />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Local</p>
                          <p className="font-medium text-white">{championship.location || 'Não especificado'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <CalendarIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-300" />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Período</p>
                          <p className="font-medium text-white">
                            {championship.startDate ? new Date(championship.startDate).toLocaleDateString('pt-BR') : 'Não definido'}
                            {championship.endDate && ` - ${new Date(championship.endDate).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <TrophyIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-300" />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Formato</p>
                          <p className="font-medium text-white">
                            {championship.format === 'groups-and-playoffs' ? 'Grupos + Playoffs' :
                             championship.format === 'round-robin' ? 'Pontos Corridos' :
                             championship.format === 'single-elimination' ? 'Eliminação Simples' :
                             championship.format || 'Não especificado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <UsersIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-300" />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Participantes</p>
                          <p className="font-medium text-white">
                            {championship.maxParticipants 
                              ? `Máximo de ${championship.maxParticipants} ${formatParticipantLabel(championship.sport).toLowerCase()}`
                              : 'Sem limite de participantes'}
                          </p>
                        </div>
                      </div>

                      {/* Read-only banner for public view */}
                      {championship?.isOwner === false && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-sm text-amber-100">
                          <span className="text-base">🔒</span>
                          <span>Visualização pública (somente leitura)</span>
                        </div>
                      )}
                      {/* debug banner removed */}
                    </div>
                  </div>

                  {/* Prizes & Timeline Card */}
                  <div className="space-y-6">
                    {/* Prizes Section */}
                    {championship.prizePool && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                          <TrophyIcon className="h-5 w-5 text-amber-600" />
                          Premiação
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                            <div className="text-3xl">🏆</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-900">Premiação Total</p>
                              <p className="text-amber-700 font-semibold">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(championship.prizePool)}
                              </p>
                            </div>
                          </div>
                          
                          {championship.prizeDistribution && (
                            <div className="p-4 bg-slate-800/40 border border-white/10 rounded-lg backdrop-blur">
                              <p className="text-xs font-medium text-slate-300 uppercase tracking-wide mb-2">Distribuição</p>
                              <p className="text-slate-100 text-sm">{championship.prizeDistribution}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Entry Fee Section */}
                    {championship.hasEntryFee && championship.entryFee && (
                      <div className="p-4 bg-blue-500/20 border border-blue-400/40 rounded-lg backdrop-blur">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">💳</span>
                          <p className="text-sm font-medium text-blue-100">Taxa de Inscrição</p>
                        </div>
                        <p className="text-blue-200 font-semibold ml-7">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(championship.entryFee)}
                        </p>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/40 rounded-xl backdrop-blur p-6">
                      <h3 className="text-lg font-semibold text-slate-100 mb-4">Resumo Rápido</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">{formatParticipantLabel(championship.sport)} Inscritos</span>
                          <span className="text-lg font-bold text-blue-200">{championship.teams?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">Jogadores Totais</span>
                          <span className="text-lg font-bold text-blue-200">
                            {championship.teams.reduce<number>(
                              (acc, team) => acc + team.players.length,
                              0
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">Partidas Agendadas</span>
                          <span className="text-lg font-bold text-blue-200">{championship.games?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-blue-400/40">
                          <span className="text-sm text-slate-300">Visibilidade</span>
                          <span className="text-sm font-semibold text-blue-200">
                            {championship.visibility === 'public' ? '🌐 Público' : 
                             championship.visibility === 'private' ? '🔒 Privado' : 
                             championship.visibility === 'inviteOnly' ? '📧 Apenas Convite' :
                             'Não definido'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                {/* Enhanced Header */}
                {!showTeamForm && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/40 rounded-xl backdrop-blur p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/30 border border-blue-400/40 rounded-xl backdrop-blur">
                          <UserGroupIcon className="h-8 w-8 text-blue-200" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-100 mb-1">
                            {formatParticipantLabel(championship.sport)} Cadastrados
                            <span className="ml-2 text-blue-200">({championship.teams?.length || 0})</span>
                          </h3>
                          <p className="text-sm text-slate-300">
                            Gerencie os participantes do seu campeonato e acompanhe suas estatísticas
                          </p>
                        </div>
                      </div>
                      {championship?.isOwner === true && (
                      <button
                        onClick={() => setShowTeamForm(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Novo {isTeamSport(championship.sport) ? 'Time' : 'Jogador'}
                      </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Team Form */}
                {showTeamForm && (
                  <div className="bg-slate-900/70 border border-white/10 rounded-xl backdrop-blur shadow-lg overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <UserGroupIcon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {editingTeam 
                                ? (isTeamSport(championship.sport) ? 'Editar Time' : 'Editar Jogador')
                                : getSportActionLabel(championship.sport, 'add')
                              }
                            </h3>
                            <p className="text-sm text-blue-100">
                              {editingTeam ? 'Atualize as informações abaixo' : 'Preencha as informações abaixo'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowTeamForm(false);
                            setEditingTeam(null);
                            setTeamName('');
                            setTeamLogo('');
                            setTeamPlayers([]);
                          }}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-8">
                      {/* Section 1: Identification */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                            1
                          </div>
                          <h4 className="text-lg font-semibold text-slate-900">
                            Identificação {isTeamSport(championship.sport) ? 'do Time' : 'do Jogador'}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              {isTeamSport(championship.sport) ? 'Nome do Time' : 'Nome do Jogador'} 
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                              type="text"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder={isTeamSport(championship.sport) ? 'Ex: Corinthians, Flamengo' : 'Ex: João Silva'}
                            />
                            {teamName && (
                              <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                                <CheckBadgeIcon className="h-3.5 w-3.5" />
                                Nome válido
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Abreviação (3 letras)
                            </label>
                            <input
                              type="text"
                              maxLength={3}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase"
                              placeholder="COR"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Logo */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold text-sm">
                            2
                          </div>
                          <h4 className="text-lg font-semibold text-slate-900">Escudo / Foto</h4>
                        </div>
                        <div className="pl-11 space-y-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {isTeamSport(championship.sport) ? 'Logo do Time' : 'Foto do Jogador'}
                          </label>
                          <div className="relative">
                            {teamLogo ? (
                              <div className="relative group">
                                <img
                                  src={teamLogo}
                                  alt="Logo"
                                  className="w-full h-48 object-cover rounded-lg border-2 border-slate-200"
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    onClick={() => setTeamLogo('')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 backdrop-blur transition-all cursor-pointer hover:border-blue-400/60 hover:bg-blue-500/10">
                                <div className="flex flex-col items-center justify-center py-6">
                                  <svg className="mb-3 h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <p className="text-sm font-medium text-slate-300">Clique ou arraste uma imagem</p>
                                  <p className="mt-1 text-xs text-slate-400">PNG, JPG até 5MB</p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleTeamLogoUpload}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Players */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full font-bold text-sm">
                            3
                          </div>
                          <h4 className="text-lg font-semibold text-slate-900">
                            Jogadores {!isTeamSport(championship.sport) && '(Opcional)'}
                          </h4>
                        </div>
                        
                        {/* Add Player Form */}
                        <div className="pl-11 space-y-4">
                          <div className="bg-slate-800/40 border border-white/10 rounded-lg backdrop-blur p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                              <input
                                type="text"
                                value={currentPlayer.name}
                                onChange={(e) => setCurrentPlayer({ ...currentPlayer, name: e.target.value })}
                                placeholder="Nome do jogador"
                                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={currentPlayer.number}
                                onChange={(e) => setCurrentPlayer({ ...currentPlayer, number: e.target.value })}
                                placeholder="Número"
                                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <select
                                value={currentPlayer.position}
                                onChange={(e) => setCurrentPlayer({ ...currentPlayer, position: e.target.value })}
                                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Selecione posição</option>
                                <option value="Goleiro">Goleiro</option>
                                <option value="Defensor">Defensor</option>
                                <option value="Meio-campo">Meio-campo</option>
                                <option value="Atacante">Atacante</option>
                              </select>
                              <button
                                onClick={handleAddPlayer}
                                disabled={!currentPlayer.name}
                                className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Adicionar
                              </button>
                            </div>

                            {/* Player Avatar Upload */}
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-2">
                                Foto do Jogador (Opcional)
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePlayerAvatarUpload}
                                  className="flex-1 text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/30 file:text-blue-200 hover:file:bg-blue-500/40"
                                />
                                {currentPlayer.avatar && (
                                  <div className="flex items-center gap-2">
                                    <img src={currentPlayer.avatar} alt="Avatar" className="h-10 w-10 object-cover rounded-full border-2 border-emerald-200" />
                                    <button
                                      onClick={() => setCurrentPlayer({ ...currentPlayer, avatar: '' })}
                                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Players List */}
                          {teamPlayers.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-slate-700">
                                Jogadores adicionados ({teamPlayers.length})
                              </p>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {teamPlayers.map((player, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/40 border border-white/10 rounded-lg hover:border-white/20 backdrop-blur transition-colors">
                                    <div className="flex items-center gap-3">
                                      {player.avatar ? (
                                        <img src={player.avatar} alt={player.name} className="h-10 w-10 object-cover rounded-full border-2 border-blue-200" />
                                      ) : (
                                        <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-bold text-blue-600">
                                            {player.name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-semibold text-slate-900">
                                          #{player.number} {player.name}
                                        </p>
                                        <p className="text-sm text-slate-600">{player.position}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleRemovePlayer(index)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Remover jogador"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setShowTeamForm(false);
                            setEditingTeam(null);
                            setTeamName('');
                            setTeamLogo('');
                            setTeamPlayers([]);
                          }}
                          className="px-6 py-3 text-slate-300 hover:bg-slate-700/40 border border-white/10 rounded-lg font-medium transition-colors backdrop-blur"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={editingTeam ? handleSaveEditedTeam : handleCreateTeam}
                          disabled={!teamName}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                        >
                          <CheckBadgeIcon className="h-5 w-5" />
                          {editingTeam 
                            ? (isTeamSport(championship.sport) ? 'Salvar Time' : 'Salvar Jogador')
                            : (isTeamSport(championship.sport) ? 'Criar Time' : 'Criar Jogador')
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Teams Grid */}
                {!showTeamForm && championship.teams?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {championship.teams.map((team) => (
                      <div key={team.id} className="group bg-slate-900/70 border border-white/10 rounded-2xl hover:border-blue-400/40 hover:shadow-lg backdrop-blur transition-all duration-200 overflow-hidden">
                        {/* Team Header removed: compact top row with logo, name, actions */}
                        <div className="p-5 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                {team.logo ? (
                                  <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                                ) : (
                                  <UserGroupIcon className="h-8 w-8 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-lg font-bold text-slate-900 truncate">{team.name}</h4>
                                <p className="text-xs text-slate-500 truncate">{team.players?.length || 0} {team.players?.length === 1 ? 'jogador' : 'jogadores'}</p>
                              </div>
                            </div>
                            {championship?.isOwner === true && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditTeam(team)}
                                  className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 rounded-lg transition-colors"
                                  title="Editar time"
                                >
                                  <PencilIcon className="h-4 w-4 text-slate-300" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(team.id)}
                                  className="p-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 rounded-lg transition-colors"
                                  title="Excluir time"
                                >
                                  <TrashIcon className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Team Info */}
                        <div className="px-5 pb-5">
                          {/* Compact chips for W/D/L derived from games */}
                          {(() => {
                            const ds = computeTeamStatsFromGames(team.id);
                            const wins = ds.wins || 0;
                            const draws = ds.draws || 0;
                            const losses = ds.losses || 0;
                            const total = Math.max(1, wins + draws + losses);
                            const wPct = Math.round((wins / total) * 100);
                            const dPct = Math.round((draws / total) * 100);
                            const lPct = 100 - wPct - dPct;
                            return (
                              <div className="mt-2 mb-4">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-1 font-medium text-blue-200 ring-1 ring-blue-400/40">● Vitórias {wins}</span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-2 py-1 font-medium text-slate-200 ring-1 ring-slate-400/40">● Empates {draws}</span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-700 ring-1 ring-rose-200">● Derrotas {losses}</span>
                                </div>
                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                  <div className="h-2 bg-emerald-500" style={{ width: `${wPct}%` }} />
                                  <div className="h-2 bg-slate-500" style={{ width: `${dPct}%` }} />
                                  <div className="h-2 bg-rose-500" style={{ width: `${lPct}%` }} />
                                </div>
                              </div>
                            );
                          })()}

                          {/* Team Metrics */}
                          {(() => {
                            const ds = computeTeamStatsFromGames(team.id);
                            const playersCount = team.players?.length || 0;
                            return (
                              <div className="flex items-center justify-between text-sm text-slate-600 py-3 border-t border-slate-100">
                                <span className="flex items-center gap-1.5">
                                  <UsersIcon className="h-4 w-4" />
                                  {playersCount} {playersCount === 1 ? 'jogador' : 'jogadores'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <TrophyIcon className="h-4 w-4" />
                                  {ds.points || 0} pts
                                </span>
                              </div>
                            );
                          })()}

                          {/* Team Actions */}
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <button
                              onClick={() => {
                                setSelectedTeamRoster(team);
                                setShowRosterModal(true);
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-400/40 bg-blue-500/20 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/30 backdrop-blur transition-colors"
                            >
                              Ver Elenco
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enhanced Empty State */}
                {!showTeamForm && (!championship.teams || championship.teams.length === 0) && (
                  <div className="text-center py-16 px-6">
                    <div className="max-w-sm mx-auto">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 border border-blue-400/40 backdrop-blur mb-6">
                        <UserGroupIcon className="h-10 w-10 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Nenhum {formatParticipantLabel(championship.sport).toLowerCase()} cadastrado
                      </h3>
                      <p className="text-slate-600 mb-8 leading-relaxed">
                        Comece adicionando {isTeamSport(championship.sport) ? 'os times' : 'os jogadores'} que irão participar do campeonato. Você pode adicionar quantos precisar.
                      </p>
                      {championship?.isOwner === true ? (
                        <button
                          onClick={() => setShowTeamForm(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                          <PlusIcon className="h-5 w-5" />
                          {getSportActionLabel(championship.sport, 'add')}
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm">
                          Somente o dono pode adicionar {isTeamSport(championship.sport) ? 'times' : 'jogadores'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Games Tab */}
            {activeTab === 'games' && (
              <div className="space-y-6">
                {/* Enhanced Header */}
                {!showGameForm && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <CalendarIcon className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            Partidas Agendadas
                            <span className="ml-2 text-emerald-600">({championship.games?.length || 0})</span>
                          </h3>
                          <p className="text-sm text-slate-600">
                            Gerencie o calendário de jogos e resultados do campeonato
                          </p>
                        </div>
                      </div>
                      {championship?.isOwner === true && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowMatchGenerator(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 rounded-lg hover:bg-emerald-500/30 backdrop-blur font-medium shadow-sm transition-all"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Sortear
                        </button>
                        <button
                          onClick={() => setShowGameForm(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <PlusIcon className="h-5 w-5" />
                          Agendar Partida
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Game Form */}
                {showGameForm && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <CalendarIcon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {championship?.isOwner === true && (gameMode === 'manual' ? 'Agendar Nova Partida' : 'Gerar Chaveamento Automático')}
                            </h3>
                            <p className="text-sm text-emerald-100">
                              {gameMode === 'manual' ? 'Preencha os detalhes do confronto' : 'Configure e gere todas as partidas'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowGameForm(false)}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-8">
                      {/* Mode Selector */}
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">
                          Método de Cadastro
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            onClick={() => setGameMode('manual')}
                            className={`group relative p-5 rounded-xl border-2 transition-all text-left ${
                              gameMode === 'manual'
                                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${gameMode === 'manual' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                <PencilSquareIcon className={`h-6 w-6 ${
                                  gameMode === 'manual' ? 'text-emerald-600' : 'text-slate-400'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-2">
                                  Manual
                                  {gameMode === 'manual' && (
                                    <CheckBadgeIcon className="h-5 w-5 text-emerald-600" />
                                  )}
                                </h5>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  Cadastre cada partida individualmente com controle total sobre datas e confrontos
                                </p>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => setGameMode('auto')}
                            className={`group relative p-5 rounded-xl border-2 transition-all text-left ${
                              gameMode === 'auto'
                                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${gameMode === 'auto' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                <svg className={`h-6 w-6 ${gameMode === 'auto' ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-2">
                                  Automático
                                  {gameMode === 'auto' && (
                                    <CheckBadgeIcon className="h-5 w-5 text-emerald-600" />
                                  )}
                                </h5>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  Gere automaticamente a tabela completa baseada no formato do campeonato
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Manual Mode */}
                      {gameMode === 'manual' && (
                        <div className="space-y-8 border-t border-slate-200 pt-8">
                          {/* Section 1: Confronto */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full font-bold text-sm">
                                1
                              </div>
                              <h4 className="text-lg font-semibold text-slate-900">Confronto</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11 items-center">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Time da Casa <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={homeTeamId}
                                  onChange={(e) => setHomeTeamId(e.target.value)}
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                >
                                  <option value="">Selecione o time</option>
                                  {championship.teams?.map((team) => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center justify-center">
                                <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full">
                                  <span className="text-2xl font-bold text-slate-400">×</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Time Visitante <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={awayTeamId}
                                  onChange={(e) => setAwayTeamId(e.target.value)}
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                >
                                  <option value="">Selecione o time</option>
                                  {championship.teams?.filter(t => t.id !== homeTeamId).map((team) => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {homeTeamId && awayTeamId && (
                              <div className="pl-11">
                                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                  <CheckBadgeIcon className="h-4 w-4" />
                                  Confronto válido selecionado
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Section 2: Data e Local */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                                2
                              </div>
                              <h4 className="text-lg font-semibold text-slate-900">Data e Local</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  📅 Data da Partida
                                </label>
                                <input
                                  type="date"
                                  value={gameDate}
                                  onChange={(e) => setGameDate(e.target.value)}
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  🕐 Horário
                                </label>
                                <input
                                  type="time"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  📍 Local
                                </label>
                                <input
                                  type="text"
                                  value={gameLocation}
                                  onChange={(e) => setGameLocation(e.target.value)}
                                  placeholder="Ex: Ginásio Municipal"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 3: Informações Adicionais */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold text-sm">
                                3
                              </div>
                              <h4 className="text-lg font-semibold text-slate-900">Informações Adicionais (Opcional)</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Rodada
                                </label>
                                <input
                                  type="number"
                                  value={gameRound}
                                  onChange={(e) => setGameRound(Number(e.target.value))}
                                  min="1"
                                  placeholder="1"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Fase / Grupo
                                </label>
                                <input
                                  type="text"
                                  value={gameStage}
                                  onChange={(e) => setGameStage(e.target.value)}
                                  placeholder="Ex: Grupo A"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                  Use "Grupo A", "Quartas de final", etc. Esse campo alimenta a visualização das fases.
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Árbitro
                                </label>
                                <input
                                  type="text"
                                  placeholder="Nome do árbitro"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                            </div>
                            <div className="pl-11">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Observações
                              </label>
                              <textarea
                                rows={3}
                                placeholder="Informações adicionais sobre a partida..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                              />
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                            <button
                              onClick={() => setShowGameForm(false)}
                              className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleCreateManualGame}
                              disabled={!homeTeamId || !awayTeamId || homeTeamId === awayTeamId}
                              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 font-semibold disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                            >
                              <CalendarIcon className="h-5 w-5" />
                              Agendar Partida
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Auto Mode */}
                      {gameMode === 'auto' && (
                        <div className="space-y-6 border-t border-slate-200 pt-8">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">Geração Automática de Partidas</p>
                                <p className="text-blue-700">
                                  O sistema irá gerar automaticamente todas as partidas baseado no formato do campeonato selecionado.
                                  Você poderá editar cada partida individualmente após a geração.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-slate-900">Configurações de Geração</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Formato do Campeonato
                                </label>
                                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                  <option value="round-robin">Todos contra todos (ida e volta)</option>
                                  <option value="knockout">Mata-mata (eliminação simples)</option>
                                  <option value="groups">Fase de grupos + mata-mata</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Data Inicial
                                </label>
                                <input
                                  type="date"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Intervalo entre Jogos (dias)
                                </label>
                                <input
                                  type="number"
                                  defaultValue={2}
                                  min="1"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Horário Padrão
                                </label>
                                <input
                                  type="time"
                                  defaultValue="14:00"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                            <h5 className="font-semibold text-slate-900 mb-4">Preview da Geração</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">Partidas a serem geradas:</span>
                                <span className="font-semibold text-slate-900">24 jogos</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">Duração estimada:</span>
                                <span className="font-semibold text-slate-900">6 semanas</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">Finalização prevista:</span>
                                <span className="font-semibold text-slate-900">05/12/2025</span>
                              </div>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                            <button
                              onClick={() => setShowGameForm(false)}
                              className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Gerar Chaveamento
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Games List - Enhanced Version */}
                {!showGameForm && championship.games?.length > 0 && (
                  <div className="space-y-6">
                    {/* Filters Section */}
                    <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
                      <button
                        onClick={() => setMatchFilter('all')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          matchFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Todas ({championship.games.length})
                      </button>
                      <button
                        onClick={() => setMatchFilter('scheduled')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          matchFilter === 'scheduled'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Agendadas ({championship.games.filter(g => g.status === 'scheduled').length})
                      </button>
                      <button
                        onClick={() => setMatchFilter('finished')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          matchFilter === 'finished'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Finalizadas ({championship.games.filter(g => g.status === 'finalizado' || g.status === 'finished').length})
                      </button>
                    </div>

                        {groupStageContext && groupStageContext.groups.length > 0 && (
                          <div className="mt-8">
                            <GroupStageDashboard
                              teams={championship?.teams ?? []}
                              groups={groupStageContext.groups}
                              qualifiersPerGroup={groupStageContext.qualifiersPerGroup}
                              isGroupStageComplete={groupStageContext.isGroupStageComplete}
                            />
                          </div>
                        )}

                    {/* Bracket Visualization for Knockout Championships */}
                    {championship.format === 'eliminatorias' && championship.games?.length > 0 && (
                      <div ref={knockoutBracketRef} className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                        {/* Enhanced Header with Championship Info */}
                        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 px-6 py-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <TrophyIcon className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-white mb-1">
                                  🏆 Chaveamento - Mata-Mata
                                </h3>
                                <p className="text-sm text-purple-100">
                                  {(() => {
                                    const phases = groupMatchesByPhase(championship.games.map(game => ({
                                      id: game.id,
                                      homeTeam: championship.teams?.find(t => t.id === game.homeTeamId) || null,
                                      awayTeam: championship.teams?.find(t => t.id === game.awayTeamId) || null,
                                      homeScore: game.homeScore,
                                      awayScore: game.awayScore,
                                      status: game.status === 'finalizado' ? 'finished' : game.status === 'in-progress' ? 'live' : game.status === 'scheduled' ? 'scheduled' : 'pending',
                                      winner: game.status === 'finalizado' && game.homeScore !== undefined && game.awayScore !== undefined
                                        ? (game.homeScore > game.awayScore 
                                            ? championship.teams?.find(t => t.id === game.homeTeamId) 
                                            : championship.teams?.find(t => t.id === game.awayTeamId))
                                        : undefined,
                                      round: game.round || 1,
                                      position: 1,
                                      scheduledDate: game.date,
                                      location: game.location,
                                    })));
                                    
                                    const currentPhase = phases.find(p => p.isCurrent);
                                    const totalMatches = championship.games.length;
                                    const finishedMatches = championship.games.filter(g => g.status === 'finalizado').length;
                                    const teamsRemaining = championship.teams?.length || 0;
                                    
                                    return (
                                      <span>
                                        {currentPhase ? `📍 Fase Atual: ${currentPhase.displayName}` : '📍 Aguardando início'} 
                                        {' • '}
                                        {finishedMatches}/{totalMatches} partidas finalizadas
                                        {' • '}
                                        🎯 {teamsRemaining} times no torneio
                                      </span>
                                    );
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b border-slate-200">
                          <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                              <span className="text-slate-700 font-medium">🟢 Ao Vivo</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-green-600"></span>
                              <span className="text-slate-700 font-medium">✅ Finalizada</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                              <span className="text-slate-700 font-medium">📅 Agendada</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                              <span className="text-slate-700 font-medium">⏳ Aguardando</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                              <span className="text-slate-700 font-medium">⏭️ BYE</span>
                            </div>
                          </div>
                        </div>

                        {/* Bracket View */}
                        <div className="p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
                          <KnockoutBracket
                            phases={groupMatchesByPhase(championship.games.map(game => ({
                              id: game.id,
                              homeTeam: championship.teams?.find(t => t.id === game.homeTeamId) || null,
                              awayTeam: championship.teams?.find(t => t.id === game.awayTeamId) || null,
                              homeScore: game.homeScore,
                              awayScore: game.awayScore,
                              status: game.status === 'finalizado' ? 'finished' : game.status === 'in-progress' ? 'live' : game.status === 'scheduled' ? 'scheduled' : 'pending',
                              winner: game.status === 'finalizado' && game.homeScore !== undefined && game.awayScore !== undefined
                                ? (game.homeScore > game.awayScore 
                                    ? championship.teams?.find(t => t.id === game.homeTeamId) 
                                    : championship.teams?.find(t => t.id === game.awayTeamId))
                                : undefined,
                              round: game.round || 1,
                              position: 1,
                              scheduledDate: game.date,
                              location: game.location,
                            })))}
                            onMatchClick={(match) => {
                              const game = championship.games?.find(g => g.id === match.id);
                              if (game?.id && !game.id.startsWith('game-')) {
                                // Navega para o LiveMatchEditor
                                navigate(`/games/${game.id}/live-editor`);
                              } else if (game) {
                                // Se não tiver ID válido, abre modal antigo
                                handleEditGame(game);
                              }
                            }}
                            onMatchDelete={(match) => {
                              const game = championship.games?.find(g => g.id === match.id);
                              if (game?.id) {
                                handleDeleteGame(game.id);
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Rounds List - Only for non-elimination formats */}
                    {championship.format !== 'eliminatorias' && championship.games?.length > 0 && (
                      <div className="space-y-4">
                        {shouldEmphasizeKnockout && (
                          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                ✅ Fase de grupos concluída
                              </h3>
                              <p className="text-sm text-slate-600 max-w-2xl">
                                Todas as partidas dos grupos foram finalizadas. O chaveamento de mata-mata está disponível abaixo com os times classificados.
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                              <button
                                onClick={() => knockoutBracketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                              >
                                Ver chaveamento
                              </button>
                              <button
                                onClick={() => setShowGroupRounds((previous) => !previous)}
                                className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                              >
                                {showGroupRounds ? 'Ocultar rodadas' : 'Ver rodadas detalhadas'}
                              </button>
                            </div>
                          </div>
                        )}

                        {(!shouldEmphasizeKnockout || showGroupRounds) && (
                          <div className="space-y-4">
                            {filteredGameSections.map((section: GameSection) => {
                              const { key, matches, round, stageLabel } = section;
                              const isExpanded = expandedSections.has(key);
                              const finishedCount = matches.filter((game: Game) => game.status === 'finalizado' || game.status === 'finished').length;
                              const headerTitle = stageLabel
                                ? `${stageLabel} • Rodada ${round}`
                                : `Rodada ${round}`;

                              return (
                                <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    {/* Round Header */}
                                    <button
                                      onClick={() => toggleSection(key)}
                                      className="w-full px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 hover:from-emerald-100 hover:via-teal-100 hover:to-blue-100 transition-all flex items-center justify-between group"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-md group-hover:shadow-lg transition-shadow">
                                          {round}
                                        </div>
                                        <div className="text-left">
                                          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            {headerTitle}
                                            {finishedCount === matches.length && (
                                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                ✓ Concluída
                                              </span>
                                            )}
                                          </h3>
                                          <p className="text-sm text-slate-600 mt-0.5">
                                            {matches.length} {matches.length === 1 ? 'partida' : 'partidas'}
                                            {finishedCount > 0 && finishedCount < matches.length && (
                                              <span className="ml-2">• {finishedCount} finalizada{finishedCount > 1 ? 's' : ''}</span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <ChevronDownIcon
                                        className={`w-6 h-6 text-slate-600 transition-transform duration-200 ${
                                          isExpanded ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </button>

                                    {/* Games in Round */}
                                    {isExpanded && (
                                      <div className="divide-y divide-slate-100">
                                        {matches.map((game: Game) => {
                                          const homeTeam = championship?.teams?.find((team: Team) => team.id === game.homeTeamId);
                                          const awayTeam = championship?.teams?.find((team: Team) => team.id === game.awayTeamId);
                                          const isFinished = game.status === 'finalizado' || game.status === 'finished';
                                          const homeWon = isFinished && (game.homeScore ?? 0) > (game.awayScore ?? 0);
                                          const awayWon = isFinished && (game.awayScore ?? 0) > (game.homeScore ?? 0);
                                          const isDraw = isFinished && game.homeScore === game.awayScore;

                                          return (
                                            <div key={game.id} className="p-6 hover:bg-slate-50 transition-colors">
                                              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                                {/* Match Info */}
                                                <div className="flex-1 w-full">
                                                  {/* Date, Time, Location */}
                                                  <div className="flex flex-wrap items-center gap-3 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                                      <CalendarIcon className="h-4 w-4" />
                                                      <span className="font-medium">{formatMatchDate(game.date)}</span>
                                                    </div>
                                                    {game.location && (
                                                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                                        <MapPinIcon className="h-4 w-4" />
                                                        <span className="font-medium">{game.location}</span>
                                                      </div>
                                                    )}
                                                    {getStatusBadge(game.status)}
                                                  </div>

                                                  {/* Teams and Score */}
                                                  <div className="flex items-center justify-between gap-6">
                                                    {/* Home Team */}
                                                    <div className={`flex items-center gap-3 flex-1 ${homeWon ? 'opacity-100' : isFinished ? 'opacity-60' : 'opacity-100'}`}>
                                                      {homeTeam?.logo ? (
                                                        <img
                                                          src={homeTeam.logo}
                                                          alt={homeTeam.name}
                                                          className="w-14 h-14 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                                                        />
                                                      ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-slate-300">
                                                          <span className="text-xl font-bold text-slate-500">{homeTeam?.name?.charAt(0) || 'A'}</span>
                                                        </div>
                                                      )}
                                                      <div className="flex-1">
                                                        <span className="text-lg font-bold text-slate-900 block">{homeTeam?.name || 'Time A'}</span>
                                                        {homeWon && <span className="text-xs text-green-600 font-semibold">⬆️ Vencedor</span>}
                                                      </div>
                                                    </div>

                                                    {/* Score Display */}
                                                    <div className="flex items-center gap-5 px-6 py-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 min-w-[160px] justify-center">
                                                      <div className="text-center">
                                                        <div className={`text-4xl font-bold ${homeWon ? 'text-green-600' : isDraw ? 'text-amber-600' : 'text-slate-900'}`}>
                                                          {game.homeScore ?? '-'}
                                                        </div>
                                                      </div>
                                                      <div className="text-2xl font-bold text-slate-400">×</div>
                                                      <div className="text-center">
                                                        <div className={`text-4xl font-bold ${awayWon ? 'text-green-600' : isDraw ? 'text-amber-600' : 'text-slate-900'}`}>
                                                          {game.awayScore ?? '-'}
                                                        </div>
                                                      </div>
                                                    </div>

                                                    {/* Away Team */}
                                                    <div className={`flex items-center gap-3 flex-1 justify-end ${awayWon ? 'opacity-100' : isFinished ? 'opacity-60' : 'opacity-100'}`}>
                                                      <div className="flex-1 text-right">
                                                        <span className="text-lg font-bold text-slate-900 block">{awayTeam?.name || 'Time B'}</span>
                                                        {awayWon && <span className="text-xs text-green-600 font-semibold">Vencedor ⬆️</span>}
                                                      </div>
                                                      {awayTeam?.logo ? (
                                                        <img
                                                          src={awayTeam.logo}
                                                          alt={awayTeam.name}
                                                          className="w-14 h-14 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                                                        />
                                                      ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-slate-300">
                                                          <span className="text-xl font-bold text-slate-500">{awayTeam?.name?.charAt(0) || 'B'}</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Actions (somente dono) */}
                                                {championship?.isOwner === true && (
                                                  <div className="flex items-center gap-2">
                                                    {/* Botão "Ao Vivo" só aparece se a partida tiver UUID válido (está no backend) */}
                                                    {game.id && !game.id.startsWith('game-') && (
                                                      <button
                                                        onClick={() => navigate(`/games/${game.id}/live-editor`)}
                                                        className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center gap-2"
                                                        title="Gerenciar partida ao vivo"
                                                      >
                                                        <span className="text-lg">⚽</span>
                                                        Ao Vivo
                                                      </button>
                                                    )}
                                                    <button
                                                      onClick={() => handleEditGame(game)}
                                                      className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-emerald-200"
                                                      title="Editar partida"
                                                    >
                                                      <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteGame(game.id)}
                                                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200"
                                                      title="Excluir partida"
                                                    >
                                                      <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Empty State */}
                {!showGameForm && (!championship.games || championship.games.length === 0) && (
                  <div className="text-center py-16 px-6 bg-gradient-to-br from-slate-800/40 to-blue-500/10 border-2 border-dashed border-white/20 rounded-xl backdrop-blur">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 border border-emerald-400/40 rounded-full backdrop-blur mb-4">
                      <CalendarIcon className="h-8 w-8 text-emerald-200" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">Nenhuma partida agendada</h3>
                    <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                      Comece agendando partidas individualmente ou gere automaticamente toda a tabela do campeonato
                    </p>
                    {(!championship.teams || championship.teams.length < 2) && (
                      <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-200 px-4 py-2.5 rounded-lg text-sm mb-6 backdrop-blur">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <span>Adicione pelo menos 2 times para criar partidas</span>
                      </div>
                    )}
                    {championship.teams && championship.teams.length >= 2 && (
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => { setGameMode('manual'); setShowGameForm(true); }}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-md hover:shadow-lg transition-all"
                        >
                          <PlusIcon className="h-5 w-5" />
                          Agendar Primeira Partida
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <ErrorBoundary>
                <div className="space-y-6">
                  {isLoadingStats ? (
                    <div className="space-y-6">
                      {/* Skeleton: Summary */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-white p-6">
                            <div className="flex items-center justify-between">
                              <div className="h-12 w-28 animate-pulse rounded bg-slate-200" />
                              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                            </div>
                            <div className="mt-4 h-2 w-24 animate-pulse rounded bg-slate-200" />
                          </div>
                        ))}
                      </div>

                      {/* Skeleton: Lists */}
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-white p-6">
                            <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200" />
                            <div className="space-y-3">
                              {Array.from({ length: 4 }).map((__, j) => (
                                <div key={j} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                                    <div>
                                      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                                      <div className="mt-1 h-3 w-24 animate-pulse rounded bg-slate-200" />
                                    </div>
                                  </div>
                                  <div className="h-6 w-10 animate-pulse rounded bg-slate-200" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : isChessChampionship ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Jogadores de xadrez">
                          <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-indigo-50/90 to-transparent pointer-events-none" />
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700/80">Jogadores Ativos</p>
                              <p className="mt-2 text-3xl md:text-4xl font-extrabold text-indigo-700">{chessStandingsData.length}</p>
                              <p className="mt-1 text-xs text-slate-500">Participando desta etapa</p>
                            </div>
                            <div className="shrink-0 rounded-xl bg-indigo-100 p-2 md:p-3 text-indigo-700 ring-1 ring-indigo-200">
                              <UsersIcon className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                          </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Partidas de xadrez finalizadas">
                          <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-emerald-50/90 to-transparent pointer-events-none" />
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">Partidas Finalizadas</p>
                              <p className="mt-2 text-3xl md:text-4xl font-extrabold text-emerald-700">{chessTotals.finishedGames}</p>
                              <p className="mt-1 text-xs text-slate-500">Considera apenas partidas concluídas</p>
                            </div>
                            <div className="shrink-0 rounded-xl bg-emerald-100 p-2 md:p-3 text-emerald-700 ring-1 ring-emerald-200">
                              <CalendarIcon className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                          </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Empates no xadrez">
                          <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-amber-50/90 to-transparent pointer-events-none" />
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">Empates</p>
                              <p className="mt-2 text-3xl md:text-4xl font-extrabold text-amber-700">{chessTotals.draws}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {chessTotals.finishedGames > 0 ? `${Math.round(chessDrawRate)}% das partidas` : 'Nenhum empate registrado'}
                              </p>
                            </div>
                            <div className="shrink-0 rounded-xl bg-amber-100 p-2 md:p-3 text-amber-700 ring-1 ring-amber-200">
                              <ArrowsRightLeftIcon className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                          </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Vitórias por cor">
                          <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-blue-50/90 to-transparent pointer-events-none" />
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700/80">Vitórias</p>
                              <p className="mt-2 text-3xl md:text-4xl font-extrabold text-blue-700">{chessVictories}</p>
                              <p className="mt-1 text-xs text-slate-500">Brancas {chessTotals.whiteWins} • Pretas {chessTotals.blackWins}</p>
                            </div>
                            <div className="shrink-0 rounded-xl bg-blue-100 p-2 md:p-3 text-blue-700 ring-1 ring-blue-200">
                              <TrophyIcon className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">Classificação Geral do Xadrez</h3>
                            <p className="text-sm text-slate-500">
                              Pontuação padrão FIDE — vitória vale {formatChessPoints(chessWinPointsPerGame)} ponto{chessWinPointsPerGame !== 1 ? 's' : ''},
                              empate vale {formatChessPoints(chessDrawPoints)}.
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            Atualizado automaticamente a partir das partidas finalizadas
                          </div>
                        </div>

                        {hasChessStandings ? (
                          <>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-2 text-left">Pos</th>
                                    <th className="px-3 py-2 text-left">Jogador</th>
                                    <th className="px-3 py-2 text-right">Pts</th>
                                    <th className="px-3 py-2 text-right">Jogos</th>
                                    <th className="px-3 py-2 text-right">Vitórias</th>
                                    <th className="px-3 py-2 text-right">Empates</th>
                                    <th className="px-3 py-2 text-right">Derrotas</th>
                                    <th className="px-3 py-2 text-right">% Aproveitamento</th>
                                    <th className="px-3 py-2 text-center">Sequência</th>
                                    <th className="px-3 py-2 text-center">Últimos 5</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {chessStandingsData.map((entry, index) => {
                                    const displayName = entry.player?.name ?? entry.team.name;
                                    const secondaryLabel = entry.player && entry.player.name !== entry.team.name
                                      ? entry.team.name
                                      : entry.player?.position ?? null;
                                    const avatar = entry.team.logo ? (
                                      <img
                                        src={entry.team.logo}
                                        alt={displayName}
                                        className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                                        {displayName.charAt(0).toUpperCase()}
                                      </div>
                                    );
                                    const streak = entry.streak;
                                    const streakContent = streak ? `${streak.length}${CHESS_RESULT_LABEL[streak.type]}` : '—';
                                    const streakClass = streak ? CHESS_RESULT_BADGE[streak.type] : 'text-slate-500';
                                    const recentForm = entry.recentForm.length ? [...entry.recentForm].slice(-5).reverse() : [];
                                    const performancePct = Number.isFinite(entry.performance) ? Math.round(entry.performance * 100) : 0;

                                    return (
                                      <tr key={entry.teamId} className={index === 0 ? 'bg-blue-50/40' : ''}>
                                        <td className="px-3 py-3 text-left text-sm font-semibold text-slate-600">{index + 1}º</td>
                                        <td className="px-3 py-3">
                                          <div className="flex items-center gap-3">
                                            {avatar}
                                            <div>
                                              <p className="font-semibold text-slate-900 leading-tight">{displayName}</p>
                                              {secondaryLabel ? (
                                                <p className="text-xs text-slate-500">{secondaryLabel}</p>
                                              ) : null}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatChessPoints(entry.points)}</td>
                                        <td className="px-3 py-3 text-right text-slate-700">{entry.games}</td>
                                        <td className="px-3 py-3 text-right text-slate-700">{entry.wins}</td>
                                        <td className="px-3 py-3 text-right text-slate-700">{entry.draws}</td>
                                        <td className="px-3 py-3 text-right text-slate-700">{entry.losses}</td>
                                        <td className="px-3 py-3 text-right text-slate-700">{performancePct}%</td>
                                        <td className="px-3 py-3 text-center">
                                          {streak ? (
                                            <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${streakClass}`}>
                                              {streakContent}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-3">
                                          {recentForm.length ? (
                                            <div className="flex items-center justify-center gap-1">
                                              {recentForm.map((code, idx) => (
                                                <span
                                                  key={idx}
                                                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${CHESS_RESULT_BADGE[code]}`}
                                                >
                                                  {CHESS_RESULT_LABEL[code]}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="block text-center text-xs text-slate-400">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase text-slate-500">Jogadores invictos</p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">{chessUndefeatedPlayers}</p>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase text-slate-500">Pontuação média</p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">{formatChessPoints(chessAveragePoints)}</p>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase text-slate-500">Total de pontos</p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">{formatChessPoints(chessStandingsData.reduce((sum, entry) => sum + entry.points, 0))}</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="py-12 text-center text-sm text-slate-500">
                            Nenhuma partida de xadrez foi finalizada ainda. Registre resultados para habilitar a classificação.
                          </div>
                        )}
                      </div>
                    </>
                  ) : championshipStats ? (
                    <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      {/* Total de Gols */}
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Cartão Total de Gols">
                        <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-blue-50/90 to-transparent pointer-events-none" />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700/80">Total de Gols</p>
                            <p className="mt-2 text-3xl md:text-4xl font-extrabold text-blue-700">{championshipStats?.summary?.totalGoals || 0}</p>
                            <p className="mt-1 text-xs text-slate-500">Desde o início do campeonato</p>
                          </div>
                          <div className="shrink-0 rounded-xl bg-blue-100 p-2 md:p-3 text-blue-700 ring-1 ring-blue-200">
                            <ArrowTrendingUpIcon className="h-6 w-6 md:h-7 md:w-7" />
                          </div>
                        </div>
                      </div>

                      {/* Total de Partidas */}
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Cartão Total de Partidas">
                        <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-emerald-50/90 to-transparent pointer-events-none" />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">Total de Partidas</p>
                            <p className="mt-2 text-3xl md:text-4xl font-extrabold text-emerald-700">{championshipStats?.summary?.totalGames || 0}</p>
                            <p className="mt-1 text-xs text-slate-500">Somando todas as fases</p>
                          </div>
                          <div className="shrink-0 rounded-xl bg-emerald-100 p-2 md:p-3 text-emerald-700 ring-1 ring-emerald-200">
                            <CalendarIcon className="h-6 w-6 md:h-7 md:w-7" />
                          </div>
                        </div>
                      </div>

                      {/* Jogadores */}
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Cartão de Jogadores">
                        <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-50/90 to-transparent pointer-events-none" />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700/80">Jogadores</p>
                            <p className="mt-2 text-3xl md:text-4xl font-extrabold text-violet-700">{championshipStats?.summary?.totalPlayers || 0}</p>
                            <p className="mt-1 text-xs text-slate-500">Inscritos no campeonato</p>
                          </div>
                          <div className="shrink-0 rounded-xl bg-violet-100 p-2 md:p-3 text-violet-700 ring-1 ring-violet-200">
                            <UsersIcon className="h-6 w-6 md:h-7 md:w-7" />
                          </div>
                        </div>
                      </div>

                      {/* Média Gols/Jogo */}
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Cartão Média de Gols por Jogo">
                        <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-amber-50/90 to-transparent pointer-events-none" />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">Média Gols/Jogo</p>
                            <p className="mt-2 text-3xl md:text-4xl font-extrabold text-amber-700">
                              {Number.isFinite(Number(championshipStats?.summary?.avgGoalsPerGame))
                                ? Number(championshipStats?.summary?.avgGoalsPerGame).toFixed(1)
                                : '0.0'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">Atualizado em tempo real</p>
                          </div>
                          <div className="shrink-0 rounded-xl bg-amber-100 p-2 md:p-3 text-amber-700 ring-1 ring-amber-200">
                            <ChartBarIcon className="h-6 w-6 md:h-7 md:w-7" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Scorers and Assisters */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Top Scorers */}
                      <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="rounded-lg bg-blue-100 p-2">
                            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">🥇 Artilheiros</h3>
                        </div>
                        {championshipStats.topScorers && championshipStats.topScorers.length > 0 ? (
                          <div className="space-y-3">
                            <div className="mb-1 grid grid-cols-[1fr_auto] items-center px-1 text-xs text-slate-500">
                              <span>Jogador</span>
                              <span>G/A</span>
                            </div>
                            {championshipStats.topScorers.map((player: any, index: number) => (
                              <div key={player.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 transition hover:bg-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-700' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{player.name}</p>
                                    <p className="text-xs text-slate-500">{player.team?.name || 'Sem time'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-sm font-semibold text-blue-700">{player.goals} G</span>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{player.assists} A</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-sm text-slate-500 py-4">Nenhum gol marcado ainda</p>
                        )}
                      </div>

                      {/* Top Assisters */}
                      <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="rounded-lg bg-green-100 p-2">
                            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">🎯 Garçons</h3>
                        </div>
                        {championshipStats.topAssisters && championshipStats.topAssisters.length > 0 ? (
                          <div className="space-y-3">
                            <div className="mb-1 grid grid-cols-[1fr_auto] items-center px-1 text-xs text-slate-500">
                              <span>Jogador</span>
                              <span>A/G</span>
                            </div>
                            {championshipStats.topAssisters.map((player: any, index: number) => (
                              <div key={player.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 transition hover:bg-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-700' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{player.name}</p>
                                    <p className="text-xs text-slate-500">{player.team?.name || 'Sem time'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-700">{player.assists} A</span>
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{player.goals} G</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-sm text-slate-500 py-4">Nenhuma assistência ainda</p>
                        )}
                      </div>
                    </div>

                    {/* Attack & Defense Leaders */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Best Attack */}
                      <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="rounded-lg bg-red-100 p-2">
                            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">🔥 Melhores Ataques</h3>
                        </div>
                        {bestAttackTeams.length > 0 ? (
                          <div className="space-y-3">
                            {bestAttackTeams.map((entry, index) => (
                              <div key={entry.team.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 transition hover:bg-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-700' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{entry.team.name}</p>
                                    <p className="text-xs text-slate-500">{entry.goalsFor} gols • {entry.games} jogos</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-red-600">{entry.goalsFor}</p>
                                  <p className="text-xs text-slate-500">Média {entry.goalsForPerGame.toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="py-4 text-center text-sm text-slate-500">Nenhuma partida finalizada ainda</p>
                        )}
                      </div>

                      {/* Best Defense */}
                      <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="rounded-lg bg-sky-100 p-2">
                            <svg className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-.828-.895-1.5-2-1.5s-2 .672-2 1.5 2 4 2 4 2-3.172 2-4z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5a7 7 0 017 7c0 5-7 9-7 9s-7-4-7-9a7 7 0 017-7z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">🛡️ Melhores Defesas</h3>
                        </div>
                        {bestDefenseTeams.length > 0 ? (
                          <div className="space-y-3">
                            {bestDefenseTeams.map((entry, index) => (
                              <div key={entry.team.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 transition hover:bg-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-700' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{entry.team.name}</p>
                                    <p className="text-xs text-slate-500">{entry.goalsAgainst} gols sofridos • {entry.games} jogos</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-sky-600">{entry.goalsAgainst}</p>
                                  <p className="text-xs text-slate-500">Média {entry.goalsAgainstPerGame.toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="py-4 text-center text-sm text-slate-500">Nenhuma partida finalizada ainda</p>
                        )}
                      </div>
                    </div>

                    {/* Goals by Type */}
                    {championshipStats?.summary?.goalsByType && Object.keys(championshipStats?.summary?.goalsByType || {}).length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-900">⚽ Gols por Tipo</h3>
                          {(() => {
                            const gb = championshipStats?.summary?.goalsByType || {};
                            const normal = Number(gb?.normal || 0);
                            const penalti = Number(gb?.penalti || 0);
                            const falta = Number(gb?.falta || 0);
                            const contra = Number(gb?.contra || 0);
                            const total = normal + penalti + falta + contra;
                            return (
                              <span className="text-xs font-medium text-slate-500">Total: {total}</span>
                            );
                          })()}
                        </div>

                        {(() => {
                          const gb = championshipStats?.summary?.goalsByType || {};
                          const items = [
                            { key: 'normal', label: 'Normal', color: 'bg-blue-500', bg: 'bg-blue-50', value: Number(gb?.normal || 0) },
                            { key: 'penalti', label: 'Pênalti', color: 'bg-emerald-500', bg: 'bg-emerald-50', value: Number(gb?.penalti || 0) },
                            { key: 'falta', label: 'Falta', color: 'bg-purple-500', bg: 'bg-purple-50', value: Number(gb?.falta || 0) },
                            { key: 'contra', label: 'Contra', color: 'bg-rose-500', bg: 'bg-rose-50', value: Number(gb?.contra || 0) },
                          ];
                          const total = items.reduce((acc, it) => acc + (it.value || 0), 0);
                          return (
                            <div className="space-y-4">
                              {items.map((it) => (
                                <BarRow
                                  key={it.key}
                                  label={it.label}
                                  value={it.value}
                                  total={total}
                                  colorClass={it.color}
                                  bgClass={it.bg}
                                />
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/20 bg-slate-800/40 backdrop-blur p-12 text-center">
                      <ChartBarIcon className="mx-auto h-16 w-16 text-slate-400" />
                      <h3 className="mt-4 text-lg font-semibold text-slate-100">Nenhuma estatística disponível</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        As estatísticas aparecerão aqui assim que houver partidas finalizadas no campeonato.
                      </p>
                    </div>
                  )}
                </div>
              </ErrorBoundary>
            )}

            {activeTab === 'xp' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/30 via-slate-900/80 to-slate-950 p-8 shadow-lg backdrop-blur">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200/80">Gamificação</p>
                      <h2 className="mt-1 text-3xl font-bold text-white">Ranking XP do Campeonato</h2>
                      <p className="mt-3 max-w-2xl text-sm text-purple-100/80">
                        Acompanhe quem está evoluindo mais rápido na temporada. O XP considera gols, assistências, presença
                        em jogos e conquistas especiais para premiar regularidade e desempenho.
                      </p>
                    </div>
                    <div className="flex w-full flex-col items-center gap-3 lg:w-auto lg:items-end">
                      <div className="flex h-24 w-full flex-col items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-500/10 text-center text-purple-200 shadow-inner lg:w-56">
                        <span className="text-5xl font-extrabold">
                          {championshipStats?.topXP?.length || 0}
                        </span>
                        <span className="mt-2 rounded-full border border-purple-300/40 bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-100">
                          jogadores ranqueados
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAchievementsModal(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-purple-300/40 bg-purple-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-100 transition hover:border-purple-300/60 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-300/40"
                      >
                        <CheckBadgeIcon className="h-4 w-4" />
                        Ver conquistas disponíveis
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg backdrop-blur">
                  {championshipStats?.topXP && championshipStats.topXP.length > 0 ? (
                    <div className="space-y-4">
                      {championshipStats.topXP.map((player: any, index: number) => {
                        const levelDetails = getLevelDetails(player?.xp);
                        const { xp, level, progress } = levelDetails;
                        const achievementCount = Array.isArray(player?.achievements)
                          ? player.achievements.length
                          : 0;
                        return (
                          <div
                            key={player.id ?? `${player.name}-${index}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenPlayerProfile(player)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleOpenPlayerProfile(player);
                              }
                            }}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-400/40 hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-300/50 cursor-pointer"
                            aria-label={`Abrir detalhes de ${player.name ?? 'jogador'} no ranking de XP`}
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
                                  index === 0
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : index === 1
                                    ? 'bg-slate-200 text-slate-700'
                                    : index === 2
                                    ? 'bg-amber-200 text-amber-800'
                                    : 'bg-slate-800 text-slate-200'
                                }`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                                </div>
                                <div>
                                  <p className="text-lg font-semibold text-white">{player.name}</p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-purple-100/80">
                                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 uppercase tracking-wide">
                                      {player.team?.name || 'Sem time'}
                                    </span>
                                    <span className="rounded-full border border-purple-300/30 bg-purple-500/20 px-2 py-1 font-semibold text-purple-100">
                                      Nível {level}
                                    </span>
                                    {achievementCount > 0 && (
                                      <span className="rounded-full border border-amber-300/60 bg-amber-500/20 px-2 py-1 font-semibold text-amber-100">
                                        {achievementCount} conquista{achievementCount > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-bold text-purple-300">{xp}</p>
                                <p className="text-xs uppercase tracking-wide text-purple-200/70">XP total</p>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-xs text-purple-200/70">
                                <span>Progresso para o nível {level + 1}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/80 p-10 text-center text-sm text-slate-300">
                      Ainda não há jogadores com XP registrado. Registre eventos nas partidas para começar a pontuação.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPlayerProfileModal && selectedPlayerProfile && (() => {
          const player = selectedPlayerProfile;
          const associatedTeamName =
            player?.team?.name ??
            (championship?.teams ?? []).find((team) =>
              (team.players ?? []).some((teamPlayer) => teamPlayer.id === player?.id)
            )?.name ??
            'Sem time';

          const levelDetails = getLevelDetails(player?.xp);
          const { xp, level, progress, nextLevelXp, currentLevelBase } = levelDetails;
          
          // Debug: verificar dados completos do jogador
          console.log('🔍 DEBUG - Dados do jogador:', player?.name);
          console.log('  - player completo:', player);
          console.log('  - gamesPlayed:', player?.gamesPlayed);
          console.log('  - goals:', player?.goals);
          console.log('  - assists:', player?.assists);
          console.log('  - wins:', player?.wins);
          console.log('  - yellowCards:', player?.yellowCards);
          console.log('  - redCards:', player?.redCards);
          
          // Priorizar dados diretos do jogador sobre stats object aninhado
          const stats = {
            games: Number(player?.gamesPlayed ?? player?.stats?.games ?? player?.stats?.matchesPlayed ?? 0),
            goals: Number(player?.goals ?? player?.stats?.goals ?? 0),
            assists: Number(player?.assists ?? player?.stats?.assists ?? 0),
            wins: Number(player?.wins ?? player?.stats?.wins ?? 0),
            yellowCards: Number(player?.yellowCards ?? player?.stats?.yellowCards ?? 0),
            redCards: Number(player?.redCards ?? player?.stats?.redCards ?? 0),
          };
          
          console.log('  - stats processado:', stats);
          
          // Mapear conquistas para obter detalhes completos
          const achievements = (Array.isArray(player?.achievements) ? player.achievements : []).map((ach: any) => {
            // Determinar o ID/chave da conquista
            const achievementKey = typeof ach === 'string' ? ach : (ach?.id || ach?.name);
            
            // Buscar no mapeamento de IDs primeiro (ex: 'first_goal', 'hat_trick')
            const mappedDef = ACHIEVEMENT_DEFINITIONS.find(def => 
              achievementKey === def.name || 
              Object.keys(ACHIEVEMENT_ID_MAP).find(key => 
                key === achievementKey && ACHIEVEMENT_ID_MAP[key].name === def.name
              )
            );
            
            // Usar ACHIEVEMENT_ID_MAP para IDs salvos no banco
            const idMapEntry = ACHIEVEMENT_ID_MAP[achievementKey];
            
            // Se for apenas uma string
            if (typeof ach === 'string') {
              if (idMapEntry) {
                return { ...idMapEntry, unlockedAt: null };
              }
              return mappedDef ? { ...mappedDef, unlockedAt: null } : { name: ach, icon: '🏅', unlockedAt: null };
            }
            
            // Se for objeto, mesclar com definição
            const baseDef = idMapEntry || mappedDef;
            return {
              ...ach,
              name: baseDef?.name || ach?.name || 'Conquista',
              description: baseDef?.description || ach?.description,
              icon: baseDef?.icon || ach?.icon || '🏅',
              xpReward: baseDef?.xpReward ?? ach?.xpReward,
            };
          });

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
              <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Perfil do jogador</p>
                    <h3 className="mt-1 text-2xl font-bold text-slate-900">{player?.name ?? 'Jogador'}</h3>
                    <p className="mt-1 text-sm text-slate-500">{associatedTeamName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClosePlayerProfile}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Fechar perfil do jogador"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6 p-6">
                  <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Nivelamento</p>
                        <p className="text-3xl font-bold text-purple-800">Nível {level}</p>
                        <p className="mt-1 text-sm text-purple-700">{xp} XP • Próximo nível em {nextLevelXp - xp} XP</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-600">Faixa atual</p>
                        <p className="text-xs text-purple-500">{currentLevelBase} XP → {nextLevelXp} XP</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-purple-200">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resumo estatístico</h4>
                    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {[{
                        label: 'Jogos',
                        value: stats.games,
                      }, {
                        label: 'Gols',
                        value: stats.goals,
                      }, {
                        label: 'Assistências',
                        value: stats.assists,
                      }, {
                        label: 'Vitórias',
                        value: stats.wins,
                      }, {
                        label: 'Amarelos',
                        value: stats.yellowCards,
                      }, {
                        label: 'Vermelhos',
                        value: stats.redCards,
                      }].map((item) => (
                        <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Conquistas desbloqueadas</h4>
                      {achievements.length > 0 && (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
                          {achievements.length} conquista{achievements.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {achievements.length > 0 ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {achievements.map((achievement: any, idx: number) => {
                          const unlockedAt = achievement?.unlockedAt ? new Date(achievement.unlockedAt) : null;
                          const unlockedLabel = unlockedAt && !Number.isNaN(unlockedAt.getTime())
                            ? unlockedAt.toLocaleDateString('pt-BR')
                            : null;
                          
                          return (
                            <div
                              key={`${achievement?.name ?? 'achievement'}-${idx}`}
                              className="rounded-xl border border-purple-200 bg-purple-50 p-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-2xl">{achievement?.icon ?? '🏅'}</span>
                                {typeof achievement?.xpReward === 'number' && (
                                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                    +{achievement.xpReward} XP
                                  </span>
                                )}
                              </div>
                              <p className="mt-3 text-sm font-semibold text-slate-900">{achievement?.name ?? 'Conquista'}</p>
                              {achievement?.description && (
                                <p className="mt-1 text-xs text-slate-600">{achievement.description}</p>
                              )}
                              {unlockedLabel && (
                                <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-500">
                                  Conquistado em {unlockedLabel}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">Nenhuma conquista desbloqueada ainda.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {showAchievementsModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-8">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conquistas</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">Catálogo de conquistas</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Descubra todas as conquistas disponíveis e veja quem já desbloqueou cada uma delas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAchievementsModal}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fechar catálogo de conquistas"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
                {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
                  const holders = allPlayersInChampionship
                    .filter((player) =>
                      Array.isArray(player?.achievements)
                      && player.achievements.some((ach: any) => ach?.name === achievement.name)
                    )
                    .sort((a, b) => Number(b?.xp ?? 0) - Number(a?.xp ?? 0));

                  return (
                    <div key={achievement.name} className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{achievement.icon ?? '🏅'}</span>
                          <div>
                            <p className="text-base font-semibold text-slate-900">{achievement.name}</p>
                            {achievement.description && (
                              <p className="mt-1 text-sm text-slate-500">{achievement.description}</p>
                            )}
                            {achievement.condition && (
                              <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                                Condição: {achievement.condition}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                          +{achievement.xpReward} XP
                        </span>
                      </div>

                      {holders.length > 0 ? (
                        <ul className="mt-4 space-y-2">
                          {holders.map((holder: any) => {
                            const holderLevel = getLevelDetails(holder?.xp);
                            const holderAchievement = Array.isArray(holder?.achievements)
                              ? holder.achievements.find((ach: any) => ach?.name === achievement.name)
                              : null;
                            const unlockedAt = holderAchievement?.unlockedAt ? new Date(holderAchievement.unlockedAt) : null;
                            const unlockedLabel = unlockedAt && !Number.isNaN(unlockedAt.getTime())
                              ? unlockedAt.toLocaleDateString('pt-BR')
                              : null;

                            return (
                              <li
                                key={holder?.id ?? `${holder?.name ?? 'jogador'}-${achievement.name}`}
                                className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {holder?.name ?? 'Jogador'}
                                    {holder?.team?.name && (
                                      <span className="ml-2 text-xs font-medium text-slate-500">
                                        {holder.team.name}
                                      </span>
                                    )}
                                  </p>
                                  {unlockedLabel && (
                                    <p className="text-xs text-slate-500">Conquistado em {unlockedLabel}</p>
                                  )}
                                </div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                                  Nível {holderLevel.level} • {holderLevel.xp} XP
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          Ainda não há jogadores que desbloquearam esta conquista.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      {showEditGameModal && editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Editar partida</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {editingGame.homeTeamName} <span className="text-slate-400">vs</span> {editingGame.awayTeamName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {sportDisplayName} • {editingGame.stage ?? `Rodada ${editingGame.round}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditGameModal}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-8 p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-700">Atualizar placar ({primaryMetricLabel.toLowerCase()})</h4>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Mandante</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{editingGame.homeTeamName}</p>
                      <input
                        type="number"
                        min={0}
                        value={editingHomeScore}
                        onChange={(event) => {
                          const rawValue = Number(event.target.value);
                          setEditingHomeScore(Number.isNaN(rawValue) ? 0 : Math.max(0, rawValue));
                        }}
                        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-2xl font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="hidden items-center justify-center rounded-xl bg-white p-4 shadow-sm md:flex">
                      <span className="text-4xl font-bold text-slate-400">×</span>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Visitante</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{editingGame.awayTeamName}</p>
                      <input
                        type="number"
                        min={0}
                        value={editingAwayScore}
                        onChange={(event) => {
                          const rawValue = Number(event.target.value);
                          setEditingAwayScore(Number.isNaN(rawValue) ? 0 : Math.max(0, rawValue));
                        }}
                        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-2xl font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-700">Situação da partida</h4>
                  <select
                    value={editingStatus}
                    onChange={(event) => setEditingStatus(event.target.value as Game['status'])}
                    className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="scheduled">Agendada</option>
                    <option value="in-progress">Em andamento</option>
                    <option value="finished">Finalizada</option>
                    <option value="postponed">Adiada</option>
                  </select>

                  {(editingGame.date || editingGame.location) && (
                    <div className="mt-4 space-y-1 text-xs text-slate-500">
                      {editingGame.date && (
                        <p>
                          <span className="font-semibold text-slate-600">Data:</span>{' '}
                          {new Date(editingGame.date).toLocaleString('pt-BR')}
                        </p>
                      )}
                      {editingGame.location && (
                        <p>
                          <span className="font-semibold text-slate-600">Local:</span> {editingGame.location}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {supportsGoalEvents ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Eventos da partida</h4>
                      <p className="text-xs text-slate-500">Registre gols, assistências e cartões para construir o histórico da partida.</p>
                    </div>
                    {sortedEditingEvents.length > 0 && (
                      <span className="text-xs font-medium text-slate-500">
                        {sortedEditingEvents.length} evento{sortedEditingEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time do evento</label>
                        <select
                          value={selectedTeamForEvent}
                          onChange={(event) => {
                            const value = event.target.value as 'home' | 'away';
                            setSelectedTeamForEvent(value);
                            setSelectedPlayerId('');
                            setAssistingPlayerId('');
                            setEventMinute('');
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="home">Mandante • {editingGame.homeTeamName}</option>
                          <option value="away">Visitante • {editingGame.awayTeamName}</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de evento</label>
                        <select
                          value={selectedEventType}
                          onChange={(event) => {
                            const value = event.target.value as 'goal' | 'card';
                            setSelectedEventType(value);
                            setAssistingPlayerId('');
                            setEventReason('');
                            if (value === 'card') {
                              setSelectedCardType('yellow');
                            }
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="goal">Gol</option>
                          <option value="card">Cartão</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jogador</label>
                        <select
                          value={selectedPlayerId}
                          onChange={(event) => setSelectedPlayerId(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="">Selecione um jogador</option>
                          {availablePlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                              {formatPlayerLabel(player)}
                            </option>
                          ))}
                        </select>
                        {availablePlayers.length === 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            Cadastre atletas no time escolhido para registrar eventos.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minuto</label>
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={eventMinute}
                          onChange={(event) => setEventMinute(event.target.value)}
                          placeholder="Ex: 42"
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    {selectedEventType === 'goal' ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assistência</label>
                          <select
                            value={assistingPlayerId}
                            onChange={(event) => setAssistingPlayerId(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="">Sem assistência</option>
                            {assistCandidates.map((player) => (
                              <option key={player.id} value={player.id}>
                                {formatPlayerLabel(player)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={addEventToEditingGame}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Adicionar evento
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de cartão</label>
                          <select
                            value={selectedCardType}
                            onChange={(event) => setSelectedCardType(event.target.value as 'yellow' | 'red')}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="yellow">Cartão amarelo</option>
                            <option value="red">Cartão vermelho</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motivo (opcional)</label>
                          <input
                            type="text"
                            value={eventReason}
                            onChange={(event) => setEventReason(event.target.value)}
                            placeholder="Falta dura, reclamação, etc."
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div className="md:col-span-3 flex items-end">
                          <button
                            type="button"
                            onClick={addEventToEditingGame}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Adicionar evento
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-2">
                    {sortedEditingEvents.length === 0 && (
                      <p className="text-xs text-slate-500">Nenhum evento registrado até o momento.</p>
                    )}
                    {sortedEditingEvents.map((event) => {
                      const isGoal = event.type === 'goal';
                      const isCard = event.type === 'card';
                      const teamLabel = event.teamId === editingGame.homeTeamId ? editingGame.homeTeamName : editingGame.awayTeamName;
                      const minuteLabel = typeof event.minute === 'number' ? `${event.minute}'` : null;
                      const playerLabel = getPlayerLabel(event.teamId, event.playerId);
                      const assistLabel = isGoal && 'assistPlayerId' in event && event.assistPlayerId
                        ? getPlayerLabel(event.teamId, event.assistPlayerId)
                        : null;

                      return (
                        <div
                          key={event.id}
                          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                isGoal
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : event.card === 'red'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {isGoal ? 'Gol' : event.card === 'red' ? 'Cartão vermelho' : 'Cartão amarelo'}
                            </span>
                            <span className="font-medium text-slate-900">{teamLabel}</span>
                            {playerLabel !== 'Jogador' && <span className="text-slate-600">• {playerLabel}</span>}
                            {minuteLabel && <span className="text-slate-500">• {minuteLabel}</span>}
                            {assistLabel && <span className="text-slate-500">• Assistência: {assistLabel}</span>}
                            {isCard && event.reason && <span className="text-slate-500">• {event.reason}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEventFromEditingGame(event.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                            Remover
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/20 bg-slate-800/40 backdrop-blur p-6">
                  <h4 className="text-sm font-semibold text-slate-100">Resumo de desempenho</h4>
                  <p className="mt-2 text-sm text-slate-300">
                    Para {sportDisplayName}, utilize o placar para registrar {primaryMetricLabel.toLowerCase()} e adicione detalhes adicionais nas notas da partida ou na súmula oficial.
                  </p>
                  {sortedEditingEvents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {sortedEditingEvents.map((event) => {
                        const teamLabel = event.teamId === editingGame.homeTeamId ? editingGame.homeTeamName : editingGame.awayTeamName;
                        const minuteLabel = typeof event.minute === 'number' ? `${event.minute}'` : null;
                        const playerLabel = getPlayerLabel(event.teamId, event.playerId);
                        return (
                          <div key={event.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                            <span className="font-semibold text-slate-900">{teamLabel}</span>
                            {playerLabel !== 'Jogador' && <span className="text-slate-600"> • {playerLabel}</span>}
                            {minuteLabel && <span className="text-slate-500"> • {minuteLabel}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseEditGameModal}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedGame}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {showRosterModal && selectedTeamRoster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedTeamRoster.logo ? (
                    <img 
                      src={selectedTeamRoster.logo} 
                      alt={selectedTeamRoster.name}
                      className="w-16 h-16 rounded-lg object-cover bg-white p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
                      <UserGroupIcon className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedTeamRoster.name}</h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {selectedTeamRoster.players?.length || 0} jogadores no elenco
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRosterModal(false);
                    setSelectedTeamRoster(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedTeamRoster.players && selectedTeamRoster.players.length > 0 ? (
                <div className="grid gap-4">
                  {selectedTeamRoster.players.map((player) => {
                    const aggregatedStats = playerStatsById.get(player.id);
                    const baseStats: Partial<PlayerStats> =
                      (player.stats as Partial<PlayerStats>) || {};
                    const goals = aggregatedStats?.goals ?? baseStats.goals ?? 0;
                    const assists = aggregatedStats?.assists ?? baseStats.assists ?? 0;
                    const gamesPlayed =
                      aggregatedStats?.games ??
                      baseStats.games ??
                      baseStats.matchesPlayed ??
                      0;
                    const yellowCards = aggregatedStats?.yellowCards ?? baseStats.yellowCards ?? 0;
                    const redCards = aggregatedStats?.redCards ?? baseStats.redCards ?? 0;
                    const hasCards = yellowCards > 0 || redCards > 0;

                    return (
                      <div
                        key={player.id}
                        className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors border border-slate-200"
                      >
                        <div className="flex items-center gap-4">
                          {/* Player Avatar/Number */}
                          <div className="flex-shrink-0">
                            {player.avatar ? (
                              <img
                                src={player.avatar}
                                alt={player.name}
                                className="w-14 h-14 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                                {player.number || '?'}
                              </div>
                            )}
                          </div>

                          {/* Player Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-semibold text-slate-900 truncate">
                                {player.name}
                              </h4>
                              {player.number && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                  #{player.number}
                                </span>
                              )}
                            </div>
                            {player.position && (
                              <p className="text-sm text-slate-600">{player.position}</p>
                            )}
                          </div>

                          {/* Player Stats */}
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <div className="text-lg font-bold text-slate-900">{goals}</div>
                              <div className="text-xs text-slate-500">Gols</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-slate-900">{assists}</div>
                              <div className="text-xs text-slate-500">Assist.</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-slate-900">{gamesPlayed}</div>
                              <div className="text-xs text-slate-500">Jogos</div>
                            </div>
                            {hasCards ? (
                              <div className="text-center">
                                <div className="flex items-center gap-1 justify-center">
                                  {yellowCards ? (
                                    <span className="text-yellow-500 font-bold">{yellowCards}🟨</span>
                                  ) : null}
                                  {redCards ? (
                                    <span className="text-red-500 font-bold">{redCards}🟥</span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-slate-500">Cartões</div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhum jogador cadastrado
                  </h4>
                  <p className="text-slate-600">
                    Este time ainda não possui jogadores no elenco.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowRosterModal(false);
                  setSelectedTeamRoster(null);
                }}
                className="w-full py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Stats Modal */}
      {showTeamStatsModal && selectedTeamStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedTeamStats.logo ? (
                    <img src={selectedTeamStats.logo} alt={selectedTeamStats.name} className="w-14 h-14 rounded-lg object-cover bg-white p-1.5" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center">
                      <UserGroupIcon className="h-7 w-7 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedTeamStats.name}</h3>
                    <p className="text-slate-200/80 text-sm mt-1">Estatísticas do time e dos jogadores</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowTeamStatsModal(false); setSelectedTeamStats(null); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Fechar estatísticas do time"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Summary cards - derived from played games */}
              {(() => {
                const derived = computeTeamStatsFromGames(selectedTeamStats.id);
                const games = Number(derived.games || 0);
                const gf = Number(derived.goalsFor || 0);
                const ga = Number(derived.goalsAgainst || 0);
                const gd = gf - ga;
                const points = Number(derived.points || 0);
                const avg = games > 0 ? (gf / games).toFixed(1) : '0.0';
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Pontos */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Cartão de Pontos">
                      <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-blue-50/90 to-transparent pointer-events-none" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700/80">Pontos</p>
                          <p className="mt-2 text-3xl font-extrabold text-blue-700">{points}</p>
                          <p className="mt-1 text-xs text-slate-500">Classificação</p>
                        </div>
                        <div className="shrink-0 rounded-xl bg-blue-100 p-2 text-blue-700 ring-1 ring-blue-200">
                          <TrophyIcon className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    {/* Jogos */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Cartão de Jogos">
                      <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-emerald-50/90 to-transparent pointer-events-none" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">Jogos</p>
                          <p className="mt-2 text-3xl font-extrabold text-emerald-700">{games}</p>
                          <p className="mt-1 text-xs text-slate-500">Disputados</p>
                        </div>
                        <div className="shrink-0 rounded-xl bg-emerald-100 p-2 text-emerald-700 ring-1 ring-emerald-200">
                          <CalendarIcon className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    {/* Média */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Cartão de Média de Gols por Jogo">
                      <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-amber-50/90 to-transparent pointer-events-none" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">Média de Gols/Jogo</p>
                          <p className="mt-2 text-3xl font-extrabold text-amber-700">{avg}</p>
                          <p className="mt-1 text-xs text-slate-500">Produção ofensiva</p>
                        </div>
                        <div className="shrink-0 rounded-xl bg-amber-100 p-2 text-amber-700 ring-1 ring-amber-200">
                          <ChartBarIcon className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    {/* Saldo */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" aria-label="Cartão de Saldo de Gols">
                      <div className="absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-50/90 to-transparent pointer-events-none" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700/80">Saldo de Gols</p>
                          <p className={`mt-2 text-3xl font-extrabold ${gd >= 0 ? 'text-violet-700' : 'text-rose-700'}`}>{gd}</p>
                          <p className="mt-1 text-xs text-slate-500"><span className="font-medium text-slate-700">{gf}</span> pró • <span className="font-medium text-slate-700">{ga}</span> contra</p>
                        </div>
                        <div className={`shrink-0 rounded-xl p-2 ring-1 ${gd >= 0 ? 'bg-violet-100 text-violet-700 ring-violet-200' : 'bg-rose-100 text-rose-700 ring-rose-200'}`}>
                          <ArrowTrendingUpIcon className={`h-6 w-6 ${gd >= 0 ? '' : 'rotate-180'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* W/D/L - derived from played games */}
                {(() => {
                  const s = computeTeamStatsFromGames(selectedTeamStats.id);
                  const wins = Number(s.wins || 0);
                  const draws = Number(s.draws || 0);
                  const losses = Number(s.losses || 0);
                  const total = wins + draws + losses || 1;
                  const pct = (n:number)=> Math.round((n/total)*100);
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-6">
                      <h4 className="mb-4 text-lg font-semibold text-slate-900">Resultados</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm"><span className="text-slate-700">Vitórias</span><span className="font-semibold text-emerald-700">{wins} ({pct(wins)}%)</span></div>
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200"><div className="h-2 rounded-full bg-emerald-500" style={{width:`${pct(wins)}%`}}/></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm"><span className="text-slate-700">Empates</span><span className="font-semibold text-slate-700">{draws} ({pct(draws)}%)</span></div>
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200"><div className="h-2 rounded-full bg-slate-500" style={{width:`${pct(draws)}%`}}/></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm"><span className="text-slate-700">Derrotas</span><span className="font-semibold text-rose-700">{losses} ({pct(losses)}%)</span></div>
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200"><div className="h-2 rounded-full bg-rose-500" style={{width:`${pct(losses)}%`}}/></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Top players */}
                {(() => {
                  const players = (selectedTeamStats.players || []) as any[];
                  const byGoals = [...players].sort((a,b)=> (b.stats?.goals||0) - (a.stats?.goals||0)).slice(0,5);
                  const byAssists = [...players].sort((a,b)=> (b.stats?.assists||0) - (a.stats?.assists||0)).slice(0,5);
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-6">
                      <h4 className="mb-4 text-lg font-semibold text-slate-900">Destaques</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="mb-2 text-sm font-semibold text-slate-700">Artilheiros</h5>
                          <div className="space-y-2">
                            {byGoals.length ? byGoals.map((p,idx)=> (
                              <div key={p.id} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs text-slate-500 w-5">{idx+1}º</span>
                                  <span className="truncate font-medium text-slate-900">{p.name}</span>
                                </div>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-sm font-semibold text-blue-700">{p.stats?.goals||0} G</span>
                              </div>
                            )) : <p className="text-sm text-slate-500">Sem gols ainda</p>}
                          </div>
                        </div>
                        <div>
                          <h5 className="mb-2 text-sm font-semibold text-slate-700">Garçons</h5>
                          <div className="space-y-2">
                            {byAssists.length ? byAssists.map((p,idx)=> (
                              <div key={p.id} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs text-slate-500 w-5">{idx+1}º</span>
                                  <span className="truncate font-medium text-slate-900">{p.name}</span>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-700">{p.stats?.assists||0} A</span>
                              </div>
                            )) : <p className="text-sm text-slate-500">Sem assistências ainda</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Players table */}
              <div className="mt-6 rounded-lg border border-slate-200 bg-white">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800">Elenco e estatísticas</h4>
                </div>
                <div className="p-2 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="px-3 py-2 font-medium">Jogador</th>
                        <th className="px-3 py-2 font-medium">Jogos</th>
                        <th className="px-3 py-2 font-medium">Gols</th>
                        <th className="px-3 py-2 font-medium">Assist.</th>
                        <th className="px-3 py-2 font-medium">Cartões</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((selectedTeamStats.players || []) as any[]).map((p:any)=> (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">#{p.number || '?'}</span>
                              <span className="font-medium text-slate-900">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">{p.stats?.games || 0}</td>
                          <td className="px-3 py-2">{p.stats?.goals || 0}</td>
                          <td className="px-3 py-2">{p.stats?.assists || 0}</td>
                          <td className="px-3 py-2">
                            {(p.stats?.yellowCards || 0) > 0 && (<span className="mr-2 text-yellow-600">{p.stats.yellowCards}🟨</span>)}
                            {(p.stats?.redCards || 0) > 0 && (<span className="text-rose-600">{p.stats.redCards}🟥</span>)}
                            {(p.stats?.yellowCards || 0) + (p.stats?.redCards || 0) === 0 && (<span className="text-slate-500">—</span>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => { setShowTeamStatsModal(false); setSelectedTeamStats(null); }}
                className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {/* Global confirm modal is mounted in App; no page-scoped delete modal needed */}

      {/* Match Generator Modal */}
      <MatchGenerator
        isOpen={showMatchGenerator}
        onClose={() => setShowMatchGenerator(false)}
        teams={championship.teams || []}
        onGenerate={handleGenerateMatches}
      />
    </div>
    </div>
  );
}
