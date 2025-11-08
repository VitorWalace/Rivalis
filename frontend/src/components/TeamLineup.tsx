import type { Team } from '../types';

interface TeamLineupProps {
  team: Team;
  events: any[]; // eventos para verificar substituições e expulsões
  isHome?: boolean;
  activePlayerIds?: string[];
}

interface PlayerStatus {
  id: string;
  name: string;
  number?: number;
  position?: string;
  status: 'playing' | 'benched' | 'substituted_out' | 'red_carded';
  substituteMinute?: number;
}

export default function TeamLineup({ team, events, isHome = true, activePlayerIds }: TeamLineupProps) {
  const getBaseStatus = (playerId: string): PlayerStatus['status'] => {
    if (!activePlayerIds || activePlayerIds.length === 0) {
      return 'playing';
    }
    return activePlayerIds.includes(playerId) ? 'playing' : 'benched';
  };

  const getPlayerStatus = (playerId: string): PlayerStatus['status'] => {
    // Verifica se foi expulso
    const hasRedCard = events.some(
      e => e.type === 'red_card' && e.playerId === playerId
    );
    if (hasRedCard) return 'red_carded';

    // Verifica se foi substituído (saiu)
    const wasSubstitutedOut = events.some(
      e => e.type === 'substitution' && e.playerOutId === playerId
    );
    if (wasSubstitutedOut) return 'substituted_out';

    // Verifica se entrou (estava no banco)
    const wasSubstitutedIn = events.some(
      e => e.type === 'substitution' && e.playerInId === playerId
    );
    if (wasSubstitutedIn) return 'playing';

    // Por padrão, assume que jogadores estão jogando (ajustar conforme escalação inicial)
    return getBaseStatus(playerId);
  };

  const players: PlayerStatus[] = (team.players || []).map(player => ({
    id: player.id,
    name: player.name,
    number: player.number,
    position: player.position,
    status: getPlayerStatus(player.id),
  }));

  const playingPlayers = players.filter(p => p.status === 'playing');
  const benchedPlayers = players.filter(p => p.status === 'benched');
  const substitutedPlayers = players.filter(p => p.status === 'substituted_out');
  const redCardedPlayers = players.filter(p => p.status === 'red_carded');

  const getStatusBadge = (status: PlayerStatus['status']) => {
    switch (status) {
      case 'playing':
        return (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
            Em quadra
          </span>
        );
      case 'benched':
        return (
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
            Banco
          </span>
        );
      case 'substituted_out':
        return (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            Substituído
          </span>
        );
      case 'red_carded':
        return (
          <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-200">
            Expulso
          </span>
        );
    }
  };

  const accent = isHome
    ? {
        tag: 'text-emerald-200',
        highlightBox: 'border-emerald-500/40 bg-emerald-500/5',
        number: 'bg-emerald-500/20 text-emerald-200',
      }
    : {
        tag: 'text-sky-200',
        highlightBox: 'border-sky-500/40 bg-sky-500/5',
        number: 'bg-sky-500/20 text-sky-200',
      };

  const getRowClasses = (status: PlayerStatus['status']) => {
    switch (status) {
      case 'playing':
        return `border ${accent.highlightBox}`;
      case 'benched':
        return 'border border-slate-800 bg-slate-900/70';
      case 'substituted_out':
        return 'border border-amber-500/40 bg-amber-500/10 text-amber-100';
      case 'red_carded':
        return 'border border-rose-500/40 bg-rose-500/10 text-rose-100';
      default:
        return 'border border-slate-800 bg-slate-900/70';
    }
  };

  const getNumberClasses = (status: PlayerStatus['status']) => {
    switch (status) {
      case 'playing':
        return `bg-slate-900/80 ${accent.number}`;
      case 'benched':
        return 'bg-slate-800 text-slate-300';
      case 'substituted_out':
        return 'bg-amber-500/20 text-amber-200';
      case 'red_carded':
        return 'bg-rose-500/20 text-rose-200';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const getTeamInitial = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';
  };

  const renderTeamBadge = () => {
    if (team.logo) {
      return <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />;
    }

    const fallbackBackground = team.color
      ? `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)`
      : isHome
      ? 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)'
      : 'linear-gradient(135deg, #f97316 0%, #6366f1 100%)';

    return (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 text-white"
        style={{ background: fallbackBackground }}
      >
        <span className="text-lg font-bold">{getTeamInitial(team.name)}</span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-xl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-5 py-4">
        <div className="flex items-center gap-3">
          {renderTeamBadge()}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-100">{team.name}</h3>
            <p className="text-xs text-slate-400">
              {playingPlayers.length} em quadra • {benchedPlayers.length} no banco
            </p>
          </div>
          <div className={`text-xs font-semibold uppercase tracking-wide ${accent.tag}`}>
            {isHome ? 'Mandante' : 'Visitante'}
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="max-h-[500px] space-y-4 overflow-y-auto p-4">
        {/* Jogadores em campo */}
        {playingPlayers.length > 0 && (
          <div>
            <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${accent.tag}`}>
              Em quadra ({playingPlayers.length})
            </h4>
            <div className="space-y-2">
              {playingPlayers.map(player => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${getRowClasses(player.status)}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${getNumberClasses(player.status)}`}>
                    #{player.number || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">{player.name}</div>
                    {player.position && (
                      <div className="text-[11px] text-slate-400">{player.position}</div>
                    )}
                  </div>
                  {getStatusBadge(player.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jogadores no banco */}
        {benchedPlayers.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Banco de reservas ({benchedPlayers.length})
            </h4>
            <div className="space-y-2">
              {benchedPlayers.map(player => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${getRowClasses(player.status)}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${getNumberClasses(player.status)}`}>
                    #{player.number || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">{player.name}</div>
                    {player.position && (
                      <div className="text-[11px] text-slate-400">{player.position}</div>
                    )}
                  </div>
                  {getStatusBadge(player.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jogadores substituídos */}
        {substitutedPlayers.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200">
              Substituídos ({substitutedPlayers.length})
            </h4>
            <div className="space-y-2">
              {substitutedPlayers.map(player => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${getRowClasses(player.status)}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${getNumberClasses(player.status)}`}>
                    #{player.number || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">{player.name}</div>
                    {player.position && (
                      <div className="text-[11px] text-amber-200/80">{player.position}</div>
                    )}
                  </div>
                  {getStatusBadge(player.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jogadores expulsos */}
        {redCardedPlayers.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-200">
              Expulsos ({redCardedPlayers.length})
            </h4>
            <div className="space-y-2">
              {redCardedPlayers.map(player => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${getRowClasses(player.status)}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${getNumberClasses(player.status)}`}>
                    #{player.number || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">{player.name}</div>
                    {player.position && (
                      <div className="text-[11px] text-rose-200/80">{player.position}</div>
                    )}
                  </div>
                  {getStatusBadge(player.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {players.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            Nenhum jogador cadastrado para este time.
          </div>
        )}
      </div>
    </div>
  );
}
