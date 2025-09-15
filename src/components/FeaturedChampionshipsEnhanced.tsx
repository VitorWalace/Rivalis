import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrophyIcon,
  UsersIcon,
  CalendarDaysIcon,
  EyeIcon,
  PlayIcon,
  FireIcon,
  StarIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';

interface ChampionshipCardProps {
  championship: any;
  featured?: boolean;
}

const ChampionshipCard: React.FC<ChampionshipCardProps> = ({ championship, featured = false }) => {
  const statusConfig = {
    active: { 
      color: 'text-green-400', 
      bg: 'bg-green-500/20', 
      text: 'Em Andamento',
      gradient: 'from-green-500/20 to-emerald-500/20'
    },
    draft: { 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/20', 
      text: 'Rascunho',
      gradient: 'from-yellow-500/20 to-orange-500/20'
    },
    finished: { 
      color: 'text-gray-400', 
      bg: 'bg-gray-500/20', 
      text: 'Finalizado',
      gradient: 'from-gray-500/20 to-slate-500/20'
    }
  };

  const sportConfig = {
    football: { name: 'Futebol', icon: '⚽', color: 'from-green-500 to-emerald-600' },
    futsal: { name: 'Futsal', icon: '🥅', color: 'from-blue-500 to-indigo-600' }
  };

  const status = statusConfig[championship.status as keyof typeof statusConfig];
  const sport = sportConfig[championship.sport as keyof typeof sportConfig];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className={`relative group ${featured ? 'md:col-span-2' : ''}`}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${sport.color} blur-3xl transform translate-x-1/3 -translate-y-1/3`}></div>
        </div>
        
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-xs font-bold">
              <StarIcon className="h-3 w-3" />
              DESTAQUE
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`flex items-center gap-2 px-3 py-1 ${status.bg} backdrop-blur-sm rounded-full border border-white/20`}>
            <div className={`w-2 h-2 ${status.color} rounded-full ${championship.status === 'active' ? 'animate-pulse' : ''}`}></div>
            <span className={`${status.color} text-xs font-medium`}>{status.text}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 pt-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${sport.color} shadow-lg`}>
              <span className="text-2xl">{sport.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors line-clamp-1">
                {championship.name}
              </h3>
              <p className="text-white/60 text-sm">{sport.name}</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-white/70">
              <UsersIcon className="h-4 w-4" />
              <span className="text-sm">{championship.teams?.length || 0} times</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <PlayIcon className="h-4 w-4" />
              <span className="text-sm">{championship.games?.length || 0} jogos</span>
            </div>
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-2 text-white/70 mb-6">
            <CalendarDaysIcon className="h-4 w-4" />
            <span className="text-sm">
              {championship.startDate ? formatDate(championship.startDate) : 'Data não definida'}
            </span>
          </div>
          
          {/* Action Button */}
          <Link 
            to={`/championship/${championship.id}`}
            className="flex items-center justify-between w-full p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-200 group/button"
          >
            <div className="flex items-center gap-2">
              <EyeIcon className="h-4 w-4 text-white/80" />
              <span className="text-white/80 font-medium text-sm">Ver Detalhes</span>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-white/60 transform group-hover/button:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {/* Hover Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      </div>
    </div>
  );
};

export const FeaturedChampionshipsEnhanced: React.FC = () => {
  const championships = useChampionshipStore((state) => state.championships);
  
  // Pegar os campeonatos mais relevantes (ativos primeiro, depois recentes)
  const featuredChampionships = championships
    .sort((a, b) => {
      // Priorizar ativos
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      
      // Depois por data de criação
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  if (featuredChampionships.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrophyIcon className="h-7 w-7 text-yellow-400" />
            Campeonatos em Destaque
          </h2>
          <p className="text-white/70 mt-1">Seus torneios mais importantes</p>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-md mx-auto">
            <TrophyIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum campeonato criado</h3>
            <p className="text-white/60 mb-6">Comece criando seu primeiro torneio!</p>
            <Link 
              to="/create-championship"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <TrophyIcon className="h-4 w-4" />
              Criar Campeonato
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrophyIcon className="h-7 w-7 text-yellow-400" />
            Campeonatos em Destaque
          </h2>
          <p className="text-white/70 mt-1">Seus torneios mais importantes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <FireIcon className="h-4 w-4 text-orange-400" />
            <span className="text-white/80 text-sm font-medium">
              {championships.filter(c => c.status === 'active').length} ativos
            </span>
          </div>
          
          {championships.length > 6 && (
            <Link 
              to="/championships"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-colors text-white/80 hover:text-white text-sm font-medium"
            >
              Ver Todos
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Championships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredChampionships.map((championship, index) => (
          <ChampionshipCard 
            key={championship.id} 
            championship={championship}
            featured={index === 0 && championships.filter(c => c.status === 'active').length > 0}
          />
        ))}
      </div>
      
      {/* Performance Insight */}
      {championships.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FireIcon className="h-5 w-5 text-orange-400" />
                Performance dos Campeonatos
              </h3>
              <p className="text-white/70 text-sm">
                Você organizou {championships.length} campeonatos com{' '}
                {championships.reduce((acc, c) => acc + (c.teams?.length || 0), 0)} times participantes
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {Math.round((championships.filter(c => c.status === 'finished').length / championships.length) * 100) || 0}%
              </div>
              <div className="text-white/60 text-sm">Taxa de conclusão</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};