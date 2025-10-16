import { useCallback, useEffect, useMemo, useState } from 'react';
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
  TrashIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore.ts';
import { toast } from 'react-hot-toast';
import type {
  Championship,
  Game,
  GameStatus,
  MatchEvent,
  Player,
  SportDefinition,
  Team,
  TournamentFormat,
} from '../types/index.ts';
import {
  DEFAULT_SPORT_ID,
  SPORTS_CATALOG,
  getSportDefinition,
  getSportDisplayName,
  getSportIcon,
} from '../config/sportsCatalog.ts';

type SupportedTournamentFormat = Extract<
  TournamentFormat,
  'groupStageKnockout' | 'league' | 'knockout'
>;

type ChampionshipDetailTab = 'overview' | 'teams' | 'games' | 'stats';

const TAB_ITEMS: ReadonlyArray<{ id: ChampionshipDetailTab; label: string; icon: typeof TrophyIcon }> = [
  { id: 'overview', label: 'Visão Geral', icon: TrophyIcon },
  { id: 'teams', label: 'Times', icon: UserGroupIcon },
  { id: 'games', label: 'Partidas', icon: CalendarIcon },
  { id: 'stats', label: 'Estatísticas', icon: ChartBarIcon },
];

const GAME_STATUS_META: Record<GameStatus, { label: string; className: string }> = {
  finished: { label: 'Finalizado', className: 'bg-green-100 text-green-700' },
  'in-progress': { label: 'Em andamento', className: 'bg-blue-100 text-blue-700' },
  postponed: { label: 'Adiada', className: 'bg-amber-100 text-amber-700' },
  scheduled: { label: 'Agendada', className: 'bg-slate-100 text-slate-600' },
  pending: { label: 'Agendada', className: 'bg-slate-100 text-slate-600' },
};

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
      secondaryMetrics:
        override.scoring?.secondaryMetrics ?? base.scoring.secondaryMetrics,
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
    performanceMetrics:
      override.performanceMetrics ?? base.performanceMetrics,
  };
};

const mapStoredFormatToTournament = (format?: string): SupportedTournamentFormat => {
  if (format === 'groupStageKnockout') return 'groupStageKnockout';
  if (format === 'knockout') return 'knockout';
  return 'league';
};

const isPowerOfTwo = (value: number) => value > 0 && (value & (value - 1)) === 0;

const getKnockoutStageLabel = (teamCount: number) => {
  if (teamCount <= 2) return 'Final';
  if (teamCount === 4) return 'Semifinais';
  if (teamCount === 8) return 'Quartas de Final';
  if (teamCount === 16) return 'Oitavas de Final';
  if (teamCount === 32) return '16-avos de Final';
  return 'Fase Eliminatória';
};

const createGameId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const createEventId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export default function ChampionshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { championships, setCurrentChampionship, deleteChampionship, updateChampionship, updateGame } = useChampionshipStore();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [activeTab, setActiveTab] = useState<ChampionshipDetailTab>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Estados para criação de time
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamPlayers, setTeamPlayers] = useState<Array<{ name: string; number: string; position: string; avatar?: string }>>([]);
  const [currentPlayer, setCurrentPlayer] = useState({ name: '', number: '', position: 'Atacante', avatar: '' });

  // Estados para criação de partidas
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameMode, setGameMode] = useState<'manual' | 'auto'>('manual');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameLocation, setGameLocation] = useState('');
  const [gameRound, setGameRound] = useState(1);
  const [tournamentFormat, setTournamentFormat] = useState<SupportedTournamentFormat>('league');
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingHomeScore, setEditingHomeScore] = useState<number>(0);
  const [editingAwayScore, setEditingAwayScore] = useState<number>(0);
  const [editingStatus, setEditingStatus] = useState<GameStatus>('scheduled');
  const [editingEvents, setEditingEvents] = useState<MatchEvent[]>([]);
  const [selectedTeamForEvent, setSelectedTeamForEvent] = useState<'home' | 'away'>('home');
  const [selectedEventType, setSelectedEventType] = useState<'goal' | 'card'>('goal');
  const [selectedCardType, setSelectedCardType] = useState<'yellow' | 'red'>('yellow');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [assistingPlayerId, setAssistingPlayerId] = useState<string>('');
  const [eventMinute, setEventMinute] = useState<string>('');
  const [eventReason, setEventReason] = useState<string>('');

  useEffect(() => {
    if (id) {
      const found = championships.find(c => c.id === id);
      if (found) {
        setChampionship(found);
        setCurrentChampionship(found);
      } else {
        navigate('/championships');
      }
    }
  }, [id, championships, navigate, setCurrentChampionship]);

  useEffect(() => {
    if (!championship?.format) {
      return;
    }
    setTournamentFormat(mapStoredFormatToTournament(championship.format as string));
  }, [championship?.format]);

  const teamCount = championship?.teams?.length ?? 0;
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
  const allowsDrawLabel = sportDefinition?.scoring.allowsDraw ? 'Empates permitidos' : 'Sem empates';

  const outcomePointsSummary = useMemo(() => {
    const outcomePoints = sportDefinition?.scoring.outcomePoints;
    if (!sportDefinition || !outcomePoints) {
      return null;
    }
    const win = outcomePoints.win;
    const draw = outcomePoints.draw ?? (sportDefinition.scoring.allowsDraw ? 1 : 0);
    const loss = outcomePoints.loss ?? 0;
    return `${win}/${draw}/${loss} pontos (V/E/D)`;
  }, [sportDefinition]);

  const matchFormatSummary = useMemo(() => {
    if (!sportDefinition) return null;
    const format = sportDefinition.matchFormat;
    if (format.durationType === 'time' && format.regulationPeriods?.length) {
      const totalMinutes = format.regulationPeriods.reduce<number>(
        (accumulator, period) => accumulator + period.minutes,
        0
      );
      return `${format.regulationPeriods.length} períodos • ${totalMinutes} minutos regulamentares`;
    }
    if (format.durationType === 'sets' && format.sets) {
      return `Melhor de ${format.sets.bestOf} sets • ${format.sets.pointsToWin} pontos para vencer`;
    }
    if (format.durationType === 'rounds' && format.rounds) {
      return `${format.rounds.count} rounds de ${format.rounds.durationMinutes ?? 5} minutos`;
    }
    if (format.durationType === 'distance' && format.distanceTargetMeters) {
      return `Meta de ${format.distanceTargetMeters} metros`;
    }
    return format.notes ?? 'Formato personalizado';
  }, [sportDefinition]);

  const recommendedFormatsSummary = useMemo(() => {
    if (!sportDefinition?.competitionStructure) return null;
    const formatLabelMap: Record<string, string> = {
      league: 'Pontos corridos',
      groupStageKnockout: 'Fase de grupos + mata-mata',
      knockout: 'Mata-mata',
      heats: 'Baterias',
      timeTrial: 'Contra o tempo',
    };
    return sportDefinition.competitionStructure.recommendedFormats
      .map((format: TournamentFormat) => formatLabelMap[format] ?? 'Formato personalizado')
      .join(', ');
  }, [sportDefinition]);

  const teamsById = useMemo(() => {
    const map = new Map<string, Team>();
    (championship?.teams ?? []).forEach((team: Team) => {
      map.set(team.id, team);
    });
    return map;
  }, [championship?.teams]);

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
    if (!editingGame) {
      return;
    }

    const teamId = selectedTeamForEvent === 'home' ? editingGame.homeTeamId : editingGame.awayTeamId;
    if (!teamId) {
      toast.error('Selecione um time válido para o evento.');
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

  const handleOpenEditGameModal = useCallback(
    (game: Game) => {
      setEditingGame(game);
      setEditingHomeScore(game.homeScore ?? 0);
      setEditingAwayScore(game.awayScore ?? 0);
      setEditingStatus(game.status ?? 'scheduled');
      setEditingEvents(game.events ?? []);
      setSelectedTeamForEvent('home');
      resetEventForm();
      setSelectedEventType('goal');
      setSelectedCardType('yellow');
      setShowEditGameModal(true);
    },
    [resetEventForm]
  );

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

  if (!championship) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (!championship) {
      return;
    }
    deleteChampionship(championship.id);
    toast.success('Campeonato excluído com sucesso');
    navigate('/championships');
  };

  const handleTeamLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    setTeamPlayers(teamPlayers.filter((_, i) => i !== index));
    toast.success('Jogador removido');
  };

  const handleCreateTeam = () => {
    if (!championship) {
      return;
    }
    if (!teamName.trim()) {
      toast.error('Digite o nome do time');
      return;
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      name: teamName,
      logo: teamLogo,
      championshipId: championship.id,
      players: teamPlayers.map(p => ({
        id: Date.now().toString() + Math.random(),
        name: p.name,
        number: parseInt(p.number),
        position: p.position,
        avatar: p.avatar,
        teamId: Date.now().toString(),
        stats: {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          matchesPlayed: 0,
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        },
        achievements: [],
        xp: 0,
        level: 1,
      })),
      stats: {
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        games: 0,
        position: 0,
      },
    };

  const updatedTeams: Team[] = [...championship.teams, newTeam];
    updateChampionship(championship.id, { teams: updatedTeams });
    setChampionship({ ...championship, teams: updatedTeams });

    // Reset form
    setTeamName('');
    setTeamLogo('');
    setTeamPlayers([]);
    setCurrentPlayer({ name: '', number: '', position: 'Atacante', avatar: '' });
    setShowTeamForm(false);
    toast.success('Time criado com sucesso!');
  };

  const handleCreateManualGame = () => {
    if (!championship) {
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      toast.error('Selecione os dois times');
      return;
    }
    if (homeTeamId === awayTeamId) {
      toast.error('Selecione times diferentes');
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
    };

    const updatedGames: Game[] = [...(championship.games ?? []), newGame];
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });

    // Reset
    setHomeTeamId('');
    setAwayTeamId('');
    setGameDate('');
    setGameLocation('');
    toast.success('Partida criada com sucesso!');
  };

  const handleGenerateLeague = () => {
    if (!championship) {
      return;
    }
    const teams = championship.teams ?? [];
    if (teams.length < 2) {
      toast.error('É necessário pelo menos 2 times');
      return;
    }

    const games: Game[] = [];
    const matchesPerRound = Math.floor(teams.length / 2) || 1;

    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams.length; j++) {
        if (i === j) continue;
        const matchNumber = games.length + 1;
        const round = Math.ceil(matchNumber / matchesPerRound) || 1;

        games.push({
          id: createGameId(),
          championshipId: championship.id,
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          homeTeamName: teams[i].name,
          awayTeamName: teams[j].name,
          homeScore: 0,
          awayScore: 0,
          status: 'scheduled',
          round,
        });
      }
    }

    const updatedGames: Game[] = [...(championship.games ?? []), ...games];
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });
    setShowGameForm(false);
    toast.success(`${games.length} partidas geradas!`);
  };

  const handleGenerateGroupStageKnockout = () => {
    if (!championship) {
      return;
    }
    const teams = championship.teams ?? [];
    if (teams.length < 8) {
      toast.error('É necessário pelo menos 8 times para fase de grupos com mata-mata.');
      return;
    }

    const groupSize = 4;
    if (teams.length % groupSize !== 0) {
      toast.error('Número de times deve ser múltiplo de 4 para formar grupos equilibrados.');
      return;
    }

    const groupCount = teams.length / groupSize;
    if (!isPowerOfTwo(groupCount)) {
      toast.error('Quantidade de grupos deve permitir um mata-mata com 4, 8 ou 16 equipes. Ajuste o número de times.');
      return;
    }

    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    const groups: Team[][] = Array.from({ length: groupCount }, () => []);

    shuffledTeams.forEach((team, index) => {
      groups[index % groupCount]?.push(team);
    });

    const groupGames: Game[] = [];
    groups.forEach((group, groupIndex) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          groupGames.push({
            id: createGameId(),
            championshipId: championship.id,
            homeTeamId: group[i].id,
            awayTeamId: group[j].id,
            homeTeamName: group[i].name,
            awayTeamName: group[j].name,
            homeScore: 0,
            awayScore: 0,
            status: 'scheduled',
            round: groupGames.length + 1,
            stage: `Fase de Grupos - Grupo ${String.fromCharCode(65 + groupIndex)}`,
          });
        }
      }
    });

    const knockoutParticipants = groups.flatMap((group) => group.slice(0, 2));
    const totalKnockoutTeams = knockoutParticipants.length;
    if (!isPowerOfTwo(totalKnockoutTeams)) {
      toast.error('Não foi possível montar o mata-mata automaticamente. Ajuste os times ou os grupos.');
      return;
    }

    const knockoutGames: Game[] = [];
    for (let i = 0; i < groups.length; i += 2) {
      const groupA = groups[i];
      const groupB = groups[i + 1];

      if (!groupA || !groupB || groupA.length < 2 || groupB.length < 2) {
        continue;
      }

      const pairings: Array<[Team, Team]> = [
        [groupA[0], groupB[1]],
        [groupB[0], groupA[1]],
      ];

      pairings.forEach(([home, away]) => {
        if (!home || !away) return;
        knockoutGames.push({
          id: createGameId(),
          championshipId: championship.id,
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeTeamName: home.name,
          awayTeamName: away.name,
          homeScore: 0,
          awayScore: 0,
          status: 'scheduled',
          round: 1,
          stage: getKnockoutStageLabel(totalKnockoutTeams),
        });
      });
    }

    const generatedGames: Game[] = [...groupGames, ...knockoutGames];
    const updatedGames: Game[] = [...(championship.games ?? []), ...generatedGames];
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });
    setShowGameForm(false);
    toast.success(`${generatedGames.length} partidas geradas (grupos + mata-mata)!`);
  };

  const handleGenerateKnockout = () => {
    if (!championship) {
      return;
    }
    const teams = championship.teams ?? [];
    if (teams.length < 2) {
      toast.error('É necessário pelo menos 2 times');
      return;
    }

    if (!isPowerOfTwo(teams.length)) {
      toast.error('Para mata-mata, o número de times deve ser 2, 4, 8, 16, etc.');
      return;
    }

    const games: Game[] = [];
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledTeams.length; i += 2) {
      const home = shuffledTeams[i];
      const away = shuffledTeams[i + 1];
      if (!home || !away) continue;

      games.push({
        id: createGameId(),
        championshipId: championship.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeTeamName: home.name,
        awayTeamName: away.name,
        homeScore: 0,
        awayScore: 0,
        status: 'scheduled',
        round: 1,
        stage: getKnockoutStageLabel(teams.length),
      });
    }

    const updatedGames: Game[] = [...(championship.games ?? []), ...games];
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });
    setShowGameForm(false);
    toast.success(`${games.length} partidas geradas!`);
  };

  const handleDeleteGame = (gameId: string) => {
    if (!championship) {
      return;
    }
    const updatedGames = championship.games.filter((g) => g.id !== gameId);
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });
    toast.success('Partida excluída');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/championships"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>{sportIcon}</span>
                  {championship.name}
                </h1>
                <p className="text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {sportDisplayName}
                  </span>
                  {championship.format && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      <TrophyIcon className="h-3.5 w-3.5" />
                      {championship.format}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Excluir Campeonato
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Times</p>
                <p className="text-2xl font-bold text-slate-900">{championship.teams?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Partidas</p>
                <p className="text-2xl font-bold text-slate-900">{championship.games?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <UsersIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Jogadores</p>
                <p className="text-2xl font-bold text-slate-900">
                  {championship.teams.reduce<number>(
                    (accumulator, team) => accumulator + team.players.length,
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <p className="text-lg font-semibold text-slate-900">{championship.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Informações do Campeonato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                      <MapPinIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-600">Local</p>
                        <p className="text-slate-900">{championship.location || 'Não especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-600">Período</p>
                        <p className="text-slate-900">
                          {championship.startDate ? new Date(championship.startDate).toLocaleDateString('pt-BR') : 'Não definido'}
                          {championship.endDate && ` - ${new Date(championship.endDate).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {championship.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Descrição</h3>
                    <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">{championship.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div>
                {!showTeamForm && (
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Times Cadastrados ({championship.teams?.length || 0})
                    </h3>
                    <button
                      onClick={() => setShowTeamForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Novo Time
                    </button>
                  </div>
                )}

                {/* Team Form */}
                {showTeamForm && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">Cadastrar Novo Time</h3>
                      <button
                        onClick={() => setShowTeamForm(false)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-slate-600" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Team Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nome do Time *
                          </label>
                          <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Digite o nome do time"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Logo do Time
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleTeamLogoUpload}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {teamLogo && (
                            <div className="mt-2 flex items-center gap-2">
                              <img src={teamLogo} alt="Logo" className="h-12 w-12 object-cover rounded" />
                              <button
                                onClick={() => setTeamLogo('')}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remover
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Players */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 mb-3">Jogadores</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <input
                            type="text"
                            value={currentPlayer.name}
                            onChange={(e) => setCurrentPlayer({ ...currentPlayer, name: e.target.value })}
                            placeholder="Nome do jogador"
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={currentPlayer.number}
                            onChange={(e) => setCurrentPlayer({ ...currentPlayer, number: e.target.value })}
                            placeholder="Número"
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <select
                            value={currentPlayer.position}
                            onChange={(e) => setCurrentPlayer({ ...currentPlayer, position: e.target.value })}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option>Goleiro</option>
                            <option>Defensor</option>
                            <option>Meio-campo</option>
                            <option>Atacante</option>
                          </select>
                          <button
                            onClick={handleAddPlayer}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Adicionar
                          </button>
                        </div>

                        {/* Player Avatar */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Foto do Jogador
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePlayerAvatarUpload}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {currentPlayer.avatar && (
                            <div className="mt-2 flex items-center gap-2">
                              <img src={currentPlayer.avatar} alt="Avatar" className="h-12 w-12 object-cover rounded-full" />
                              <button
                                onClick={() => setCurrentPlayer({ ...currentPlayer, avatar: '' })}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remover
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Players List */}
                        {teamPlayers.length > 0 && (
                          <div className="space-y-2">
                            {teamPlayers.map((player, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3">
                                  {player.avatar && (
                                    <img src={player.avatar} alt={player.name} className="h-10 w-10 object-cover rounded-full" />
                                  )}
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      #{player.number} {player.name}
                                    </p>
                                    <p className="text-sm text-slate-600">{player.position}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemovePlayer(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleCreateTeam}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Criar Time
                      </button>
                    </div>
                  </div>
                )}

                {/* Teams Grid */}
                {!showTeamForm && championship.teams?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {championship.teams.map((team) => (
                      <div key={team.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="h-12 w-12 object-cover rounded" />
                          ) : (
                            <div className="h-12 w-12 bg-slate-100 rounded flex items-center justify-center">
                              <UserGroupIcon className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-slate-900">{team.name}</h4>
                            <p className="text-sm text-slate-600">{team.players?.length || 0} jogadores</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="bg-slate-50 rounded p-2">
                            <p className="text-slate-600">V</p>
                            <p className="font-semibold text-slate-900">{team.stats?.wins || 0}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2">
                            <p className="text-slate-600">E</p>
                            <p className="font-semibold text-slate-900">{team.stats?.draws || 0}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2">
                            <p className="text-slate-600">D</p>
                            <p className="font-semibold text-slate-900">{team.stats?.losses || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showTeamForm && (!championship.teams || championship.teams.length === 0) && (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                    <UserGroupIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum time cadastrado</h3>
                    <p className="text-sm text-slate-600 mb-6">Comece criando o primeiro time do campeonato</p>
                    <button
                      onClick={() => setShowTeamForm(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Criar Primeiro Time
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Games Tab */}
            {activeTab === 'games' && (
              <div>
                {!showGameForm && (
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Gestão de Partidas ({championship.games?.length || 0})
                    </h3>
                    <button
                      onClick={() => setShowGameForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Nova Partida
                    </button>
                  </div>
                )}

                {/* Game Form */}
                {showGameForm && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Cadastrar Partidas</h3>
                        <p className="text-sm text-slate-600 mt-1">Escolha o método de cadastro</p>
                      </div>
                      <button
                        onClick={() => setShowGameForm(false)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-slate-600" />
                      </button>
                    </div>

                    {/* Mode Selector */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Método de Cadastro
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => setGameMode('manual')}
                          className={`p-4 rounded-lg border-2 transition-colors text-left ${
                            gameMode === 'manual'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <PencilSquareIcon className={`h-5 w-5 mt-0.5 ${
                              gameMode === 'manual' ? 'text-blue-600' : 'text-slate-400'
                            }`} />
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-1">Manual</h5>
                              <p className="text-sm text-slate-600">Cadastre partidas individualmente</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setGameMode('auto')}
                          className={`p-4 rounded-lg border-2 transition-colors text-left ${
                            gameMode === 'auto'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <CalendarIcon className={`h-5 w-5 mt-0.5 ${
                              gameMode === 'auto' ? 'text-blue-600' : 'text-slate-400'
                            }`} />
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-1">Automático</h5>
                              <p className="text-sm text-slate-600">Gere tabela completa automaticamente</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Manual Mode */}
                    {gameMode === 'manual' && (
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-sm font-medium text-slate-900 mb-4">
                          Dados da Partida
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Time da Casa *
                            </label>
                            <select
                              value={homeTeamId}
                              onChange={(e) => setHomeTeamId(e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Selecione o time</option>
                              {championship.teams?.map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Time Visitante *
                            </label>
                            <select
                              value={awayTeamId}
                              onChange={(e) => setAwayTeamId(e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Selecione o time</option>
                              {championship.teams?.map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Rodada
                            </label>
                            <input
                              type="number"
                              value={gameRound}
                              onChange={(e) => setGameRound(parseInt(e.target.value))}
                              min="1"
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Data e Hora
                            </label>
                            <input
                              type="datetime-local"
                              value={gameDate}
                              onChange={(e) => setGameDate(e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Local da Partida
                            </label>
                            <input
                              type="text"
                              value={gameLocation}
                              onChange={(e) => setGameLocation(e.target.value)}
                              placeholder="Ex: Estádio Municipal, Ginásio ABC..."
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleCreateManualGame}
                          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                        >
                          Cadastrar Partida
                        </button>
                      </div>
                    )}

                    {/* Auto Mode */}
                    {gameMode === 'auto' && (
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-sm font-medium text-slate-900 mb-4">
                          Formato da Competição
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <button
                            onClick={() => setTournamentFormat('groupStageKnockout')}
                            className={`p-4 rounded-lg border-2 transition-colors text-left ${
                              tournamentFormat === 'groupStageKnockout'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <h5 className="font-semibold text-slate-900 mb-2">Fase de Grupos + Mata-mata</h5>
                            <p className="text-sm text-slate-600 mb-3">Grupos equilibrados com classificação para eliminatória</p>
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>• Grupos de 4 times</div>
                              <div>• Dois melhores avançam</div>
                              <div>• Mata-mata final</div>
                            </div>
                          </button>
                          <button
                            onClick={() => setTournamentFormat('league')}
                            className={`p-4 rounded-lg border-2 transition-colors text-left ${
                              tournamentFormat === 'league'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <h5 className="font-semibold text-slate-900 mb-2">Pontos Corridos</h5>
                            <p className="text-sm text-slate-600 mb-3">Sistema em que todos jogam entre si</p>
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>• {teamCount} times</div>
                              <div>• {teamCount * Math.max(0, teamCount - 1)} partidas</div>
                            </div>
                          </button>
                          <button
                            onClick={() => setTournamentFormat('knockout')}
                            className={`p-4 rounded-lg border-2 transition-colors text-left ${
                              tournamentFormat === 'knockout'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <h5 className="font-semibold text-slate-900 mb-2">Somente Mata-mata</h5>
                            <p className="text-sm text-slate-600 mb-3">Eliminação direta até a final</p>
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>• Requer 2, 4, 8, 16... times</div>
                              <div>• Sorteio automático</div>
                            </div>
                          </button>
                        </div>
                        {tournamentFormat === 'groupStageKnockout' && (
                          <button
                            onClick={handleGenerateGroupStageKnockout}
                            disabled={teamCount < 8}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            Gerar Grupos e Mata-mata
                          </button>
                        )}
                        {tournamentFormat === 'league' && (
                          <button
                            onClick={handleGenerateLeague}
                            disabled={teamCount < 2}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            Gerar Tabela Completa ({teamCount * Math.max(0, teamCount - 1)} partidas)
                          </button>
                        )}
                        {tournamentFormat === 'knockout' && (
                          <button
                            onClick={handleGenerateKnockout}
                            disabled={teamCount < 2}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            Gerar Chaveamento ({Math.floor(teamCount / 2)} partidas iniciais)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Games List */}
                {!showGameForm && championship.games?.length > 0 && (
                  <div className="space-y-3">
                    {championship.games.map((game: Game, index: number) => (
                      <div key={index} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                Rodada {game.round}
                              </span>
                              {game.stage && (
                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                  {game.stage}
                                </span>
                              )}
                            </div>
                            {(() => {
                              const statusMeta = GAME_STATUS_META[game.status] ?? GAME_STATUS_META.scheduled;
                              return (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-3 py-1 rounded text-xs font-medium ${statusMeta.className}`}
                                  >
                                    {statusMeta.label}
                                  </span>
                                  <button
                                    onClick={() => handleOpenEditGameModal(game)}
                                    className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                                    title="Editar partida"
                                  >
                                    <PencilSquareIcon className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGame(game.id)}
                                    className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                    title="Excluir partida"
                                  >
                                    <TrashIcon className="h-4 w-4 text-slate-400 hover:text-red-600" />
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 mb-1">{game.homeTeamName}</p>
                              <p className="text-3xl font-bold text-slate-900">{game.homeScore || 0}</p>
                              <p className="text-xs text-slate-500 mt-1">{primaryMetricLabel}</p>
                            </div>
                            <div className="px-6">
                              <span className="text-lg font-medium text-slate-400">×</span>
                            </div>
                            <div className="flex-1 text-right">
                              <p className="font-semibold text-slate-900 mb-1">{game.awayTeamName}</p>
                              <p className="text-3xl font-bold text-slate-900">{game.awayScore || 0}</p>
                              <p className="text-xs text-slate-500 mt-1">{primaryMetricLabel}</p>
                            </div>
                          </div>

                          {(game.date || game.location) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3 text-sm text-slate-600">
                              {game.date && (
                                <div className="flex items-center gap-1.5">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>{new Date(game.date).toLocaleString('pt-BR')}</span>
                                </div>
                              )}
                              {game.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPinIcon className="h-4 w-4" />
                                  <span>{game.location}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!showGameForm && (!championship.games || championship.games.length === 0) && (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                    <CalendarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma partida cadastrada</h3>
                    <p className="text-sm text-slate-600 mb-6">Cadastre partidas individualmente ou gere uma tabela completa</p>
                    {(!championship.teams || championship.teams.length < 2) && (
                      <p className="text-sm text-orange-600 mb-6">
                        É necessário cadastrar pelo menos 2 times antes de criar partidas
                      </p>
                    )}
                    <button
                      onClick={() => setShowGameForm(true)}
                      disabled={!championship.teams || championship.teams.length < 2}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Cadastrar Partidas
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Métrica principal</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{primaryMetricLabel}</p>
                    <p className="mt-1 text-sm text-slate-600">{allowsDrawLabel}</p>
                    {outcomePointsSummary && (
                      <p className="mt-2 text-xs text-slate-500">Pontuação padrão: {outcomePointsSummary}</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formato de partida</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{matchFormatSummary ?? 'Formato personalizado'}</p>
                    {sportDefinition?.matchFormat.notes && (
                      <p className="mt-2 text-xs text-slate-500">{sportDefinition.matchFormat.notes}</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formatos recomendados</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {recommendedFormatsSummary ?? 'Configuração livre'}
                    </p>
                    {sportDefinition?.competitionStructure?.notes && (
                      <p className="mt-2 text-xs text-slate-500">{sportDefinition.competitionStructure.notes}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">Análises avançadas a caminho</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Em breve você poderá acompanhar gráficos de tendência, rankings individuais e comparativos entre equipes para {sportDisplayName}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <h4 className="text-sm font-semibold text-slate-900">Resumo de desempenho</h4>
                  <p className="mt-2 text-sm text-slate-600">
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Excluir Campeonato</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir o campeonato <span className="font-semibold text-slate-900">"{championship?.name}"</span>? 
              Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
