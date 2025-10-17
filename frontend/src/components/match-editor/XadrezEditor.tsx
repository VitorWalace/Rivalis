import { useMatchEditor } from '../../store/matchEditorStore';
import type { XadrezMatch } from '../../types/match';
import { EventButton } from './EventButton';
import { StatCard } from './StatCard';
import { Clock, Move, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

// Componente do tabuleiro simples
function ChessBoard({ moves: _moves }: { moves: string[] }) {
  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="grid grid-cols-8 gap-0 w-full max-w-md mx-auto aspect-square">
        {Array.from({ length: 64 }).map((_, idx) => {
          const row = Math.floor(idx / 8);
          const col = idx % 8;
          const isLight = (row + col) % 2 === 0;
          
          return (
            <div
              key={idx}
              className={`
                aspect-square flex items-center justify-center text-2xl
                ${isLight ? 'bg-amber-200' : 'bg-amber-800'}
              `}
            >
              {/* Peças seriam renderizadas aqui baseado em FEN */}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-gray-400 text-sm">
        <span>a b c d e f g h</span>
      </div>
    </div>
  );
}

export function XadrezEditor() {
  const { currentMatch, addXadrezMove } = useMatchEditor();
  const [moveInput, setMoveInput] = useState('');
  
  if (!currentMatch || currentMatch.sport !== 'xadrez') return null;
  
  const match = currentMatch as XadrezMatch;
  
  const handleAddMove = () => {
    if (!moveInput.trim()) return;
    addXadrezMove(moveInput.trim());
    setMoveInput('');
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* VISUALIZAÇÃO - 2 colunas */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">{match.homeTeam}</h2>
              <p className="text-gray-400">♔ Brancas</p>
            </div>
            <div className="text-4xl">VS</div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-white">{match.awayTeam}</h2>
              <p className="text-gray-400">♚ Pretas</p>
            </div>
          </div>
        </div>
        
        {/* Tabuleiro */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Tabuleiro</h3>
          <ChessBoard moves={match.moves} />
        </div>
        
        {/* Lista de Movimentos */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Movimentos</h3>
          {match.parsedMoves.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhum movimento registrado ainda</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {match.parsedMoves.map((move) => (
                <motion.div
                  key={move.moveNumber}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-700 rounded-lg p-3 flex items-center gap-3"
                >
                  <span className="text-gray-400 font-mono text-sm w-8">{move.moveNumber}.</span>
                  <div className="flex-1 flex gap-4">
                    <span className="text-white font-mono font-bold">{move.white}</span>
                    {move.black && (
                      <span className="text-gray-300 font-mono font-bold">{move.black}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={Move}
            label="Total de Jogadas"
            value={match.moves.length}
            color="blue"
          />
          <StatCard
            icon={Award}
            label="Peças Capturadas"
            value={`${match.captured.white.length} - ${match.captured.black.length}`}
            color="red"
          />
          <StatCard
            icon={Clock}
            label="Tempo Médio"
            value="2:30"
            color="green"
            subtitle="por jogada"
          />
        </div>
      </div>
      
      {/* CONTROLES - 1 coluna */}
      <div className="space-y-6">
        {/* Timers */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Tempo</h3>
          
          {/* Brancas */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">♔ Brancas - {match.homeTeam}</p>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-4xl font-mono font-bold text-white text-center">
                {match.times.white.remaining}
              </p>
            </div>
          </div>
          
          {/* Pretas */}
          <div>
            <p className="text-gray-400 text-sm mb-2">♚ Pretas - {match.awayTeam}</p>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-4xl font-mono font-bold text-white text-center">
                {match.times.black.remaining}
              </p>
            </div>
          </div>
          
          <EventButton
            icon={Clock}
            label="⏱️ ALTERNAR TEMPO"
            color="blue"
            size="medium"
            onClick={() => console.log('Toggle timer')}
          />
        </div>
        
        {/* Input de Jogada */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Registrar Jogada</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                Notação Algébrica (ex: e4, Nf3, O-O)
              </label>
              <input
                type="text"
                value={moveInput}
                onChange={(e) => setMoveInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMove()}
                placeholder="Digite a jogada..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>
            
            <EventButton
              icon={Move}
              label="➕ ADICIONAR JOGADA"
              color="green"
              onClick={handleAddMove}
              disabled={!moveInput.trim()}
            />
          </div>
          
          {/* Exemplos */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm mb-3">Exemplos de Notação:</p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">e4</span>
                <span className="text-white">Peão para e4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nf3</span>
                <span className="text-white">Cavalo para f3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">O-O</span>
                <span className="text-white">Roque pequeno</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Qxe5+</span>
                <span className="text-white">Dama captura e5 (xeque)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Peças Capturadas */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Peças Capturadas</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-2">Brancas capturaram:</p>
              <div className="bg-gray-700 rounded-lg p-3 min-h-12 flex items-center gap-2 flex-wrap">
                {match.captured.white.length === 0 ? (
                  <span className="text-gray-500 text-sm">Nenhuma</span>
                ) : (
                  match.captured.white.map((_piece, idx) => (
                    <span key={idx} className="text-2xl">♟</span>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-2">Pretas capturaram:</p>
              <div className="bg-gray-700 rounded-lg p-3 min-h-12 flex items-center gap-2 flex-wrap">
                {match.captured.black.length === 0 ? (
                  <span className="text-gray-500 text-sm">Nenhuma</span>
                ) : (
                  match.captured.black.map((_piece, idx) => (
                    <span key={idx} className="text-2xl">♙</span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
