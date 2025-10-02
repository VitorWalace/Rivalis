import React from 'react';
import {
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  PlayIcon,
  ArrowRightIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface PremiumDashboardProps {
  stats: {
    activeChampionships: number;
    totalTeams: number;
    totalPlayers: number;
    gamesToday: number;
  };
  onCreateChampionship?: () => void;
}

// Utility for composing class names
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export const PremiumDashboard: React.FC<PremiumDashboardProps> = ({ stats, onCreateChampionship }) => {
  const metricCards = [
    {
      label: 'Campeonatos Ativos',
      value: stats.activeChampionships,
      icon: TrophyIcon,
    },
    {
      label: 'Total de Times',
      value: stats.totalTeams,
      icon: UserGroupIcon,
    },
    {
      label: 'Jogadores Registrados',
      value: stats.totalPlayers,
      icon: UsersIcon,
    },
    {
      label: 'Jogos Hoje',
      value: stats.gamesToday,
      icon: PlayIcon,
    },
  ];

  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão Geral da Organização</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCreateChampionship}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white',
              'shadow-sm shadow-black/10 ring-1 ring-black/5',
              'transition-all duration-300 hover:bg-gray-800 hover:shadow-md hover:shadow-black/10',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
            )}
          >
            <BoltIcon className="h-4 w-4" />
            Criar Novo Campeonato
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={cn(
                  'group relative overflow-hidden rounded-2xl bg-white p-6',
                  'border border-gray-200/70',
                  'shadow-sm shadow-black/5',
                  'transition-all duration-300',
                  'hover:shadow-md hover:shadow-black/10 hover:-translate-y-0.5'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-medium uppercase tracking-wide text-gray-500">{card.label}</span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-600 ring-1 ring-gray-100 group-hover:bg-gray-100 transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums text-gray-900">{card.value}</span>
                </div>
                {/* Decorative subtle gradient overlay */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                  background: 'radial-gradient(circle at 85% 15%, rgba(0,0,0,0.04), transparent 60%)'
                }} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Secondary Sections */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Performance Metrics (spans 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-8 border border-gray-200/70 shadow-sm shadow-black/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-gray-500" />
                Métricas de Performance
              </h2>
              <p className="text-sm text-gray-500 mt-1">Atividade recente (placeholder)</p>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            (Adicionar gráficos ou KPIs aqui)
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white p-6 border border-gray-200/70 shadow-sm shadow-black/5 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Ações Rápidas</h2>
          <nav className="flex flex-col divide-y divide-gray-100 -mx-3">
            {[
              { label: 'Criar Campeonato', icon: TrophyIcon, href: '/championship/create' },
              { label: 'Gerenciar Times', icon: UserGroupIcon, href: '/teams' },
              { label: 'Registrar Jogador', icon: UsersIcon, href: '/players/add' },
              { label: 'Agendar Jogo', icon: PlayIcon, href: '/games/schedule' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between px-3 py-3 text-sm',
                    'text-gray-600 hover:text-gray-900 transition-colors'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-50 ring-1 ring-gray-100 group-hover:bg-gray-100 text-gray-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </span>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                </a>
              );
            })}
          </nav>
        </div>
      </section>
    </div>
  );
};

export default PremiumDashboard;
