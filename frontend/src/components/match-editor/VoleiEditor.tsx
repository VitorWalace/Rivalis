import { useMatchEditor } from '../../store/matchEditorStore';
import type { VoleiMatch } from '../../types/match';
import { ScoreDisplay } from './ScoreDisplay';
import { EventButton } from './EventButton';
import { StatCard } from './StatCard';
import { Timeline } from './Timeline';
import { Award, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function VoleiEditor() {
  const { currentMatch, addVoleiPoint } = useMatchEditor();
  
  if (!currentMatch || currentMatch.sport !== 'volei') return null;
  
  const match = currentMatch as VoleiMatch;
  
  // Calculate current scores
  const currentSetData = match.sets.find(s => s.set === match.currentSet);
  const homeScore = currentSetData?.homeScore || 0;
  const awayScore = currentSetData?.awayScore || 0;
  
  // Calculate sets won
  const homeSetsWon = match.sets.filter(s => s.homeScore > s.awayScore).length;
  const awaySetsWon = match.sets.filter(s => s.awayScore > s.homeScore).length;
  
  // Check if set point
  const isSetPoint = homeScore >= 24 || awayScore >= 24;
  
  // Timeline events
  const timelineEvents = match.events.map(event => ({
    time: new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    icon: Award,
    text: `Ponto para ${event.team === 'home' ? match.homeTeam : match.awayTeam} - Set ${event.setNumber}`,
    color: (event.team === 'home' ? 'blue' : 'red') as 'blue' | 'red',
  }));
  
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
          sport="VÔLEI"
        />
        
        {/* Sets Completos */}
        {match.sets.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Placar por Sets</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {match.sets.map((set) => (
                <motion.div
                  key={set.set}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    bg-gray-700 rounded-lg p-4 text-center
                    ${set.set === match.currentSet ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  <p className="text-gray-400 text-sm mb-2">Set {set.set}</p>
                  <p className={`text-2xl font-bold ${set.homeScore > set.awayScore ? 'text-blue-400' : 'text-red-400'}`}>
                    {set.homeScore} - {set.awayScore}
                  </p>
                  {set.homeScore > set.awayScore && (
                    <p className="text-blue-400 text-xs mt-1">✓ {match.homeTeam}</p>
                  )}
                  {set.awayScore > set.homeScore && (
                    <p className="text-red-400 text-xs mt-1">✓ {match.awayTeam}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={Award}
            label="Sets Vencidos"
            value={`${homeSetsWon} - ${awaySetsWon}`}
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Set Atual"
            value={match.currentSet}
            color="green"
            subtitle={isSetPoint ? '⚠️ Set Point!' : undefined}
          />
          <StatCard
            icon={Clock}
            label="Total de Pontos"
            value={match.events.length}
            color="purple"
          />
        </div>
        
        {/* Timeline */}
        <Timeline events={timelineEvents.reverse()} />
      </div>
      
      {/* CONTROLES - 1 coluna */}
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-6">
            Controles - Set {match.currentSet}
          </h3>
          
          {isSetPoint && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="bg-yellow-500 text-black font-bold text-center py-3 rounded-lg mb-4"
            >
              ⚠️ SET POINT!
            </motion.div>
          )}
          
          <div className="space-y-4">
            <EventButton
              icon={Award}
              label={`PONTO ${match.homeTeam.toUpperCase()}`}
              color="blue"
              onClick={() => addVoleiPoint('home')}
            />
            
            <EventButton
              icon={Award}
              label={`PONTO ${match.awayTeam.toUpperCase()}`}
              color="red"
              onClick={() => addVoleiPoint('away')}
            />
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm mb-3">Atalhos de Teclado:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tecla [1]</span>
                <span className="text-white">Ponto Mandante</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tecla [2]</span>
                <span className="text-white">Ponto Visitante</span>
              </div>
            </div>
          </div>
          
          {/* Progress to 25 */}
          <div className="mt-6">
            <p className="text-gray-400 text-sm mb-2">Progresso do Set</p>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                style={{ width: `${(homeScore / 25) * 100}%` }}
              />
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                style={{ width: `${(awayScore / 25) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
