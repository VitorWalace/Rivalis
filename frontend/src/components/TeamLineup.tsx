import type { Team } from '../types';

interface TeamLineupProps {
  team: Team;
  events: any[]; // eventos para verificar substituições e expulsões
  isHome?: boolean;
}

interface PlayerStatus {
  id: string;
  name: string;
  number?: number;
  position?: string;
  status: 'playing' | 'benched' | 'substituted_out' | 'red_carded';
  substituteMinute?: number;
}

export default function TeamLineup({ team, events, isHome = true }: TeamLineupProps) {
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
    return 'playing';
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
          <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-300">
            ⚽ EM CAMPO
          </span>
        );
      case 'benched':
        return (
          <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            🪑 BANCO
          </span>
        );
      case 'substituted_out':
        return (
          <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
            ⬆️ SUBSTITUÍDO
          </span>
        );
      case 'red_carded':
        return (
          <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
            🟥 EXPULSO
          </span>
        );
    }
  };

  const teamColor = isHome ? 'from-blue-600 to-blue-700' : 'from-purple-600 to-purple-700';
  const accentColor = isHome ? 'blue' : 'purple';

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${teamColor} px-5 py-4`}>
        <div className="flex items-center gap-3">
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{team.name?.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{team.name}</h3>
            <p className="text-sm text-white/80">
              {playingPlayers.length} em campo • {benchedPlayers.length} no banco
            </p>
          </div>
          <div className="text-white text-2xl">
            {isHome ? '🏠' : '🚗'}
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {/* Jogadores em campo */}
        {playingPlayers.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              ⚽ EM CAMPO ({playingPlayers.length})
            </h4>
            <div className="space-y-2">
              {playingPlayers.map(player => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 border-${accentColor}-200 bg-${accentColor}-50`}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${teamColor} flex items-center justify-center font-bold text-white shadow-md`}>
                    #{player.number || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{player.name}</div>
                    {player.position && (
                      <div className="text-xs text-slate-500">{player.position}</div>
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
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              🪑 BANCO DE RESERVAS ({benchedPlayers.length})
            </h4>
            <div className="space-y-2">
              {benchedPlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-700">
                    #{player.number || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-700 truncate">{player.name}</div>
                    {player.position && (
                      <div className="text-xs text-slate-500">{player.position}</div>
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
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              ⬆️ SUBSTITUÍDOS ({substitutedPlayers.length})
            </h4>
            <div className="space-y-2">
              {substitutedPlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-amber-200 bg-amber-50 opacity-60"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center font-bold text-amber-800">
                    #{player.number || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-amber-900 truncate">{player.name}</div>
                    {player.position && (
                      <div className="text-xs text-amber-700">{player.position}</div>
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
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              🟥 EXPULSOS ({redCardedPlayers.length})
            </h4>
            <div className="space-y-2">
              {redCardedPlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-red-300 bg-red-50"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-bold text-white">
                    #{player.number || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-red-900 truncate">{player.name}</div>
                    {player.position && (
                      <div className="text-xs text-red-700">{player.position}</div>
                    )}
                  </div>
                  {getStatusBadge(player.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {players.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-slate-600 font-semibold">Nenhum jogador cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
