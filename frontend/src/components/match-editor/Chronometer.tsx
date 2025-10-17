import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChronometerProps {
  initialTime: string; // Format: "MM:SS" or "HH:MM:SS"
  counting?: 'up' | 'down';
  onFinish?: () => void;
  pausable?: boolean;
  onTimeUpdate?: (time: string) => void;
}

export function Chronometer({
  initialTime,
  counting = 'up',
  onFinish,
  pausable = true,
  onTimeUpdate,
}: ChronometerProps) {
  const [seconds, setSeconds] = useState(timeToSeconds(initialTime));
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = counting === 'up' ? prev + 1 : prev - 1;

        if (counting === 'down' && next <= 0) {
          setIsRunning(false);
          onFinish?.();
          return 0;
        }

        const timeString = secondsToTime(next);
        onTimeUpdate?.(timeString);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, counting, onFinish, onTimeUpdate]);

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setSeconds(timeToSeconds(initialTime));
    setIsRunning(false);
  };

  const displayTime = secondsToTime(seconds);
  const progress = counting === 'down' ? (seconds / timeToSeconds(initialTime)) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="text-center mb-4">
        <motion.div
          key={displayTime}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-6xl font-mono font-bold text-white"
        >
          {displayTime}
        </motion.div>
      </div>

      {counting === 'down' && (
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <div className="flex gap-3 justify-center">
        {pausable && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className={`
              px-6 py-3 rounded-lg font-bold flex items-center gap-2
              ${
                isRunning
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-green-500 hover:bg-green-600'
              }
              text-white transition-colors
            `}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Iniciar
              </>
            )}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Resetar
        </motion.button>
      </div>
    </div>
  );
}

// Helper functions
function timeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function secondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}
