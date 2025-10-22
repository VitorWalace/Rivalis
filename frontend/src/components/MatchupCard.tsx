import type { BracketMatch } from '../types/bracket';
import { getMatchStatusInfo, formatMatchDate } from '../utils/bracketHelpers';
import { TrophyIcon, MapPinIcon, CalendarIcon, ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';

interface MatchupCardProps {
  match: BracketMatch;
  nextPhaseName?: string;
  onMatchClick?: (match: BracketMatch) => void;
  onMatchDelete?: (match: BracketMatch) => void;
}

export default function MatchupCard({ match, nextPhaseName, onMatchClick, onMatchDelete }: MatchupCardProps) {
  const statusInfo = getMatchStatusInfo(match);
  const isLocked = match.status === 'locked';
  const hasResult = match.status === 'finished';
  
  // Detectar BYE (classificação direta)
  const isByeMatch = !match.homeTeam || !match.awayTeam;
  const byeTeam = match.homeTeam || match.awayTeam;

  // Se for BYE, renderizar card especial
  if (isByeMatch && byeTeam) {
    return (
      <div
        onClick={() => onMatchClick?.(match)}
        className={`
          bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-300 
          transition-all duration-200 shadow-md
          ${onMatchClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-amber-400' : ''}
        `}
      >
        {/* Header */}
        <div className="px-4 py-2 border-b border-amber-200 bg-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-800">
              Jogo {match.position + 1}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded bg-amber-200 text-amber-800">
              ⏭️ BYE
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="text-center space-y-4">
            {/* Badge de BYE */}
            <div className="inline-block">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-200 rounded-full">
                <span className="text-2xl">⏭️</span>
                <span className="text-sm font-bold text-amber-900 uppercase tracking-wider">
                  Classificação Direta
                </span>
              </div>
            </div>

            {/* Time classificado */}
            <div className="flex items-center justify-center gap-3 p-4 bg-white rounded-lg border-2 border-amber-200 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                {byeTeam.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xl font-bold text-slate-900">{byeTeam.name}</span>
              <TrophyIcon className="w-6 h-6 text-amber-500" />
            </div>

            {/* Mensagem */}
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 font-medium">
                🏆 Este time avança automaticamente para a próxima fase
              </p>
              {nextPhaseName && (
                <div className="flex items-center justify-center gap-2 text-sm mt-2 text-amber-700">
                  <ArrowRightIcon className="w-4 h-4" />
                  <span>Próxima fase: <strong>{nextPhaseName}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Botão Deletar */}
          {onMatchDelete && (
            <div className="pt-2 mt-2 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Tem certeza que deseja excluir esta partida?')) {
                    onMatchDelete(match);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Excluir Partida</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
