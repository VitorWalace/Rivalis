import type { Team } from '../types';

type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution';

interface MatchEvent {
  id: string;
  type: EventType;
  teamId: string;
  minute: number;
}

interface BasicStatsProps {
  events: MatchEvent[];
  homeTeam: Team;
  awayTeam: Team;
}

export default function BasicStats({ events, homeTeam, awayTeam }: BasicStatsProps) {
  const getTeamStats = (teamId: string) => {
    const teamEvents = events.filter(e => e.teamId === teamId);
    return {
      goals: teamEvents.filter(e => e.type === 'goal').length,
      yellowCards: teamEvents.filter(e => e.type === 'yellow_card').length,
      redCards: teamEvents.filter(e => e.type === 'red_card').length,
      substitutions: teamEvents.filter(e => e.type === 'substitution').length,
    };
  };

  const getTeamInitial = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';
  };

  const renderTeamBadge = (team: Team, variant: 'home' | 'away') => {
    if (team.logo) {
      return <img src={team.logo} alt={team.name} className="w-10 h-10 rounded-lg object-cover" />;
    }

    const fallbackBackground = team.color
      ? `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)`
      : variant === 'home'
      ? 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)'
      : 'linear-gradient(135deg, #f97316 0%, #6366f1 100%)';

    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white"
        style={{ background: fallbackBackground }}
      >
        <span className="text-sm font-bold">{getTeamInitial(team.name)}</span>
      </div>
    );
  };

  const homeStats = getTeamStats(homeTeam.id);
  const awayStats = getTeamStats(awayTeam.id);

  const StatRow = ({ 
    icon, 
    label, 
    homeValue, 
    awayValue 
  }: { 
    icon: string; 
    label: string; 
    homeValue: number; 
    awayValue: number;
  }) => {
    const total = homeValue + awayValue;
    const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPercentage = total > 0 ? (awayValue / total) * 100 : 50;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
          <span className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            {label}
          </span>
          <span>Total: {total}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 text-right">
            <span className="text-lg font-semibold text-emerald-200">{homeValue}</span>
          </div>
          <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="rounded-r-full bg-emerald-500/50 transition-all duration-500"
              style={{ width: `${homePercentage}%` }}
            />
            <div
              className="rounded-l-full bg-sky-500/50 transition-all duration-500"
              style={{ width: `${awayPercentage}%` }}
            />
          </div>
          <div className="w-10 text-left">
            <span className="text-lg font-semibold text-sky-200">{awayValue}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-xl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-5 py-4">
        <h3 className="text-lg font-semibold uppercase tracking-wide text-slate-300">
          Estatísticas
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Resumo comparativo da partida
        </p>
      </div>

      {/* Teams Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-5 py-4">
        <div className="flex items-center gap-3">
          {renderTeamBadge(homeTeam, 'home')}
          <div>
            <div className="text-sm font-medium text-slate-100">{homeTeam.name}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Mandante</div>
          </div>
        </div>

        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">VS</div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-100">{awayTeam.name}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Visitante</div>
          </div>
          {renderTeamBadge(awayTeam, 'away')}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-6 p-5">
        <StatRow
          icon="⚽"
          label="GOLS"
          homeValue={homeStats.goals}
          awayValue={awayStats.goals}
        />

        <StatRow
          icon="🟨"
          label="CARTÕES AMARELOS"
          homeValue={homeStats.yellowCards}
          awayValue={awayStats.yellowCards}
        />

        <StatRow
          icon="🟥"
          label="CARTÕES VERMELHOS"
          homeValue={homeStats.redCards}
          awayValue={awayStats.redCards}
        />

        <StatRow
          icon="🔄"
          label="SUBSTITUIÇÕES"
          homeValue={homeStats.substitutions}
          awayValue={awayStats.substitutions}
        />
      </div>

      {/* Footer Summary */}
      <div className="border-t border-slate-800 bg-slate-900/70 px-5 py-4">
        <div className="grid grid-cols-2 gap-4 text-center text-xs uppercase tracking-wide text-slate-400">
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-emerald-200">
              {homeStats.goals + homeStats.yellowCards + homeStats.redCards + homeStats.substitutions}
            </div>
            <div>Total de eventos • {homeTeam.name}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-sky-200">
              {awayStats.goals + awayStats.yellowCards + awayStats.redCards + awayStats.substitutions}
            </div>
            <div>Total de eventos • {awayTeam.name}</div>
          </div>
        </div>
      </div>

      {events.length === 0 && (
        <div className="py-10 text-center text-sm text-slate-400">
          As estatísticas aparecerão conforme os eventos forem registrados.
        </div>
      )}
    </div>
  );
}
