import type { BracketMatch } from '../types/bracket';
import { getMatchStatusInfo, formatMatchDate } from '../utils/bracketHelpers';
import { TrophyIcon, MapPinIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface MatchupCardProps {
  match: BracketMatch;
  nextPhaseName?: string;
  onMatchClick?: (match: BracketMatch) => void;
}

export default function MatchupCard({ match, nextPhaseName, onMatchClick }: MatchupCardProps) {
  const statusInfo = getMatchStatusInfo(match);
  const isLocked = match.status === 'locked';
  const hasResult = match.status === 'finished';

  return (
    <div
      onClick={() => onMatchClick?.(match)}
      className={`
        bg-white rounded-lg border-2 transition-all duration-200
        ${statusInfo.color}
        ${onMatchClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
      `}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {match.round === 1 ? '🏆 FINAL' : `Jogo ${match.position + 1}`}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${statusInfo.color}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Confronto */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Time Casa */}
          <div className={`
            flex items-center justify-between p-3 rounded-lg transition-all
            ${hasResult && match.winner?.id === match.homeTeam?.id 
              ? 'bg-green-50 ring-2 ring-green-400' 
              : 'bg-gray-50'
            }
          `}>
            <div className="flex items-center gap-3 flex-1">
              {match.homeTeam ? (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow">
                    {match.homeTeam.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-semibold ${
                    hasResult && match.winner?.id === match.homeTeam.id 
                      ? 'text-green-700 text-lg' 
                      : 'text-gray-900'
                  }`}>
                    {match.homeTeam.name}
                  </span>
                  {hasResult && match.winner?.id === match.homeTeam.id && (
                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                  )}
                </>
              ) : (
                <span className="text-gray-400 italic">
                  {isLocked ? '🔒 Aguardando definição' : 'A definir'}
                </span>
              )}
            </div>
            {hasResult && match.homeScore !== undefined && (
              <span className={`text-2xl font-bold ${
                match.winner?.id === match.homeTeam?.id 
                  ? 'text-green-600' 
                  : 'text-gray-500'
              }`}>
                {match.homeScore}
              </span>
            )}
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              VS
            </span>
          </div>

          {/* Time Visitante */}
          <div className={`
            flex items-center justify-between p-3 rounded-lg transition-all
            ${hasResult && match.winner?.id === match.awayTeam?.id 
              ? 'bg-green-50 ring-2 ring-green-400' 
              : 'bg-gray-50'
            }
          `}>
            <div className="flex items-center gap-3 flex-1">
              {match.awayTeam ? (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow">
                    {match.awayTeam.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-semibold ${
                    hasResult && match.winner?.id === match.awayTeam.id 
                      ? 'text-green-700 text-lg' 
                      : 'text-gray-900'
                  }`}>
                    {match.awayTeam.name}
                  </span>
                  {hasResult && match.winner?.id === match.awayTeam.id && (
                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                  )}
                </>
              ) : (
                <span className="text-gray-400 italic">
                  {isLocked ? '🔒 Aguardando definição' : 'A definir'}
                </span>
              )}
            </div>
            {hasResult && match.awayScore !== undefined && (
              <span className={`text-2xl font-bold ${
                match.winner?.id === match.awayTeam?.id 
                  ? 'text-green-600' 
                  : 'text-gray-500'
              }`}>
                {match.awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Vencedor e Próxima Fase */}
        {hasResult && match.winner && nextPhaseName && (
          <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-primary-900">✅ Vencedor:</span>
              <span className="text-primary-700">{match.winner.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <ArrowRightIcon className="w-4 h-4 text-primary-600" />
              <span className="text-primary-600">Avança para: {nextPhaseName}</span>
            </div>
          </div>
        )}

        {/* Dependências */}
        {isLocked && match.dependsOn && match.dependsOn.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <span className="text-lg">⏳</span>
              <span className="font-medium">
                Aguardando resultados das partidas anteriores
              </span>
            </div>
          </div>
        )}

        {/* Informações da Partida */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {match.scheduledDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              <span>{formatMatchDate(match.scheduledDate)}</span>
            </div>
          )}
          {match.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4" />
              <span>{match.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
