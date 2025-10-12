import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Championship,
  Player,
  Game,
  Goal,
  Achievement,
  SportDefinition,
  SportId,
} from '../types/index.ts';
import { DEFAULT_SPORT_ID, SPORTS_CATALOG, getSportDefinition } from '../config/sportsCatalog.ts';

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
  deleteChampionship: (id: string) => void;
  removeTeam: (championshipId: string, teamId: string) => void;
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
        const resolveSportId = (rawValue?: string): SportId => {
          if (!rawValue) return DEFAULT_SPORT_ID;

          const normalize = (value: string) =>
            value
              .toLowerCase()
              .normalize('NFD')
              .replace(/[^a-z0-9]/g, '');

          const normalizedInput = normalize(rawValue);

          const directMatch = SPORTS_CATALOG.find((sport) => normalize(sport.id) === normalizedInput);
          if (directMatch) {
            return directMatch.id;
          }

          const nameMatch = SPORTS_CATALOG.find((sport) => normalize(sport.name) === normalizedInput);
          if (nameMatch) {
            return nameMatch.id;
          }

          const aliasMap: Record<string, SportId> = {
            futeboldecampo: 'football',
            futebol: 'football',
            soccer: 'football',
            society: 'society',
            beachsoccer: 'beach-soccer',
            voleidepraia: 'beach-volleyball',
            voleipraia: 'beach-volleyball',
            tenisdemesa: 'table-tennis',
            pingpong: 'table-tennis',
            artesmarciais: 'mma',
          };

          return aliasMap[normalizedInput] ?? DEFAULT_SPORT_ID;
        };

        const sportId = resolveSportId(data.game);
        const sportDefinition: SportDefinition | undefined = getSportDefinition(sportId);
        const sportConfig = sportDefinition ?? getSportDefinition(DEFAULT_SPORT_ID);
        type Visibility = NonNullable<Championship['visibility']>;
        type Status = Championship['status'];
        const allowedVisibility: Visibility[] = ['public', 'private', 'inviteOnly'];
        const allowedStatus: Status[] = ['draft', 'active', 'finished'];
        const rawVisibility = data.visibility as Championship['visibility'];
        const normalizedVisibility: Visibility = rawVisibility && allowedVisibility.includes(rawVisibility as Visibility)
          ? (rawVisibility as Visibility)
          : 'public';
        const rawStatus = data.status as Championship['status'];
        const normalizedStatus: Status = rawStatus && allowedStatus.includes(rawStatus)
          ? rawStatus
          : 'draft';

        const newChampionship: Championship = {
          id: crypto.randomUUID(),
          name: data.name,
          sport: sportConfig?.id ?? DEFAULT_SPORT_ID,
          adminId: data.organizerId,
          description: data.description,
          format: data.format,
          visibility: normalizedVisibility,
          maxParticipants: data.maxParticipants,
          currentParticipants: data.currentParticipants,
          registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
          hasEntryFee: data.hasEntryFee,
          entryFee: data.entryFee,
          prizePool: data.prizePool,
          prizeDistribution: data.prizeDistribution,
          teams: [],
          games: [],
          status: normalizedStatus,
          createdAt: new Date(),
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          sportConfig: sportConfig,
          sportCategory: sportConfig?.category,
          matchFormatConfig: sportConfig?.matchFormat,
          scoringConfig: sportConfig?.scoring,
          performanceMetricsConfig: sportConfig?.performanceMetrics,
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
      
      deleteChampionship: (id) =>
        set((state) => ({
          championships: state.championships.filter(
            (championship) => championship.id !== id
          ),
          currentChampionship:
            state.currentChampionship?.id === id
              ? null
              : state.currentChampionship,
        })),

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
            registrationDeadline: championship.registrationDeadline ? new Date(championship.registrationDeadline) : undefined,
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