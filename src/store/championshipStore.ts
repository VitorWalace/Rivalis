import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Championship, Player, Game, Goal, Achievement } from '../types';

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
  addChampionship: (championship: Championship) => void;
  createChampionship: (data: CreateChampionshipData) => Promise<void>;
  setCurrentChampionship: (championship: Championship | null) => void;
  updateChampionship: (id: string, data: Partial<Championship>) => void;
  addGame: (championshipId: string, game: Game) => void;
  updateGame: (gameId: string, data: Partial<Game>) => void;
  addGoal: (gameId: string, goal: Goal) => void;
  updatePlayerStats: (playerId: string, stats: Partial<Player['stats']>) => void;
  addPlayerAchievement: (playerId: string, achievement: Achievement) => void;
  calculateXP: (playerId: string, action: 'goal' | 'assist' | 'win' | 'play') => void;
}

export const useChampionshipStore = create<ChampionshipState>()(
  persist(
    (set) => ({
      championships: [],
      currentChampionship: null,
      
      addChampionship: (championship) =>
        set((state) => ({
          championships: [...state.championships, championship],
        })),
      
      createChampionship: async (data) => {
        const newChampionship: Championship = {
          id: crypto.randomUUID(),
          name: data.name,
          sport: data.game === 'Futsal' ? 'futsal' : 'football',
          adminId: data.organizerId,
          teams: [],
          games: [],
          status: 'draft',
          createdAt: new Date(),
          startDate: new Date(data.startDate),
        };
        
        set((state) => ({
          championships: [...state.championships, newChampionship],
        }));
      },
      
      setCurrentChampionship: (championship) =>
        set({ currentChampionship: championship }),
      
      updateChampionship: (id, data) =>
        set((state) => ({
          championships: state.championships.map((championship) =>
            championship.id === id ? { ...championship, ...data } : championship
          ),
          currentChampionship:
            state.currentChampionship?.id === id
              ? { ...state.currentChampionship, ...data }
              : state.currentChampionship,
        })),
      
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
              game.id === gameId ? { ...game, goals: [...game.goals, goal] } : game
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
    }),
    {
      name: 'rivalis-championships',
      // Corrigir datas ao carregar do localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.championships) {
          state.championships = state.championships.map((championship: any) => ({
            ...championship,
            createdAt: championship.createdAt ? new Date(championship.createdAt) : new Date(),
            startDate: championship.startDate ? new Date(championship.startDate) : undefined,
            endDate: championship.endDate ? new Date(championship.endDate) : undefined,
            games: championship.games?.map((game: any) => ({
              ...game,
              playedAt: game.playedAt ? new Date(game.playedAt) : undefined,
            })) || [],
          }));
        }
      },
    }
  )
);