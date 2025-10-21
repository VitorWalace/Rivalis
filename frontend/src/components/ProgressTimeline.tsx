import type { Phase } from '../types/bracket';
import { calculateBracketProgress } from '../utils/bracketHelpers';

interface ProgressTimelineProps {
  phases: Phase[];
}

export default function ProgressTimeline({ phases }: ProgressTimelineProps) {
  const { percentage, currentPhase } = calculateBracketProgress(phases);

  if (phases.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Progresso do Campeonato</h3>
        <span className="text-2xl font-bold text-primary-600">{percentage}%</span>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
        <div
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Fases */}
      <div className="flex items-center justify-between relative">
        {/* Linha conectora */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        
        {phases.map((phase) => {
          const isCompleted = phase.isCompleted;
          const isCurrent = phase.isCurrent;
          
          return (
            <div key={phase.round} className="flex flex-col items-center flex-1">
              {/* Círculo indicador */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                  transition-all duration-300 mb-2
                  ${isCompleted 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isCurrent
                    ? 'bg-primary-500 text-white shadow-lg ring-4 ring-primary-200 animate-pulse'
                    : 'bg-gray-300 text-gray-600'
                  }
                `}
              >
                {isCompleted ? '✓' : isCurrent ? '⏱' : '🔒'}
              </div>
              
              {/* Nome da fase */}
              <div className="text-center">
                <div className={`
                  text-xs font-semibold mb-1
                  ${isCompleted ? 'text-green-600' : isCurrent ? 'text-primary-600' : 'text-gray-500'}
                `}>
                  {phase.name}
                </div>
                <div className="text-xs text-gray-500">
                  {phase.completedMatches}/{phase.totalMatches}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Atual */}
      {currentPhase && (
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="text-sm font-semibold text-primary-900">Fase Atual</div>
              <div className="text-lg font-bold text-primary-700">{currentPhase.displayName}</div>
            </div>
          </div>
        </div>
      )}

      {/* Campeonato Concluído */}
      {percentage === 100 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="text-sm font-semibold text-yellow-900">Campeonato Concluído!</div>
              <div className="text-lg font-bold text-yellow-700">Parabéns ao Campeão! 🎉</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
