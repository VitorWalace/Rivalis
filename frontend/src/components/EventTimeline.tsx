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

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'goal':
        return 'from-green-500 to-emerald-500';
      case 'yellow_card':
        return 'from-yellow-400 to-amber-500';
      case 'red_card':
        return 'from-red-500 to-rose-600';
      case 'substitution':
        return 'from-blue-500 to-indigo-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
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

  const getTeamName = (teamId: string) => {
    return teamId === homeTeam.id ? homeTeam.name : awayTeam.name;
  };

  const getTeamColor = (teamId: string) => {
    return teamId === homeTeam.id ? 'text-blue-600' : 'text-purple-600';
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
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          📋 LINHA DO TEMPO
        </h3>
        <p className="text-sm text-slate-300 mt-1">
          {events.length} {events.length === 1 ? 'evento registrado' : 'eventos registrados'}
        </p>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {sortedEvents.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {sortedEvents.map((event, index) => (
              <div
                key={event.id}
                className="relative group hover:bg-slate-50 rounded-xl transition-all border-2 border-slate-200 hover:border-slate-300 hover:shadow-md"
              >
                {/* Timeline Line */}
                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-[29px] top-[60px] bottom-[-12px] w-0.5 bg-slate-200 group-hover:bg-slate-300" />
                )}

                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${getEventColor(event.type)} flex items-center justify-center text-2xl shadow-lg`}>
                    {getEventIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-black text-slate-900">
                        {event.minute}'
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${getEventColor(event.type)}`}>
                        {getEventLabel(event)}
                      </span>
                    </div>

                    <div className={`font-bold text-lg ${getTeamColor(event.teamId)} mb-1`}>
                      {getTeamName(event.teamId)}
                    </div>

                    <div className="text-sm text-slate-600 leading-relaxed break-words">
                      {formatDescription(event)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(event)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 text-blue-600 hover:text-blue-700"
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
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors border border-red-200 text-red-600 hover:text-red-700"
                      title="Excluir evento"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🕐</div>
            <p className="text-xl font-bold text-slate-600 mb-2">
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
        <div className="bg-slate-50 border-t-2 border-slate-200 px-5 py-3">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.type === 'goal').length}
              </div>
              <div className="text-xs text-slate-600 font-medium">Gols</div>
            </div>
            <div className="w-px h-8 bg-slate-300" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {events.filter(e => e.type === 'yellow_card').length}
              </div>
              <div className="text-xs text-slate-600 font-medium">Amarelos</div>
            </div>
            <div className="w-px h-8 bg-slate-300" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {events.filter(e => e.type === 'red_card').length}
              </div>
              <div className="text-xs text-slate-600 font-medium">Vermelhos</div>
            </div>
            <div className="w-px h-8 bg-slate-300" />
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {events.filter(e => e.type === 'substitution').length}
              </div>
              <div className="text-xs text-slate-600 font-medium">Substituições</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
