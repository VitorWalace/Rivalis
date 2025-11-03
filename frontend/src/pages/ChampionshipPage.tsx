import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  StarIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { useAuthStore } from '../store/authStore';
import { GameResultModal } from '../components/GameResultModal';
import { Logo } from '../components/Logo';
import type { Game } from '../types/index.ts';
import { getSportDisplayName, getSportIcon } from '../config/sportsCatalog.ts';

type TabType = 'highlights' | 'games' | 'standings' | 'players';

export function ChampionshipPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('highlights');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const championships = useChampionshipStore((state) => state.championships);
  const setCurrentChampionship = useChampionshipStore((state) => state.setCurrentChampionship);
  const user = useAuthStore((state) => state.user);

  const championship = championships.find(c => c.id === id);

  useEffect(() => {
    if (championship) {
      setCurrentChampionship(championship);
    }
  }, [championship, setCurrentChampionship]);

  if (!championship) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-10 text-center shadow-xl shadow-slate-950/40 backdrop-blur">
          <h2 className="mb-2 text-2xl font-bold text-white">Campeonato não encontrado</h2>
          <Link to="/dashboard" className="text-blue-300 transition hover:text-blue-200">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = championship.adminId === user?.id;

  const handleGameResultClick = (game: Game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  // Calculate player rankings
  const allPlayers = championship.teams.flatMap(team => team.players);
  const topScorers = [...allPlayers].sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 5);
  const topAssists = [...allPlayers].sort((a, b) => b.stats.assists - a.stats.assists).slice(0, 5);
  const topXP = [...allPlayers].sort((a, b) => b.xp - a.xp).slice(0, 5);

  // Find player of the round (most XP gained in last completed round)
  const playerOfRound = topXP[0]; // Simplified for now

  // Calculate team standings
  const standings = [...championship.teams].sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
    const goalDiffA = a.stats.goalsFor - a.stats.goalsAgainst;
    const goalDiffB = b.stats.goalsFor - b.stats.goalsAgainst;
    if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
    return b.stats.goalsFor - a.stats.goalsFor;
  });

  // Group games by round
  const gamesByRound = championship.games.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = [];
    acc[game.round].push(game);
    return acc;
  }, {} as Record<number, typeof championship.games>);

  const tabs = [
    { id: 'highlights', name: 'Destaques', icon: StarIcon },
    { id: 'games', name: 'Jogos', icon: CalendarIcon },
    { id: 'standings', name: 'Classificação', icon: ChartBarIcon },
    { id: 'players', name: 'Jogadores', icon: UsersIcon },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_65%)]" />
      <div className="relative">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-blue-300/60 hover:bg-blue-500/20 hover:text-white"
              aria-label="Voltar ao dashboard"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <Logo size="sm" variant="colored" showText={true} />
            <div className="ml-6 hidden border-l border-white/10 pl-6 sm:block">
              <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
                <span aria-hidden>{getSportIcon(championship.sport)}</span>
                {championship.name}
              </h1>
              <p className="text-sm capitalize text-slate-300">
                {getSportDisplayName(championship.sport)}
                {isAdmin && ' • Administrador'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-4 py-1 text-sm font-semibold tracking-wide backdrop-blur ${
                championship.status === 'active'
                  ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
                  : championship.status === 'draft'
                  ? 'border border-yellow-400/50 bg-yellow-500/20 text-yellow-100'
                  : 'border border-slate-400/50 bg-slate-500/20 text-slate-100'
              }`}
            >
              {championship.status === 'active' && 'Em andamento'}
              {championship.status === 'draft' && 'Em preparação'}
              {championship.status === 'finished' && 'Finalizado'}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 border-b-2 pb-3 pt-4 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-200'
                      : 'border-transparent text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
  <main className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Highlights Tab */}
        {activeTab === 'highlights' && (
          <div className="space-y-8">
            {/* Player of the Round */}
            {playerOfRound && (
              <div className="card p-6">
                <h2 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <StarIcon className="mr-2 h-5 w-5 text-yellow-300" />
                  Jogador da Rodada
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-xl font-bold text-white shadow-lg shadow-yellow-900/30">
                    {playerOfRound.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{playerOfRound.name}</h3>
                    <p className="text-slate-300">
                      {championship.teams.find(t => t.id === playerOfRound.teamId)?.name}
                    </p>
                    <p className="text-sm font-medium text-blue-200">{playerOfRound.xp} XP</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Scorers */}
              <div className="card p-6">
                <h3 className="mb-4 flex items-center font-semibold text-white">
                  ⚽ Artilheiros
                </h3>
                <div className="space-y-3">
                  {topScorers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-4 text-sm font-medium text-slate-400">
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-medium text-white">{player.name}</p>
                          <p className="text-xs text-slate-300">
                            {championship.teams.find(t => t.id === player.teamId)?.name}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-blue-200">{player.stats.goals}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Assists */}
              <div className="card p-6">
                <h3 className="mb-4 flex items-center font-semibold text-white">
                  🍽️ Líderes de Assistência
                </h3>
                <div className="space-y-3">
                  {topAssists.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-4 text-sm font-medium text-slate-400">
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-medium text-white">{player.name}</p>
                          <p className="text-xs text-slate-300">
                            {championship.teams.find(t => t.id === player.teamId)?.name}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-blue-200">{player.stats.assists}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MVP Ranking */}
              <div className="card p-6">
                <h3 className="mb-4 flex items-center font-semibold text-white">
                  ⭐ Ranking MVP (XP)
                </h3>
                <div className="space-y-3">
                  {topXP.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-4 text-sm font-medium text-slate-400">
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-medium text-white">{player.name}</p>
                          <p className="text-xs text-slate-300">
                            {championship.teams.find(t => t.id === player.teamId)?.name}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-blue-200">{player.xp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Jogos</h2>
            
            {Object.entries(gamesByRound).map(([round, games]) => (
              <div key={round} className="card p-6">
                <h3 className="mb-4 font-semibold text-white">Rodada {round}</h3>
                <div className="space-y-3">
                  {games.map((game) => {
                    const homeTeam = championship.teams.find(t => t.id === game.homeTeamId);
                    const awayTeam = championship.teams.find(t => t.id === game.awayTeamId);
                    
                    return (
                      <div key={game.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-center min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{homeTeam?.name}</p>
                          </div>
                          
                          <div className="text-center px-4">
                            {game.status === 'finished' ? (
                              <span className="text-lg font-bold text-white">
                                {game.homeScore} x {game.awayScore}
                              </span>
                            ) : (
                              <span className="text-slate-400">vs</span>
                            )}
                          </div>
                          
                          <div className="text-center min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{awayTeam?.name}</p>
                          </div>
                        </div>
                        
                        <div className="ml-auto">
                          {game.status === 'pending' && isAdmin ? (
                            <button 
                              onClick={() => handleGameResultClick(game)}
                              className="btn-primary text-sm"
                            >
                              Lançar Resultado
                            </button>
                          ) : game.status === 'finished' ? (
                            <span className="text-sm font-medium text-emerald-200">Finalizado</span>
                          ) : (
                            <span className="text-sm text-slate-400">Pendente</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Classificação</h2>
            
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        Pos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        Time
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        J
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        V
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        E
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        D
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        GP
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        GC
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        SG
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/40">
                    {standings.map((team, index) => {
                      const goalDiff = team.stats.goalsFor - team.stats.goalsAgainst;
                      return (
                        <tr key={team.id} className={index < 3 ? 'bg-emerald-500/10' : ''}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                            {index + 1}º
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                            {team.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-300">
                            {team.stats.games}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-300">
                            {team.stats.wins}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-300">
                            {team.stats.draws}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-300">
                            {team.stats.losses}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-300">
                            {team.stats.goalsFor}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-300">
                            {team.stats.goalsAgainst}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-300">
                            {goalDiff > 0 ? '+' : ''}{goalDiff}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-white">
                            {team.stats.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Jogadores</h2>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allPlayers.map((player) => {
                const team = championship.teams.find(t => t.id === player.teamId);
                return (
                  <Link
                    key={player.id}
                    to={`/championship/${championship.id}/player/${player.id}`}
                    className="card cursor-pointer p-5 transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{player.name}</h3>
                        <p className="text-sm text-slate-300">{team?.name}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{player.stats.goals}</p>
                        <p>Gols</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{player.stats.assists}</p>
                        <p>Assistências</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{player.stats.games}</p>
                        <p>Jogos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-200">{player.xp}</p>
                        <p>XP</p>
                      </div>
                    </div>
                    
                    {player.achievements.length > 0 && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <div className="flex flex-wrap gap-2 text-lg">
                          {player.achievements.slice(0, 3).map((achievement) => (
                            <span
                              key={achievement.id}
                              className="text-lg"
                              title={achievement.name}
                            >
                              {achievement.icon}
                            </span>
                          ))}
                          {player.achievements.length > 3 && (
                            <span className="text-xs text-slate-400">
                              +{player.achievements.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      </div>
      {/* Game Result Modal */}
      {selectedGame && (
        <GameResultModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          game={selectedGame}
          homeTeam={championship.teams.find(t => t.id === selectedGame.homeTeamId)!}
          awayTeam={championship.teams.find(t => t.id === selectedGame.awayTeamId)!}
        />
      )}
    </div>
  );
}