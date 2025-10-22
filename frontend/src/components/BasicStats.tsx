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
      <div className="space-y-2">
        {/* Label */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-700 flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            {label}
          </span>
          <span className="text-xs text-slate-500">
            Total: {total}
          </span>
        </div>

        {/* Bar */}
        <div className="flex items-center gap-3">
          {/* Home Value */}
          <div className="w-12 text-right">
            <span className="text-2xl font-black text-blue-600">{homeValue}</span>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 h-8 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className={`bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${homePercentage}%` }}
            >
              {homeValue > 0 && (
                <span className="text-xs font-bold text-white">🏠</span>
              )}
            </div>
            <div
              className={`bg-gradient-to-r from-purple-600 to-purple-500 transition-all duration-500 flex items-center justify-start pl-2`}
              style={{ width: `${awayPercentage}%` }}
            >
              {awayValue > 0 && (
                <span className="text-xs font-bold text-white">🚗</span>
              )}
            </div>
          </div>

          {/* Away Value */}
          <div className="w-12 text-left">
            <span className="text-2xl font-black text-purple-600">{awayValue}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          📊 ESTATÍSTICAS
        </h3>
        <p className="text-sm text-slate-300 mt-1">
          Resumo comparativo da partida
        </p>
      </div>

      {/* Teams Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          {homeTeam.logo ? (
            <img src={homeTeam.logo} alt={homeTeam.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">{homeTeam.name?.charAt(0)}</span>
            </div>
          )}
          <div>
            <div className="font-bold text-blue-600">{homeTeam.name}</div>
            <div className="text-xs text-slate-500">🏠 Casa</div>
          </div>
        </div>

        <div className="text-3xl font-black text-slate-400">VS</div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-bold text-purple-600">{awayTeam.name}</div>
            <div className="text-xs text-slate-500">🚗 Visitante</div>
          </div>
          {awayTeam.logo ? (
            <img src={awayTeam.logo} alt={awayTeam.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="text-lg font-bold text-purple-600">{awayTeam.name?.charAt(0)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 space-y-6">
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
      <div className="bg-slate-50 border-t-2 border-slate-200 px-5 py-3">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-3xl font-black text-blue-600">
              {homeStats.goals + homeStats.yellowCards + homeStats.redCards + homeStats.substitutions}
            </div>
            <div className="text-xs text-slate-600 font-medium">Total de Eventos - {homeTeam.name}</div>
          </div>
          <div>
            <div className="text-3xl font-black text-purple-600">
              {awayStats.goals + awayStats.yellowCards + awayStats.redCards + awayStats.substitutions}
            </div>
            <div className="text-xs text-slate-600 font-medium">Total de Eventos - {awayTeam.name}</div>
          </div>
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-xl font-bold text-slate-600 mb-2">
            Sem estatísticas ainda
          </p>
          <p className="text-sm text-slate-500">
            As estatísticas aparecerão conforme os eventos forem registrados
          </p>
        </div>
      )}
    </div>
  );
}
