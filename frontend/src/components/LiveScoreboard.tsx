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

  const getTeamInitial = (team: Team) => {
    const name = team?.name?.trim();
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  };

  const getFallbackBackground = (team: Team, variant: 'home' | 'away') => {
    if (team?.color) {
      return `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)`;
    }
    return variant === 'home'
      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
      : 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)';
  };

  const renderTeamVisual = (team: Team, variant: 'home' | 'away') => {
    if (team.logo) {
      return (
        <img
          src={team.logo}
          alt={team.name}
          className="h-32 w-32 rounded-2xl border border-slate-700 object-cover shadow-lg"
        />
      );
    }

    return (
      <div
        className="flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-700 text-white shadow-lg"
        style={{ background: getFallbackBackground(team, variant) }}
      >
        <span className="text-4xl font-bold tracking-tight">
          {getTeamInitial(team)}
        </span>
      </div>
    );
  };

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ao vivo</span>
        </div>
      );
    }
    if (isFinished) {
      return (
        <div className="rounded-full border border-slate-600/60 bg-slate-700/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
          Finalizado
        </div>
      );
    }
    return (
      <div className="rounded-full border border-slate-600/60 bg-slate-700/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300">
        Agendado
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
      {/* Header com Status */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {isLive && (
              <div className="flex items-center gap-3 text-slate-200">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{period}</span>
                <span className="text-lg font-semibold">{time}</span>
              </div>
            )}
          </div>
          {isFinished && isDraw && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-200">
              Empate
            </div>
          )}
        </div>
      </div>

      {/* Placar Principal */}
      <div className="p-8">
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Time da Casa */}
          <div
            className={`text-center transition-all duration-300 ${
              homeWinning && isFinished ? 'scale-105' : isFinished ? 'opacity-60' : ''
            }`}
          >
            <div className="relative inline-block mb-4">
              {renderTeamVisual(homeTeam, 'home')}
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-100">{homeTeam.name}</h3>
            <div className="inline-block rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
              Mandante
            </div>
          </div>

          {/* Placar Central */}
          <div className="text-center">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
              <div className="flex items-center justify-center gap-6">
                <div className={`transition-all duration-500 ${
                  homeWinning ? 'scale-110' : ''
                }`}>
                  <div className={`text-8xl font-black tracking-tight ${
                    homeWinning && isFinished
                      ? 'text-emerald-300'
                      : isDraw && isFinished
                      ? 'text-amber-200'
                      : 'text-slate-100'
                  }`}>
                    {homeScore}
                  </div>
                </div>
                
                <div className="text-4xl font-semibold text-slate-500">×</div>
                
                <div className={`transition-all duration-500 ${
                  awayWinning ? 'scale-110' : ''
                }`}>
                  <div className={`text-8xl font-black tracking-tight ${
                    awayWinning && isFinished
                      ? 'text-emerald-300'
                      : isDraw && isFinished
                      ? 'text-amber-200'
                      : 'text-slate-100'
                  }`}>
                    {awayScore}
                  </div>
                </div>
              </div>
              
              {isLive && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Partida em andamento</span>
                </div>
              )}
            </div>
          </div>

          {/* Time Visitante */}
          <div
            className={`text-center transition-all duration-300 ${
              awayWinning && isFinished ? 'scale-105' : isFinished ? 'opacity-60' : ''
            }`}
          >
            <div className="relative inline-block mb-4">
              {renderTeamVisual(awayTeam, 'away')}
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-100">{awayTeam.name}</h3>
            <div className="inline-block rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
              Visitante
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
