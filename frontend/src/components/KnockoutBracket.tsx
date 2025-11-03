import type { BracketMatch, Phase } from '../types/bracket';
import { TrophyIcon } from '@heroicons/react/24/solid';

interface KnockoutBracketProps {
  phases: Phase[];
  onMatchClick?: (match: BracketMatch) => void;
  onMatchDelete?: (match: BracketMatch) => void;
}

// Componente de Card de Partida
function MatchCard({ match, onClick }: { match: BracketMatch; onClick: () => void }) {
  const isFinished = match.status === 'finished';
  const hasScore = match.homeScore !== null && match.awayScore !== null && match.homeScore !== undefined && match.awayScore !== undefined;
  const homeWon = hasScore && match.homeScore! > match.awayScore!;
  const awayWon = hasScore && match.awayScore! > match.homeScore!;
  const isDraw = hasScore && match.homeScore === match.awayScore;

  return (
    <button
      onClick={onClick}
      className="w-64 bg-white rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-slate-200 hover:border-indigo-400 overflow-hidden group"
    >
      {/* Time Casa */}
      <div className={`p-3 flex items-center justify-between transition-colors ${
        isFinished && homeWon ? 'bg-green-50 border-l-4 border-green-500' : 'group-hover:bg-slate-50'
      }`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div 
            className="w-8 h-8 rounded-full flex-shrink-0"
            style={{ 
              background: match.homeTeam?.color 
                ? `linear-gradient(135deg, ${match.homeTeam.color} 0%, ${match.homeTeam.color}dd 100%)`
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            }}
          />
          <span className={`font-semibold truncate ${
            homeWon ? 'text-green-700' : isDraw ? 'text-amber-600' : 'text-slate-700'
          }`}>
            {match.homeTeam?.name || 'A definir'}
          </span>
        </div>
        {hasScore && (
          <span className={`text-2xl font-bold ml-2 ${
            homeWon ? 'text-green-600' : isDraw ? 'text-amber-500' : 'text-slate-400'
          }`}>
            {match.homeScore}
          </span>
        )}
      </div>

      {/* Divisor */}
      <div className="h-px bg-slate-200" />

      {/* Time Visitante */}
      <div className={`p-3 flex items-center justify-between transition-colors ${
        isFinished && awayWon ? 'bg-green-50 border-l-4 border-green-500' : 'group-hover:bg-slate-50'
      }`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div 
            className="w-8 h-8 rounded-full flex-shrink-0"
            style={{ 
              background: match.awayTeam?.color 
                ? `linear-gradient(135deg, ${match.awayTeam.color} 0%, ${match.awayTeam.color}dd 100%)`
                : 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)'
            }}
          />
          <span className={`font-semibold truncate ${
            awayWon ? 'text-green-700' : isDraw ? 'text-amber-600' : 'text-slate-700'
          }`}>
            {match.awayTeam?.name || 'A definir'}
          </span>
        </div>
        {hasScore && (
          <span className={`text-2xl font-bold ml-2 ${
            awayWon ? 'text-green-600' : isDraw ? 'text-amber-500' : 'text-slate-400'
          }`}>
            {match.awayScore}
          </span>
        )}
      </div>

      {/* Status Badge */}
      {!isFinished && (
        <div className="p-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-xs text-center text-indigo-600 font-medium">
          Clique para editar
        </div>
      )}
      {isFinished && (
        <div className="p-2 bg-gradient-to-r from-green-50 to-emerald-50 text-xs text-center text-green-600 font-medium">
          ✓ Finalizado
        </div>
      )}
    </button>
  );
}

// Componente de Display do Campeão
function ChampionDisplay({ phase }: { phase: Phase }) {
  if (!phase.matches || phase.matches.length === 0) return null;
  
  const finalMatch = phase.matches[0];
  const hasScore = finalMatch.homeScore !== null && finalMatch.awayScore !== null && finalMatch.homeScore !== undefined && finalMatch.awayScore !== undefined;
  
  if (!hasScore || finalMatch.status !== 'finished') {
    return (
      <div className="flex flex-col items-center justify-center min-w-80 p-8">
        <div className="text-8xl mb-4 opacity-30 animate-pulse">🏆</div>
        <h2 className="text-2xl font-bold text-slate-400">Aguardando Final</h2>
        <p className="text-sm text-slate-500 mt-2">O campeão será definido em breve</p>
      </div>
    );
  }

  const champion = finalMatch.homeScore! > finalMatch.awayScore! 
    ? finalMatch.homeTeam 
    : finalMatch.awayTeam;

  if (!champion) return null;

  return (
    <div className="flex flex-col items-center justify-center min-w-80 p-8">
      <div className="text-8xl mb-6 animate-bounce">🏆</div>
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 mb-4">
        CAMPEÃO
      </h2>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 blur-xl opacity-50 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-white px-10 py-6 rounded-xl shadow-2xl border-4 border-yellow-300">
          <div className="flex items-center gap-4">
            {champion.color && (
              <div 
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${champion.color} 0%, ${champion.color}dd 100%)`
                }}
              />
            )}
            <p className="text-3xl font-bold text-center">{champion.name}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        {[...Array(3)].map((_, i) => (
          <TrophyIcon key={i} className="w-6 h-6 text-yellow-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
    </div>
  );
}

export default function KnockoutBracket({ phases, onMatchClick }: KnockoutBracketProps) {
  // Calcular nomes das fases baseado no número de JOGOS (não no número de fases)
  const getPhaseNames = (): Record<number, string> => {
    if (!phases || phases.length === 0) return {};
    
    const names: Record<number, string> = {};
    
    // Para cada fase, calcular o nome baseado no número de jogos
    phases.forEach(phase => {
      const numMatches = phase.matches.length;
      const teamsInPhase = numMatches * 2;
      
      console.log(`🎯 Fase rodada ${phase.round}: ${numMatches} jogos = ${teamsInPhase} times`);
      
      // Mapear baseado no número de times competindo
      if (teamsInPhase === 2) {
        names[phase.round] = 'Final';
      } else if (teamsInPhase === 4) {
        names[phase.round] = 'Semifinal';
      } else if (teamsInPhase === 8) {
        names[phase.round] = 'Quartas de Final';
      } else if (teamsInPhase === 16) {
        names[phase.round] = 'Oitavas de Final';
      } else if (teamsInPhase === 32) {
        names[phase.round] = 'Dezesseis Avos';
      } else if (teamsInPhase === 64) {
        names[phase.round] = 'Trinta e Dois Avos';
      } else {
        names[phase.round] = `Fase ${phase.round}`;
      }
    });
    
    console.log('🏷️ Nomes das fases:', names);
    return names;
  };

  const phaseNames = getPhaseNames();

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

  // Ordena as fases
  const sortedPhases = [...phases].sort((a, b) => a.round - b.round);
  const maxMatchesPerPhase = Math.max(...sortedPhases.map((phase) => phase.matches?.length ?? 0), 1);
  const CARD_HEIGHT_ESTIMATE = 152; // Aproximação para altura total de cada card (inclui padding)
  const CARD_GAP_ESTIMATE = 24; // Espaço vertical entre cards
  const estimatedColumnHeight = Math.max(
    CARD_HEIGHT_ESTIMATE,
    maxMatchesPerPhase * CARD_HEIGHT_ESTIMATE + (Math.max(maxMatchesPerPhase - 1, 0) * CARD_GAP_ESTIMATE)
  );
  const finalPhase = sortedPhases[sortedPhases.length - 1];
  const hasFinalFinished = finalPhase?.matches?.[0]?.status === 'finished';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">🏆 Chave de Eliminatórias</h2>
            <p className="text-indigo-100">
              Clique em uma partida para editar o placar e avançar times automaticamente
            </p>
          </div>
          <div className="text-6xl opacity-20">⚔️</div>
        </div>
      </div>

      {/* Bracket Visual - Layout Horizontal */}
      <div className="bg-white rounded-xl shadow-lg p-8 overflow-x-auto">
        <div className="flex gap-12 justify-start items-stretch min-w-max min-h-[360px]">
          {sortedPhases.map((phase, index) => {
            const matchesInPhase = phase.matches?.length ?? 0;
            const previousMatches = index > 0 ? sortedPhases[index - 1]?.matches?.length ?? matchesInPhase : matchesInPhase;
            const shouldCenterMatches = matchesInPhase > 0 && matchesInPhase < previousMatches;
            const matchesContainerClass = `relative flex flex-col gap-6 ${shouldCenterMatches ? 'flex-1 justify-center my-auto' : 'justify-start'}`;
            const matchesContainerStyle = {
              minHeight: `${estimatedColumnHeight}px`,
            };

            return (
              <div key={phase.round} className="bracket-round flex-shrink-0 flex flex-col h-full min-h-full">
              {/* Nome da Fase */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg">
                  <span className="text-2xl">⚔️</span>
                  <span className="text-lg font-bold">
                    {phaseNames[phase.round] || phase.name}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {phase.matches?.length || 0} {phase.matches?.length === 1 ? 'partida' : 'partidas'}
                </div>
              </div>

              {/* Partidas da Fase */}
              <div className={matchesContainerClass} style={matchesContainerStyle}>
                {phase.matches && phase.matches.length > 0 ? (
                  phase.matches.map((match) => (
                    <div key={match.id} className="relative">
                      <MatchCard
                        match={match}
                        onClick={() => onMatchClick?.(match)}
                      />
                      {/* Conector para próxima fase */}
                      {index < sortedPhases.length - 1 && (
                        <div className="absolute top-1/2 -right-12 w-12 h-0.5 bg-gradient-to-r from-indigo-300 to-transparent -translate-y-1/2" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="w-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                    <span className="text-4xl block mb-2">⏳</span>
                    <p className="text-sm text-slate-500">Aguardando partidas</p>
                  </div>
                )}
              </div>
              </div>
            );
          })}

          {/* Display do Campeão */}
          {hasFinalFinished && <ChampionDisplay phase={finalPhase} />}
        </div>
      </div>

      {/* Legenda Compacta */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📖</span> Como funciona
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-semibold text-indigo-900">Clique na Partida</p>
              <p className="text-indigo-700">Edite o placar e finalize o jogo</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-semibold text-green-900">Avanço Automático</p>
              <p className="text-green-700">Vencedor vai para a próxima fase</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-semibold text-yellow-900">Campeão</p>
              <p className="text-yellow-700">Vencedor da final é coroado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
