import React from 'react';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  UsersIcon, 
  PlayIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  highlight?: string;
  icon: React.ElementType;
  variant: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle,
  highlight,
  icon: Icon,
  variant 
}) => {
  const variantStyles = {
    primary: {
      container: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
      valueColor: 'text-blue-900',
      highlightStyles: 'bg-white/70 text-blue-700 border border-blue-100'
    },
    secondary: {
      container: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      valueColor: 'text-emerald-900',
      highlightStyles: 'bg-white/70 text-emerald-700 border border-emerald-100'
    },
    tertiary: {
      container: 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/50',
      iconBg: 'bg-violet-500',
      iconColor: 'text-white',
      valueColor: 'text-violet-900',
      highlightStyles: 'bg-white/70 text-violet-700 border border-violet-100'
    },
    quaternary: {
      container: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50',
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      valueColor: 'text-amber-900',
      highlightStyles: 'bg-white/70 text-amber-700 border border-amber-100'
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
      </div>

      {highlight && (
        <div className={`mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold tracking-wide shadow-sm backdrop-blur ${styles.highlightStyles}`}>
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>{highlight}</span>
        </div>
      )}

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
      highlight: 'Convide equipes e comece novas disputas',
      icon: TrophyIcon,
      variant: 'primary' as const
    },
    {
      title: 'Equipes Registradas',
      value: stats.totalTeams,
      subtitle: 'times',
      highlight: 'Mantenha todos informados com atualizações rápidas',
      icon: UserGroupIcon,
      variant: 'secondary' as const
    },
    {
      title: 'Atletas Cadastrados',
      value: stats.totalPlayers,
      subtitle: 'jogadores',
      highlight: 'Gerencie perfis e documentos em um só lugar',
      icon: UsersIcon,
      variant: 'tertiary' as const
    },
    {
      title: 'Partidas Realizadas',
      value: stats.totalGames,
      subtitle: 'jogos',
      highlight: 'Agende rodadas com poucos cliques',
      icon: PlayIcon,
      variant: 'quaternary' as const
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Visão Geral
            </h2>
            <p className="text-sm text-gray-600">
              Seus principais indicadores em um lugar acolhedor para você planejar os próximos passos.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">Tudo funcionando perfeitamente</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-blue-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Destaque do dia</p>
            <p className="mt-1 text-sm font-medium">Novos jogadores estão chegando e as agendas seguem em dia.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-emerald-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Sugestão</p>
            <p className="mt-1 text-sm font-medium">Envie uma mensagem de boas-vindas para os times inscritos.</p>
          </div>
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
            highlight={metric.highlight}
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
              Suas competições seguem recebendo novas inscrições e elogios dos participantes.
              Que tal aproveitar o momento para apresentar um formato especial ou um torneio amistoso?
            </p>
            
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ChartBarIcon className="w-4 h-4" />
                <span>Baseado em interações recentes da plataforma</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};