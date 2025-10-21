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
  PencilIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore.ts';
import { useMatchEditor } from '../store/matchEditorStore';
import { toast } from 'react-hot-toast';
import MatchGenerator from '../components/MatchGenerator.tsx';
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
  formatParticipantLabel,
  getSportActionLabel,
  isTeamSport,
} from '../config/sportsCatalog.ts';

type SupportedTournamentFormat = Extract<
  TournamentFormat,
  'groupStageKnockout' | 'league' | 'knockout'
>;

type ChampionshipDetailTab = 'overview' | 'teams' | 'games' | 'stats';

const getTabItems = (sportId?: string): ReadonlyArray<{ id: ChampionshipDetailTab; label: string; icon: typeof TrophyIcon }> => {
  const participantLabel = formatParticipantLabel(sportId || '');
  return [
    { id: 'overview', label: 'Visão Geral', icon: TrophyIcon },
    { id: 'teams', label: participantLabel, icon: UserGroupIcon },
    { id: 'games', label: 'Partidas', icon: CalendarIcon },
    { id: 'stats', label: 'Estatísticas', icon: ChartBarIcon },
  ];
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
  const { createMatch } = useMatchEditor();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [activeTab, setActiveTab] = useState<ChampionshipDetailTab>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Estados para criação de time
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamPlayers, setTeamPlayers] = useState<Array<{ name: string; number: string; position: string; avatar?: string }>>([]);
  const [currentPlayer, setCurrentPlayer] = useState({ name: '', number: '', position: 'Atacante', avatar: '' });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Estados para criação de partidas
  const [showGameForm, setShowGameForm] = useState(false);
  const [showMatchGenerator, setShowMatchGenerator] = useState(false);
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
    // Se estamos editando, usa a função de salvar edição
    if (editingTeam) {
      handleSaveEditedTeam();
      return;
    }

    if (!championship) {
      return;
    }
    if (!teamName.trim()) {
      toast.error(isTeamSport(championship.sport) ? 'Digite o nome do time' : 'Digite o nome do jogador');
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

  const handleDeleteGame = (gameId: string) => {
    if (!championship) {
      return;
    }
    const updatedGames = championship.games.filter((g) => g.id !== gameId);
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });
    toast.success('Partida excluída');
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!championship) {
      return;
    }
    // Verificar se o time está em alguma partida
    const teamInGames = championship.games.some(
      g => g.homeTeamId === teamId || g.awayTeamId === teamId
    );
    
    if (teamInGames) {
      toast.error('Não é possível excluir um time que está em partidas agendadas');
      return;
    }

    const updatedTeams = championship.teams.filter((t) => t.id !== teamId);
    updateChampionship(championship.id, { teams: updatedTeams });
    setChampionship({ ...championship, teams: updatedTeams });
    toast.success('Time excluído');
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

  const handleSaveEditedTeam = () => {
    if (!championship || !editingTeam) {
      return;
    }

    if (!teamName.trim()) {
      toast.error('Digite o nome do time');
      return;
    }

    if (teamPlayers.length === 0) {
      toast.error('Adicione pelo menos um jogador');
      return;
    }

    const updatedTeam: Team = {
      ...editingTeam,
      name: teamName,
      logo: teamLogo,
      players: teamPlayers.map((p, i) => ({
        id: editingTeam.players[i]?.id || `player-${Date.now()}-${i}`,
        name: p.name,
        teamId: editingTeam.id,
        number: Number(p.number),
        position: p.position,
        avatar: p.avatar,
        stats: editingTeam.players[i]?.stats || {
          games: 0,
          goals: 0,
          assists: 0,
          wins: 0,
          losses: 0,
        },
        achievements: editingTeam.players[i]?.achievements || [],
        xp: editingTeam.players[i]?.xp || 0,
        level: editingTeam.players[i]?.level || 1,
      })),
    };

    const updatedTeams = championship.teams.map((t) =>
      t.id === editingTeam.id ? updatedTeam : t
    );

    updateChampionship(championship.id, { teams: updatedTeams });
    setChampionship({ ...championship, teams: updatedTeams });
    setShowTeamForm(false);
    setEditingTeam(null);
    setTeamName('');
    setTeamLogo('');
    setTeamPlayers([]);
    toast.success('Time atualizado');
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

  // Generate test data: 10 teams with 10 players each
  const handleGenerateTestData = async () => {
    if (!championship) {
      return;

    }

    try {
      const teamNames = [
        'Águias FC', 'Leões United', 'Tigres SC', 'Falcões EC', 'Panteras FC',
        'Lobos AC', 'Dragões FC', 'Tubarões SC', 'Cobras EC', 'Gladiadores FC'
      ];

      const firstNames = [
        'João', 'Pedro', 'Lucas', 'Matheus', 'Gabriel', 'Rafael', 'Bruno', 'Diego', 'Carlos', 'André',
        'Felipe', 'Thiago', 'Rodrigo', 'Leonardo', 'Marcelo', 'Fernando', 'Ricardo', 'Paulo', 'Vitor', 'Daniel'
      ];

      const lastNames = [
        'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Pereira', 'Rodrigues', 'Almeida', 'Nascimento',
        'Ferreira', 'Araújo', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Mendes'
      ];

      const newTeams: Team[] = [];

      for (let i = 0; i < 10; i++) {
        const teamId = `team-${Date.now()}-${i}`;
        const teamPlayers: Player[] = [];
        
        // Generate 10 players for each team
        for (let j = 0; j < 10; j++) {
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          
          teamPlayers.push({
            id: `player-${Date.now()}-${i}-${j}`,
            name: `${firstName} ${lastName}`,
            teamId: teamId,
            number: j + 1,
            position: j === 0 ? 'Goleiro' : j <= 4 ? 'Defensor' : j <= 7 ? 'Meio-campo' : 'Atacante',
            stats: {
              games: 0,
              goals: 0,
              assists: 0,
              wins: 0,
              losses: 0,
              draws: 0,
            },
            achievements: [],
            xp: 0,
            level: 1,
          });
        }

        newTeams.push({
          id: teamId,
          name: teamNames[i],
          championshipId: championship.id,
          logo: undefined,
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
      }

      const updatedChampionship = {
        ...championship,
        teams: [...(championship.teams || []), ...newTeams]
      };

      updateChampionship(championship.id, { teams: updatedChampionship.teams });
      setChampionship(updatedChampionship);
      
      toast.success('🎉 10 times com 10 jogadores cada foram gerados!', {
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao gerar dados de teste:', error);
      toast.error('Erro ao gerar dados de teste');
    }
  };

  // Handle automatic match generation
  const handleGenerateMatches = async (matches: any[]) => {
    if (!championship) {
      return;
    }

    try {
      // Converte os matches gerados para o formato Game
      const games: Game[] = matches.map((match, index) => {
        const homeTeam = championship.teams?.find(t => t.id === match.homeTeamId);
        const awayTeam = championship.teams?.find(t => t.id === match.awayTeamId);

        return {
          id: `game-${Date.now()}-${index}`,
          championshipId: championship.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeTeamName: homeTeam?.name || 'Time Casa',
          awayTeamName: awayTeam?.name || 'Time Visitante',
          round: match.round,
          group: match.group,
          date: match.date,
          location: match.location || '',
          homeScore: undefined,
          awayScore: undefined,
          status: 'scheduled' as GameStatus,
        };
      });

      const updatedChampionship = {
        ...championship,
        games: [...(championship.games || []), ...games]
      };

      updateChampionship(championship.id, { games: updatedChampionship.games });
      setChampionship(updatedChampionship);

      toast.success(`🎉 ${games.length} partidas geradas com sucesso!`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao gerar partidas:', error);
      toast.error('Erro ao gerar partidas');
      throw error;
    }
  };

  // Helper to get status-based gradient
  const getStatusGradient = () => {
    switch (championship.status) {
      case 'draft':
        return 'from-blue-50 to-blue-100';
      case 'active':
        return 'from-emerald-50 to-emerald-100';
      case 'finished':
        return 'from-slate-50 to-slate-100';
      default:
        return 'from-blue-50 to-blue-100';
    }
  };

  const getStatusColor = () => {
    switch (championship.status) {
      case 'draft':
        return 'bg-blue-100 text-blue-700';
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'finished':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className={`bg-gradient-to-br ${getStatusGradient()} border-b border-slate-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            to="/championships"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar para Campeonatos
          </Link>

          {/* Hero Content */}
          <div className="flex items-start justify-between gap-6">
            {/* Left: Icon + Title + Metadata */}
            <div className="flex items-start gap-6">
              {/* Sport Icon */}
              <div className="flex-shrink-0">
                <div className="h-20 w-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-5xl">
                  {sportIcon}
                </div>
              </div>

              {/* Title & Info */}
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-3">
                  {championship.name}
                </h1>

                {/* Inline Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-200">
                    {sportDisplayName}
                  </span>
                  {championship.format && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-200">
                      <TrophyIcon className="h-4 w-4" />
                      {championship.format === 'groups-and-playoffs' ? 'Grupos + Playoffs' :
                       championship.format === 'round-robin' ? 'Pontos Corridos' :
                       championship.format === 'single-elimination' ? 'Eliminação Simples' :
                       championship.format}
                    </span>
                  )}
                  {championship.visibility && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-purple-700 border border-purple-200">
                      {championship.visibility === 'public' ? '🌐 Público' : championship.visibility === 'private' ? '🔒 Privado' : '📧 Apenas Convite'}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusColor()}`}>
                    {championship.status === 'draft' ? '📝 Rascunho' :
                     championship.status === 'active' ? '⚡ Em Andamento' :
                     championship.status === 'finished' ? '🏁 Finalizado' :
                     championship.status}
                  </span>
                </div>

                {/* Metadata Line */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinIcon className="h-4 w-4" />
                    {championship.location || 'Local não especificado'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    {championship.startDate ? new Date(championship.startDate).toLocaleDateString('pt-BR') : 'Data não definida'}
                    {championship.endDate && ` - ${new Date(championship.endDate).toLocaleDateString('pt-BR')}`}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon className="h-4 w-4" />
                    {championship.maxParticipants ? `Máx. ${championship.maxParticipants} ${formatParticipantLabel(championship.sport).toLowerCase()}` : 'Sem limite de participantes'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleGenerateTestData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                title="Gera 10 times com 10 jogadores cada para testes"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Gerar Dados de Teste
              </button>
              <Link
                to={`/championship/${championship.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 font-medium transition-colors shadow-sm"
              >
                <PencilIcon className="h-4 w-4" />
                Editar
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium transition-colors shadow-sm"
              >
                <TrashIcon className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Participants Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              {formatParticipantLabel(championship.sport)}
            </p>
            <p className="text-3xl font-bold text-slate-900">
              {championship.teams?.length || 0}
            </p>
          </div>

          {/* Games Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CalendarIcon className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Partidas</p>
            <p className="text-3xl font-bold text-slate-900">
              {championship.games?.length || 0}
            </p>
          </div>

          {/* Players Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <UsersIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Jogadores</p>
            <p className="text-3xl font-bold text-slate-900">
              {championship.teams.reduce<number>(
                (accumulator, team) => accumulator + team.players.length,
                0
              )}
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <TrophyIcon className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Status</p>
            <p className="text-lg font-semibold text-slate-900 capitalize">
              {championship.status === 'draft' ? 'Rascunho' :
               championship.status === 'active' ? 'Em Andamento' :
               championship.status === 'finished' ? 'Finalizado' :
               championship.status}
            </p>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="border-b border-slate-200">
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
                    className={`group relative flex items-center gap-2.5 px-6 py-4 font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <tab.icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                    <span>{tab.label}</span>
                    {itemCount !== null && (
                      <span className={`ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}>
                        {itemCount}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Description Card (if exists) */}
                {championship.description && (
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Sobre o Campeonato</h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-11">{championship.description}</p>
                  </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Information Card */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                      Informações Gerais
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
                        <MapPinIcon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Local</p>
                          <p className="text-slate-900 font-medium">{championship.location || 'Não especificado'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
                        <CalendarIcon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Período</p>
                          <p className="text-slate-900 font-medium">
                            {championship.startDate ? new Date(championship.startDate).toLocaleDateString('pt-BR') : 'Não definido'}
                            {championship.endDate && ` - ${new Date(championship.endDate).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
                        <TrophyIcon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Formato</p>
                          <p className="text-slate-900 font-medium">
                            {championship.format === 'groups-and-playoffs' ? 'Grupos + Playoffs' :
                             championship.format === 'round-robin' ? 'Pontos Corridos' :
                             championship.format === 'single-elimination' ? 'Eliminação Simples' :
                             championship.format || 'Não especificado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
                        <UsersIcon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Participantes</p>
                          <p className="text-slate-900 font-medium">
                            {championship.maxParticipants 
                              ? `Máximo de ${championship.maxParticipants} ${formatParticipantLabel(championship.sport).toLowerCase()}`
                              : 'Sem limite de participantes'}
                          </p>
                        </div>
                      </div>
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
                            <div className="p-4 bg-white rounded-lg border border-slate-200">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Distribuição</p>
                              <p className="text-slate-700 text-sm">{championship.prizeDistribution}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Entry Fee Section */}
                    {championship.hasEntryFee && championship.entryFee && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">💳</span>
                          <p className="text-sm font-medium text-blue-900">Taxa de Inscrição</p>
                        </div>
                        <p className="text-blue-700 font-semibold ml-7">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(championship.entryFee)}
                        </p>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumo Rápido</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{formatParticipantLabel(championship.sport)} Inscritos</span>
                          <span className="text-lg font-bold text-blue-600">{championship.teams?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Jogadores Totais</span>
                          <span className="text-lg font-bold text-blue-600">
                            {championship.teams.reduce<number>(
                              (acc, team) => acc + team.players.length,
                              0
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Partidas Agendadas</span>
                          <span className="text-lg font-bold text-blue-600">{championship.games?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                          <span className="text-sm text-slate-600">Visibilidade</span>
                          <span className="text-sm font-semibold text-blue-700">
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
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <UserGroupIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            {formatParticipantLabel(championship.sport)} Cadastrados
                            <span className="ml-2 text-blue-600">({championship.teams?.length || 0})</span>
                          </h3>
                          <p className="text-sm text-slate-600">
                            Gerencie os participantes do seu campeonato e acompanhe suas estatísticas
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTeamForm(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Novo {isTeamSport(championship.sport) ? 'Time' : 'Jogador'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Enhanced Team Form */}
                {showTeamForm && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
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

                      {/* Section 2: Logo and Colors */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold text-sm">
                            2
                          </div>
                          <h4 className="text-lg font-semibold text-slate-900">Logo e Cores</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-11">
                          <div>
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
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => setTeamLogo('')}
                                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                                  <div className="flex flex-col items-center justify-center py-6">
                                    <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm text-slate-600 font-medium">
                                      Clique ou arraste uma imagem
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">PNG, JPG até 5MB</p>
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
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Cor Primária
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  defaultValue="#3B82F6"
                                  className="h-12 w-20 border border-slate-300 rounded-lg cursor-pointer"
                                />
                                <input
                                  type="text"
                                  defaultValue="#3B82F6"
                                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="#3B82F6"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Cor Secundária
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  defaultValue="#FFFFFF"
                                  className="h-12 w-20 border border-slate-300 rounded-lg cursor-pointer"
                                />
                                <input
                                  type="text"
                                  defaultValue="#FFFFFF"
                                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="#FFFFFF"
                                />
                              </div>
                            </div>
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
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
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
                                  className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
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
                          className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateTeam}
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
                      <div key={team.id} className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
                        {/* Team Header */}
                        <div className="relative h-24 bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
                          <div className="absolute top-3 right-3 flex items-center gap-1">
                            <button
                              onClick={() => handleEditTeam(team)}
                              className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-colors"
                              title="Editar time"
                            >
                              <PencilIcon className="h-3.5 w-3.5 text-slate-700" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-colors"
                              title="Excluir time"
                            >
                              <TrashIcon className="h-3.5 w-3.5 text-red-600" />
                            </button>
                          </div>
                        </div>

                        {/* Team Info */}
                        <div className="p-5">
                          <div className="flex items-start gap-4 -mt-14 mb-4">
                            {team.logo ? (
                              <img 
                                src={team.logo} 
                                alt={team.name} 
                                className="h-20 w-20 object-cover rounded-xl border-4 border-white shadow-lg bg-white" 
                              />
                            ) : (
                              <div className="h-20 w-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
                                <UserGroupIcon className="h-10 w-10 text-slate-400" />
                              </div>
                            )}
                          </div>
                          
                          <h4 className="text-xl font-bold text-slate-900 mb-1">{team.name}</h4>
                          
                          {/* Team Stats */}
                          <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                              <p className="text-xs text-blue-600 font-medium mb-0.5">Vitórias</p>
                              <p className="text-lg font-bold text-blue-700">{team.stats?.wins || 0}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                              <p className="text-xs text-slate-600 font-medium mb-0.5">Empates</p>
                              <p className="text-lg font-bold text-slate-700">{team.stats?.draws || 0}</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2.5 text-center">
                              <p className="text-xs text-red-600 font-medium mb-0.5">Derrotas</p>
                              <p className="text-lg font-bold text-red-700">{team.stats?.losses || 0}</p>
                            </div>
                          </div>

                          {/* Team Metrics */}
                          <div className="flex items-center justify-between text-sm text-slate-600 py-3 border-t border-slate-100">
                            <span className="flex items-center gap-1.5">
                              <UsersIcon className="h-4 w-4" />
                              {team.players?.length || 0} jogadores
                            </span>
                            <span className="flex items-center gap-1.5">
                              <TrophyIcon className="h-4 w-4" />
                              {team.stats?.points || 0} pts
                            </span>
                          </div>

                          {/* Team Actions */}
                          <div className="flex items-center gap-2 mt-4">
                            <button className="flex-1 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              Ver Elenco
                            </button>
                            <button className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                              Estatísticas
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
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                        <UserGroupIcon className="h-10 w-10 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Nenhum {formatParticipantLabel(championship.sport).toLowerCase()} cadastrado
                      </h3>
                      <p className="text-slate-600 mb-8 leading-relaxed">
                        Comece adicionando {isTeamSport(championship.sport) ? 'os times' : 'os jogadores'} que irão participar do campeonato. Você pode adicionar quantos precisar.
                      </p>
                      <button
                        onClick={() => setShowTeamForm(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm hover:shadow-md transition-all"
                      >
                        <PlusIcon className="h-5 w-5" />
                        {getSportActionLabel(championship.sport, 'add')}
                      </button>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowMatchGenerator(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 font-medium shadow-sm transition-all"
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
                              {gameMode === 'manual' ? 'Agendar Nova Partida' : 'Gerar Chaveamento Automático'}
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
                                  Grupo
                                </label>
                                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                  <option value="">Nenhum</option>
                                  <option value="A">Grupo A</option>
                                  <option value="B">Grupo B</option>
                                  <option value="C">Grupo C</option>
                                </select>
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

                {/* Games List */}
                {!showGameForm && championship.games?.length > 0 && (
                  <div className="space-y-4">
                    {/* Group by Round */}
                    {Array.from(new Set(championship.games.map(g => g.round || 1))).map(round => (
                      <div key={round} className="space-y-3">
                        <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                            {round}
                          </span>
                          Rodada {round}
                        </h4>
                        <div className="space-y-3">
                          {championship.games
                            .filter(g => (g.round || 1) === round)
                            .map((game) => {
                              const homeTeam = championship.teams.find(t => t.id === game.homeTeamId);
                              const awayTeam = championship.teams.find(t => t.id === game.awayTeamId);
                              
                              return (
                                <div key={game.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all">
                                  <div className="flex items-center justify-between gap-6">
                                    {/* Game Info */}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                          <CalendarIcon className="h-4 w-4" />
                                          {game.date ? new Date(game.date).toLocaleDateString('pt-BR') : 'Data não definida'}
                                        </div>
                                        {game.location && (
                                          <>
                                            <span className="text-slate-300">•</span>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                              <MapPinIcon className="h-4 w-4" />
                                              {game.location}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Matchup */}
                                      <div className="flex items-center justify-between gap-4">
                                        {/* Home Team */}
                                        <div className="flex items-center gap-3 flex-1">
                                          {homeTeam?.logo ? (
                                            <img src={homeTeam.logo} alt={homeTeam.name} className="h-10 w-10 object-cover rounded-lg" />
                                          ) : (
                                            <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                              <UserGroupIcon className="h-5 w-5 text-slate-400" />
                                            </div>
                                          )}
                                          <span className="font-semibold text-slate-900">{homeTeam?.name}</span>
                                        </div>

                                        {/* Score */}
                                        <div className="flex items-center gap-3 px-6 py-2 bg-slate-50 rounded-lg">
                                          <span className="text-2xl font-bold text-slate-900">{game.homeScore ?? '-'}</span>
                                          <span className="text-slate-400">×</span>
                                          <span className="text-2xl font-bold text-slate-900">{game.awayScore ?? '-'}</span>
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex items-center gap-3 flex-1 justify-end">
                                          <span className="font-semibold text-slate-900">{awayTeam?.name}</span>
                                          {awayTeam?.logo ? (
                                            <img src={awayTeam.logo} alt={awayTeam.name} className="h-10 w-10 object-cover rounded-lg" />
                                          ) : (
                                            <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                              <UserGroupIcon className="h-5 w-5 text-slate-400" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                      {game.status === 'pending' && (
                                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors">
                                          ▶️ Iniciar
                                        </button>
                                      )}
                                      {game.status === 'in-progress' && (
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">
                                          Finalizar
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleEditGame(game)}
                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Editar partida"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteGame(game.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir partida"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enhanced Empty State */}
                {!showGameForm && (!championship.games || championship.games.length === 0) && (
                  <div className="text-center py-16 px-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-dashed border-slate-300">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                      <CalendarIcon className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma partida agendada</h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                      Comece agendando partidas individualmente ou gere automaticamente toda a tabela do campeonato
                    </p>
                    {(!championship.teams || championship.teams.length < 2) && (
                      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-sm mb-6">
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

      {/* Match Generator Modal */}
      <MatchGenerator
        isOpen={showMatchGenerator}
        onClose={() => setShowMatchGenerator(false)}
        teams={championship.teams || []}
        onGenerate={handleGenerateMatches}
      />
    </div>
  );
}
