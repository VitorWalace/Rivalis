import { useState } from 'react';
import { 
  Trophy, Users, Calendar, Settings, Play, Plus,
  Eye, Clock, UserPlus 
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
  color?: string;
  playersCount?: number;
  captain?: string;
  createdAt: string;
}

interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: Team;
  awayTeam?: Team;
  round: number;
  status: 'pending' | 'in-progress' | 'finished';
  homeScore: number;
  awayScore: number;
  scheduledAt?: string;
}

interface Championship {
  id: string;
  name: string;
  modality: string;
  description: string;
  banner?: string;
  format: string;
  startDate: string;
  endDate?: string;
  registrationStart: string;
  registrationEnd: string;
  maxTeams: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  rules?: string;
  status: string;
  createdAt: string;
  teams?: Team[];
  games?: Game[];
}

interface ChampionshipDetailsProps {
  championship: Championship;
  onGenerateRound: (championshipId: string) => void;
}

export default function ChampionshipDetails({ 
  championship, 
  onGenerateRound 
}: ChampionshipDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingRound, setIsGeneratingRound] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFormatLabel = (format: string) => {
    const formats: { [key: string]: string } = {
      'round-robin': 'Todos contra Todos',
      'knockout': 'Eliminatória Simples',
      'groups': 'Fase de Grupos + Mata-mata',
      'league': 'Pontos Corridos'
    };
    return formats[format] || format;
  };

  const canGenerateRound = () => {
    return championship.teams && championship.teams.length >= 2;
  };

  const handleGenerateRound = async () => {
    setIsGeneratingRound(true);
    try {
      await onGenerateRound(championship.id);
    } finally {
      setIsGeneratingRound(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Eye },
    { id: 'teams', label: `Times (${championship.teams?.length || 0})`, icon: Users },
    { id: 'games', label: `Jogos (${championship.games?.length || 0})`, icon: Trophy },
    { id: 'schedule', label: 'Cronograma', icon: Calendar },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Banner */}
      {championship.banner && (
        <div className="relative h-64 rounded-lg overflow-hidden">
          <img
            src={championship.banner}
            alt={`Banner do ${championship.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-3xl font-bold">{championship.name}</h1>
              <p className="text-lg opacity-90">{championship.modality}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informações Básicas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">Informações</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Modalidade:</span>
              <span className="font-medium">{championship.modality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Formato:</span>
              <span className="font-medium">{getFormatLabel(championship.format)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{championship.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max. Times:</span>
              <span className="font-medium">{championship.maxTeams}</span>
            </div>
          </div>
        </div>

        {/* Participação */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Participação</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Times Inscritos:</span>
              <span className="text-2xl font-bold text-blue-600">
                {championship.teams?.length || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ 
                  width: `${Math.min(((championship.teams?.length || 0) / championship.maxTeams) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {championship.maxTeams - (championship.teams?.length || 0)} vagas restantes
            </p>
          </div>
        </div>

        {/* Cronograma */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold">Cronograma</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600 block">Inscrições:</span>
              <span className="font-medium">
                {formatDate(championship.registrationStart)} - {formatDate(championship.registrationEnd)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 block">Início:</span>
              <span className="font-medium">{formatDate(championship.startDate)}</span>
            </div>
            {championship.endDate && (
              <div>
                <span className="text-gray-600 block">Término:</span>
                <span className="font-medium">{formatDate(championship.endDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Descrição */}
      {championship.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Sobre o Campeonato</h3>
          <p className="text-gray-600 leading-relaxed">{championship.description}</p>
        </div>
      )}

      {/* Regras */}
      {championship.rules && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Regras</h3>
          <p className="text-gray-600 leading-relaxed">{championship.rules}</p>
        </div>
      )}
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Times Inscritos</h3>
          <p className="text-gray-600">
            {championship.teams?.length || 0} de {championship.maxTeams} times
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => console.log('Adicionar time')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Time
          </button>
          {canGenerateRound() && (
            <button
              onClick={handleGenerateRound}
              disabled={isGeneratingRound}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" />
              {isGeneratingRound ? 'Gerando...' : 'Gerar Rodada'}
            </button>
          )}
        </div>
      </div>

      {/* Lista de times */}
      {championship.teams && championship.teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {championship.teams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: team.color || '#3B82F6' }}
                ></div>
                <h4 className="font-semibold">{team.name}</h4>
              </div>
              {team.description && (
                <p className="text-gray-600 text-sm mb-3">{team.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{team.playersCount || 0} jogadores</span>
                <span>Criado em {formatDate(team.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum time inscrito</h3>
          <p className="text-gray-500 mb-6">Adicione times para começar o campeonato</p>
          <button
            onClick={() => console.log('Adicionar primeiro time')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Adicionar Primeiro Time
          </button>
        </div>
      )}

      {/* Aviso sobre geração de rodadas */}
      {championship.teams && championship.teams.length > 0 && championship.teams.length < 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              É necessário pelo menos 2 times para gerar rodadas
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderGames = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Jogos do Campeonato</h3>
        {canGenerateRound() && (
          <button
            onClick={handleGenerateRound}
            disabled={isGeneratingRound}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {isGeneratingRound ? 'Gerando...' : 'Gerar Nova Rodada'}
          </button>
        )}
      </div>

      {championship.games && championship.games.length > 0 ? (
        <div className="space-y-4">
          {/* Agrupar jogos por rodada */}
          {Object.entries(
            championship.games.reduce((acc, game) => {
              const round = game.round;
              if (!acc[round]) acc[round] = [];
              acc[round].push(game);
              return acc;
            }, {} as { [key: number]: Game[] })
          ).map(([round, games]) => (
            <div key={round} className="bg-white rounded-lg shadow">
              <div className="p-4 border-b bg-gray-50">
                <h4 className="font-semibold">Rodada {round}</h4>
              </div>
              <div className="p-4 space-y-3">
                {games.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="font-medium">
                          {game.homeTeam?.name || game.homeTeamId}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-400">VS</div>
                      <div className="text-center">
                        <div className="font-medium">
                          {game.awayTeam?.name || game.awayTeamId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 capitalize">{game.status}</div>
                      {game.status === 'finished' && (
                        <div className="font-bold">
                          {game.homeScore} - {game.awayScore}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum jogo criado</h3>
          <p className="text-gray-500 mb-6">
            {canGenerateRound() 
              ? 'Gere a primeira rodada para começar o campeonato'
              : 'Adicione pelo menos 2 times para gerar jogos'
            }
          </p>
          {canGenerateRound() && (
            <button
              onClick={handleGenerateRound}
              disabled={isGeneratingRound}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="w-5 h-5 mr-2" />
              {isGeneratingRound ? 'Gerando...' : 'Gerar Primeira Rodada'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'teams' && renderTeams()}
        {activeTab === 'games' && renderGames()}
        {activeTab === 'schedule' && (
          <div className="text-center py-12 text-gray-500">
            Cronograma em desenvolvimento
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="text-center py-12 text-gray-500">
            Configurações em desenvolvimento
          </div>
        )}
      </div>
    </div>
  );
}