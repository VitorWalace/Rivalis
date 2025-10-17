import { useMatchEditor } from '../../store/matchEditorStore';
import type { BasqueteMatch } from '../../types/match';
import { ScoreDisplay } from './ScoreDisplay';
import { EventButton } from './EventButton';
import { StatCard } from './StatCard';
import { Timeline } from './Timeline';
import { Target, TrendingUp, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function BasqueteEditor() {
  const { currentMatch, addBasquetePoints } = useMatchEditor();
  const [playerName, setPlayerName] = useState('');
  
  if (!currentMatch || currentMatch.sport !== 'basquete') return null;
  
  const match = currentMatch as BasqueteMatch;
  
  // Calculate current scores
  const homeScore = match.quarters.reduce((sum, q) => sum + q.homeScore, 0);
  const awayScore = match.quarters.reduce((sum, q) => sum + q.awayScore, 0);
  
  // Calculate stats
  const homeStats = match.stats.home;
  const awayStats = match.stats.away;
  
  const homeFg = ((homeStats.twoPoints.made + homeStats.threePoints.made) / 
    (homeStats.twoPoints.attempts + homeStats.threePoints.attempts) * 100) || 0;
  const awayFg = ((awayStats.twoPoints.made + awayStats.threePoints.made) / 
    (awayStats.twoPoints.attempts + awayStats.threePoints.attempts) * 100) || 0;
  
  // Timeline events
  const timelineEvents = match.events.map(event => {
    const icon = event.points === 3 ? Trophy : Target;
    const pointsLabel = event.points === 1 ? 'Lance Livre' : event.points === 2 ? 'Cesta 2pts' : 'Cesta 3pts 🎯';
    const team = event.team === 'home' ? match.homeTeam : match.awayTeam;
    const playerText = event.player ? ` - ${event.player}` : '';
    
    return {
      time: `Q${event.quarter} ${new Date(event.timestamp).toLocaleTimeString('pt-BR', { minute: '2-digit', second: '2-digit' })}`,
      icon,
      text: `${pointsLabel}: ${team}${playerText}`,
      color: (event.team === 'home' ? 'blue' : 'red') as 'blue' | 'red',
    };
  });
  
  const handleAddPoints = (team: 'home' | 'away', points: 1 | 2 | 3) => {
    addBasquetePoints(team, points, playerName || undefined);
    setPlayerName('');
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* VISUALIZAÇÃO - 2 colunas */}
      <div className="lg:col-span-2 space-y-6">
        {/* Placar Principal */}
        <ScoreDisplay
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeScore={homeScore}
          awayScore={awayScore}
          sport="BASQUETE"
        />
        
        {/* Placar por Quarter */}
        {match.quarters.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Placar por Quarter</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {match.quarters.map((quarter) => (
                <motion.div
                  key={quarter.quarter}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    bg-gray-700 rounded-lg p-4 text-center
                    ${quarter.quarter === match.currentQuarter ? 'ring-2 ring-orange-500' : ''}
                  `}
                >
                  <p className="text-gray-400 text-sm mb-2">Q{quarter.quarter}</p>
                  <p className="text-2xl font-bold text-white">
                    {quarter.homeScore} - {quarter.awayScore}
                  </p>
                </motion.div>
              ))}
            </div>
            
            {/* Gráfico de Barras Comparativo */}
            <div className="space-y-3 mt-6">
              {match.quarters.map((quarter) => (
                <div key={quarter.quarter} className="space-y-1">
                  <p className="text-gray-400 text-xs">Quarter {quarter.quarter}</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(quarter.homeScore / (quarter.homeScore + quarter.awayScore)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold"
                      >
                        {quarter.homeScore}
                      </motion.div>
                    </div>
                    <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(quarter.awayScore / (quarter.homeScore + quarter.awayScore)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 flex items-center justify-center text-white text-xs font-bold"
                      >
                        {quarter.awayScore}
                      </motion.div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label={`${match.homeTeam} - FG%`}
            value={`${homeFg.toFixed(1)}%`}
            color="blue"
          />
          <StatCard
            icon={Target}
            label={`${match.awayTeam} - FG%`}
            value={`${awayFg.toFixed(1)}%`}
            color="red"
          />
          <StatCard
            icon={Trophy}
            label="Cestas de 3"
            value={`${homeStats.threePoints.made} - ${awayStats.threePoints.made}`}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="Quarter Atual"
            value={match.currentQuarter}
            color="green"
          />
        </div>
        
        {/* Timeline */}
        <Timeline events={timelineEvents.reverse()} />
      </div>
      
      {/* CONTROLES - 1 coluna */}
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-6">
            Controles - Q{match.currentQuarter}
          </h3>
          
          {/* Player Input */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">
              Jogador (opcional)
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nome do jogador"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          {/* Mandante */}
          <div className="mb-6">
            <h4 className="text-white font-bold mb-3">{match.homeTeam}</h4>
            <div className="space-y-2">
              <EventButton
                icon={Target}
                label="+1 Lance Livre"
                color="blue"
                size="medium"
                onClick={() => handleAddPoints('home', 1)}
              />
              <EventButton
                icon={Target}
                label="+2 Cesta Normal"
                color="blue"
                size="medium"
                onClick={() => handleAddPoints('home', 2)}
              />
              <EventButton
                icon={Trophy}
                label="+3 Cesta de 3"
                color="purple"
                size="medium"
                onClick={() => handleAddPoints('home', 3)}
              />
            </div>
          </div>
          
          {/* Visitante */}
          <div>
            <h4 className="text-white font-bold mb-3">{match.awayTeam}</h4>
            <div className="space-y-2">
              <EventButton
                icon={Target}
                label="+1 Lance Livre"
                color="red"
                size="medium"
                onClick={() => handleAddPoints('away', 1)}
              />
              <EventButton
                icon={Target}
                label="+2 Cesta Normal"
                color="red"
                size="medium"
                onClick={() => handleAddPoints('away', 2)}
              />
              <EventButton
                icon={Trophy}
                label="+3 Cesta de 3"
                color="orange"
                size="medium"
                onClick={() => handleAddPoints('away', 3)}
              />
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Atalhos de Teclado:</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">[1] [2] [3]</span>
                <span className="text-white">Mandante</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">[4] [5] [6]</span>
                <span className="text-white">Visitante</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
