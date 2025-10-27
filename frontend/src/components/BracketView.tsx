import { useEffect, useRef, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { BracketMatch, Phase } from '../types/bracket';
import { buildBracketTree } from '../utils/bracketHelpers';
import { useConfirm } from '../store/confirmStore';

interface BracketViewProps {
  phases: Phase[];
  onMatchClick?: (match: BracketMatch) => void;
  onMatchDelete?: (match: BracketMatch) => void;
}

export default function BracketView({ phases, onMatchClick, onMatchDelete }: BracketViewProps) {
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
              <div key={phase.round} className="flex flex-col gap-4 min-w-[320px]">
                {/* Header da Coluna - Melhorado */}
                <div className={`
                  text-center p-4 rounded-xl font-bold text-sm sticky top-0 z-10 shadow-md border-2
                  transition-all duration-300
                  ${phase.isCompleted 
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 border-green-300' 
                    : phase.isCurrent
                    ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 border-blue-400 ring-4 ring-blue-200'
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 border-slate-300'
                  }
                `}>
                  <div className="text-lg mb-2">
                    {phase.isCompleted && '✅ '}
                    {phase.isCurrent && '🔵 '}
                    {!phase.isCompleted && !phase.isCurrent && '⏳ '}
                    {phase.displayName}
                  </div>
                  <div className={`
                    text-xs font-semibold px-3 py-1 rounded-full inline-block
                    ${phase.isCompleted 
                      ? 'bg-green-200 text-green-800' 
                      : phase.isCurrent
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-slate-200 text-slate-700'
                    }
                  `}>
                    {phase.completedMatches}/{phase.totalMatches} finalizadas
                  </div>
                  {phase.isCurrent && (
                    <div className="text-xs text-blue-700 mt-2 font-medium">
                      ⚡ Fase Atual
                    </div>
                  )}
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
                      onDelete={onMatchDelete ? () => onMatchDelete(match) : undefined}
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
  onDelete?: () => void;
}

function BracketMatchCard({ match, onClick, onDelete }: BracketMatchCardProps) {
  const confirmModal = useConfirm();
  const hasResult = match.status === 'finished';
  const isLive = match.status === 'live';
  const isScheduled = match.status === 'scheduled';

  // Formatar data se disponível
  const formatDate = (date?: string | Date) => {
    if (!date) return null;
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border-2 rounded-xl p-4 cursor-pointer
        transition-all duration-200 hover:shadow-xl
        ${isLive 
          ? 'border-green-400 hover:border-green-500 animate-pulse' 
          : hasResult 
          ? 'border-green-400 hover:border-green-500' 
          : isScheduled
          ? 'border-blue-300 hover:border-blue-400'
          : 'border-slate-300 hover:border-slate-400'
        }
      `}
    >
      {/* Status Badge no topo */}
      <div className="flex items-center justify-between mb-3">
        <span className={`
          text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide
          ${isLive 
            ? 'bg-green-500 text-white animate-pulse' 
            : hasResult 
            ? 'bg-green-100 text-green-700' 
            : isScheduled
            ? 'bg-blue-100 text-blue-700'
            : 'bg-slate-100 text-slate-600'
          }
        `}>
          {isLive ? '🟢 Ao Vivo' : hasResult ? '✅ Finalizada' : isScheduled ? '📅 Agendada' : '⏳ Aguardando'}
        </span>
        {match.scheduledDate && isScheduled && (
          <span className="text-xs text-slate-600 font-medium">
            {formatDate(match.scheduledDate)}
          </span>
        )}
      </div>

      {/* Time 1 */}
      <div className={`
        flex items-center justify-between p-3 rounded-lg mb-2 transition-all
        ${hasResult && match.winner?.id === match.homeTeam?.id 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-sm' 
          : 'bg-slate-50 border-2 border-transparent'
        }
      `}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
            {match.homeTeam?.name.charAt(0).toUpperCase() || '?'}
          </div>
          <span className={`text-sm truncate ${hasResult && match.winner?.id === match.homeTeam?.id ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
            {match.homeTeam?.name || '🔒 Aguardando'}
          </span>
          {hasResult && match.winner?.id === match.homeTeam?.id && (
            <span className="text-lg">🏆</span>
          )}
        </div>
        {hasResult && match.homeScore !== undefined && (
          <span className={`text-lg font-bold ml-2 ${match.winner?.id === match.homeTeam?.id ? 'text-green-600' : 'text-slate-500'}`}>
            {match.homeScore}
          </span>
        )}
      </div>

      {/* VS Divider */}
      <div className="text-center text-xs font-bold text-slate-400 my-1">
        VS
      </div>

      {/* Time 2 */}
      <div className={`
        flex items-center justify-between p-3 rounded-lg transition-all
        ${hasResult && match.winner?.id === match.awayTeam?.id 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-sm' 
          : 'bg-slate-50 border-2 border-transparent'
        }
      `}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
            {match.awayTeam?.name.charAt(0).toUpperCase() || '?'}
          </div>
          <span className={`text-sm truncate ${hasResult && match.winner?.id === match.awayTeam?.id ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
            {match.awayTeam?.name || '🔒 Aguardando'}
          </span>
          {hasResult && match.winner?.id === match.awayTeam?.id && (
            <span className="text-lg">🏆</span>
          )}
        </div>
        {hasResult && match.awayScore !== undefined && (
          <span className={`text-lg font-bold ml-2 ${match.winner?.id === match.awayTeam?.id ? 'text-green-600' : 'text-slate-500'}`}>
            {match.awayScore}
          </span>
        )}
      </div>

      {/* Localização (se disponível) */}
      {match.location && (
        <div className="mt-3 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <span>📍</span>
          <span>{match.location}</span>
        </div>
      )}

      {/* Botão de Deletar */}
      {onDelete && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <button
            onClick={async (e) => {
              e.stopPropagation(); // Evita abrir o modal de edição
              const ok = await confirmModal({
                title: 'Excluir Partida',
                message: 'Tem certeza que deseja excluir esta partida? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                tone: 'danger',
              });
              if (ok && onDelete) onDelete();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir partida"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Excluir</span>
          </button>
        </div>
      )}
    </div>
  );
}
