import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import KnockoutBracket from '../components/KnockoutBracket';
import { getMockPhases, mockKnockoutMatches } from '../mocks/bracketMockData';
import { groupMatchesByPhase } from '../utils/bracketHelpers';
import type { BracketMatch } from '../types/bracket';

export default function BracketDemoPage() {
  // Pode usar dados mockados ou dados reais do backend
  const [useMockData] = useState(true);
  
  // Obter fases (mockadas ou do backend)
  const phases = useMockData 
    ? getMockPhases() 
    : groupMatchesByPhase(mockKnockoutMatches);

  const handleMatchClick = (match: BracketMatch) => {
    console.log('🎯 Partida clicada:', match);
    // Implementar navegação ou modal com detalhes da partida
    // navigate(`/match/${match.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              to="/championships"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏆 Demo: Visualização de Mata-Mata
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Demonstração do novo sistema de visualização de brackets
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">💡</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Recursos do Sistema de Bracket
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Alternância entre visualização em Lista e Bracket (árvore)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Timeline de progresso com indicadores visuais de cada fase</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Cards de confronto com status, vencedor e próxima fase</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Sistema de dependências (partidas aguardando resultados anteriores)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Zoom e navegação no modo Bracket</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Responsivo (desktop, tablet e mobile)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bracket Component */}
        <KnockoutBracket
          phases={phases}
          onMatchClick={handleMatchClick}
        />

        {/* Debug Info (apenas para demo) */}
        <div className="mt-8 bg-gray-800 text-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🔧</span>
            <span>Informações de Debug</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total de Fases:</span>
              <span className="ml-2 font-mono font-bold">{phases.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Total de Partidas:</span>
              <span className="ml-2 font-mono font-bold">
                {phases.reduce((sum, p) => sum + p.totalMatches, 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Partidas Concluídas:</span>
              <span className="ml-2 font-mono font-bold">
                {phases.reduce((sum, p) => sum + p.completedMatches, 0)}
              </span>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-900 rounded font-mono text-xs overflow-x-auto">
            <pre>{JSON.stringify(phases, null, 2)}</pre>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📚 Como Usar em Produção
          </h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 mb-4">
              Para usar o sistema de bracket em um campeonato real:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Busque as partidas do campeonato através da API:
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                  GET /api/championships/:id/matches
                </code>
              </li>
              <li>
                Converta os dados do backend para o formato <code>BracketMatch[]</code>
              </li>
              <li>
                Use a função <code>groupMatchesByPhase()</code> para agrupar por fases
              </li>
              <li>
                Passe as fases para o componente <code>&lt;KnockoutBracket /&gt;</code>
              </li>
              <li>
                Implemente o callback <code>onMatchClick</code> para navegação/edição
              </li>
            </ol>
            <p className="text-gray-700 mt-4">
              Consulte o arquivo <code>KNOCKOUT_BRACKET_README.md</code> para documentação completa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
