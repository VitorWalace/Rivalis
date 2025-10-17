import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Clock } from 'lucide-react';

interface TimelineEvent {
  time: string;
  icon: LucideIcon;
  text: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'orange';
}

interface TimelineProps {
  events: TimelineEvent[];
  maxHeight?: string;
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
};

export function Timeline({ events, maxHeight = '500px' }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Nenhum evento registrado ainda</p>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-800 rounded-lg p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700"
      style={{ maxHeight }}
    >
      <h3 className="text-xl font-bold text-white mb-4">Timeline de Eventos</h3>
      <div className="space-y-3">
        {events.map((event, index) => {
          const Icon = event.icon;
          const color = event.color || 'blue';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className={`${colorClasses[color]} p-2 rounded-full flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-gray-300 text-sm font-mono">{event.time}</span>
                <p className="text-white font-medium mt-1">{event.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
