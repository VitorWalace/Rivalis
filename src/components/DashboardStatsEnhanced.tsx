import React from 'react';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  UsersIcon, 
  PlayIcon,
  FireIcon,
  SparklesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophySolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  UsersIcon as UsersSolidIcon,
  PlayIcon as PlaySolidIcon
} from '@heroicons/react/24/solid';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  solidIcon: React.ElementType;
  color: string;
  gradient: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  solidIcon: SolidIcon, 
  color, 
  gradient,
  change,
  subtitle 
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/20 blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white/10 blur-lg"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 backdrop-blur-sm ${
              change.type === 'increase' ? 'text-green-200' : 'text-red-200'
            }`}>
              <ArrowTrendingUpIcon className={`h-3 w-3 ${change.type === 'decrease' ? 'rotate-180' : ''}`} />
              <span className="text-xs font-medium">{change.value}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-white/80 text-sm font-medium">{title}</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{value}</span>
            {subtitle && (
              <span className="text-white/60 text-sm mb-1">{subtitle}</span>
            )}
          </div>
        </div>
        
        {/* Floating Icon */}
        <div className="absolute -top-2 -right-2 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
          <SolidIcon className="h-16 w-16 text-white" />
        </div>
      </div>
      
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
    </div>
  );
};

interface DashboardStatsProps {
  stats: {
    totalChampionships: number;
    totalTeams: number;
    totalPlayers: number;
    totalGames: number;
  };
}

export const DashboardStatsEnhanced: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Campeonatos',
      value: stats.totalChampionships,
      icon: TrophyIcon,
      solidIcon: TrophySolidIcon,
      color: 'text-yellow-400',
      gradient: 'from-yellow-500 to-orange-600',
      change: { value: 12, type: 'increase' as const },
      subtitle: 'ativos'
    },
    {
      title: 'Times',
      value: stats.totalTeams,
      icon: UserGroupIcon,
      solidIcon: UserGroupSolidIcon,
      color: 'text-blue-400',
      gradient: 'from-blue-500 to-purple-600',
      change: { value: 8, type: 'increase' as const },
      subtitle: 'registrados'
    },
    {
      title: 'Jogadores',
      value: stats.totalPlayers,
      icon: UsersIcon,
      solidIcon: UsersSolidIcon,
      color: 'text-green-400',
      gradient: 'from-green-500 to-emerald-600',
      change: { value: 15, type: 'increase' as const },
      subtitle: 'participando'
    },
    {
      title: 'Jogos',
      value: stats.totalGames,
      icon: PlayIcon,
      solidIcon: PlaySolidIcon,
      color: 'text-pink-400',
      gradient: 'from-pink-500 to-rose-600',
      change: { value: 23, type: 'increase' as const },
      subtitle: 'realizados'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ChartBarIcon className="h-7 w-7 text-blue-400" />
            Estatísticas Gerais
          </h2>
          <p className="text-white/70 mt-1">Acompanhe o crescimento da sua plataforma</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <SparklesIcon className="h-4 w-4 text-yellow-400" />
          <span className="text-white/80 text-sm font-medium">Em crescimento</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Additional Insights */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <FireIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Insights Rápidos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {stats.totalPlayers > 0 ? Math.round(stats.totalPlayers / stats.totalTeams) : 0}
            </div>
            <div className="text-white/70 text-sm">Jogadores por time</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {stats.totalChampionships > 0 ? Math.round(stats.totalGames / stats.totalChampionships) : 0}
            </div>
            <div className="text-white/70 text-sm">Jogos por campeonato</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {stats.totalChampionships > 0 ? Math.round(stats.totalTeams / stats.totalChampionships) : 0}
            </div>
            <div className="text-white/70 text-sm">Times por campeonato</div>
          </div>
        </div>
      </div>
    </div>
  );
};