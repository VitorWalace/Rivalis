import { useEffect, useRef, useState } from 'react';
import type { BracketMatch, Phase } from '../types/bracket';
import { buildBracketTree } from '../utils/bracketHelpers';

interface BracketViewProps {
  phases: Phase[];
  onMatchClick?: (match: BracketMatch) => void;
}

export default function BracketView({ phases, onMatchClick }: BracketViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Coletar todas as partidas
  const allMatches = phases.flatMap(p => p.matches);
  const bracketTree = buildBracketTree(allMatches);

  useEffect(() => {
    // Centralizar scroll no final
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, []);

  if (!bracketTree || phases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <span className="text-6xl mb-4 block">🌳</span>
        <p className="text-xl text-gray-600">Nenhum bracket disponível ainda</p>
      </div>
    );
  }

  // Calcular número de níveis
  const maxLevel = Math.max(...allMatches.map(m => m.round));

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Controles de Zoom */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">🌳 Visualização em Bracket</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium transition-colors"
          >
            −
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(2, scale + 0.1))}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setScale(1)}
            className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium transition-colors ml-2"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Container com Scroll Horizontal */}
      <div 
        ref={containerRef}
        className="overflow-x-auto overflow-y-auto p-8"
        style={{ maxHeight: '800px' }}
      >
        <div 
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            minWidth: `${maxLevel * 350}px`,
          }}
          className="transition-transform duration-200"
        >
          {/* Layout em Grid Reverso (Final à esquerda) */}
          <div className="flex gap-8">
            {phases.map((phase, phaseIndex) => (
              <div key={phase.round} className="flex flex-col gap-4 min-w-[300px]">
                {/* Header da Coluna */}
                <div className={`
                  text-center p-3 rounded-lg font-bold text-sm sticky top-0 z-10
                  ${phase.isCompleted 
                    ? 'bg-green-100 text-green-700' 
                    : phase.isCurrent
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {phase.displayName}
                  <div className="text-xs font-normal mt-1">
                    {phase.completedMatches}/{phase.totalMatches}
                  </div>
                </div>

                {/* Partidas da Coluna */}
                <div 
                  className="flex flex-col justify-around flex-1"
                  style={{
                    gap: `${Math.pow(2, phaseIndex) * 20}px`,
                  }}
                >
                  {phase.matches.map((match) => (
                    <BracketMatchCard
                      key={match.id}
                      match={match}
                      onClick={() => onMatchClick?.(match)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dica de Navegação */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-center text-sm text-gray-600">
        💡 Dica: Use os controles de zoom ou arraste para navegar pelo bracket
      </div>
    </div>
  );
}

// Componente de Card Simplificado para Bracket
interface BracketMatchCardProps {
  match: BracketMatch;
  onClick?: () => void;
}

function BracketMatchCard({ match, onClick }: BracketMatchCardProps) {
  const isLocked = match.status === 'locked';
  const hasResult = match.status === 'finished';

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border-2 rounded-lg p-3 cursor-pointer
        transition-all duration-200 hover:shadow-lg
        ${hasResult 
          ? 'border-green-400 hover:border-green-500' 
          : isLocked
          ? 'border-gray-300 hover:border-gray-400'
          : 'border-primary-300 hover:border-primary-400'
        }
      `}
    >
      {/* Time 1 */}
      <div className={`
        flex items-center justify-between p-2 rounded mb-1
        ${hasResult && match.winner?.id === match.homeTeam?.id 
          ? 'bg-green-50 font-bold' 
          : 'bg-gray-50'
        }
      `}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {match.homeTeam?.name.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-sm truncate">
            {match.homeTeam?.name || '🔒 Aguardando'}
          </span>
        </div>
        {hasResult && match.homeScore !== undefined && (
          <span className="text-sm font-bold ml-2">{match.homeScore}</span>
        )}
      </div>

      {/* Time 2 */}
      <div className={`
        flex items-center justify-between p-2 rounded
        ${hasResult && match.winner?.id === match.awayTeam?.id 
          ? 'bg-green-50 font-bold' 
          : 'bg-gray-50'
        }
      `}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {match.awayTeam?.name.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-sm truncate">
            {match.awayTeam?.name || '🔒 Aguardando'}
          </span>
        </div>
        {hasResult && match.awayScore !== undefined && (
          <span className="text-sm font-bold ml-2">{match.awayScore}</span>
        )}
      </div>

      {/* Status Badge */}
      <div className="mt-2 text-center">
        <span className={`
          text-xs px-2 py-1 rounded-full
          ${hasResult 
            ? 'bg-green-100 text-green-700' 
            : isLocked
            ? 'bg-gray-100 text-gray-600'
            : 'bg-yellow-100 text-yellow-700'
          }
        `}>
          {hasResult ? '✓' : isLocked ? '🔒' : '⏱'}
        </span>
      </div>
    </div>
  );
}
