import type { Phase, BracketMatch } from '../types/bracket';
import MatchupCard from './MatchupCard';
import { getPhaseDisplayName } from '../utils/bracketHelpers';

interface PhaseSectionProps {
  phase: Phase;
  onMatchClick?: (match: BracketMatch) => void;
}

export default function PhaseSection({ phase, onMatchClick }: PhaseSectionProps) {
  // Determinar o nome da próxima fase
  const nextPhaseInfo = phase.round > 1 ? getPhaseDisplayName(phase.round - 1) : null;

  return (
    <div className="mb-8">
      {/* Header da Fase */}
      <div className={`
        p-4 rounded-t-lg border-b-4 
        ${phase.isCompleted 
          ? 'bg-green-50 border-green-400' 
          : phase.isCurrent
          ? 'bg-primary-50 border-primary-400'
          : 'bg-gray-50 border-gray-300'
        }
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {phase.round === 1 ? '🏆' : phase.round === 2 ? '🥇' : phase.round === 3 ? '🥈' : '⚡'}
            </span>
            <div>
              <h3 className={`text-2xl font-bold ${
                phase.isCompleted 
                  ? 'text-green-700' 
                  : phase.isCurrent 
                  ? 'text-primary-700' 
                  : 'text-gray-700'
              }`}>
                {phase.displayName}
              </h3>
              <p className="text-sm text-gray-600">
                {phase.completedMatches} de {phase.totalMatches} partidas concluídas
              </p>
            </div>
          </div>

          {/* Badge de Status */}
          <div className={`
            px-4 py-2 rounded-full font-semibold text-sm
            ${phase.isCompleted 
              ? 'bg-green-100 text-green-700' 
              : phase.isCurrent
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {phase.isCompleted ? '✓ Concluída' : phase.isCurrent ? '⏱ Em Andamento' : '🔒 Aguardando'}
          </div>
        </div>

        {/* Barra de Progresso da Fase */}
        {!phase.isCompleted && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  phase.isCurrent ? 'bg-primary-500' : 'bg-gray-400'
                }`}
                style={{ 
                  width: `${phase.totalMatches > 0 ? (phase.completedMatches / phase.totalMatches) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid de Partidas */}
      <div className="bg-white rounded-b-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phase.matches.map((match) => (
            <MatchupCard
              key={match.id}
              match={match}
              nextPhaseName={nextPhaseInfo?.name}
              onMatchClick={onMatchClick}
            />
          ))}
        </div>

        {/* Mensagem se não houver partidas */}
        {phase.matches.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl mb-2 block">📭</span>
            <p className="text-lg">Nenhuma partida nesta fase ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
