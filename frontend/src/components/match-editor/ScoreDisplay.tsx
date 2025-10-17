import { motion, AnimatePresence } from 'framer-motion';

interface ScoreDisplayProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  sport: string;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const sizeClasses = {
  small: { container: 'text-2xl', score: 'text-4xl' },
  medium: { container: 'text-3xl', score: 'text-6xl' },
  large: { container: 'text-4xl', score: 'text-8xl' },
};

export function ScoreDisplay({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  sport,
  animated = true,
  size = 'large',
}: ScoreDisplayProps) {
  const sizes = sizeClasses[size];

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center justify-between gap-8">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <h3 className={`font-bold text-white mb-4 ${sizes.container}`}>
            {homeTeam}
          </h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={homeScore}
              initial={animated ? { scale: 1.5, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`font-black text-blue-400 ${sizes.score}`}
            >
              {homeScore}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <span className="text-gray-500 text-2xl font-bold">VS</span>
          <span className="text-gray-600 text-sm mt-2 uppercase tracking-wider">
            {sport}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left">
          <h3 className={`font-bold text-white mb-4 ${sizes.container}`}>
            {awayTeam}
          </h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={awayScore}
              initial={animated ? { scale: 1.5, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`font-black text-red-400 ${sizes.score}`}
            >
              {awayScore}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
