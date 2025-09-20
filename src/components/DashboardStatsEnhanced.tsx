import React from 'react';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  UsersIcon, 
  PlayIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon: React.ElementType;
  variant: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle,
  trend,
  icon: Icon,
  variant 
}) => {
  const variantStyles = {
    primary: {
      container: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
      valueColor: 'text-blue-900',
      trendColor: trend?.isPositive ? 'text-emerald-600' : 'text-red-500'
    },
    secondary: {
      container: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      valueColor: 'text-emerald-900',
      trendColor: trend?.isPositive ? 'text-emerald-600' : 'text-red-500'
    },
    tertiary: {
      container: 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/50',
      iconBg: 'bg-violet-500',
      iconColor: 'text-white',
      valueColor: 'text-violet-900',
      trendColor: trend?.isPositive ? 'text-emerald-600' : 'text-red-500'
    },
    quaternary: {
      container: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50',
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      valueColor: 'text-amber-900',
      trendColor: trend?.isPositive ? 'text-emerald-600' : 'text-red-500'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={`
      relative group cursor-pointer
      bg-white border border-gray-200/60 rounded-2xl p-6 
      hover:shadow-lg hover:shadow-gray-200/40 hover:border-gray-300/60
      transition-all duration-300 ease-out
      hover:translate-y-[-2px]
      ${styles.container}
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-current blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`
          inline-flex items-center justify-center w-11 h-11 rounded-xl
          ${styles.iconBg} ${styles.iconColor}
          shadow-sm group-hover:shadow-md transition-shadow duration-300
        `}>
          <Icon className="w-5 h-5" />
        </div>
        
        {trend && (
          <div className="flex items-center gap-1">
            <ArrowTrendingUpIcon 
              className={`w-4 h-4 ${trend.isPositive ? 'rotate-0' : 'rotate-180'} ${styles.trendColor}`} 
            />
            <span className={`text-sm font-semibold ${styles.trendColor}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600 tracking-tight">
          {title}
        </p>
        
        <div className="flex items-baseline gap-2">
          <h3 className={`text-3xl font-bold tracking-tight ${styles.valueColor}`}>
            {value.toLocaleString()}
          </h3>
          
          {subtitle && (
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {subtitle}
            </span>
          )}
        </div>

        {trend && (
          <p className="text-xs text-gray-500 mt-2">
            vs. {trend.period}
          </p>
        )}
      </div>

      {/* Subtle hover decoration */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
  const metricCards = [
    {
      title: 'Campeonatos Ativos',
      value: stats.totalChampionships,
      subtitle: 'total',
      trend: {
        value: 12,
        isPositive: true,
        period: 'último mês'
      },
      icon: TrophyIcon,
      variant: 'primary' as const
    },
    {
      title: 'Equipes Registradas',
      value: stats.totalTeams,
      subtitle: 'times',
      trend: {
        value: 8,
        isPositive: true,
        period: 'última semana'
      },
      icon: UserGroupIcon,
      variant: 'secondary' as const
    },
    {
      title: 'Atletas Cadastrados',
      value: stats.totalPlayers,
      subtitle: 'jogadores',
      trend: {
        value: 15,
        isPositive: true,
        period: 'último mês'
      },
      icon: UsersIcon,
      variant: 'tertiary' as const
    },
    {
      title: 'Partidas Realizadas',
      value: stats.totalGames,
      subtitle: 'jogos',
      trend: {
        value: 23,
        isPositive: true,
        period: 'última semana'
      },
      icon: PlayIcon,
      variant: 'quaternary' as const
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Visão Geral
          </h2>
          <p className="text-sm text-gray-600">
            Acompanhe o desempenho da sua plataforma em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-gray-700">Atualizado agora</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            trend={metric.trend}
            icon={metric.icon}
            variant={metric.variant}
          />
        ))}
      </div>

      {/* Insights Section */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-gray-200/60 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Insights da Semana
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Suas competições estão crescendo {' '}
              <span className="font-semibold text-emerald-600">+23%</span> em participação. 
              Continue engajando os atletas com novos formatos de torneio.
            </p>
            
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ChartBarIcon className="w-4 h-4" />
                <span>Baseado em dados dos últimos 30 dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};