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
  color: string;
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
  color,
  change,
  subtitle 
}) => {
  return (
    <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-6 hover:bg-white/25 transition-all duration-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white/20 shadow-sm ${color.replace('text-', 'text-')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
            change.type === 'increase' ? 'text-green-100 bg-green-500/20 border border-green-400/30' : 'text-red-100 bg-red-500/20 border border-red-400/30'
          }`}>
            <ArrowTrendingUpIcon className={`h-3 w-3 ${change.type === 'decrease' ? 'rotate-180' : ''}`} />
            <span>+{change.value}%</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <p className="text-white/90 text-sm font-semibold uppercase tracking-wide">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white drop-shadow-sm">{value.toLocaleString()}</span>
          {subtitle && (
            <span className="text-white/70 text-sm font-medium">{subtitle}</span>
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
      color: 'text-yellow-400',
      change: { value: 12, type: 'increase' as const },
      subtitle: 'ativos'
    },
    {
      title: 'Times',
      value: stats.totalTeams,
      icon: UserGroupIcon,
      color: 'text-blue-400',
      change: { value: 8, type: 'increase' as const },
      subtitle: 'registrados'
    },
    {
      title: 'Jogadores',
      value: stats.totalPlayers,
      icon: UsersIcon,
      color: 'text-green-400',
      change: { value: 15, type: 'increase' as const },
      subtitle: 'participando'
    },
    {
      title: 'Jogos',
      value: stats.totalGames,
      icon: PlayIcon,
      color: 'text-pink-400',
      change: { value: 23, type: 'increase' as const },
      subtitle: 'realizados'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-slate-400" />
            Estatísticas Gerais
          </h2>
          <p className="text-white/60 mt-2 text-lg">Visão geral dos dados da plataforma</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-white/70 text-sm font-medium">Sistema ativo</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Additional Insights */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-white/20 shadow-sm">
            <EyeIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Métricas de Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
            <div className="text-3xl font-bold text-blue-400 mb-2 drop-shadow-sm">
              {stats.totalPlayers > 0 ? Math.round(stats.totalPlayers / stats.totalTeams) : 0}
            </div>
            <div className="text-white/90 text-sm font-medium">Jogadores por time</div>
            <div className="text-white/70 text-xs mt-1">Média de participação</div>
          </div>
          
          <div className="text-center p-6 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
            <div className="text-3xl font-bold text-green-400 mb-2 drop-shadow-sm">
              {stats.totalChampionships > 0 ? Math.round(stats.totalGames / stats.totalChampionships) : 0}
            </div>
            <div className="text-white/90 text-sm font-medium">Jogos por campeonato</div>
            <div className="text-white/70 text-xs mt-1">Atividade média</div>
          </div>
          
          <div className="text-center p-6 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
            <div className="text-3xl font-bold text-yellow-400 mb-2 drop-shadow-sm">
              {stats.totalChampionships > 0 ? Math.round(stats.totalTeams / stats.totalChampionships) : 0}
            </div>
            <div className="text-white/90 text-sm font-medium">Times por campeonato</div>
            <div className="text-white/70 text-xs mt-1">Participação geral</div>
          </div>
        </div>
      </div>
    </div>
  );
};