import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  MinusIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { gamesService } from '../services/gamesService';
import { generateId } from '../utils';
import { checkAchievements } from '../utils/achievements';
import type { Game, Team, Goal } from '../types';
import toast from 'react-hot-toast';

interface EnhancedGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  mode: 'result' | 'manage' | 'live';
}

const goalSchema = z.object({
  scorer: z.string().min(1, 'Selecione o marcador'),
  assistant: z.string().optional(),
  minute: z.number().min(0).max(120).optional(),
  type: z.enum(['goal', 'own_goal', 'penalty']).default('goal'),
});

const gameResultSchema = z.object({
  homeScore: z.number().min(0, 'Placar deve ser maior ou igual a 0').max(50, 'Placar muito alto'),
  awayScore: z.number().min(0, 'Placar deve ser maior ou igual a 0').max(50, 'Placar muito alto'),
  homeGoals: z.array(goalSchema),
  awayGoals: z.array(goalSchema),
  venue: z.string().optional(),
  notes: z.string().optional(),
});

const gameStatusConfig = {
  scheduled: { label: 'Agendado', color: 'bg-blue-500', icon: ClockIcon },
  live: { label: 'Ao Vivo', color: 'bg-red-500', icon: PlayIcon },
  paused: { label: 'Pausado', color: 'bg-yellow-500', icon: PauseIcon },
  finished: { label: 'Finalizado', color: 'bg-green-500', icon: TrophyIcon },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500', icon: StopIcon },
  pending: { label: 'Pendente', color: 'bg-purple-500', icon: ClockIcon }
};

type GameResultData = z.infer<typeof gameResultSchema>;

export function EnhancedGameModal({ isOpen, onClose, game, homeTeam, awayTeam, mode }: EnhancedGameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(game.status);
  const [isLiveMode, setIsLiveMode] = useState(mode === 'live');
  const [currentTime, setCurrentTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const updateGame = useChampionshipStore((state) => state.updateGame);
  const updatePlayerStats = useChampionshipStore((state) => state.updatePlayerStats);
  const calculateXPAction = useChampionshipStore((state) => state.calculateXP);
  const addPlayerAchievement = useChampionshipStore((state) => state.addPlayerAchievement);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GameResultData>({
    resolver: zodResolver(gameResultSchema),
    defaultValues: {
      homeScore: game.homeScore || 0,
      awayScore: game.awayScore || 0,
      homeGoals: [],
      awayGoals: [],
      venue: game.venue || '',
      notes: '',
    },
  });

  const {
    fields: homeGoalFields,
    append: appendHomeGoal,
    remove: removeHomeGoal,
  } = useFieldArray({
    control,
    name: 'homeGoals',
  });

  const {
    fields: awayGoalFields,
    append: appendAwayGoal,
    remove: removeAwayGoal,
  } = useFieldArray({
    control,
    name: 'awayGoals',
  });

  const homeScore = watch('homeScore');
  const awayScore = watch('awayScore');

  // Timer para modo ao vivo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && isLiveMode) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isLiveMode]);

  // Update goal fields when scores change
  useEffect(() => {
    const currentHomeGoals = homeGoalFields.length;
    const currentAwayGoals = awayGoalFields.length;

    if (homeScore > currentHomeGoals) {
      for (let i = currentHomeGoals; i < homeScore; i++) {
        appendHomeGoal({ 
          scorer: '', 
          assistant: '', 
          minute: isLiveMode ? Math.floor(currentTime / 60) : undefined,
          type: 'goal' 
        });
      }
    } else if (homeScore < currentHomeGoals) {
      for (let i = currentHomeGoals - 1; i >= homeScore; i--) {
        removeHomeGoal(i);
      }
    }

    if (awayScore > currentAwayGoals) {
      for (let i = currentAwayGoals; i < awayScore; i++) {
        appendAwayGoal({ 
          scorer: '', 
          assistant: '', 
          minute: isLiveMode ? Math.floor(currentTime / 60) : undefined,
          type: 'goal' 
        });
      }
    } else if (awayScore < currentAwayGoals) {
      for (let i = currentAwayGoals - 1; i >= awayScore; i--) {
        removeAwayGoal(i);
      }
    }
  }, [homeScore, awayScore, homeGoalFields.length, awayGoalFields.length, appendHomeGoal, appendAwayGoal, removeHomeGoal, removeAwayGoal, currentTime, isLiveMode]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsSubmitting(true);
      await gamesService.updateGameStatus(game.id, { status: newStatus as any });
      setCurrentStatus(newStatus as any);
      
      if (newStatus === 'live') {
        setIsLiveMode(true);
        setIsTimerRunning(true);
      } else if (newStatus === 'paused') {
        setIsTimerRunning(false);
      } else if (newStatus === 'finished') {
        setIsTimerRunning(false);
        setIsLiveMode(false);
      }
      
      toast.success(`Status alterado para: ${gameStatusConfig[newStatus as keyof typeof gameStatusConfig]?.label}`);
    } catch (error) {
      toast.error('Erro ao alterar status do jogo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: GameResultData) => {
    setIsSubmitting(true);
    
    try {
      const goals: Goal[] = [];
      
      // Home team goals
      data.homeGoals.forEach((goalData, index) => {
        goals.push({
          id: generateId(),
          gameId: game.id,
          playerId: goalData.scorer,
          teamId: homeTeam.id,
          assistPlayerId: goalData.assistant || undefined,
          minute: goalData.minute,
          type: goalData.type,
        });
      });

      // Away team goals
      data.awayGoals.forEach((goalData, index) => {
        goals.push({
          id: generateId(),
          gameId: game.id,
          playerId: goalData.scorer,
          teamId: awayTeam.id,
          assistPlayerId: goalData.assistant || undefined,
          minute: goalData.minute,
          type: goalData.type,
        });
      });

      // Update game
      const finalStatus = mode === 'result' ? 'finished' : currentStatus;
      
      updateGame(game.id, {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: finalStatus,
        goals,
        venue: data.venue,
        playedAt: finalStatus === 'finished' ? new Date() : game.playedAt,
      });

      // Only calculate stats if finishing the game
      if (finalStatus === 'finished') {
        await processGameCompletion(data, goals);
      }

      toast.success(finalStatus === 'finished' ? 'Jogo finalizado com sucesso!' : 'Jogo atualizado com sucesso!');
      onClose();
      reset();
    } catch (error) {
      toast.error('Erro ao processar jogo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processGameCompletion = async (data: GameResultData, goals: Goal[]) => {
    const allPlayers = [...homeTeam.players, ...awayTeam.players];
    const gameWinner = data.homeScore > data.awayScore ? 'home' : 
                      data.awayScore > data.homeScore ? 'away' : 'draw';

    for (const player of allPlayers) {
      const playerGoals = goals.filter(g => g.playerId === player.id).length;
      const playerAssists = goals.filter(g => g.assistPlayerId === player.id).length;
      
      let wins = 0, draws = 0, losses = 0;
      
      if (gameWinner === 'draw') {
        draws = 1;
      } else if (
        (player.teamId === homeTeam.id && gameWinner === 'home') ||
        (player.teamId === awayTeam.id && gameWinner === 'away')
      ) {
        wins = 1;
      } else {
        losses = 1;
      }

      updatePlayerStats(player.id, {
        games: player.stats.games + 1,
        goals: player.stats.goals + playerGoals,
        assists: player.stats.assists + playerAssists,
        wins: player.stats.wins + wins,
        draws: player.stats.draws + draws,
        losses: player.stats.losses + losses,
      });

      // Calculate XP and achievements
      calculateXPAction(player.id, 'play');
      for (let i = 0; i < playerGoals; i++) calculateXPAction(player.id, 'goal');
      for (let i = 0; i < playerAssists; i++) calculateXPAction(player.id, 'assist');
      if (wins > 0) calculateXPAction(player.id, 'win');

      const updatedPlayer = {
        ...player,
        stats: {
          games: player.stats.games + 1,
          goals: player.stats.goals + playerGoals,
          assists: player.stats.assists + playerAssists,
          wins: player.stats.wins + wins,
          draws: player.stats.draws + draws,
          losses: player.stats.losses + losses,
        }
      };

      const newAchievements = checkAchievements(updatedPlayer, {
        ...game,
        goals,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: 'finished',
      });

      newAchievements.forEach(achievement => {
        addPlayerAchievement(player.id, achievement);
        calculateXPAction(player.id, 'play');
        toast.success(`🏆 ${player.name} desbloqueou: ${achievement.name}!`);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const StatusIcon = gameStatusConfig[currentStatus]?.icon || ClockIcon;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${gameStatusConfig[currentStatus]?.color || 'bg-gray-500'}`}>
                        <StatusIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <Dialog.Title className="text-2xl font-bold">
                          {mode === 'result' ? 'Lançar Resultado' : 
                           mode === 'live' ? 'Jogo Ao Vivo' : 'Gerenciar Jogo'}
                        </Dialog.Title>
                        <p className="text-blue-100">
                          Status: {gameStatusConfig[currentStatus]?.label}
                        </p>
                      </div>
                    </div>
                    
                    {isLiveMode && (
                      <div className="text-center">
                        <div className="text-3xl font-mono font-bold">
                          {formatTime(currentTime)}
                        </div>
                        <p className="text-sm text-blue-100">Tempo de jogo</p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Game Controls - Only in live/manage mode */}
                    {(mode === 'live' || mode === 'manage') && (
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Controles do Jogo</h3>
                        <div className="flex flex-wrap gap-3">
                          {currentStatus === 'scheduled' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange('live')}
                              disabled={isSubmitting}
                              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              <PlayIcon className="h-5 w-5" />
                              <span>Iniciar Jogo</span>
                            </button>
                          )}
                          
                          {currentStatus === 'live' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange('paused')}
                                disabled={isSubmitting}
                                className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                <PauseIcon className="h-5 w-5" />
                                <span>Pausar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange('finished')}
                                disabled={isSubmitting}
                                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                <TrophyIcon className="h-5 w-5" />
                                <span>Finalizar</span>
                              </button>
                            </>
                          )}
                          
                          {currentStatus === 'paused' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange('live')}
                              disabled={isSubmitting}
                              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              <PlayIcon className="h-5 w-5" />
                              <span>Retomar</span>
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => handleStatusChange('cancelled')}
                            disabled={isSubmitting}
                            className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <StopIcon className="h-5 w-5" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Score Section */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        {/* Home Team */}
                        <div className="text-center">
                          <div 
                            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                            style={{ backgroundColor: homeTeam.color || '#6B7280' }}
                          >
                            {homeTeam.name.charAt(0)}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{homeTeam.name}</h3>
                          <p className="text-sm text-gray-600">Mandante</p>
                          
                          <div className="mt-4 flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setValue('homeScore', Math.max(0, homeScore - 1))}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <input
                              {...register('homeScore', { valueAsNumber: true })}
                              type="number"
                              min="0"
                              max="50"
                              className="w-16 text-center text-2xl font-bold border border-gray-300 rounded-lg p-2"
                            />
                            <button
                              type="button"
                              onClick={() => setValue('homeScore', homeScore + 1)}
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          {errors.homeScore && (
                            <p className="text-red-500 text-sm mt-1">{errors.homeScore.message}</p>
                          )}
                        </div>

                        {/* VS / Timer */}
                        <div className="text-center">
                          <div className="text-6xl font-bold text-gray-400 mb-2">VS</div>
                          {game.scheduledAt && (
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                              <ClockIcon className="h-4 w-4" />
                              <span>{new Date(game.scheduledAt).toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          {game.venue && (
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mt-1">
                              <MapPinIcon className="h-4 w-4" />
                              <span>{game.venue}</span>
                            </div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="text-center">
                          <div 
                            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                            style={{ backgroundColor: awayTeam.color || '#6B7280' }}
                          >
                            {awayTeam.name.charAt(0)}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{awayTeam.name}</h3>
                          <p className="text-sm text-gray-600">Visitante</p>
                          
                          <div className="mt-4 flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setValue('awayScore', Math.max(0, awayScore - 1))}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <input
                              {...register('awayScore', { valueAsNumber: true })}
                              type="number"
                              min="0"
                              max="50"
                              className="w-16 text-center text-2xl font-bold border border-gray-300 rounded-lg p-2"
                            />
                            <button
                              type="button"
                              onClick={() => setValue('awayScore', awayScore + 1)}
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          {errors.awayScore && (
                            <p className="text-red-500 text-sm mt-1">{errors.awayScore.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Goals Details */}
                    {(homeScore > 0 || awayScore > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Home Team Goals */}
                        {homeScore > 0 && (
                          <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h4 className="text-lg font-semibold mb-4 text-gray-900">
                              Gols - {homeTeam.name}
                            </h4>
                            <div className="space-y-4">
                              {homeGoalFields.map((field, index) => (
                                <div key={field.id} className="bg-gray-50 rounded-lg p-4">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Marcador *
                                      </label>
                                      <select
                                        {...register(`homeGoals.${index}.scorer`)}
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                      >
                                        <option value="">Selecione o jogador</option>
                                        {homeTeam.players.map(player => (
                                          <option key={player.id} value={player.id}>
                                            {player.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Assistência
                                        </label>
                                        <select
                                          {...register(`homeGoals.${index}.assistant`)}
                                          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        >
                                          <option value="">Nenhuma</option>
                                          {homeTeam.players.map(player => (
                                            <option key={player.id} value={player.id}>
                                              {player.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Minuto
                                        </label>
                                        <input
                                          {...register(`homeGoals.${index}.minute`, { valueAsNumber: true })}
                                          type="number"
                                          min="0"
                                          max="120"
                                          className="w-full border border-gray-300 rounded-lg p-2"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tipo
                                        </label>
                                        <select
                                          {...register(`homeGoals.${index}.type`)}
                                          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        >
                                          <option value="goal">Gol</option>
                                          <option value="penalty">Pênalti</option>
                                          <option value="own_goal">Gol Contra</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Away Team Goals */}
                        {awayScore > 0 && (
                          <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h4 className="text-lg font-semibold mb-4 text-gray-900">
                              Gols - {awayTeam.name}
                            </h4>
                            <div className="space-y-4">
                              {awayGoalFields.map((field, index) => (
                                <div key={field.id} className="bg-gray-50 rounded-lg p-4">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Marcador *
                                      </label>
                                      <select
                                        {...register(`awayGoals.${index}.scorer`)}
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                      >
                                        <option value="">Selecione o jogador</option>
                                        {awayTeam.players.map(player => (
                                          <option key={player.id} value={player.id}>
                                            {player.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Assistência
                                        </label>
                                        <select
                                          {...register(`awayGoals.${index}.assistant`)}
                                          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        >
                                          <option value="">Nenhuma</option>
                                          {awayTeam.players.map(player => (
                                            <option key={player.id} value={player.id}>
                                              {player.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Minuto
                                        </label>
                                        <input
                                          {...register(`awayGoals.${index}.minute`, { valueAsNumber: true })}
                                          type="number"
                                          min="0"
                                          max="120"
                                          className="w-full border border-gray-300 rounded-lg p-2"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tipo
                                        </label>
                                        <select
                                          {...register(`awayGoals.${index}.type`)}
                                          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        >
                                          <option value="goal">Gol</option>
                                          <option value="penalty">Pênalti</option>
                                          <option value="own_goal">Gol Contra</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Local do jogo
                        </label>
                        <input
                          {...register('venue')}
                          type="text"
                          placeholder="Ex: Estádio Municipal"
                          className="w-full border border-gray-300 rounded-lg p-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Observações
                        </label>
                        <input
                          {...register('notes')}
                          type="text"
                          placeholder="Informações adicionais"
                          className="w-full border border-gray-300 rounded-lg p-3"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Processando...' : 
                         mode === 'result' ? 'Finalizar Jogo' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}