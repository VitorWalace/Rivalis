import { useState } from 'react';
import type { BracketMatch, Phase, ViewMode } from '../types/bracket';
import { ListBulletIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import ProgressTimeline from './ProgressTimeline';
import PhaseSection from './PhaseSection';
import BracketView from './BracketView';

interface KnockoutBracketProps {
  phases: Phase[];
  onMatchClick?: (match: BracketMatch) => void;
}

export default function KnockoutBracket({ phases, onMatchClick }: KnockoutBracketProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  if (!phases || phases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <span className="text-6xl mb-4 block">🏆</span>
        <p className="text-xl text-gray-600 mb-2">Nenhuma fase disponível</p>
        <p className="text-sm text-gray-500">
          As fases do mata-mata aparecerão aqui quando as partidas forem criadas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline de Progresso */}
      <ProgressTimeline phases={phases} />

      {/* Toggle de Visualização */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Chaves do Mata-Mata</h2>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Visualização:</span>
            <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50">
              <button
                onClick={() => setViewMode('list')}
                className={`
                  px-4 py-2 text-sm font-medium rounded-l-lg transition-colors
                  flex items-center gap-2
                  ${viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <ListBulletIcon className="w-5 h-5" />
                Lista
              </button>
              <button
                onClick={() => setViewMode('bracket')}
                className={`
                  px-4 py-2 text-sm font-medium rounded-r-lg transition-colors
                  flex items-center gap-2
                  ${viewMode === 'bracket'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <ChartBarIcon className="w-5 h-5" />
                Bracket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo baseado no modo de visualização */}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          {phases.map((phase) => (
            <PhaseSection
              key={phase.round}
              phase={phase}
              onMatchClick={onMatchClick}
            />
          ))}
        </div>
      ) : (
        <BracketView
          phases={phases}
          onMatchClick={onMatchClick}
        />
      )}

      {/* Legenda */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📖 Legenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="text-sm text-gray-700">Finalizada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔴</span>
            <span className="text-sm text-gray-700">Ao Vivo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🕐</span>
            <span className="text-sm text-gray-700">Agendada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <span className="text-sm text-gray-700">Aguardando</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⏳</span>
            <span className="text-sm text-gray-700">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="text-sm text-gray-700">Vencedor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-50 border-2 border-green-400 rounded"></div>
            <span className="text-sm text-gray-700">Classificado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-50 border-2 border-gray-300 rounded"></div>
            <span className="text-sm text-gray-700">Eliminado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
