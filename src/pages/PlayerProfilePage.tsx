import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';

export function PlayerProfilePage() {
  const { championshipId, playerId } = useParams<{ championshipId: string; playerId: string }>();
  const navigate = useNavigate();
  
  const championships = useChampionshipStore((state) => state.championships);
  const championship = championships.find(c => c.id === championshipId);
  
  if (!championship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campeonato não encontrado</h2>
          <Link to="/dashboard" className="text-primary-600 hover:text-primary-700">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Find player across all teams
  let player = null;
  let playerTeam = null;
  
  for (const team of championship.teams) {
    const foundPlayer = team.players.find(p => p.id === playerId);
    if (foundPlayer) {
      player = foundPlayer;
      playerTeam = team;
      break;
    }
  }

  if (!player || !playerTeam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Jogador não encontrado</h2>
          <Link to={`/championship/${championshipId}`} className="text-primary-600 hover:text-primary-700">
            Voltar ao Campeonato
          </Link>
        </div>
      </div>
    );
  }

  // Calculate additional stats
  const totalGames = player.stats.games;
  const winRate = totalGames > 0 ? Math.round((player.stats.wins / totalGames) * 100) : 0;
  const goalsPerGame = totalGames > 0 ? (player.stats.goals / totalGames).toFixed(1) : '0.0';
  const assistsPerGame = totalGames > 0 ? (player.stats.assists / totalGames).toFixed(1) : '0.0';

  // Get player's goals in games for detailed stats
  const playerGoals = championship.games
    .flatMap(game => game.goals)
    .filter(goal => goal.playerId === player.id);

  const playerAssists = championship.games
    .flatMap(game => game.goals)
    .filter(goal => goal.assistPlayerId === player.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(`/championship/${championshipId}`)}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Perfil do Jogador</h1>
              <p className="text-sm text-gray-600">{championship.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Player Header */}
        <div className="card p-8 mb-8">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
              {player.name.charAt(0)}
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{player.name}</h2>
              <p className="text-lg text-gray-600 mb-4">{playerTeam.name}</p>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{player.xp}</p>
                  <p className="text-sm text-gray-600">Pontos XP</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{player.stats.games}</p>
                  <p className="text-sm text-gray-600">Jogos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{winRate}%</p>
                  <p className="text-sm text-gray-600">Taxa de Vitória</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Statistics */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
              Estatísticas
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{player.stats.goals}</p>
                <p className="text-sm text-gray-600 mt-1">Gols</p>
                <p className="text-xs text-gray-500">{goalsPerGame} por jogo</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{player.stats.assists}</p>
                <p className="text-sm text-gray-600 mt-1">Assistências</p>
                <p className="text-xs text-gray-500">{assistsPerGame} por jogo</p>
              </div>
              
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600">{player.stats.wins}</p>
                <p className="text-sm text-gray-600 mt-1">Vitórias</p>
                <p className="text-xs text-gray-500">
                  {player.stats.draws} empates, {player.stats.losses} derrotas
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{player.xp}</p>
                <p className="text-sm text-gray-600 mt-1">Total XP</p>
                <p className="text-xs text-gray-500">
                  {totalGames > 0 ? Math.round(player.xp / totalGames) : 0} XP por jogo
                </p>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
              Medalhas e Conquistas
            </h3>
            
            {player.achievements.length === 0 ? (
              <div className="text-center py-8">
                <TrophyIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma conquista ainda</p>
                <p className="text-sm text-gray-400 mt-1">
                  Continue jogando para desbloquear medalhas!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {player.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="text-center p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    title={achievement.description}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <p className="font-medium text-gray-900 text-sm">{achievement.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                    <p className="text-xs text-primary-600 font-medium mt-1">
                      +{achievement.xpReward} XP
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance History */}
        <div className="card p-6 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Histórico de Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Goals History */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Gols Marcados</h4>
              {playerGoals.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum gol marcado ainda</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {playerGoals.map((goal) => {
                    const game = championship.games.find(g => g.id === goal.gameId);
                    const homeTeam = championship.teams.find(t => t.id === game?.homeTeamId);
                    const awayTeam = championship.teams.find(t => t.id === game?.awayTeamId);
                    
                    return (
                      <div key={goal.id} className="text-sm bg-blue-50 p-3 rounded">
                        <p className="font-medium">
                          {homeTeam?.name} vs {awayTeam?.name}
                        </p>
                        <p className="text-gray-600">
                          Rodada {game?.round} • {goal.type === 'penalty' ? 'Pênalti' : 'Gol'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assists History */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Assistências</h4>
              {playerAssists.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma assistência ainda</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {playerAssists.map((assist) => {
                    const game = championship.games.find(g => g.id === assist.gameId);
                    const homeTeam = championship.teams.find(t => t.id === game?.homeTeamId);
                    const awayTeam = championship.teams.find(t => t.id === game?.awayTeamId);
                    const scorer = championship.teams
                      .flatMap(t => t.players)
                      .find(p => p.id === assist.playerId);
                    
                    return (
                      <div key={assist.id} className="text-sm bg-green-50 p-3 rounded">
                        <p className="font-medium">
                          {homeTeam?.name} vs {awayTeam?.name}
                        </p>
                        <p className="text-gray-600">
                          Rodada {game?.round} • Assistência para {scorer?.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}