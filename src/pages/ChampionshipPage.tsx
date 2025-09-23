import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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
import { gamesService } from '../services/gamesService';
import { championshipAPI } from '../services/enhancedApi';
import type { Game } from '../types';

type TabType = 'highlights' | 'games' | 'standings' | 'players';

export function ChampionshipPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('highlights');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingRound, setIsGeneratingRound] = useState(false);
  
  const championships = useChampionshipStore((state) => state.championships);
  const setCurrentChampionship = useChampionshipStore((state) => state.setCurrentChampionship);
  const updateChampionship = useChampionshipStore((state) => state.updateChampionship);
  const user = useAuthStore((state) => state.user);

  const championship = championships.find(c => c.id === id);

  // Sempre que a página carregar ou id mudar, sincroniza com backend
  useEffect(() => {
    const sync = async () => {
      if (!id) return;
      try {
  const resp: any = await championshipAPI.getById(id);
  const backendChamp = resp?.data?.championship || resp?.data || resp?.championship;
        if (backendChamp) {
          updateChampionship(backendChamp.id, backendChamp); // garante merge
          setCurrentChampionship(backendChamp);
        }
      } catch (e) {
        console.warn('Falha ao sincronizar campeonato com backend', e);
      }
    };
    sync();
  }, [id, updateChampionship, setCurrentChampionship]);

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

  const isAdmin = championship.createdBy === user?.id || championship.adminId === user?.id;

  const handleGameResultClick = (game: Game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  const handleGenerateRound = async () => {
    if (!championship?.id) return;
    setIsGeneratingRound(true);
    try {
      const response: any = await gamesService.generateRound(championship.id);
      if (response?.success) {
        toast.success(`${response.message}! ${response.data?.totalGames || response.data?.games?.length || 0} jogos criados.`);
        // Atualiza estado local sem reload
        const refreshed: any = await gamesService.getGamesByChampionship(championship.id);
        const games = refreshed?.data?.games || refreshed?.games || [];
        updateChampionship(championship.id, { games });
      } else {
        toast.error(response?.message || 'Erro ao gerar rodada');
      }
    } catch (error: any) {
      console.error('Erro ao gerar rodada:', error);
      const msg = error?.message || error?.response?.data?.message || 'Erro ao gerar rodada';
      toast.error(msg);
    } finally {
      setIsGeneratingRound(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <Logo size="sm" variant="colored" showText={true} />
              <div className="ml-6 border-l border-gray-200 pl-6">
                <h1 className="text-xl font-semibold text-gray-900">{championship.name}</h1>
                <p className="text-sm text-gray-600 capitalize">
                  {championship.sport === 'football' ? 'Futebol de Campo' : 'Futsal'}
                  {isAdmin && ' • Administrador'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <button
                  onClick={() => navigate(`/championship/${championship.id}/teams`)}
                  className="btn-primary text-sm"
                >
                  Gerenciar Times
                </button>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  championship.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : championship.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {championship.status === 'active' && 'Ativo'}
                {championship.status === 'draft' && 'Rascunho'}
                {championship.status === 'finished' && 'Finalizado'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Highlights Tab */}
        {activeTab === 'highlights' && (
          <div className="space-y-8">
            {/* Player of the Round */}
            {playerOfRound && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  Jogador da Rodada
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {playerOfRound.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{playerOfRound.name}</h3>
                    <p className="text-gray-600">
                      {championship.teams.find(t => t.id === playerOfRound.teamId)?.name}
                    </p>
                    <p className="text-sm text-primary-600 font-medium">{playerOfRound.xp} XP</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Scorers */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  ⚽ Artilheiros
                </h3>
                <div className="space-y-3">
                  {topScorers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500 w-4">
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{player.name}</p>
                          <p className="text-xs text-gray-600">
                            {championship.teams.find(t => t.id === player.teamId)?.name}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-primary-600">{player.stats.goals}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Assists */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  🍽️ Líderes de Assistência
                </h3>
                <div className="space-y-3">
                  {topAssists.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500 w-4">
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{player.name}</p>
                          <p className="text-xs text-gray-600">
                            {championship.teams.find(t => t.id === player.teamId)?.name}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-primary-600">{player.stats.assists}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MVP Ranking */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  ⭐ Ranking MVP (XP)
                </h3>
                <div className="space-y-3">
                  {topXP.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500 w-4">
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{player.name}</p>
                          <p className="text-xs text-gray-600">
                            {championship.teams.find(t => t.id === player.teamId)?.name}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-primary-600">{player.xp}</span>
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
            {/* Header com estatísticas e ações */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Jogos</h2>
                <p className="text-gray-600 mt-1">
                  {championship.games.length} jogos • {championship.games.filter(g => g.status === 'finished').length} finalizados
                </p>
              </div>
              
              {isAdmin && (
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/games/create?championshipId=${championship.id}`}
                    className="btn-primary flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Novo Jogo
                  </Link>
                  
                  <div className="relative">
                    <button 
                      onClick={handleGenerateRound}
                      disabled={isGeneratingRound || championship.teams.length < 2}
                      className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={championship.teams.length < 2 ? 'É necessário pelo menos 2 times para gerar uma rodada' : 'Gerar nova rodada automaticamente'}
                    >
                      {isGeneratingRound ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Gerando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Gerar Rodada
                        </>
                      )}
                    </button>
                    
                    {championship.teams.length < 2 && (
                      <div className="absolute -bottom-8 left-0 text-xs text-gray-500 whitespace-nowrap">
                        Adicione mais times primeiro
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Agendados</p>
                    <p className="text-lg font-bold text-blue-900">
                      {championship.games.filter(g => g.status === 'scheduled').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Finalizados</p>
                    <p className="text-lg font-bold text-green-900">
                      {championship.games.filter(g => g.status === 'finished').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-900">Ao Vivo</p>
                    <p className="text-lg font-bold text-red-900">
                      {championship.games.filter(g => g.status === 'live').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-900">Pendentes</p>
                    <p className="text-lg font-bold text-yellow-900">
                      {championship.games.filter(g => g.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lista de jogos por rodada */}
            {Object.entries(gamesByRound).length > 0 ? (
              Object.entries(gamesByRound).map(([round, games]) => (
                <div key={round} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Rodada {round}</h3>
                    <span className="text-sm text-gray-500">{games.length} jogos</span>
                  </div>
                  
                  <div className="space-y-3">
                    {games.map((game) => {
                      const homeTeam = championship.teams.find(t => t.id === game.homeTeamId);
                      const awayTeam = championship.teams.find(t => t.id === game.awayTeamId);
                      
                      const getStatusConfig = (status: string) => {
                        switch (status) {
                          case 'live':
                            return { color: 'text-red-600 bg-red-50 border-red-200', text: '🔴 Ao Vivo' };
                          case 'finished':
                            return { color: 'text-green-600 bg-green-50 border-green-200', text: '✅ Finalizado' };
                          case 'scheduled':
                            return { color: 'text-blue-600 bg-blue-50 border-blue-200', text: '📅 Agendado' };
                          case 'paused':
                            return { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', text: '⏸️ Pausado' };
                          case 'cancelled':
                            return { color: 'text-gray-600 bg-gray-50 border-gray-200', text: '❌ Cancelado' };
                          default:
                            return { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', text: '⏳ Pendente' };
                        }
                      };
                      
                      const statusConfig = getStatusConfig(game.status);
                      
                      return (
                        <div key={game.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            {/* Teams */}
                            <div className="flex items-center flex-1 space-x-4">
                              <div className="text-center min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{homeTeam?.name || 'Time não encontrado'}</p>
                                {homeTeam?.color && (
                                  <div 
                                    className="w-4 h-2 mx-auto mt-1 rounded-sm"
                                    style={{ backgroundColor: homeTeam.color }}
                                  />
                                )}
                              </div>
                              
                              {/* Score/VS */}
                              <div className="text-center px-4">
                                {game.status === 'finished' ? (
                                  <span className="font-bold text-xl text-gray-900">
                                    {game.homeScore} x {game.awayScore}
                                  </span>
                                ) : game.status === 'live' ? (
                                  <div className="text-center">
                                    <span className="font-bold text-lg text-red-600">
                                      {game.homeScore || 0} x {game.awayScore || 0}
                                    </span>
                                    <div className="text-xs text-red-500 animate-pulse">● AO VIVO</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 font-medium">vs</span>
                                )}
                              </div>
                              
                              <div className="text-center min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{awayTeam?.name || 'Time não encontrado'}</p>
                                {awayTeam?.color && (
                                  <div 
                                    className="w-4 h-2 mx-auto mt-1 rounded-sm"
                                    style={{ backgroundColor: awayTeam.color }}
                                  />
                                )}
                              </div>
                            </div>
                            
                            {/* Status e ações */}
                            <div className="ml-4 flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                {statusConfig.text}
                              </span>
                              
                              {isAdmin && (
                                <div className="flex gap-2">
                                  {(game.status === 'pending' || game.status === 'scheduled') && (
                                    <button 
                                      onClick={() => handleGameResultClick(game)}
                                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                      Iniciar
                                    </button>
                                  )}
                                  
                                  {game.status === 'live' && (
                                    <button 
                                      onClick={() => handleGameResultClick(game)}
                                      className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                                    >
                                      Gerenciar
                                    </button>
                                  )}
                                  
                                  {game.status === 'finished' && (
                                    <button 
                                      onClick={() => handleGameResultClick(game)}
                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                    >
                                      Editar
                                    </button>
                                  )}
                                  
                                  <Link
                                    to={`/game/${game.id}`}
                                    className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
                                  >
                                    Detalhes
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Informações adicionais */}
                          {(game.scheduledAt || game.venue) && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {game.scheduledAt && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(game.scheduledAt).toLocaleString('pt-BR')}
                                  </div>
                                )}
                                {game.venue && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {game.venue}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum jogo encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">Comece criando o primeiro jogo do campeonato.</p>
                {isAdmin && (
                  <div className="mt-6">
                    <Link
                      to={`/games/create?championshipId=${championship.id}`}
                      className="btn-primary"
                    >
                      Criar Primeiro Jogo
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Classificação</h2>
            
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        J
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        V
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        D
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GP
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GC
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SG
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {standings.map((team, index) => {
                      const goalDiff = team.stats.goalsFor - team.stats.goalsAgainst;
                      return (
                        <tr key={team.id} className={index < 3 ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}º
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {team.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {team.stats.games}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {team.stats.wins}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {team.stats.draws}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {team.stats.losses}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {team.stats.goalsFor}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {team.stats.goalsAgainst}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {goalDiff > 0 ? '+' : ''}{goalDiff}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
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
            <h2 className="text-2xl font-bold text-gray-900">Jogadores</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlayers.map((player) => {
                const team = championship.teams.find(t => t.id === player.teamId);
                return (
                  <Link
                    key={player.id}
                    to={`/championship/${championship.id}/player/${player.id}`}
                    className="card p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{player.name}</h3>
                        <p className="text-sm text-gray-600">{team?.name}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{player.stats.goals}</p>
                        <p className="text-gray-600">Gols</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{player.stats.assists}</p>
                        <p className="text-gray-600">Assistências</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{player.stats.games}</p>
                        <p className="text-gray-600">Jogos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-primary-600">{player.xp}</p>
                        <p className="text-gray-600">XP</p>
                      </div>
                    </div>
                    
                    {player.achievements.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-1">
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
                            <span className="text-xs text-gray-500">
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