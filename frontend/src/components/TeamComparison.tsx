import { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { Team } from '../types';
import api from '../services/api';

interface TeamComparisonProps {
  team: Team;
  championshipId: string;
}

const TeamComparison = ({ team, championshipId }: TeamComparisonProps) => {
  const [championshipAverage, setChampionshipAverage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChampionshipData();
  }, [championshipId]);

  const loadChampionshipData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/championships/${championshipId}`);
      const championship = response.data;
      
      const teams = championship.teams || [];
      if (teams.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate averages
      const totalTeams = teams.length;
      const averages = teams.reduce((acc: any, t: Team) => {
        const stats = t.stats || {};
        const gamesPlayed = (stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0);
        
        return {
          attack: acc.attack + ((stats.goalsFor || 0) / Math.max(gamesPlayed, 1)),
          defense: acc.defense + ((stats.goalsAgainst || 0) / Math.max(gamesPlayed, 1)),
          winRate: acc.winRate + ((stats.wins || 0) / Math.max(gamesPlayed, 1) * 100),
          points: acc.points + ((stats.wins || 0) * 3 + (stats.draws || 0)),
        };
      }, { attack: 0, defense: 0, winRate: 0, points: 0 });

      setChampionshipAverage({
        attack: averages.attack / totalTeams,
        defense: averages.defense / totalTeams,
        winRate: averages.winRate / totalTeams,
        points: averages.points / totalTeams,
      });
    } catch (error) {
      console.error('Error loading championship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamMetrics = () => {
    const stats = team.stats || {};
    const gamesPlayed = (stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0);

    return {
      attack: (stats.goalsFor || 0) / Math.max(gamesPlayed, 1),
      defense: 10 - ((stats.goalsAgainst || 0) / Math.max(gamesPlayed, 1)), // Inverted (higher is better)
      winRate: (stats.wins || 0) / Math.max(gamesPlayed, 1) * 100,
      points: (stats.wins || 0) * 3 + (stats.draws || 0),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!championshipAverage) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Dados insuficientes para comparação</p>
      </div>
    );
  }

  const teamMetrics = getTeamMetrics();
  
  const radarData = [
    {
      metric: 'Ataque',
      team: teamMetrics.attack * 10,
      average: championshipAverage.attack * 10,
    },
    {
      metric: 'Defesa',
      team: teamMetrics.defense * 10,
      average: (10 - championshipAverage.defense) * 10,
    },
    {
      metric: 'Taxa de Vitória',
      team: teamMetrics.winRate,
      average: championshipAverage.winRate,
    },
    {
      metric: 'Pontos',
      team: (teamMetrics.points / Math.max(championshipAverage.points, 1)) * 100,
      average: 100,
    },
  ];

  const comparisonStats = [
    {
      label: 'Gols por Jogo',
      team: teamMetrics.attack.toFixed(2),
      average: championshipAverage.attack.toFixed(2),
      better: teamMetrics.attack > championshipAverage.attack,
    },
    {
      label: 'Gols Sofridos por Jogo',
      team: (10 - teamMetrics.defense).toFixed(2),
      average: championshipAverage.defense.toFixed(2),
      better: teamMetrics.defense > (10 - championshipAverage.defense),
    },
    {
      label: 'Taxa de Vitória',
      team: `${teamMetrics.winRate.toFixed(1)}%`,
      average: `${championshipAverage.winRate.toFixed(1)}%`,
      better: teamMetrics.winRate > championshipAverage.winRate,
    },
    {
      label: 'Pontos',
      team: teamMetrics.points.toString(),
      average: championshipAverage.points.toFixed(1),
      better: teamMetrics.points > championshipAverage.points,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Radar Chart */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Comparação com a Média do Campeonato</h3>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748B', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94A3B8' }} />
              <Radar
                name="Time"
                dataKey="team"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.5}
              />
              <Radar
                name="Média do Campeonato"
                dataKey="average"
                stroke="#94A3B8"
                fill="#94A3B8"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-sm text-slate-600">{team.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-400 rounded" />
              <span className="text-sm text-slate-600">Média do Campeonato</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Estatísticas Detalhadas</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Métrica
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {team.name}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Média
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonStats.map((stat, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {stat.label}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-blue-600">
                    {stat.team}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">
                    {stat.average}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {stat.better ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Acima
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-4 4L5 7" />
                        </svg>
                        Abaixo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo de Performance</h3>
        <p className="text-slate-700 leading-relaxed">
          {teamMetrics.winRate > championshipAverage.winRate ? (
            <>
              O <strong>{team.name}</strong> está <strong className="text-green-600">acima da média</strong> do campeonato,
              com uma taxa de vitória de <strong>{teamMetrics.winRate.toFixed(1)}%</strong> comparada à média de{' '}
              <strong>{championshipAverage.winRate.toFixed(1)}%</strong>.
            </>
          ) : (
            <>
              O <strong>{team.name}</strong> está <strong className="text-amber-600">abaixo da média</strong> do campeonato,
              com uma taxa de vitória de <strong>{teamMetrics.winRate.toFixed(1)}%</strong> comparada à média de{' '}
              <strong>{championshipAverage.winRate.toFixed(1)}%</strong>.
            </>
          )}
          {' '}
          {teamMetrics.attack > championshipAverage.attack ? (
            <>O time apresenta um <strong className="text-green-600">ataque forte</strong>, marcando em média{' '}
            <strong>{teamMetrics.attack.toFixed(2)}</strong> gols por partida.</>
          ) : (
            <>O ataque precisa de melhorias, com média de <strong>{teamMetrics.attack.toFixed(2)}</strong> gols por partida.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default TeamComparison;
