import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  PlayIcon,
  UserGroupIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { EnhancedGameModal } from '../components/EnhancedGameModal';
import type { Game, Team } from '../types';

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
    icon: ClockIcon,
    iconColor: 'text-yellow-600'
  },
  finished: {
    label: 'Finalizado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: FlagIcon,
    iconColor: 'text-green-600'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: ArrowLeftIcon,
    iconColor: 'text-gray-600'
  },
  pending: {
    label: 'Pendente',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: ClockIcon,
    iconColor: 'text-purple-600'
  }
};

export function GameDetailsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const championships = useChampionshipStore((state) => state.championships);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'result' | 'manage' | 'live'>('manage');

  // Encontrar o jogo
  let game: (Game & { championship: any }) | null = null;
  let homeTeam: Team | null = null;
  let awayTeam: Team | null = null;

  for (const championship of championships) {
    const foundGame = championship.games.find(g => g.id === gameId);
    if (foundGame) {
      game = { ...foundGame, championship };
      homeTeam = championship.teams.find(t => t.id === foundGame.homeTeamId) || null;
      awayTeam = championship.teams.find(t => t.id === foundGame.awayTeamId) || null;
      break;
    }
  }

  if (!game || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Jogo não encontrado</h1>
          <p className="text-gray-600 mb-8">O jogo que você está procurando não existe ou foi removido.</p>
          <Link
            to="/games"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Voltar para Jogos</span>
          </Link>
        </div>
      </div>
    );
  }

  const status = gameStatusConfig[game.status as keyof typeof gameStatusConfig] || gameStatusConfig.scheduled;
  const StatusIcon = status.icon;

  const handleOpenModal = (mode: 'result' | 'manage' | 'live') => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/60 border-b border-slate-200/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/games')}
                className="p-2 hover:bg-white/60 rounded-xl transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-slate-600" />
              </button>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${status.iconColor.replace('text-', 'bg-').replace('-600', '-500')}`}>
                    <StatusIcon className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Detalhes do Jogo
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${status.color}`}>
                    <StatusIcon className={`h-4 w-4 ${status.iconColor}`} />
                    <span>{status.label}</span>
                  </div>
                  <span className="text-slate-600">
                    {game.championship.name} • Rodada {game.round}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {game.status !== 'finished' && (
                <button
                  onClick={() => handleOpenModal('manage')}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
                  <span>Gerenciar</span>
                </button>
              )}
              
              {(game.status === 'finished' || game.status === 'scheduled') && (
                <button
                  onClick={() => handleOpenModal('result')}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FlagIcon className="h-5 w-5" />
                  <span>{game.status === 'finished' ? 'Ver Resultado' : 'Lançar Resultado'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Confronto principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* Time da casa */}
                <div className="text-center">
                  <div 
                    className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                    style={{ backgroundColor: homeTeam.color || '#6B7280' }}
                  >
                    {homeTeam.name.charAt(0)}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{homeTeam.name}</h2>
                  <p className="text-slate-600 font-medium">Mandante</p>
                  
                  {/* Estatísticas do time */}
                  <div className="mt-4 bg-slate-50 rounded-xl p-4">
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Jogos:</span>
                        <span className="font-medium">{homeTeam.stats.games}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vitórias:</span>
                        <span className="font-medium text-green-600">{homeTeam.stats.wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pontos:</span>
                        <span className="font-medium">{homeTeam.stats.points}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Placar */}
                <div className="text-center">
                  {game.status === 'finished' && game.homeScore !== null && game.awayScore !== null ? (
                    <div>
                      <div className="text-6xl font-bold text-slate-900 mb-2">
                        {game.homeScore} - {game.awayScore}
                      </div>
                      <div className="text-lg text-slate-600 mb-4">Final</div>
                    </div>
                  ) : game.status === 'live' && game.homeScore !== null && game.awayScore !== null ? (
                    <div>
                      <div className="text-6xl font-bold text-red-600 mb-2">
                        {game.homeScore} - {game.awayScore}
                      </div>
                      <div className="text-lg text-red-500 animate-pulse mb-4">AO VIVO</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl font-bold text-slate-400 mb-4">VS</div>
                    </div>
                  )}

                  {/* Informações do jogo */}
                  <div className="space-y-2 text-sm text-slate-600">
                    {game.scheduledAt && (
                      <div className="flex items-center justify-center space-x-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{new Date(game.scheduledAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {game.scheduledAt && (
                      <div className="flex items-center justify-center space-x-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>{new Date(game.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {game.venue && (
                      <div className="flex items-center justify-center space-x-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{game.venue}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time visitante */}
                <div className="text-center">
                  <div 
                    className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                    style={{ backgroundColor: awayTeam.color || '#6B7280' }}
                  >
                    {awayTeam.name.charAt(0)}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{awayTeam.name}</h2>
                  <p className="text-slate-600 font-medium">Visitante</p>
                  
                  {/* Estatísticas do time */}
                  <div className="mt-4 bg-slate-50 rounded-xl p-4">
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Jogos:</span>
                        <span className="font-medium">{awayTeam.stats.games}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vitórias:</span>
                        <span className="font-medium text-green-600">{awayTeam.stats.wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pontos:</span>
                        <span className="font-medium">{awayTeam.stats.points}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gols e eventos */}
            {game.goals && game.goals.length > 0 && (
              <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Gols</h3>
                <div className="space-y-4">
                  {game.goals.map((goal, index) => {
                    const team = goal.teamId === homeTeam.id ? homeTeam : awayTeam;
                    const player = team.players.find(p => p.id === goal.playerId);
                    const assistant = goal.assistPlayerId ? team.players.find(p => p.id === goal.assistPlayerId) : null;

                    return (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: team.color || '#6B7280' }}
                        >
                          ⚽
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            {player?.name || 'Jogador desconhecido'}
                          </div>
                          {assistant && (
                            <div className="text-sm text-slate-600">
                              Assistência: {assistant.name}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-slate-900">{team.name}</div>
                          {goal.minute && (
                            <div className="text-sm text-slate-600">{goal.minute}'</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informações do campeonato */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Campeonato</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {game.championship.sport === 'football' ? '⚽' : '🏀'}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{game.championship.name}</p>
                    <p className="text-sm text-slate-600">{game.championship.sport === 'football' ? 'Futebol' : 'Futsal'}</p>
                  </div>
                </div>
                <Link
                  to={`/championship/${game.championship.id}`}
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <span>Ver campeonato</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Navegação */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Navegação</h3>
              <div className="space-y-2">
                <Link
                  to="/games"
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Todos os jogos</span>
                </Link>
                <Link
                  to={`/championship/${game.championship.id}`}
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <UserGroupIcon className="h-4 w-4" />
                  <span>Ver campeonato</span>
                </Link>
                <Link
                  to="/games/create"
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>Criar novo jogo</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <EnhancedGameModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          game={game}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          mode={modalMode}
        />
      )}
    </div>
  );
}