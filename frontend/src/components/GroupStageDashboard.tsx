import { useMemo } from 'react';
import { CalendarIcon, TrophyIcon } from '@heroicons/react/24/outline';
import type { Team } from '../types';
import type { GroupStageGroup, GroupResultToken } from '../utils/groupStage';

interface GroupStageDashboardProps {
  teams: Team[];
  groups: GroupStageGroup[];
  qualifiersPerGroup: number;
  isGroupStageComplete: boolean;
}

const RESULT_COLORS: Record<GroupResultToken, string> = {
  W: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  D: 'bg-amber-100 text-amber-700 border border-amber-200',
  L: 'bg-rose-100 text-rose-700 border border-rose-200',
};

const formatDate = (iso?: string) => {
  if (!iso) return 'Data a definir';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Data a definir';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function GroupStageDashboard({
  teams,
  groups,
  qualifiersPerGroup,
  isGroupStageComplete,
}: GroupStageDashboardProps) {
  const teamsById = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((team) => {
      map.set(team.id, team);
    });
    return map;
  }, [teams]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">Fase de Grupos</h3>
            <p className="text-sm text-blue-100 max-w-2xl">
              Acompanhe a classificação atualizada de cada grupo, estatísticas completas e as próximas partidas.
              {qualifiersPerGroup > 0 && (
                <span className="block mt-1">
                  {qualifiersPerGroup} {qualifiersPerGroup === 1 ? 'time' : 'times'} por grupo avançam para o mata-mata.
                </span>
              )}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            isGroupStageComplete
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}>
            {isGroupStageComplete ? '✅ Fase de grupos concluída' : '⏳ Fase de grupos em andamento'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {groups.map((group) => {
          const upcoming = group.upcomingMatches.slice(0, 3);

          return (
            <div key={group.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-500">Grupo</span>
                  <h4 className="text-xl font-bold text-slate-900">{group.label}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Vitória
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Empate
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Derrota
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-3 py-2 text-left">Pos</th>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-center">P</th>
                        <th className="px-3 py-2 text-center">V</th>
                        <th className="px-3 py-2 text-center">E</th>
                        <th className="px-3 py-2 text-center">D</th>
                        <th className="px-3 py-2 text-center">GP</th>
                        <th className="px-3 py-2 text-center">GC</th>
                        <th className="px-3 py-2 text-center">SG</th>
                        <th className="px-3 py-2 text-center">Pts</th>
                        <th className="px-3 py-2 text-center">Últimos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {group.standings.map((row, index) => {
                        const isQualified = qualifiersPerGroup > 0 && index < qualifiersPerGroup;
                        return (
                          <tr
                            key={row.teamId}
                            className={`${isQualified ? 'bg-emerald-50' : ''}`}
                          >
                            <td className="px-3 py-3 font-semibold text-slate-500">{index + 1}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                {row.logo ? (
                                  <img
                                    src={row.logo}
                                    alt={row.teamName}
                                    className="w-9 h-9 rounded-lg border border-slate-200 object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-500">
                                    {row.teamName.charAt(0)}
                                  </div>
                                )}
                                <span className="font-semibold text-slate-900">{row.teamName}</span>
                                {isQualified && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-200 text-emerald-800">
                                    <TrophyIcon className="h-4 w-4" /> Classificado
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center font-semibold text-slate-800">{row.played}</td>
                            <td className="px-3 py-3 text-center text-slate-700">{row.wins}</td>
                            <td className="px-3 py-3 text-center text-slate-700">{row.draws}</td>
                            <td className="px-3 py-3 text-center text-slate-700">{row.losses}</td>
                            <td className="px-3 py-3 text-center text-slate-700">{row.goalsFor}</td>
                            <td className="px-3 py-3 text-center text-slate-700">{row.goalsAgainst}</td>
                            <td className="px-3 py-3 text-center text-slate-700">{row.goalDifference}</td>
                            <td className="px-3 py-3 text-center font-bold text-slate-900">{row.points}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {row.recentResults.length === 0 && (
                                  <span className="text-xs text-slate-400">-</span>
                                )}
                                {row.recentResults.map((token, idx) => (
                                  <span
                                    key={`${row.teamId}-${idx}`}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${RESULT_COLORS[token]}`}
                                  >
                                    {token}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 space-y-3">
                  <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Próximos jogos
                  </h5>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                      Nenhum jogo pendente neste grupo.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {upcoming.map((match) => {
                        const homeId = match.homeTeamId || match.homeTeam?.id;
                        const awayId = match.awayTeamId || match.awayTeam?.id;
                        const homeName = homeId ? teamsById.get(homeId)?.name ?? 'A definir' : 'A definir';
                        const awayName = awayId ? teamsById.get(awayId)?.name ?? 'A definir' : 'A definir';
                        return (
                          <div
                            key={match.id}
                            className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between text-sm text-slate-600">
                              <span className="font-semibold text-slate-700">{formatDate(match.date)}</span>
                              {match.location && <span>{match.location}</span>}
                            </div>
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                              <span>{homeName}</span>
                              <span className="text-slate-500">vs</span>
                              <span>{awayName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
