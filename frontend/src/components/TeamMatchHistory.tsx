import { useEffect, useState } from 'react';
import { CalendarIcon, MapPinIcon, CheckCircleIcon, XCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import type { Team, Game } from '../types';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamMatchHistoryProps {
  team: Team;
  championshipId: string;
}

const TeamMatchHistory = ({ team, championshipId }: TeamMatchHistoryProps) => {
  const [matches, setMatches] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, [team.id, championshipId]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/championships/${championshipId}`);
      const championship = response.data;
      
      // Filter matches involving this team
      const teamMatches = (championship.games || []).filter((game: Game) => 
        game.homeTeamId === team.id || game.awayTeamId === team.id
      );

      // Sort by date (most recent first)
      teamMatches.sort((a: Game, b: Game) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setMatches(teamMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchResult = (game: Game) => {
    if (game.status !== 'finalizado') return null;

    const isHome = game.homeTeamId === team.id;
    const teamScore = isHome ? game.homeScore : game.awayScore;
    const opponentScore = isHome ? game.awayScore : game.homeScore;

    if (teamScore > opponentScore) return 'win';
    if (teamScore < opponentScore) return 'loss';
    return 'draw';
  };

  const getOpponentTeam = (game: Game) => {
    const isHome = game.homeTeamId === team.id;
    return isHome ? game.awayTeam : game.homeTeam;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;

    const badges = {
      win: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircleIcon,
        label: 'Vitória',
      },
      loss: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: XCircleIcon,
        label: 'Derrota',
      },
      draw: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: MinusCircleIcon,
        label: 'Empate',
      },
    };

    const badge = badges[result as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold">{badge.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">
          Histórico de Partidas ({matches.length})
        </h3>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma partida registrada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const isHome = match.homeTeamId === team.id;
            const opponent = getOpponentTeam(match);
            const result = getMatchResult(match);
            const teamScore = isHome ? match.homeScore : match.awayScore;
            const opponentScore = isHome ? match.awayScore : match.homeScore;

            return (
              <div
                key={match.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4" />
                      {match.date ? format(new Date(match.date), 'dd MMM yyyy', { locale: ptBR }) : 'Data não definida'}
                    </div>
                    {match.venue && (
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="h-4 w-4" />
                        {match.venue}
                      </div>
                    )}
                    <div className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">
                      Rodada {match.round || '-'}
                    </div>
                  </div>
                  {getResultBadge(result)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Home Team */}
                    <div className={`flex items-center gap-3 ${isHome ? 'font-bold' : ''}`}>
                      {match.homeTeam?.logo ? (
                        <img 
                          src={match.homeTeam.logo} 
                          alt={match.homeTeam.name}
                          className="h-10 w-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-400">
                            {match.homeTeam?.name?.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-slate-900">{match.homeTeam?.name || 'Time Casa'}</span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2 px-4">
                      {match.status === 'finalizado' ? (
                        <>
                          <span className={`text-3xl font-bold ${isHome ? 'text-blue-600' : 'text-slate-700'}`}>
                            {match.homeScore ?? 0}
                          </span>
                          <span className="text-2xl text-slate-400">×</span>
                          <span className={`text-3xl font-bold ${!isHome ? 'text-blue-600' : 'text-slate-700'}`}>
                            {match.awayScore ?? 0}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-500 px-3 py-1 bg-slate-100 rounded">
                          {match.status === 'agendado' ? 'Agendado' : 
                           match.status === 'em_andamento' ? 'Ao Vivo' : 
                           match.status}
                        </span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className={`flex items-center gap-3 ${!isHome ? 'font-bold' : ''}`}>
                      <span className="text-slate-900">{match.awayTeam?.name || 'Time Visitante'}</span>
                      {match.awayTeam?.logo ? (
                        <img 
                          src={match.awayTeam.logo} 
                          alt={match.awayTeam.name}
                          className="h-10 w-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-400">
                            {match.awayTeam?.name?.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Notes */}
                {match.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-sm text-slate-600">{match.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamMatchHistory;
