import { PlayIcon, PauseIcon, ForwardIcon, FlagIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';

interface MatchControlPanelProps {
  status: 'pending' | 'scheduled' | 'in-progress' | 'finished' | 'postponed';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEndPeriod: () => void;
  onFinish: () => void;
  initialTime?: number;
}

type PeriodLabel = '1º TEMPO' | 'INTERVALO' | '2º TEMPO' | 'PRORROGAÇÃO' | 'FINALIZADO';

export default function MatchControlPanel({
  status,
  onStart,
  onPause,
  onResume,
  onEndPeriod,
  onFinish,
  initialTime = 0,
}: MatchControlPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(status !== 'in-progress');
  const [period, setPeriod] = useState<PeriodLabel>('1º TEMPO');

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (status === 'in-progress' && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(true);
    onPause();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResume();
  };

  const handleEndPeriod = () => {
    if (period === '1º TEMPO') {
      setPeriod('INTERVALO');
      setIsPaused(true);
    } else if (period === '2º TEMPO') {
      handleFinish();
    }
    onEndPeriod();
  };

  const handleStartSecondHalf = () => {
    setPeriod('2º TEMPO');
    setElapsedTime(0);
    setIsPaused(false);
  };

  const handleFinish = () => {
    setPeriod('FINALIZADO');
    setIsPaused(true);
    onFinish();
  };

  const handleAddTime = (minutes: number) => {
    setElapsedTime((prev) => prev + minutes * 60);
  };

  if (status === 'finished') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 text-slate-100 shadow-xl">
        <div className="text-center">
          <FlagIcon className="mx-auto mb-4 h-14 w-14 text-slate-400" />
          <h3 className="mb-2 text-2xl font-semibold">Partida finalizada</h3>
          <p className="text-sm text-slate-400">Tempo total: {formatTime(elapsedTime)}</p>
        </div>
      </div>
    );
  }

  if (status === 'scheduled' || status === 'pending') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-slate-100 shadow-xl">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
            <PlayIcon className="h-8 w-8 text-emerald-300" />
          </div>
          <h3 className="text-2xl font-semibold">Iniciar partida</h3>
          <p className="text-sm text-slate-400">Quando estiver pronto, inicie o cronômetro da partida.</p>
          <button
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-0"
          >
            <PlayIcon className="h-5 w-5" />
            <span>Iniciar jogo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700 bg-slate-800">
            <ClockIcon className="h-8 w-8 text-slate-300" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Cronômetro</div>
            <div className="text-5xl font-semibold text-slate-100">{formatTime(elapsedTime)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Período</div>
          <div className="text-2xl font-semibold text-slate-100">{period}</div>
          {isPaused && period !== 'FINALIZADO' && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-200">
              Pausado
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {period === 'INTERVALO' ? (
          <div className="text-center">
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
              <h3 className="mb-2 text-xl font-semibold text-slate-100">Intervalo</h3>
              <p className="text-sm text-slate-400">Quando quiser retomar, inicie o segundo tempo.</p>
            </div>
            <button
              onClick={handleStartSecondHalf}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              <PlayIcon className="h-5 w-5" />
              <span>Iniciar 2º tempo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {isPaused ? (
              <button
                onClick={handleResume}
                className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-6 text-sm font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              >
                <PlayIcon className="h-10 w-10" />
                <span>Retomar</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex flex-col items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-6 text-sm font-semibold uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/15 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <PauseIcon className="h-10 w-10" />
                <span>Pausar</span>
              </button>
            )}

            <button
              onClick={handleEndPeriod}
              className="flex flex-col items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-6 py-6 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-600"
              disabled={isPaused}
            >
              <ForwardIcon className="h-10 w-10" />
              <span>{period === '1º TEMPO' ? 'Encerrar 1º tempo' : 'Encerrar período'}</span>
            </button>

            <button
              onClick={handleFinish}
              className="flex flex-col items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-6 py-6 text-sm font-semibold uppercase tracking-wide text-rose-200 transition hover:bg-rose-500/15 focus:outline-none focus:ring-2 focus:ring-rose-400/50"
            >
              <FlagIcon className="h-10 w-10" />
              <span>Finalizar partida</span>
            </button>
          </div>
        )}

        {period !== 'INTERVALO' && period !== 'FINALIZADO' && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">Acréscimos</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddTime(1)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
                >
                  +1 min
                </button>
                <button
                  onClick={() => handleAddTime(3)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
                >
                  +3 min
                </button>
                <button
                  onClick={() => handleAddTime(5)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
                >
                  +5 min
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
