import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  TrophyIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  FunnelIcon,
  SparklesIcon,
  FireIcon,
  ArrowRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';

export default function BrowseChampionshipsPage() {
  const { championships } = useChampionshipStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const sportOptions = [
    { value: 'football', label: '⚽ Futebol' },
    { value: 'futsal', label: '🏀 Futsal' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Rascunho', color: 'gray', icon: ClockIcon },
    { value: 'active', label: 'Em Andamento', color: 'green', icon: FireIcon },
    { value: 'finished', label: 'Finalizados', color: 'blue', icon: TrophyIcon },
  ];

  const filteredChampionships = championships.filter(champ => {
    const matchesSearch = champ.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === 'all' || champ.sport === selectedSport;
    const matchesStatus = selectedStatus === 'all' || champ.status === selectedStatus;
    
    return matchesSearch && matchesSport && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (!statusConfig) return null;

    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const StatusIcon = statusConfig.icon;
    const colorClass = colors[statusConfig.color as keyof typeof colors];

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
        <StatusIcon className="h-3.5 w-3.5" />
        {statusConfig.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TrophyIcon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Campeonatos Disponíveis</h1>
                  <p className="mt-2 text-indigo-100">
                    Encontre e participe dos melhores torneios de e-sports
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  <span>{championships.length} campeonatos ativos</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  <span>Junte-se agora!</span>
                </div>
              </div>
            </div>
            
            <Link
              to="/championship/create"
              className="mt-6 md:mt-0 inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Criar Campeonato
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome do campeonato..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Esporte
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="all">Todos os esportes</option>
                {sportOptions.map(sport => (
                  <option key={sport.value} value={sport.value}>{sport.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="all">Todos os status</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredChampionships.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <TrophyIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum campeonato encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedSport !== 'all' || selectedStatus !== 'all'
                ? 'Tente ajustar os filtros ou buscar por outro termo'
                : 'Seja o primeiro a criar um campeonato!'}
            </p>
            <Link
              to="/championship/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Criar Primeiro Campeonato
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChampionships.map((championship) => {
              const StatusIcon = statusOptions.find(s => s.value === championship.status)?.icon || TrophyIcon;
              
              return (
                <Link
                  key={championship.id}
                  to={`/championship/${championship.id}`}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <TrophyIcon className="h-6 w-6 text-white" />
                        </div>
                        {getStatusBadge(championship.status)}
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-50 transition-colors">
                        {championship.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <FireIcon className="h-5 w-5 mr-2 text-orange-500" />
                        <span className="font-medium">
                          {sportOptions.find(s => s.value === championship.sport)?.label || championship.sport}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        <span>
                          <span className="font-semibold text-gray-900">{championship.teams?.length || 0}</span> times participantes
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <TrophyIcon className="h-5 w-5 mr-2 text-purple-500" />
                        <span>
                          <span className="font-semibold text-gray-900">{championship.games?.length || 0}</span> partidas
                        </span>
                      </div>

                      {championship.startDate && (
                        <div className="flex items-center text-gray-600">
                          <CalendarIcon className="h-5 w-5 mr-2 text-green-500" />
                          <span className="text-sm">
                            Início: {new Date(championship.startDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <StatusIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {statusOptions.find(s => s.value === championship.status)?.label}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-indigo-600 font-semibold group-hover:text-indigo-700 transition-colors">
                        Ver detalhes
                      </span>
                      <ArrowRightIcon className="h-5 w-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
