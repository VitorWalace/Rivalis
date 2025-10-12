import React from 'react';
import {
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  PlayIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle
}) => {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-black/5 transition-colors hover:border-gray-300">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="h-10 w-10 shrink-0 rounded-md bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center group-hover:bg-gray-100">
          <Icon className="h-5 w-5 text-gray-600" />
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
      subtitle: 'Total cadastrado'
    },
    {
      title: 'Times',
      value: stats.totalTeams,
      icon: UserGroupIcon,
      subtitle: 'Times ativos'
    },
    {
      title: 'Jogadores',
      value: stats.totalPlayers,
      icon: UsersIcon,
      subtitle: 'Participantes'
    },
    {
      title: 'Jogos',
      value: stats.totalGames,
      icon: PlayIcon,
      subtitle: 'Disputados'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ChartBarIcon className="h-6 w-6 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Visão Geral</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <EyeIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Indicadores Derivados</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Jogadores / Time (média)</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.totalTeams > 0 ? Math.round(stats.totalPlayers / stats.totalTeams) : 0}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Jogos / Campeonato (média)</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.totalChampionships > 0 ? Math.round(stats.totalGames / stats.totalChampionships) : 0}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Times / Campeonato (média)</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.totalChampionships > 0 ? Math.round(stats.totalTeams / stats.totalChampionships) : 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};