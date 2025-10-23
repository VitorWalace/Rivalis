import { TrophyIcon, FireIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline';
import type { Team } from '../types';

interface TeamStatsOverviewProps {
  team: Team;
  championshipId: string;
}

const TeamStatsOverview = ({ team }: TeamStatsOverviewProps) => {
  const stats = team.stats || {
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };

  const gamesPlayed = (stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0);
  const goalDifference = (stats.goalsFor || 0) - (stats.goalsAgainst || 0);
  const points = (stats.wins || 0) * 3 + (stats.draws || 0);
  const winPercentage = gamesPlayed > 0 ? ((stats.wins || 0) / gamesPlayed * 100).toFixed(1) : '0.0';

  const mainMetrics = [
    {
      label: 'Total de Jogos',
      value: gamesPlayed,
      icon: TrophyIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Vitórias',
      value: stats.wins || 0,
      subtitle: `${winPercentage}% aproveitamento`,
      icon: FireIcon,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
    },
    {
      label: 'Empates',
      value: stats.draws || 0,
      subtitle: `${gamesPlayed > 0 ? ((stats.draws || 0) / gamesPlayed * 100).toFixed(1) : '0.0'}%`,
      icon: ShieldCheckIcon,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Derrotas',
      value: stats.losses || 0,
      subtitle: `${gamesPlayed > 0 ? ((stats.losses || 0) / gamesPlayed * 100).toFixed(1) : '0.0'}%`,
      icon: BoltIcon,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
    },
  ];

  const goalMetrics = [
    {
      label: 'Gols Marcados',
      value: stats.goalsFor || 0,
      average: gamesPlayed > 0 ? ((stats.goalsFor || 0) / gamesPlayed).toFixed(2) : '0.00',
      color: 'emerald',
    },
    {
      label: 'Gols Sofridos',
      value: stats.goalsAgainst || 0,
      average: gamesPlayed > 0 ? ((stats.goalsAgainst || 0) / gamesPlayed).toFixed(2) : '0.00',
      color: 'rose',
    },
    {
      label: 'Saldo de Gols',
      value: goalDifference,
      isPositive: goalDifference >= 0,
      color: goalDifference >= 0 ? 'green' : 'red',
    },
    {
      label: 'Pontos Totais',
      value: points,
      maxPoints: gamesPlayed * 3,
      color: 'blue',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Main Metrics */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Desempenho Geral</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mainMetrics.map((metric, index) => (
            <div
              key={index}
              className={`${metric.bgColor} rounded-xl p-6 border border-${metric.color}-100 transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 ${metric.bgColor} rounded-lg`}>
                  <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
              </div>
              <div className={`text-4xl font-bold ${metric.textColor} mb-1`}>
                {metric.value}
              </div>
              <div className="text-sm font-medium text-slate-600">{metric.label}</div>
              {metric.subtitle && (
                <div className="text-xs text-slate-500 mt-1">{metric.subtitle}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Bar */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Distribuição de Resultados</h3>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-6 rounded-full overflow-hidden bg-slate-100 flex">
              {gamesPlayed > 0 && (
                <>
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${((stats.wins || 0) / gamesPlayed) * 100}%` }}
                  />
                  <div
                    className="bg-yellow-500 transition-all duration-500"
                    style={{ width: `${((stats.draws || 0) / gamesPlayed) * 100}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${((stats.losses || 0) / gamesPlayed) * 100}%` }}
                  />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600">Vitórias ({stats.wins || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-slate-600">Empates ({stats.draws || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600">Derrotas ({stats.losses || 0})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Metrics */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Estatísticas de Gols</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {goalMetrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all"
            >
              <div className="text-sm font-medium text-slate-600 mb-2">{metric.label}</div>
              <div className={`text-3xl font-bold mb-2 ${
                metric.color === 'emerald' ? 'text-emerald-600' :
                metric.color === 'rose' ? 'text-rose-600' :
                metric.color === 'green' ? 'text-green-600' :
                metric.color === 'red' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {metric.isPositive !== undefined && metric.value > 0 && '+'}
                {metric.value}
              </div>
              {metric.average && (
                <div className="text-xs text-slate-500">
                  Média: {metric.average} por jogo
                </div>
              )}
              {metric.maxPoints && (
                <div className="text-xs text-slate-500">
                  de {metric.maxPoints} possíveis ({((metric.value / metric.maxPoints) * 100).toFixed(1)}%)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Goal Difference Chart */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Saldo de Gols</h3>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Gols Marcados</span>
                <span className="font-bold text-emerald-600">{stats.goalsFor || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((stats.goalsFor || 0) / Math.max(stats.goalsFor || 1, stats.goalsAgainst || 1)) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Gols Sofridos</span>
                <span className="font-bold text-rose-600">{stats.goalsAgainst || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((stats.goalsAgainst || 0) / Math.max(stats.goalsFor || 1, stats.goalsAgainst || 1)) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStatsOverview;
