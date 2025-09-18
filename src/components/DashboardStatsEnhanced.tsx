import React from 'react';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  UsersIcon, 
  PlayIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
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
  change,
  subtitle 
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-gray-100">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
            change.type === 'increase' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
          }`}>
            <ArrowTrendingUpIcon className={`h-3 w-3 ${change.type === 'decrease' ? 'rotate-180' : ''}`} />
            <span>+{change.value}%</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</span>
          {subtitle && (
            <span className="text-gray-500 text-sm font-medium">{subtitle}</span>
          )}
        </div>
      </div>
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
      change: { value: 12, type: 'increase' as const },
      subtitle: 'ativos'
    },
    {
      title: 'Times',
      value: stats.totalTeams,
      icon: UserGroupIcon,
      change: { value: 8, type: 'increase' as const },
      subtitle: 'registrados'
    },
    {
      title: 'Jogadores',
      value: stats.totalPlayers,
      icon: UsersIcon,
      change: { value: 15, type: 'increase' as const },
      subtitle: 'participando'
    },
    {
      title: 'Jogos',
      value: stats.totalGames,
      icon: PlayIcon,
      change: { value: 23, type: 'increase' as const },
      subtitle: 'realizados'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-gray-700" />
            Estatísticas Gerais
          </h2>
          <p className="text-gray-600 mt-2 text-lg">Visão geral dos dados da plataforma</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-700 text-sm font-medium">Sistema ativo</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Additional Insights */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gray-100">
            <EyeIcon className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Métricas de Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.totalPlayers > 0 ? Math.round(stats.totalPlayers / stats.totalTeams) : 0}
            </div>
            <div className="text-gray-700 text-sm font-medium">Jogadores por time</div>
            <div className="text-gray-500 text-xs mt-1">Média de participação</div>
          </div>
          
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.totalChampionships > 0 ? Math.round(stats.totalGames / stats.totalChampionships) : 0}
            </div>
            <div className="text-gray-700 text-sm font-medium">Jogos por campeonato</div>
            <div className="text-gray-500 text-xs mt-1">Atividade média</div>
          </div>
          
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="text-3xl font-bold text-amber-600 mb-2">
              {stats.totalChampionships > 0 ? Math.round(stats.totalTeams / stats.totalChampionships) : 0}
            </div>
            <div className="text-gray-700 text-sm font-medium">Times por campeonato</div>
            <div className="text-gray-500 text-xs mt-1">Participação geral</div>
          </div>
        </div>
      </div>
    </div>
  );
};