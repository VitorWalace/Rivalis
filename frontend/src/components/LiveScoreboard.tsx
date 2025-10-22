import type { Team } from '../types';

interface LiveScoreboardProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status?: 'pending' | 'scheduled' | 'in-progress' | 'finished' | 'postponed';
  period?: string;
  time?: string;
}

export default function LiveScoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status = 'scheduled',
  period = '1º TEMPO',
  time = '00:00',
}: LiveScoreboardProps) {
  const isLive = status === 'in-progress';
  const isFinished = status === 'finished';
  const homeWinning = homeScore > awayScore;
  const awayWinning = awayScore > homeScore;
  const isDraw = homeScore === awayScore;

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="font-bold text-sm">AO VIVO</span>
        </div>
      );
    }
    if (isFinished) {
      return (
        <div className="bg-slate-600 text-white px-4 py-2 rounded-full font-bold text-sm">
          FINALIZADO
        </div>
      );
    }
    return (
      <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm">
        AGENDADO
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header com Status */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {isLive && (
              <div className="flex items-center gap-2 text-white">
                <span className="text-sm font-medium opacity-75">{period}</span>
                <span className="text-lg font-bold">{time}</span>
              </div>
            )}
          </div>
          {isFinished && isDraw && (
            <div className="bg-amber-500/20 text-amber-300 px-4 py-2 rounded-lg font-semibold text-sm border border-amber-500/30">
              ⚖️ EMPATE
            </div>
          )}
        </div>
      </div>

      {/* Placar Principal */}
      <div className="p-8">
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Time da Casa */}
          <div className={`text-center transition-all duration-300 ${
            homeWinning && isFinished ? 'scale-105' : isFinished ? 'opacity-60' : ''
          }`}>
            <div className="relative inline-block mb-4">
              {homeTeam.logo ? (
                <img
                  src={homeTeam.logo}
                  alt={homeTeam.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-white/20 shadow-xl">
                  <span className="text-5xl font-bold text-white">
                    {homeTeam.name?.charAt(0) || 'A'}
                  </span>
                </div>
              )}
              {homeWinning && isFinished && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-12 h-12 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-2xl">🏆</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{homeTeam.name}</h3>
            <div className="inline-block bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-lg text-sm font-semibold border border-blue-500/30">
              🏠 CASA
            </div>
          </div>

          {/* Placar Central */}
          <div className="text-center">
            <div className="bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-center gap-6">
                <div className={`transition-all duration-500 ${
                  homeWinning ? 'scale-110' : ''
                }`}>
                  <div className={`text-8xl font-black tracking-tight ${
                    homeWinning && isFinished
                      ? 'text-green-400'
                      : isDraw && isFinished
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}>
                    {homeScore}
                  </div>
                </div>
                
                <div className="text-5xl font-bold text-white/40">×</div>
                
                <div className={`transition-all duration-500 ${
                  awayWinning ? 'scale-110' : ''
                }`}>
                  <div className={`text-8xl font-black tracking-tight ${
                    awayWinning && isFinished
                      ? 'text-green-400'
                      : isDraw && isFinished
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}>
                    {awayScore}
                  </div>
                </div>
              </div>
              
              {isLive && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-red-400">PARTIDA EM ANDAMENTO</span>
                </div>
              )}
            </div>
          </div>

          {/* Time Visitante */}
          <div className={`text-center transition-all duration-300 ${
            awayWinning && isFinished ? 'scale-105' : isFinished ? 'opacity-60' : ''
          }`}>
            <div className="relative inline-block mb-4">
              {awayTeam.logo ? (
                <img
                  src={awayTeam.logo}
                  alt={awayTeam.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border-4 border-white/20 shadow-xl">
                  <span className="text-5xl font-bold text-white">
                    {awayTeam.name?.charAt(0) || 'B'}
                  </span>
                </div>
              )}
              {awayWinning && isFinished && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-12 h-12 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-2xl">🏆</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{awayTeam.name}</h3>
            <div className="inline-block bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-lg text-sm font-semibold border border-purple-500/30">
              🚗 VISITANTE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
