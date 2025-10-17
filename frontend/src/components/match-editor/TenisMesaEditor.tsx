import { useMatchEditor } from '../../store/matchEditorStore';
import type { TenisMesaMatch } from '../../types/match';
import { ScoreDisplay } from './ScoreDisplay';
import { EventButton } from './EventButton';
import { StatCard } from './StatCard';
import { Award, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export function TenisMesaEditor() {
  const { currentMatch, addTenisMesaPoint } = useMatchEditor();
  
  if (!currentMatch || currentMatch.sport !== 'tenis_mesa') return null;
  
  const match = currentMatch as TenisMesaMatch;
  
  // Calculate sets won
  const playerASets = match.sets.filter(s => s.playerA > s.playerB).length;
  const playerBSets = match.sets.filter(s => s.playerB > s.playerA).length;
  
  // Check for deuce
  const isDeuce = match.currentSet.playerA >= 10 && match.currentSet.playerB >= 10;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* VISUALIZAÇÃO - 2 colunas */}
      <div className="lg:col-span-2 space-y-6">
        {/* Placar Principal */}
        <ScoreDisplay
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeScore={match.currentSet.playerA}
          awayScore={match.currentSet.playerB}
          sport="TÊNIS DE MESA"
          size="large"
        />
        
        {/* Indicador de Saque */}
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 mb-2">Sacando</p>
          <p className="text-white text-2xl font-bold">
            🏓 {match.currentSet.serving === 'playerA' ? match.homeTeam : match.awayTeam}
          </p>
        </div>
        
        {isDeuce && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-yellow-500 text-black font-bold text-center py-4 rounded-lg text-xl"
          >
            ⚠️ DEUCE! Precisa de 2 pontos de diferença
          </motion.div>
        )}
        
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
                  className="bg-gray-700 rounded-lg p-4 text-center"
                >
                  <p className="text-gray-400 text-sm mb-2">Set {set.set}</p>
                  <p className={`text-2xl font-bold ${set.playerA > set.playerB ? 'text-blue-400' : 'text-red-400'}`}>
                    {set.playerA} - {set.playerB}
                  </p>
                  {set.playerA > set.playerB && (
                    <p className="text-blue-400 text-xs mt-1">✓ {match.homeTeam}</p>
                  )}
                  {set.playerB > set.playerA && (
                    <p className="text-red-400 text-xs mt-1">✓ {match.awayTeam}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={Award}
            label="Sets Vencidos"
            value={`${playerASets} - ${playerBSets}`}
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Set Atual"
            value={match.sets.length + 1}
            color="green"
          />
          <StatCard
            icon={Target}
            label="Total de Pontos"
            value={match.events.length}
            color="purple"
          />
        </div>
      </div>
      
      {/* CONTROLES - 1 coluna */}
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-6">
            Controles - Set {match.sets.length + 1}
          </h3>
          
          <div className="space-y-4">
            <EventButton
              icon={Award}
              label={`PONTO ${match.homeTeam.toUpperCase()}`}
              color="blue"
              onClick={() => addTenisMesaPoint('playerA')}
            />
            
            <EventButton
              icon={Award}
              label={`PONTO ${match.awayTeam.toUpperCase()}`}
              color="red"
              onClick={() => addTenisMesaPoint('playerB')}
            />
          </div>
          
          {/* Progress to 11 */}
          <div className="mt-6">
            <p className="text-gray-400 text-sm mb-2">Progresso do Set</p>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${(match.currentSet.playerA / 11) * 100}%` }}
              >
                <span className="text-white text-xs font-bold">{match.currentSet.playerA}</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${(match.currentSet.playerB / 11) * 100}%` }}
              >
                <span className="text-white text-xs font-bold">{match.currentSet.playerB}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm mb-3">Atalhos de Teclado:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tecla [A]</span>
                <span className="text-white">Ponto Jogador A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tecla [B]</span>
                <span className="text-white">Ponto Jogador B</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
