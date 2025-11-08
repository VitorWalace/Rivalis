import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useConfirm } from '../store/confirmStore';
import type { Team } from '../types';

type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution';

interface MatchEvent {
  id: string;
  type: EventType;
  minute: number;
  teamId: string;
  playerName?: string;
  playerNumber?: number;
  description?: string;
  assistPlayerName?: string;
  playerOutName?: string;
  playerInName?: string;
  goalType?: 'normal' | 'penalty' | 'own_goal' | 'free_kick';
}

interface EventTimelineProps {
  events: MatchEvent[];
  homeTeam: Team;
  awayTeam: Team;
  onEdit: (event: MatchEvent) => void;
  onDelete: (eventId: string) => void;
}

export default function EventTimeline({
  events,
  homeTeam,
  awayTeam,
  onEdit,
  onDelete,
}: EventTimelineProps) {
  const confirm = useConfirm();
  const getTeamById = (teamId: string) => (teamId === homeTeam.id ? homeTeam : awayTeam);

  const getTeamInitial = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';
  };

  const renderTeamBadge = (teamId: string) => {
    const team = getTeamById(teamId);
    const variant = teamId === homeTeam.id ? 'home' : 'away';

    if (team?.logo) {
      return (
        <img
          src={team.logo}
          alt={team.name}
          className="h-9 w-9 rounded-full border border-white/20 object-cover shadow-sm"
        />
      );
    }

    const fallbackBackground = team?.color
      ? `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)`
      : variant === 'home'
      ? 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)'
      : 'linear-gradient(135deg, #f97316 0%, #6366f1 100%)';

    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs font-semibold text-white"
        style={{ background: fallbackBackground }}
      >
        {getTeamInitial(team?.name)}
      </div>
    );
  };
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution':
        return '🔄';
      default:
        return '📝';
    }
  };

  const eventStyles: Record<EventType, { icon: string; chip: string; stat: string }> = {
    goal: {
      icon: 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
      chip: 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
      stat: 'text-emerald-300',
    },
    yellow_card: {
      icon: 'border border-amber-500/40 bg-amber-500/10 text-amber-200',
      chip: 'border border-amber-500/40 bg-amber-500/10 text-amber-200',
      stat: 'text-amber-300',
    },
    red_card: {
      icon: 'border border-rose-500/40 bg-rose-500/10 text-rose-200',
      chip: 'border border-rose-500/40 bg-rose-500/10 text-rose-200',
      stat: 'text-rose-300',
    },
    substitution: {
      icon: 'border border-sky-500/40 bg-sky-500/10 text-sky-200',
      chip: 'border border-sky-500/40 bg-sky-500/10 text-sky-200',
      stat: 'text-sky-300',
    },
  };

  const defaultStyle = {
    icon: 'border border-slate-700 bg-slate-800 text-slate-200',
    chip: 'border border-slate-700 bg-slate-800 text-slate-200',
    stat: 'text-slate-200',
  };

  const getEventLabel = (event: MatchEvent) => {
    switch (event.type) {
      case 'goal':
        return 'GOL';
      case 'yellow_card':
        return 'CARTÃO AMARELO';
      case 'red_card':
        return 'CARTÃO VERMELHO';
      case 'substitution':
        return 'SUBSTITUIÇÃO';
      default:
        return 'EVENTO';
    }
  };

  const getTeamName = (teamId: string) => getTeamById(teamId)?.name;

  const getTeamColor = (teamId: string) => {
    return teamId === homeTeam.id ? 'text-emerald-200' : 'text-sky-200';
  };

  const formatDescription = (event: MatchEvent) => {
    const parts: string[] = [];

    if (event.playerNumber && event.playerName) {
      parts.push(`#${event.playerNumber} ${event.playerName}`);
    } else if (event.playerName) {
      parts.push(event.playerName);
    }

    if (event.type === 'goal' && event.goalType) {
      const goalTypes = {
        normal: '',
        penalty: '(Pênalti)',
        own_goal: '(Contra)',
        free_kick: '(Falta)',
      };
      if (goalTypes[event.goalType]) {
        parts.push(goalTypes[event.goalType]);
      }
    }

    if (event.type === 'goal' && event.assistPlayerName) {
      parts.push(`• Assistência: ${event.assistPlayerName}`);
    }

    if (event.type === 'substitution') {
      if (event.playerOutName && event.playerInName) {
        return `⬆️ ${event.playerOutName} • ⬇️ ${event.playerInName}`;
      }
    }

    if (event.description) {
      parts.push(`• ${event.description}`);
    }

    return parts.join(' ');
  };

  // Ordena eventos do mais recente para o mais antigo
  const sortedEvents = [...events].sort((a, b) => b.minute - a.minute);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-xl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-5 py-4">
        <h3 className="text-lg font-semibold uppercase tracking-wide text-slate-300">
          Linha do tempo
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {events.length} {events.length === 1 ? 'evento registrado' : 'eventos registrados'}
        </p>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {sortedEvents.length > 0 ? (
          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
            {sortedEvents.map((event, index) => {
              const styles = eventStyles[event.type] || defaultStyle;
              return (
                <div
                  key={event.id}
                  className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 transition hover:border-slate-600 hover:bg-slate-900"
                >
                {/* Timeline Line */}
                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-[29px] top-[60px] bottom-[-12px] w-px bg-slate-800 group-hover:bg-slate-700" />
                )}

                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl ${styles.icon}`}>
                    {getEventIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-3">
                      <span className="text-2xl font-semibold text-slate-100">
                        {event.minute}'
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles.chip}`}>
                        {getEventLabel(event)}
                      </span>
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                      {renderTeamBadge(event.teamId)}
                      <div className={`text-sm font-semibold uppercase tracking-wide ${getTeamColor(event.teamId)}`}>
                        {getTeamName(event.teamId) || 'A definir'}
                      </div>
                    </div>

                    <div className="break-words text-sm text-slate-300">
                      {formatDescription(event)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => onEdit(event)}
                      className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                      title="Editar evento"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Excluir evento',
                          message: 'Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.',
                          confirmText: 'Excluir',
                          cancelText: 'Cancelar',
                          tone: 'danger',
                        });
                        if (ok) onDelete(event.id);
                      }}
                      className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-rose-500/50 hover:text-rose-300"
                      title="Excluir evento"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="mb-2 text-lg font-semibold text-slate-300">
              Nenhum evento registrado
            </p>
            <p className="text-sm text-slate-500">
              Use os botões de ação para começar a registrar eventos da partida
            </p>
          </div>
        )}
      </div>

      {/* Footer com estatísticas rápidas */}
      {events.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900/70 px-5 py-3">
          <div className="flex items-center justify-around text-center text-xs uppercase tracking-wide text-slate-400">
            {(['goal', 'yellow_card', 'red_card', 'substitution'] as EventType[]).map((type) => {
              const styles = eventStyles[type] || defaultStyle;
              const labelMap: Record<EventType, string> = {
                goal: 'Gols',
                yellow_card: 'Amarelos',
                red_card: 'Vermelhos',
                substitution: 'Substituições',
              };
              return (
                <div key={type} className="flex flex-col items-center gap-1">
                  <span className={`text-lg font-semibold ${styles.stat}`}>
                    {events.filter((e) => e.type === type).length}
                  </span>
                  <span>{labelMap[type]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
