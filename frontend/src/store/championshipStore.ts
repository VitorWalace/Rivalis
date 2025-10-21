import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Championship,
  Player,
  Game,
  Goal,
  Achievement,
} from '../types/index.ts';
import { championshipService } from '../services/championshipService';

interface CreateChampionshipData {
  name: string;
  description?: string;
  game: string;
  maxParticipants: number;
  format: string;
  visibility: string;
  registrationDeadline?: string;
  startDate: string;
  hasEntryFee?: boolean;
  entryFee?: number;
  prizePool?: number;
  prizeDistribution?: string;
  organizerId: string;
  status: string;
  currentParticipants: number;
}

interface ChampionshipState {
  championships: Championship[];
  currentChampionship: Championship | null;
  isLoading: boolean;
  error: string | null;
  addChampionship: (championship: Championship) => void;
  createChampionship: (data: CreateChampionshipData) => Promise<void>;
  setCurrentChampionship: (championship: Championship | null) => void;
  updateChampionship: (id: string, data: Partial<Championship>) => Promise<void>;
  deleteChampionship: (id: string) => Promise<void>;
  removeTeam: (championshipId: string, teamId: string) => void;
  addGame: (championshipId: string, game: Game) => void;
  updateGame: (gameId: string, data: Partial<Game>) => void;
  addGoal: (gameId: string, goal: Goal) => void;
  updatePlayerStats: (playerId: string, stats: Partial<Player['stats']>) => void;
  addPlayerAchievement: (playerId: string, achievement: Achievement) => void;
  calculateXP: (playerId: string, action: 'goal' | 'assist' | 'win' | 'play') => void;
  clearChampionships: () => void;
  fetchUserChampionships: () => Promise<void>;
}

export const useChampionshipStore = create<ChampionshipState>()(
  persist(
    (set) => ({
      championships: [],
      currentChampionship: null,
      isLoading: false,
      error: null,
      
      fetchUserChampionships: async () => {
        console.log('🔄 Buscando campeonatos do usuário...');
        set({ isLoading: true, error: null });
        try {
          const response = await championshipService.getUserChampionships();
          console.log('📥 Resposta ao buscar campeonatos:', response);
          if (response.success) {
            console.log(`✅ ${response.data.championships.length} campeonatos encontrados`);
            console.log('📋 Primeiro campeonato:', response.data.championships[0]);
            set({ championships: response.data.championships, isLoading: false });
          } else {
            console.error('❌ Erro na resposta:', response);
            set({ error: 'Erro ao buscar campeonatos', isLoading: false });
          }
        } catch (error: any) {
          console.error('❌ Erro ao buscar campeonatos:', error);
          set({ error: error.message || 'Erro ao buscar campeonatos', isLoading: false });
        }
      },
      
      addChampionship: (championship) =>
        set((state) => ({
          championships: [...state.championships, championship],
        })),
      
      createChampionship: async (data) => {
        console.log('🔄 Criando campeonato:', data);
        set({ isLoading: true, error: null });
        
        try {
          // Preparar dados para enviar ao backend
          // O backend só aceita: 'futsal', 'chess'
          const resolveSportId = (rawValue?: string): string => {
            if (!rawValue) return 'futsal';

            const normalize = (value: string) =>
              value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[^a-z0-9]/g, '');

            const normalizedInput = normalize(rawValue);

            // Mapeamento para os esportes aceitos pelo backend (apenas futsal e xadrez)
            const sportMap: Record<string, string> = {
              futsal: 'futsal',
              futeboldesalao: 'futsal',
              xadrez: 'chess',
              chess: 'chess',
            };

            return sportMap[normalizedInput] ?? 'futsal';
          };

          const sportId = resolveSportId(data.game);
          
          console.log('📤 Enviando para backend:', {
            name: data.name,
            sport: sportId,
            format: data.format,
            description: data.description,
            startDate: data.startDate,
            maxTeams: data.maxParticipants,
          });

          // Enviar para o backend
          const response = await championshipService.createChampionship({
            name: data.name,
            sport: sportId,
            format: data.format,
            description: data.description,
            startDate: data.startDate,
            maxTeams: data.maxParticipants,
          });

          console.log('✅ Resposta do backend:', response);

          if (response.success) {
            // Adicionar o campeonato retornado pelo backend ao estado local
            console.log('✅ Campeonato criado:', response.data.championship);
            console.log('📊 Estado atual antes de adicionar:', set);
            set((state) => {
              const newChampionships = [...state.championships, response.data.championship];
              console.log('📊 Novo estado com', newChampionships.length, 'campeonatos');
              return {
                championships: newChampionships,
                isLoading: false,
              };
            });
          } else {
            set({ error: 'Erro ao criar campeonato', isLoading: false });
            throw new Error('Erro ao criar campeonato');
          }
        } catch (error: any) {
          console.error('Erro ao criar campeonato:', error);
          set({ error: error.message || 'Erro ao criar campeonato', isLoading: false });
          throw error;
        }
      },
      
      setCurrentChampionship: (championship) =>
        set({ currentChampionship: championship }),
      
      updateChampionship: async (id, data) => {
        console.log('✏️ Atualizando campeonato:', id, data);
        set({ isLoading: true, error: null });
        
        try {
          // Convert Date objects to ISO strings for the backend
          const updateData: any = { ...data };
          if (updateData.startDate instanceof Date) {
            updateData.startDate = updateData.startDate.toISOString();
          }
          if (updateData.registrationDeadline instanceof Date) {
            updateData.registrationDeadline = updateData.registrationDeadline.toISOString();
          }
          if (updateData.endDate instanceof Date) {
            updateData.endDate = updateData.endDate.toISOString();
          }
          
          const response = await championshipService.updateChampionship(id, updateData);
          
          if (response.success && response.data) {
            // Update local state after backend update
            set((state) => ({
              championships: state.championships.map((championship) =>
                championship.id === id ? { ...championship, ...response.data.championship } : championship
              ),
              currentChampionship:
                state.currentChampionship?.id === id
                  ? { ...state.currentChampionship, ...response.data.championship }
                  : state.currentChampionship,
              isLoading: false,
            }));
            console.log('✅ Campeonato atualizado com sucesso');
          }
        } catch (error: any) {
          console.error('❌ Erro ao atualizar campeonato:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      deleteChampionship: async (id) => {
        console.log('🗑️ Deletando campeonato:', id);
        set({ isLoading: true, error: null });
        
        try {
          const response = await championshipService.deleteChampionship(id);
          
          if (response.success) {
            // Remover do estado local após deletar no backend
            set((state) => ({
              championships: state.championships.filter(
                (championship) => championship.id !== id
              ),
              currentChampionship:
                state.currentChampionship?.id === id
                  ? null
                  : state.currentChampionship,
              isLoading: false,
            }));
            console.log('✅ Campeonato deletado com sucesso');
          } else {
            throw new Error(response.message || 'Erro ao deletar campeonato');
          }
        } catch (error: any) {
          console.error('❌ Erro ao deletar campeonato:', error);
          set({ 
            error: error.message || 'Erro ao deletar campeonato',
            isLoading: false 
          });
          throw error;
        }
      },

      removeTeam: (championshipId, teamId) =>
        set((state) => {
          const updatedChampionships = state.championships.map((championship) => {
            if (championship.id !== championshipId) return championship;

            const filteredTeams = championship.teams.filter((team) => team.id !== teamId);
            const filteredGames = championship.games.filter(
              (game) => game.homeTeamId !== teamId && game.awayTeamId !== teamId
            );

            return {
              ...championship,
              teams: filteredTeams,
              games: filteredGames,
            };
          });

          const updatedCurrentChampionship =
            state.currentChampionship?.id === championshipId
              ? updatedChampionships.find((championship) => championship.id === championshipId) || null
              : state.currentChampionship;

          return {
            championships: updatedChampionships,
            currentChampionship: updatedCurrentChampionship,
          };
        }),
      
      addGame: (championshipId, game) =>
        set((state) => ({
          championships: state.championships.map((championship) =>
            championship.id === championshipId
              ? { ...championship, games: [...championship.games, game] }
              : championship
          ),
        })),
      
      updateGame: (gameId, data) =>
        set((state) => {
          const newState = {
            championships: state.championships.map((championship) => {
              const updatedChampionship = {
                ...championship,
                games: championship.games.map((game) =>
                  game.id === gameId ? { ...game, ...data } : game
                ),
              };

              // If game is finished, update team stats
              if (data.status === 'finished' && data.homeScore !== undefined && data.awayScore !== undefined) {
                const game = championship.games.find(g => g.id === gameId);
                if (game) {
                  const homeTeam = championship.teams.find(t => t.id === game.homeTeamId);
                  const awayTeam = championship.teams.find(t => t.id === game.awayTeamId);

                  if (homeTeam && awayTeam) {
                    const homeScore = data.homeScore!;
                    const awayScore = data.awayScore!;
                    const homeWin = homeScore > awayScore;
                    const awayWin = awayScore > homeScore;
                    const draw = homeScore === awayScore;

                    updatedChampionship.teams = championship.teams.map((team) => {
                      if (team.id === homeTeam.id) {
                        return {
                          ...team,
                          stats: {
                            ...team.stats,
                            games: team.stats.games + 1,
                            wins: team.stats.wins + (homeWin ? 1 : 0),
                            draws: team.stats.draws + (draw ? 1 : 0),
                            losses: team.stats.losses + (awayWin ? 1 : 0),
                            goalsFor: team.stats.goalsFor + homeScore,
                            goalsAgainst: team.stats.goalsAgainst + awayScore,
                            points: team.stats.points + (homeWin ? 3 : draw ? 1 : 0),
                          },
                        };
                      }
                      if (team.id === awayTeam.id) {
                        return {
                          ...team,
                          stats: {
                            ...team.stats,
                            games: team.stats.games + 1,
                            wins: team.stats.wins + (awayWin ? 1 : 0),
                            draws: team.stats.draws + (draw ? 1 : 0),
                            losses: team.stats.losses + (homeWin ? 1 : 0),
                            goalsFor: team.stats.goalsFor + awayScore,
                            goalsAgainst: team.stats.goalsAgainst + homeScore,
                            points: team.stats.points + (awayWin ? 3 : draw ? 1 : 0),
                          },
                        };
                      }
                      return team;
                    });
                  }
                }
              }

              return updatedChampionship;
            }),
          };

          // Update current championship if it's the one being modified
          if (state.currentChampionship) {
            const updatedCurrent = newState.championships.find(
              c => c.id === state.currentChampionship?.id
            );
            return {
              ...newState,
              currentChampionship: updatedCurrent || state.currentChampionship,
            };
          }

          return newState;
        }),
      
      addGoal: (gameId, goal) =>
        set((state) => ({
          championships: state.championships.map((championship) => ({
            ...championship,
            games: championship.games.map((game) =>
              game.id === gameId
                ? { ...game, goals: [...(game.goals ?? []), goal] }
                : game
            ),
          })),
        })),
      
      updatePlayerStats: (playerId, stats) =>
        set((state) => ({
          championships: state.championships.map((championship) => ({
            ...championship,
            teams: championship.teams.map((team) => ({
              ...team,
              players: team.players.map((player) =>
                player.id === playerId
                  ? { ...player, stats: { ...player.stats, ...stats } }
                  : player
              ),
            })),
          })),
        })),
      
      addPlayerAchievement: (playerId, achievement) =>
        set((state) => ({
          championships: state.championships.map((championship) => ({
            ...championship,
            teams: championship.teams.map((team) => ({
              ...team,
              players: team.players.map((player) =>
                player.id === playerId
                  ? { ...player, achievements: [...player.achievements, achievement] }
                  : player
              ),
            })),
          })),
        })),
      
      calculateXP: (playerId, action) => {
        const xpValues = {
          play: 10,
          goal: 20,
          assist: 15,
          win: 25,
        };
        
        const xpGained = xpValues[action];
        
        set((state) => ({
          championships: state.championships.map((championship) => ({
            ...championship,
            teams: championship.teams.map((team) => ({
              ...team,
              players: team.players.map((player) =>
                player.id === playerId
                  ? { ...player, xp: player.xp + xpGained }
                  : player
              ),
            })),
          })),
        }));
      },

      clearChampionships: () =>
        set({
          championships: [],
          currentChampionship: null,
        }),
    }),
    {
      name: 'rivalis-championships',
      // NÃO persistir championships - sempre buscar do servidor
      partialize: (state) => ({
        // Não salvar championships no localStorage, apenas currentChampionship
        currentChampionship: state.currentChampionship,
      }),
      // Corrigir datas ao carregar do localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.currentChampionship) {
          const c = state.currentChampionship as any;
          state.currentChampionship = {
            ...c,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            startDate: c.startDate ? new Date(c.startDate) : undefined,
            endDate: c.endDate ? new Date(c.endDate) : undefined,
            registrationDeadline: c.registrationDeadline ? new Date(c.registrationDeadline) : undefined,
            games: c.games?.map((game: any) => ({
              ...game,
              playedAt: game.playedAt ? new Date(game.playedAt) : undefined,
            })) || [],
          };
        }
      },
    }
  )
);