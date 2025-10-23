import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Team } from '../types';

interface TeamStatsPerformanceProps {
  team: Team;
  championshipId: string;
}

const TeamStatsPerformance = ({ team }: TeamStatsPerformanceProps) => {
  const stats = team.stats || {
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };

  // Data for Pie Chart (Results Distribution)
  const pieData = [
    { name: 'Vitórias', value: stats.wins || 0, color: '#10B981' },
    { name: 'Empates', value: stats.draws || 0, color: '#F59E0B' },
    { name: 'Derrotas', value: stats.losses || 0, color: '#EF4444' },
  ].filter(item => item.value > 0);

  // Data for Bar Chart (Goals)
  const goalsData = [
    {
      category: 'Gols',
      'Marcados': stats.goalsFor || 0,
      'Sofridos': stats.goalsAgainst || 0,
    },
  ];

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    return `${entry.value}`;
  };

  return (
    <div className="space-y-8">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Results Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição de Resultados</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Sem dados disponíveis
            </div>
          )}
          <div className="mt-4 space-y-2">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart - Goals */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Gols Marcados vs Sofridos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="category" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="Marcados" fill="#10B981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Sofridos" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{stats.goalsFor || 0}</div>
              <div className="text-sm text-slate-600">Gols Marcados</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.goalsAgainst || 0}</div>
              <div className="text-sm text-slate-600">Gols Sofridos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo de Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-slate-600 mb-1">Taxa de Vitória</div>
            <div className="text-3xl font-bold text-green-600">
              {((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) > 0
                ? (((stats.wins || 0) / ((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0))) * 100).toFixed(1)
                : '0.0'}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-slate-600 mb-1">Média de Gols</div>
            <div className="text-3xl font-bold text-blue-600">
              {((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) > 0
                ? (((stats.goalsFor || 0)) / ((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0))).toFixed(2)
                : '0.00'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-slate-600 mb-1">Saldo de Gols</div>
            <div className={`text-3xl font-bold ${
              ((stats.goalsFor || 0) - (stats.goalsAgainst || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {((stats.goalsFor || 0) - (stats.goalsAgainst || 0)) > 0 ? '+' : ''}
              {(stats.goalsFor || 0) - (stats.goalsAgainst || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Indicadores de Performance</h3>
        <div className="space-y-4">
          {/* Attack Efficiency */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Eficiência de Ataque</span>
              <span className="font-bold text-slate-900">
                {((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) > 0
                  ? (((stats.goalsFor || 0) / ((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0))) * 10).toFixed(1)
                  : '0.0'}/10
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    ((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) > 0
                      ? (((stats.goalsFor || 0) / ((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0))) * 10) * 10
                      : 0,
                    100
                  )}%`
                }}
              />
            </div>
          </div>

          {/* Defense Solidity */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Solidez Defensiva</span>
              <span className="font-bold text-slate-900">
                {((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) > 0
                  ? (Math.max(0, 10 - ((stats.goalsAgainst || 0) / ((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0))))).toFixed(1)
                  : '10.0'}/10
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    ((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) > 0
                      ? (Math.max(0, 10 - ((stats.goalsAgainst || 0) / ((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0))))) * 10
                      : 100,
                    100
                  )}%`
                }}
              />
            </div>
          </div>

          {/* Overall Performance */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Performance Geral</span>
              <span className="font-bold text-slate-900">
                {((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) > 0
                  ? (((stats.wins || 0) * 3 + (stats.draws || 0)) / (((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) * 3) * 10).toFixed(1)
                  : '0.0'}/10
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-purple-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) > 0
                    ? (((stats.wins || 0) * 3 + (stats.draws || 0)) / (((stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0)) * 3) * 100)
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStatsPerformance;
