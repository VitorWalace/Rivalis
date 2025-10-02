import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { generateId } from '../utils';
import { checkAchievements } from '../utils/achievements';
import type { Game, Team, Goal } from '../types';
import toast from 'react-hot-toast';

interface GameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
}

const goalSchema = z.object({
  scorer: z.string().min(1, 'Selecione o marcador'),
  assistant: z.string().optional(),
});

const gameResultSchema = z.object({
  homeScore: z.number().min(0, 'Placar deve ser maior ou igual a 0').max(50, 'Placar muito alto'),
  awayScore: z.number().min(0, 'Placar deve ser maior ou igual a 0').max(50, 'Placar muito alto'),
  homeGoals: z.array(goalSchema),
  awayGoals: z.array(goalSchema),
});

type GameResultData = z.infer<typeof gameResultSchema>;

export function GameResultModal({ isOpen, onClose, game, homeTeam, awayTeam }: GameResultModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    formState: { errors },
  } = useForm<GameResultData>({
    resolver: zodResolver(gameResultSchema),
    defaultValues: {
      homeScore: 0,
      awayScore: 0,
      homeGoals: [],
      awayGoals: [],
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

  // Update goal fields when scores change
  useEffect(() => {
    const currentHomeGoals = homeGoalFields.length;
    const currentAwayGoals = awayGoalFields.length;

    // Add home goals
    if (homeScore > currentHomeGoals) {
      for (let i = currentHomeGoals; i < homeScore; i++) {
        appendHomeGoal({ scorer: '', assistant: '' });
      }
    }
    // Remove home goals
    else if (homeScore < currentHomeGoals) {
      for (let i = currentHomeGoals - 1; i >= homeScore; i--) {
        removeHomeGoal(i);
      }
    }

    // Add away goals
    if (awayScore > currentAwayGoals) {
      for (let i = currentAwayGoals; i < awayScore; i++) {
        appendAwayGoal({ scorer: '', assistant: '' });
      }
    }
    // Remove away goals
    else if (awayScore < currentAwayGoals) {
      for (let i = currentAwayGoals - 1; i >= awayScore; i--) {
        removeAwayGoal(i);
      }
    }
  }, [homeScore, awayScore, homeGoalFields.length, awayGoalFields.length, appendHomeGoal, appendAwayGoal, removeHomeGoal, removeAwayGoal]);

  const onSubmit = async (data: GameResultData) => {
    setIsSubmitting(true);
    
    try {
      // Create goal objects
      const goals: Goal[] = [];
      
      // Home team goals
      data.homeGoals.forEach((goalData) => {
        goals.push({
          id: generateId(),
          gameId: game.id,
          playerId: goalData.scorer,
          teamId: homeTeam.id,
          assistPlayerId: goalData.assistant || undefined,
          type: 'goal',
        });
      });

      // Away team goals
      data.awayGoals.forEach((goalData) => {
        goals.push({
          id: generateId(),
          gameId: game.id,
          playerId: goalData.scorer,
          teamId: awayTeam.id,
          assistPlayerId: goalData.assistant || undefined,
          type: 'goal',
        });
      });

      // Update game
      updateGame(game.id, {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: 'finished',
        goals,
        playedAt: new Date(),
      });

      // Calculate player stats and XP
      const allPlayers = [...homeTeam.players, ...awayTeam.players];
      const gameWinner = data.homeScore > data.awayScore ? 'home' : 
                        data.awayScore > data.homeScore ? 'away' : 'draw';

      // Update stats for all players who participated
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

        // Update player stats
        updatePlayerStats(player.id, {
          games: player.stats.games + 1,
          goals: player.stats.goals + playerGoals,
          assists: player.stats.assists + playerAssists,
          wins: player.stats.wins + wins,
          draws: player.stats.draws + draws,
          losses: player.stats.losses + losses,
        });

        // Calculate XP
        calculateXPAction(player.id, 'play'); // Base XP for playing
        
        if (playerGoals > 0) {
          for (let i = 0; i < playerGoals; i++) {
            calculateXPAction(player.id, 'goal');
          }
        }
        
        if (playerAssists > 0) {
          for (let i = 0; i < playerAssists; i++) {
            calculateXPAction(player.id, 'assist');
          }
        }
        
        if (wins > 0) {
          calculateXPAction(player.id, 'win');
        }

        // Check for achievements
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

        // Add new achievements
        newAchievements.forEach(achievement => {
          addPlayerAchievement(player.id, achievement);
          calculateXPAction(player.id, 'play'); // Bonus XP for achievement
          toast.success(`🏆 ${player.name} desbloqueou: ${achievement.name}!`);
        });
      }

      toast.success('Resultado lançado com sucesso!');
      onClose();
      reset();
    } catch (error) {
      toast.error('Erro ao lançar resultado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    Lançar Resultado
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Teams Display */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-8">
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900">{homeTeam.name}</h4>
                        <p className="text-sm text-gray-600">Casa</p>
                      </div>
                      <div className="text-2xl font-bold text-gray-600">VS</div>
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900">{awayTeam.name}</h4>
                        <p className="text-sm text-gray-600">Visitante</p>
                      </div>
                    </div>
                  </div>

                  {/* Score Input */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gols de {homeTeam.name}
                      </label>
                      <input
                        {...register('homeScore', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="50"
                        className="input-field text-center text-2xl font-bold"
                      />
                      {errors.homeScore && (
                        <p className="mt-1 text-sm text-red-600">{errors.homeScore.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gols de {awayTeam.name}
                      </label>
                      <input
                        {...register('awayScore', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="50"
                        className="input-field text-center text-2xl font-bold"
                      />
                      {errors.awayScore && (
                        <p className="mt-1 text-sm text-red-600">{errors.awayScore.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Goal Details */}
                  {(homeScore > 0 || awayScore > 0) && (
                    <div className="space-y-6">
                      <h4 className="font-medium text-gray-900">Detalhes dos Gols</h4>

                      {/* Home Team Goals */}
                      {homeScore > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">Gols de {homeTeam.name}</h5>
                          <div className="space-y-3">
                            {homeGoalFields.map((field, index) => (
                              <div key={field.id} className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Marcador do Gol {index + 1}
                                  </label>
                                  <select
                                    {...register(`homeGoals.${index}.scorer`)}
                                    className="input-field"
                                  >
                                    <option value="">Selecione o jogador</option>
                                    {homeTeam.players.map((player) => (
                                      <option key={player.id} value={player.id}>
                                        {player.name}
                                      </option>
                                    ))}
                                  </select>
                                  {errors.homeGoals?.[index]?.scorer && (
                                    <p className="mt-1 text-sm text-red-600">
                                      {errors.homeGoals[index]?.scorer?.message}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assistência (opcional)
                                  </label>
                                  <select
                                    {...register(`homeGoals.${index}.assistant`)}
                                    className="input-field"
                                  >
                                    <option value="">Nenhuma assistência</option>
                                    {homeTeam.players.map((player) => (
                                      <option key={player.id} value={player.id}>
                                        {player.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Away Team Goals */}
                      {awayScore > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">Gols de {awayTeam.name}</h5>
                          <div className="space-y-3">
                            {awayGoalFields.map((field, index) => (
                              <div key={field.id} className="grid grid-cols-2 gap-3 p-3 bg-red-50 rounded-lg">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Marcador do Gol {index + 1}
                                  </label>
                                  <select
                                    {...register(`awayGoals.${index}.scorer`)}
                                    className="input-field"
                                  >
                                    <option value="">Selecione o jogador</option>
                                    {awayTeam.players.map((player) => (
                                      <option key={player.id} value={player.id}>
                                        {player.name}
                                      </option>
                                    ))}
                                  </select>
                                  {errors.awayGoals?.[index]?.scorer && (
                                    <p className="mt-1 text-sm text-red-600">
                                      {errors.awayGoals[index]?.scorer?.message}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assistência (opcional)
                                  </label>
                                  <select
                                    {...register(`awayGoals.${index}.assistant`)}
                                    className="input-field"
                                  >
                                    <option value="">Nenhuma assistência</option>
                                    {awayTeam.players.map((player) => (
                                      <option key={player.id} value={player.id}>
                                        {player.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar Resultado'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}