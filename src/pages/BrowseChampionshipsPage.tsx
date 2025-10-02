import { Link } from 'react-router-dom';
import { 
  TrophyIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  CalendarIcon,
  FireIcon,
  ClockIcon,
  CheckBadgeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { useState } from 'react';

export default function BrowseChampionshipsPage() {
  const championships = useChampionshipStore((state) => state.championships);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'active' | 'finished'>('all');

  // Filtrar campeonatos
  const filteredChampionships = championships.filter((champ) => {
    const matchesSearch = champ.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          champ.sport.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || champ.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: championships.length,
    active: championships.filter(c => c.status === 'active').length,
    draft: championships.filter(c => c.status === 'draft').length,
    finished: championships.filter(c => c.status === 'finished').length,
  };

  // Badge de status
  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Rascunho', icon: ClockIcon },
      active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Em Andamento', icon: FireIcon },
      finished: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Finalizado', icon: CheckBadgeIcon },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Campeonatos
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                Explore, participe e acompanhe competições esportivas
              </p>
            </div>
            
            <Link 
              to="/championship/create" 
              className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              Criar Campeonato
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <TrophyIcon className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Rascunhos</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.draft}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Ativos</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.active}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FireIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Finalizados</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.finished}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <CheckBadgeIcon className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou modalidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-5 w-5 text-slate-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                >
                  <option value="all">Todos</option>
                  <option value="draft">Rascunhos</option>
                  <option value="active">Em Andamento</option>
                  <option value="finished">Finalizados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Create Button */}
          <Link 
            to="/championship/create" 
            className="md:hidden mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md"
          >
            <PlusIcon className="h-5 w-5" />
            Criar Campeonato
          </Link>
        </div>

        {/* Championships Grid */}
        {filteredChampionships.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <TrophyIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Nenhum campeonato encontrado
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Seja o primeiro a criar um campeonato!'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link 
                to="/championship/create" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Criar Primeiro Campeonato
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChampionships.map((champ) => (
              <Link 
                key={champ.id} 
                to={`/championship/${champ.id}`} 
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors">
                      <TrophyIcon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    {getStatusBadge(champ.status)}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {champ.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="font-medium">{champ.sport === 'futsal' ? 'Futsal' : 'Futebol'}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 bg-slate-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white rounded-lg">
                        <UserGroupIcon className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Times</p>
                        <p className="text-sm font-bold text-slate-900">
                          {champ.teams?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white rounded-lg">
                        <CalendarIcon className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Partidas</p>
                        <p className="text-sm font-bold text-slate-900">{champ.games?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {champ.startDate && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>
                          Início: {new Date(champ.startDate).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-6 py-3 bg-white border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">
                      {champ.teams?.length || 0} times inscritos
                    </span>
                    <span className="text-blue-600 font-semibold group-hover:underline">
                      Ver detalhes →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
