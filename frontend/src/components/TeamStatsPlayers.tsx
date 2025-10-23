import type { Team } from '../types';
import { TrophyIcon, UserCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface TeamStatsPlayersProps {
  team: Team;
}

export default function TeamStatsPlayers({ team }: TeamStatsPlayersProps) {
  const players = team.players || [];

  // Ordenar jogadores por gols
  const topScorers = [...players]
    .sort((a, b) => (b.goals || 0) - (a.goals || 0))
    .slice(0, 5);

  // Ordenar por assistências
  const topAssisters = [...players]
    .sort((a, b) => (b.assists || 0) - (a.assists || 0))
    .slice(0, 3);

  // Jogadores com mais cartões
  const mostCarded = [...players]
    .sort((a, b) => 
      ((b.yellowCards || 0) + (b.redCards || 0) * 2) - 
      ((a.yellowCards || 0) + (a.redCards || 0) * 2)
    )
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Artilheiros */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <TrophyIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Top 5 Artilheiros</h3>
        </div>

        {topScorers.length > 0 ? (
          <div className="space-y-3">
            {topScorers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-bold text-white
                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-500' : 'bg-slate-300'}
                `}>
                  {index + 1}º
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{player.name}</p>
                  <p className="text-sm text-slate-600">
                    #{player.number} • {player.position || 'Jogador'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{player.goals || 0}</p>
                  <p className="text-xs text-slate-600">gols</p>
                </div>
                {player.assists && player.assists > 0 && (
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-600">{player.assists}</p>
                    <p className="text-xs text-slate-600">assist.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserCircleIcon className="h-16 w-16 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Nenhum gol marcado ainda</p>
          </div>
        )}
      </div>

      {/* Top Assistências */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-200 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-blue-700" />
          </div>
          <h3 className="text-xl font-bold text-blue-900">Maiores Assistentes</h3>
        </div>

        {topAssisters.filter(p => (p.assists || 0) > 0).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topAssisters.filter(p => (p.assists || 0) > 0).map((player) => (
              <div key={player.id} className="bg-white rounded-lg p-4 shadow-sm">
                <p className="font-bold text-slate-900 truncate">{player.name}</p>
                <p className="text-sm text-slate-600 mb-2">#{player.number}</p>
                <p className="text-3xl font-bold text-blue-600">{player.assists || 0}</p>
                <p className="text-xs text-slate-600">assistências</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-blue-700">Nenhuma assistência registrada</p>
          </div>
        )}
      </div>

      {/* Disciplina */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Cartões Disciplinares</h3>

        {mostCarded.filter(p => (p.yellowCards || 0) + (p.redCards || 0) > 0).length > 0 ? (
          <div className="space-y-3">
            {mostCarded.filter(p => (p.yellowCards || 0) + (p.redCards || 0) > 0).map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div>
                  <p className="font-bold text-slate-900">{player.name}</p>
                  <p className="text-sm text-slate-600">#{player.number}</p>
                </div>
                <div className="flex items-center gap-4">
                  {player.yellowCards && player.yellowCards > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-8 bg-yellow-400 rounded"></div>
                      <span className="font-bold text-slate-900">{player.yellowCards}</span>
                    </div>
                  )}
                  {player.redCards && player.redCards > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-8 bg-red-500 rounded"></div>
                      <span className="font-bold text-slate-900">{player.redCards}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
              <span className="text-3xl">✨</span>
            </div>
            <p className="text-slate-600">Time sem cartões! Excelente disciplina!</p>
          </div>
        )}
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Total Jogadores</p>
          <p className="text-3xl font-bold text-slate-900">{players.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-700 mb-1">Total Gols</p>
          <p className="text-3xl font-bold text-green-900">
            {players.reduce((sum, p) => sum + (p.goals || 0), 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Assistências</p>
          <p className="text-3xl font-bold text-blue-900">
            {players.reduce((sum, p) => sum + (p.assists || 0), 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700 mb-1">Cartões</p>
          <p className="text-3xl font-bold text-yellow-900">
            {players.reduce((sum, p) => sum + (p.yellowCards || 0) + (p.redCards || 0), 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
