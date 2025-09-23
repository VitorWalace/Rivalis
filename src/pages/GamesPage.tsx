import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  CalendarIcon, 
  ClockIcon,
  MapPinIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { formatDate } from '../utils';

// Status dos jogos com cores e ícones
const gameStatusConfig = {
  scheduled: {
    label: 'Agendado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CalendarIcon,
    iconColor: 'text-blue-600'
  },
  live: {
    label: 'Ao Vivo',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: PlayIcon,
    iconColor: 'text-red-600'
  },
  paused: {
    label: 'Pausado',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: PauseIcon,
    iconColor: 'text-yellow-600'
  },
  finished: {
    label: 'Finalizado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon,
    iconColor: 'text-green-600'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircleIcon,
    iconColor: 'text-gray-600'
  }
};

interface GameCardProps {
  game: any;
  championship: any;
  onViewDetails: (gameId: string) => void;
  onEditGame: (gameId: string) => void;
}

function GameCard({ game, championship, onViewDetails, onEditGame }: GameCardProps) {
  const homeTeam = championship.teams.find((t: any) => t.id === game.homeTeamId);
  const awayTeam = championship.teams.find((t: any) => t.id === game.awayTeamId);
  const status = gameStatusConfig[game.status as keyof typeof gameStatusConfig] || gameStatusConfig.scheduled;
  const StatusIcon = status.icon;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
      {/* Header com status e rodada */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${status.color}`}>
            <StatusIcon className={`h-4 w-4 ${status.iconColor}`} />
            <span className="text-sm font-semibold">{status.label}</span>
          </div>
          <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Rodada {game.round}
          </span>
        </div>
        <div className="text-sm text-slate-500">
          {championship.name}
        </div>
      </div>

      {/* Confronto */}
      <div className="flex items-center justify-between mb-6">
        {/* Time da casa */}
        <div className="flex items-center space-x-3 flex-1">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: homeTeam?.color || '#6B7280' }}
          >
            {homeTeam?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-lg">{homeTeam?.name || 'Time Casa'}</h3>
            <p className="text-sm text-slate-600">Mandante</p>
          </div>
        </div>

        {/* Placar ou VS */}
        <div className="px-6">
          {game.status === 'finished' && game.homeScore !== null && game.awayScore !== null ? (
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                {game.homeScore} - {game.awayScore}
              </div>
              <div className="text-xs text-slate-500 mt-1">Final</div>
            </div>
          ) : game.status === 'live' && game.homeScore !== null && game.awayScore !== null ? (
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {game.homeScore} - {game.awayScore}
              </div>
              <div className="text-xs text-red-500 mt-1 animate-pulse">AO VIVO</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">VS</div>
              <div className="text-xs text-slate-500 mt-1">
                {game.scheduledAt ? formatDate(new Date(game.scheduledAt)) : 'A definir'}
              </div>
            </div>
          )}
        </div>

        {/* Time visitante */}
        <div className="flex items-center space-x-3 flex-1 flex-row-reverse">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: awayTeam?.color || '#6B7280' }}
          >
            {awayTeam?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 text-right">
            <h3 className="font-bold text-slate-900 text-lg">{awayTeam?.name || 'Time Visitante'}</h3>
            <p className="text-sm text-slate-600">Visitante</p>
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      {(game.scheduledAt || game.venue) && (
        <div className="flex items-center justify-between text-sm text-slate-600 mb-4 pt-4 border-t border-slate-100">
          {game.scheduledAt && (
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4" />
              <span>{new Date(game.scheduledAt).toLocaleString('pt-BR')}</span>
            </div>
          )}
          {game.venue && (
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-4 w-4" />
              <span>{game.venue}</span>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={() => onViewDetails(game.id)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <span>Ver detalhes</span>
          <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <button
          onClick={() => onEditGame(game.id)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          Editar
        </button>
      </div>
    </div>
  );
}

export function GamesPage() {
  const navigate = useNavigate();
  const championships = useChampionshipStore((state) => state.championships);

  const [selectedChampionship, setSelectedChampionship] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRound, setSelectedRound] = useState<string>('all');

  // Coletar todos os jogos de todos os campeonatos
  const allGames = championships.flatMap(championship => 
    championship.games.map(game => ({
      ...game,
      championship
    }))
  );

  // Filtrar jogos
  const filteredGames = allGames.filter(game => {
    const matchesChampionship = selectedChampionship === 'all' || game.championship.id === selectedChampionship;
    const matchesStatus = selectedStatus === 'all' || game.status === selectedStatus;
    const matchesRound = selectedRound === 'all' || game.round.toString() === selectedRound;
    
    const homeTeam = game.championship.teams.find((t: any) => t.id === game.homeTeamId);
    const awayTeam = game.championship.teams.find((t: any) => t.id === game.awayTeamId);
    const matchesSearch = searchTerm === '' || 
      homeTeam?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      awayTeam?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.championship.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesChampionship && matchesStatus && matchesRound && matchesSearch;
  });

  // Estatísticas rápidas
  const stats = {
    total: allGames.length,
    scheduled: allGames.filter(g => g.status === 'scheduled').length,
    live: allGames.filter(g => g.status === 'live').length,
    finished: allGames.filter(g => g.status === 'finished').length,
    thisWeek: allGames.filter(g => {
      if (!g.scheduledAt) return false;
      const gameDate = new Date(g.scheduledAt);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return gameDate >= weekStart && gameDate <= weekEnd;
    }).length
  };

  const handleViewDetails = (gameId: string) => {
    // Navegar para página de detalhes do jogo
    navigate(`/game/${gameId}`);
  };

  const handleEditGame = (gameId: string) => {
    // Navegar para página de edição do jogo
    navigate(`/game/${gameId}/edit`);
  };

  const handleCreateGame = () => {
    navigate('/games/create');
  };

  // Obter rodadas únicas
  const allRounds = [...new Set(allGames.map(g => g.round))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/60 border-b border-slate-200/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <PlayIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-emerald-900 bg-clip-text text-transparent">
                  Gerenciar Jogos
                </h1>
              </div>
              <p className="text-xl text-slate-600 max-w-2xl">
                Gerencie todos os jogos dos seus campeonatos em um só lugar
              </p>
            </div>
            <button
              onClick={handleCreateGame}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <PlusIcon className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              Novo Jogo
            </button>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-600">Total de Jogos</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60">
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <div className="text-sm text-slate-600">Agendados</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60">
              <div className="text-2xl font-bold text-red-600">{stats.live}</div>
              <div className="text-sm text-slate-600">Ao Vivo</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60">
              <div className="text-2xl font-bold text-green-600">{stats.finished}</div>
              <div className="text-sm text-slate-600">Finalizados</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60">
              <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
              <div className="text-sm text-slate-600">Esta Semana</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
            </div>
            <button
              onClick={() => {
                setSelectedChampionship('all');
                setSelectedStatus('all');
                setSelectedRound('all');
                setSearchTerm('');
              }}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span className="text-sm">Limpar filtros</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Busca */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar times..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Campeonato */}
            <select
              value={selectedChampionship}
              onChange={(e) => setSelectedChampionship(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os campeonatos</option>
              {championships.map(championship => (
                <option key={championship.id} value={championship.id}>
                  {championship.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="scheduled">Agendados</option>
              <option value="live">Ao Vivo</option>
              <option value="paused">Pausados</option>
              <option value="finished">Finalizados</option>
              <option value="cancelled">Cancelados</option>
            </select>

            {/* Rodada */}
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as rodadas</option>
              {allRounds.map(round => (
                <option key={round} value={round.toString()}>
                  Rodada {round}
                </option>
              ))}
            </select>

            {/* Ações rápidas */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedStatus('live')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Ao Vivo
              </button>
              <button
                onClick={() => setSelectedStatus('scheduled')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Hoje
              </button>
            </div>
          </div>
        </div>

        {/* Lista de jogos */}
        {filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative mx-auto mb-8">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto shadow-lg">
                <PlayIcon className="h-16 w-16 text-slate-400" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🎯</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Nenhum jogo encontrado
            </h3>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              {allGames.length === 0 
                ? "Crie seus primeiros jogos ou gere jogos automaticamente nos campeonatos."
                : "Ajuste os filtros para encontrar os jogos que você procura."
              }
            </p>
            <button
              onClick={handleCreateGame}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <PlusIcon className="h-5 w-5" />
              Criar Primeiro Jogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                championship={game.championship}
                onViewDetails={handleViewDetails}
                onEditGame={handleEditGame}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}