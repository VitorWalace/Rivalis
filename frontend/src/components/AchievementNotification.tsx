import { useEffect, useState } from 'react';
import { TrophyIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LevelInfo {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  totalXp: number;
  progress: string;
}

interface Props {
  achievements: Achievement[];
  xpGained: number;
  levelInfo?: LevelInfo;
  onClose: () => void;
}

export default function AchievementNotification({ 
  achievements, 
  xpGained, 
  levelInfo,
  onClose 
}: Props) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 7000); // 7 segundos
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };
  
  const getRarityColor = (rarity?: string) => {
    switch(rarity) {
      case 'legendary': return 'from-yellow-400 via-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 via-purple-600 to-pink-500';
      case 'rare': return 'from-blue-500 via-blue-600 to-cyan-500';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };
  
  const getRarityBorder = (rarity?: string) => {
    switch(rarity) {
      case 'legendary': return 'border-yellow-400';
      case 'epic': return 'border-purple-500';
      case 'rare': return 'border-blue-500';
      default: return 'border-gray-400';
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right max-w-sm">
      <div className={`bg-white rounded-xl shadow-2xl overflow-hidden border-4 ${getRarityBorder(achievements[0]?.rarity)}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-yellow-300 animate-bounce" />
            <h3 className="text-xl font-bold text-white">
              {achievements.length > 1 ? 'Conquistas Desbloqueadas!' : 'Conquista Desbloqueada!'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Conquistas */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} p-4 rounded-lg text-white shadow-lg transform hover:scale-105 transition-transform`}
              style={{
                animationDelay: `${index * 0.2}s`
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{achievement.name.split(' ')[0]}</div>
                <div className="flex-1">
                  <div className="text-lg font-bold">{achievement.name}</div>
                  <div className="text-sm opacity-90 mt-1">{achievement.description}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="font-semibold">+{achievement.xp} XP</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* XP Total e Nível */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-2xl font-bold text-indigo-600">+{xpGained} XP</div>
              <div className="text-sm text-slate-500">Total ganho</div>
            </div>
            {levelInfo && (
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">Nível {levelInfo.level}</div>
                <div className="text-sm text-slate-500">{levelInfo.totalXp} XP total</div>
              </div>
            )}
          </div>
          
          {/* Barra de Progresso */}
          {levelInfo && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>{levelInfo.currentXp} XP</span>
                <span className="font-semibold">{levelInfo.progress}%</span>
                <span>{levelInfo.xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
              <div className="text-xs text-center text-slate-500 mt-1">
                Próximo nível: {levelInfo.level + 1}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
