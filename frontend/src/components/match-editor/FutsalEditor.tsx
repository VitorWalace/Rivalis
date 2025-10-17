import { useMatchEditor } from '../../store/matchEditorStore';
import type { FutsalMatch } from '../../types/match';
import { ScoreDisplay } from './ScoreDisplay';
import { EventButton } from './EventButton';
import { StatCard } from './StatCard';
import { Timeline } from './Timeline';
import { Chronometer } from './Chronometer';
import { Target, AlertCircle, UserX, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function FutsalEditor() {
  const { currentMatch, addFutsalGoal, addFutsalCard } = useMatchEditor();
  const [playerName, setPlayerName] = useState('');
  const [showPlayerInput, setShowPlayerInput] = useState<{ type: 'goal' | 'yellow' | 'red', team: 'home' | 'away' } | null>(null);
  
  if (!currentMatch || currentMatch.sport !== 'futsal') return null;
  
  const match = currentMatch as FutsalMatch;
  
  // Calculate stats
  const homeGoals = match.events.filter(e => e.type === 'goal' && e.team === 'home').length;
  const awayGoals = match.events.filter(e => e.type === 'goal' && e.team === 'away').length;
  const homeYellow = match.events.filter(e => e.type === 'yellow_card' && e.team === 'home').length;
  const awayYellow = match.events.filter(e => e.type === 'yellow_card' && e.team === 'away').length;
  const homeRed = match.events.filter(e => e.type === 'red_card' && e.team === 'home').length;
  const awayRed = match.events.filter(e => e.type === 'red_card' && e.team === 'away').length;
  
  // Timeline events
  const timelineEvents = match.events.map(event => {
    const team = event.team === 'home' ? match.homeTeam : match.awayTeam;
    const playerText = event.player ? ` - ${event.player}` : '';
    
    let icon, text, color: 'green' | 'yellow' | 'red';
    
    switch (event.type) {
      case 'goal':
        icon = Target;
        text = `⚽ Gol de ${team}${playerText}`;
        color = 'green';
        break;
      case 'yellow_card':
        icon = AlertCircle;
        text = `🟨 Cartão Amarelo - ${team}${playerText}`;
        color = 'yellow';
        break;
      case 'red_card':
        icon = UserX;
        text = `🟥 Cartão Vermelho - ${team}${playerText}`;
        color = 'red';
        break;
      default:
        icon = Target;
        text = event.type;
        color = 'green';
    }
    
    return {
      time: `${event.minuteGame} (${event.half}T)`,
      icon,
      text,
      color,
    };
  });
  
  const handleAction = (action: 'goal' | 'yellow' | 'red', team: 'home' | 'away') => {
    setShowPlayerInput({ type: action, team });
  };
  
  const confirmAction = () => {
    if (!showPlayerInput) return;
    
    if (showPlayerInput.type === 'goal') {
      addFutsalGoal(showPlayerInput.team, playerName || undefined);
    } else {
      addFutsalCard(showPlayerInput.team, showPlayerInput.type, playerName || undefined);
    }
    
    setPlayerName('');
    setShowPlayerInput(null);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* VISUALIZAÇÃO - 2 colunas */}
      <div className="lg:col-span-2 space-y-6">
        {/* Placar Principal */}
        <ScoreDisplay
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeScore={match.score.home}
          awayScore={match.score.away}
          sport="FUTSAL"
        />
        
        {/* Campo com Posições dos Gols (Simples) */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Visualização dos Gols</h3>
          <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-lg p-8 relative" style={{ minHeight: '200px' }}>
            {/* Campo simplificado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full border-2 border-white/20 rounded-lg relative">
                {/* Linha do meio */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
                <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-2 border-white/20 rounded-full" />
                
                {/* Gols marcados */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-2">
                  {match.events.filter(e => e.type === 'goal' && e.team === 'home').map((_, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"
                    />
                  ))}
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-2">
                  {match.events.filter(e => e.type === 'goal' && e.team === 'away').map((_, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-red-500 rounded-full border-2 border-white"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label="Gols"
            value={`${homeGoals} - ${awayGoals}`}
            color="green"
          />
          <StatCard
            icon={AlertCircle}
            label="Cartões Amarelos"
            value={`${homeYellow} - ${awayYellow}`}
            color="yellow"
          />
          <StatCard
            icon={UserX}
            label="Cartões Vermelhos"
            value={`${homeRed} - ${awayRed}`}
            color="red"
          />
          <StatCard
            icon={TrendingUp}
            label="Tempo"
            value={`${match.currentHalf}º Tempo`}
            color="blue"
          />
        </div>
        
        {/* Timeline */}
        <Timeline events={timelineEvents.reverse()} />
      </div>
      
      {/* CONTROLES - 1 coluna */}
      <div className="space-y-6">
        {/* Cronômetro */}
        <Chronometer
          initialTime="20:00"
          counting="up"
          pausable={true}
        />
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-6">
            Controles - {match.currentHalf}º Tempo
          </h3>
          
          {/* Modal para input de jogador */}
          {showPlayerInput && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-700 rounded-lg p-4 mb-4"
            >
              <h4 className="text-white font-bold mb-3">
                {showPlayerInput.type === 'goal' ? '⚽ Quem fez o gol?' : 
                 showPlayerInput.type === 'yellow' ? '🟨 Cartão amarelo para:' : 
                 '🟥 Cartão vermelho para:'}
              </h4>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nome do jogador (opcional)"
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && confirmAction()}
              />
              <div className="flex gap-2">
                <button
                  onClick={confirmAction}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowPlayerInput(null);
                    setPlayerName('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Mandante */}
          <div className="mb-6">
            <h4 className="text-white font-bold mb-3">{match.homeTeam}</h4>
            <div className="space-y-2">
              <EventButton
                icon={Target}
                label="⚽ GOL"
                color="green"
                size="medium"
                onClick={() => handleAction('goal', 'home')}
              />
              <div className="grid grid-cols-2 gap-2">
                <EventButton
                  icon={AlertCircle}
                  label="🟨"
                  color="yellow"
                  size="small"
                  onClick={() => handleAction('yellow', 'home')}
                />
                <EventButton
                  icon={UserX}
                  label="🟥"
                  color="red"
                  size="small"
                  onClick={() => handleAction('red', 'home')}
                />
              </div>
            </div>
          </div>
          
          {/* Visitante */}
          <div>
            <h4 className="text-white font-bold mb-3">{match.awayTeam}</h4>
            <div className="space-y-2">
              <EventButton
                icon={Target}
                label="⚽ GOL"
                color="green"
                size="medium"
                onClick={() => handleAction('goal', 'away')}
              />
              <div className="grid grid-cols-2 gap-2">
                <EventButton
                  icon={AlertCircle}
                  label="🟨"
                  color="yellow"
                  size="small"
                  onClick={() => handleAction('yellow', 'away')}
                />
                <EventButton
                  icon={UserX}
                  label="🟥"
                  color="red"
                  size="small"
                  onClick={() => handleAction('red', 'away')}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Atalhos de Teclado:</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">[G]</span>
                <span className="text-white">Gol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">[C]</span>
                <span className="text-white">Cartão</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">[Space]</span>
                <span className="text-white">Pausar/Retomar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
