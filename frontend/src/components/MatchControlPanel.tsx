import { PlayIcon, PauseIcon, ForwardIcon, FlagIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';

interface MatchControlPanelProps {
  status: 'pending' | 'scheduled' | 'in-progress' | 'finished' | 'postponed';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEndPeriod: () => void;
  onFinish: () => void;
  initialTime?: number; // segundos
}

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
  const [period, setPeriod] = useState<'1º TEMPO' | 'INTERVALO' | '2º TEMPO' | 'PRORROGAÇÃO' | 'FINALIZADO'>('1º TEMPO');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'in-progress' && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev: number) => prev + 1);
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
    setElapsedTime((prev: number) => prev + (minutes * 60));
  };

  if (status === 'finished') {
    return (
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg p-6">
        <div className="text-center">
          <FlagIcon className="h-16 w-16 text-white mx-auto mb-3 opacity-75" />
          <h3 className="text-2xl font-bold text-white mb-2">Partida Finalizada</h3>
          <p className="text-slate-300">Tempo total: {formatTime(elapsedTime)}</p>
        </div>
      </div>
    );
  }

  if (status === 'scheduled' || status === 'pending') {
    return (
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full p-6 mb-4">
            <PlayIcon className="h-16 w-16 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">Iniciar Partida</h3>
          <p className="text-emerald-100 mb-6">Clique no botão abaixo para começar o cronômetro</p>
          <button
            onClick={onStart}
            className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
          >
            🚀 INICIAR JOGO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-xl shadow-2xl overflow-hidden">
      {/* Header com Cronômetro */}
      <div className="bg-black/20 backdrop-blur-sm px-8 py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <ClockIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="text-white/75 text-sm font-medium mb-1">CRONÔMETRO</div>
              <div className="text-6xl font-black text-white tracking-tight">
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-white/75 text-sm font-medium mb-1">PERÍODO</div>
            <div className="text-3xl font-bold text-white">{period}</div>
            {isPaused && period !== 'FINALIZADO' && (
              <div className="mt-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-lg text-sm font-semibold border border-amber-500/30 inline-block">
                ⏸️ PAUSADO
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles Principais */}
      <div className="p-6">
        {period === 'INTERVALO' ? (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-4">
              <h3 className="text-2xl font-bold text-white mb-2">⏸️ INTERVALO</h3>
              <p className="text-white/75 mb-6">Pressione o botão abaixo para iniciar o 2º tempo</p>
              <button
                onClick={handleStartSecondHalf}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
              >
                ▶️ INICIAR 2º TEMPO
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pausar/Retomar */}
            {isPaused ? (
              <button
                onClick={handleResume}
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform flex flex-col items-center gap-3"
              >
                <PlayIcon className="h-10 w-10" />
                <span>▶️ RETOMAR</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform flex flex-col items-center gap-3"
              >
                <PauseIcon className="h-10 w-10" />
                <span>⏸️ PAUSAR</span>
              </button>
            )}

            {/* Finalizar Período */}
            <button
              onClick={handleEndPeriod}
              className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform flex flex-col items-center gap-3"
              disabled={isPaused}
            >
              <ForwardIcon className="h-10 w-10" />
              <span>⏭️ {period === '1º TEMPO' ? 'INTERVALO' : 'ENCERRAR'}</span>
            </button>

            {/* Finalizar Jogo */}
            <button
              onClick={handleFinish}
              className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform flex flex-col items-center gap-3"
            >
              <FlagIcon className="h-10 w-10" />
              <span>🏁 FINALIZAR</span>
            </button>
          </div>
        )}

        {/* Ações Rápidas */}
        {period !== 'INTERVALO' && period !== 'FINALIZADO' && (
          <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Acréscimos:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddTime(1)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  +1 min
                </button>
                <button
                  onClick={() => handleAddTime(3)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  +3 min
                </button>
                <button
                  onClick={() => handleAddTime(5)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-all"
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
