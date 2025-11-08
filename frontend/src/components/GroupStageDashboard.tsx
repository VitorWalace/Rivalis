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
  W: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40',
  D: 'bg-amber-500/20 text-amber-200 border border-amber-400/40',
  L: 'bg-rose-500/20 text-rose-200 border border-rose-400/40',
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
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-700/40 via-indigo-700/40 to-slate-900/70 shadow-lg overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/80">Etapa atual</p>
            <h3 className="mt-1 text-2xl font-bold text-white">Fase de Grupos</h3>
            <p className="mt-2 text-sm text-blue-100/80 max-w-2xl">
              Acompanhe a classificação atualizada de cada grupo, estatísticas completas e as próximas partidas.
              {qualifiersPerGroup > 0 && (
                <span className="block mt-1 text-blue-100">
                  {qualifiersPerGroup} {qualifiersPerGroup === 1 ? 'time' : 'times'} por grupo avançam para o mata-mata.
                </span>
              )}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide border ${
              isGroupStageComplete
                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
                : 'border-amber-400/40 bg-amber-500/20 text-amber-100'
            }`}
          >
            {isGroupStageComplete ? 'Fase de grupos concluída' : 'Fase de grupos em andamento'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {groups.map((group) => {
          const upcoming = group.upcomingMatches.slice(0, 3);

          return (
            <div
              key={group.label}
              className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg backdrop-blur overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Grupo</span>
                  <h4 className="mt-1 text-xl font-bold text-white">{group.label}</h4>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Vitória
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Empate
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Derrota
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-slate-100">
                    <thead>
                      <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">
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
                    <tbody className="divide-y divide-white/5 text-sm">
                      {group.standings.map((row, index) => {
                        const isQualified = qualifiersPerGroup > 0 && index < qualifiersPerGroup;
                        const cellStyle = isQualified ? { backgroundColor: '#064e3b' } : {};
                        return (
                          <tr
                            key={row.teamId}
                            style={{
                              backgroundColor: isQualified ? '#064e3b !important' : 'rgba(30, 41, 59, 0.4)'
                            }}
                            className="transition"
                          >
                            <td style={cellStyle} className="px-3 py-3 font-semibold text-slate-200">{index + 1}</td>
                            <td style={cellStyle} className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                {row.logo ? (
                                  <img
                                    src={row.logo}
                                    alt={row.teamName}
                                    className="w-9 h-9 rounded-lg border border-white/10 bg-slate-800 object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-sm font-semibold text-slate-200">
                                    {row.teamName.charAt(0)}
                                  </div>
                                )}
                                <span className="font-semibold text-white">{row.teamName}</span>
                                {isQualified && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-600 text-white">
                                    <TrophyIcon className="h-3.5 w-3.5" /> Classificado
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={cellStyle} className="px-3 py-3 text-center font-semibold text-slate-100">{row.played}</td>
                            <td style={cellStyle} className="px-3 py-3 text-center text-slate-200">{row.wins}</td>
                            <td style={cellStyle} className="px-3 py-3 text-center text-slate-200">{row.draws}</td>
                            <td style={cellStyle} className="px-3 py-3 text-center text-slate-200">{row.losses}</td>
                            <td style={cellStyle} className="px-3 py-3 text-center text-slate-200">{row.goalsFor}</td>
                            <td style={cellStyle} className="px-3 py-3 text-center text-slate-200">{row.goalsAgainst}</td>
                            <td style={cellStyle} className="px-3 py-3 text-center text-slate-200">{row.goalDifference}</td>
                            <td style={cellStyle} className="px-3 py-3 text-center font-bold text-white">{row.points}</td>
                            <td style={cellStyle} className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {row.recentResults.length === 0 && (
                                  <span className="text-xs text-slate-500">-</span>
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
                  <h5 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-200" /> Próximos jogos
                  </h5>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-slate-300 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
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
                            className="px-4 py-3 border border-white/10 rounded-lg bg-white/5 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between text-sm text-slate-300">
                              <span className="font-semibold text-white">{formatDate(match.date)}</span>
                              {match.location && <span>{match.location}</span>}
                            </div>
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-100">
                              <span>{homeName}</span>
                              <span className="text-slate-400">vs</span>
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
