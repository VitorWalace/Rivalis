import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LiveScoreboard from '../components/LiveScoreboard';
import MatchControlPanel from '../components/MatchControlPanel';
import EventButtons from '../components/EventButtons';
import EventModal from '../components/EventModal';
import EventTimeline from '../components/EventTimeline';
import TeamLineup from '../components/TeamLineup';
import BasicStats from '../components/BasicStats';
import AchievementNotification from '../components/AchievementNotification';
import ChessMatchEditor from '../components/chess/ChessMatchEditor';
import StartingLineupModal from '../components/StartingLineupModal';
import { normalizeSportId } from '../config/sportsCatalog';
import type { Game, Team } from '../types';
import api from '../services/api';

type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution';

interface EventData {
  type: EventType;
  teamId: string;
  playerId?: string;
  minute: number;
  description?: string;
  assistPlayerId?: string;
  playerOutId?: string;
  playerInId?: string;
  goalType?: 'normal' | 'penalty' | 'own_goal' | 'free_kick';
}

interface MatchEvent extends EventData {
  id: string;
  playerName?: string;
  playerNumber?: number;
  assistPlayerName?: string;
  playerOutName?: string;
  playerInName?: string;
}

type PenaltyResult = 'goal' | 'miss';

interface PenaltyAttemptRecord {
  id: string;
  teamId: string;
  teamName: string;
  order: number;
  result: PenaltyResult;
}

interface PenaltyShootoutSummary {
  winnerTeamId: string;
  winnerTeamName: string;
  decidedAt: string;
  homeTeam: {
    id: string;
    name: string;
    goals: number;
    attempts: Array<Pick<PenaltyAttemptRecord, 'order' | 'result'>>;
  };
  awayTeam: {
    id: string;
    name: string;
    goals: number;
    attempts: Array<Pick<PenaltyAttemptRecord, 'order' | 'result'>>;
  };
}

export default function LiveMatchEditorPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'finished'>('pending');
  const [currentTime] = useState(0);
  const [period, setPeriod] = useState('1º TEMPO');
  
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEventType, setCurrentEventType] = useState<EventType>('goal');
  const [achievementNotification, setAchievementNotification] = useState<any>(null);
  const [showStartingLineupModal, setShowStartingLineupModal] = useState(false);
  const [lineupConfirmed, setLineupConfirmed] = useState(false);
  const [homeStartingPlayers, setHomeStartingPlayers] = useState<string[]>([]);
  const [awayStartingPlayers, setAwayStartingPlayers] = useState<string[]>([]);
  const [showPenaltyShootoutModal, setShowPenaltyShootoutModal] = useState(false);
  const [penaltyAttempts, setPenaltyAttempts] = useState<PenaltyAttemptRecord[]>([]);
  const [isSavingPenaltyShootout, setIsSavingPenaltyShootout] = useState(false);

  useEffect(() => {
    setLineupConfirmed(false);
    setHomeStartingPlayers([]);
    setAwayStartingPlayers([]);
    setShowStartingLineupModal(false);
  }, [gameId]);

  // Carregar dados da partida
  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/games/${gameId}`);
        // O interceptor já retorna response.data, então response já é { success, data: { game } }
        const gameData = response.data.game;
        
        setGame(gameData);
        setHomeScore(gameData.homeScore || 0);
        setAwayScore(gameData.awayScore || 0);
        
        // Mapear status do backend para o frontend
        const statusMap: Record<string, 'pending' | 'in-progress' | 'finished'> = {
          'agendado': 'pending',
          'ao-vivo': 'in-progress',
          'finalizado': 'finished',
          'cancelado': 'pending'
        };
        setStatus(statusMap[gameData.status as string] || 'pending');
        
        // Usar os times que já vêm na resposta do jogo
        if (gameData.homeTeam) {
          setHomeTeam(gameData.homeTeam);
        }
        if (gameData.awayTeam) {
          setAwayTeam(gameData.awayTeam);
        }
        
        // Carregar eventos salvos (se existirem)
        if (gameData.events) {
          setEvents(gameData.events);
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados da partida:', error);
        toast.error('Erro ao carregar partida');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, navigate]);

  const handleStartMatch = () => {
    setStatus('in-progress');
    setPeriod('1º TEMPO');
    toast.success('⚽ Partida iniciada!');
  };

  const handlePauseMatch = () => {
    toast('⏸️ Jogo pausado');
  };

  const handleResumeMatch = () => {
    toast.success('▶️ Jogo retomado');
  };

  const handleEndPeriod = () => {
    if (period === '1º TEMPO') {
      setPeriod('INTERVALO');
      toast('🕐 Fim do primeiro tempo');
    } else if (period === 'INTERVALO') {
      setPeriod('2º TEMPO');
      toast.success('▶️ Início do segundo tempo');
    } else if (period === '2º TEMPO') {
      handleFinishMatch();
    }
  };

  const finalizeMatch = async (options: {
    winnerTeamId?: string;
    winnerTeamName?: string;
    penaltyShootout?: PenaltyShootoutSummary;
  } = {}) => {
    if (!game) {
      return;
    }

    setStatus('finished');
    toast.success('🏁 Partida finalizada!');

    try {
      const payload: Record<string, unknown> = {
        championshipId: game.championshipId,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        status: 'finalizado',
        homeScore,
        awayScore,
        endTime: new Date().toISOString(),
      };

      await api.put(`/games/${gameId}`, payload);

      if (options.penaltyShootout) {
        try {
          await api.post(`/games/${gameId}/state`, {
            type: 'penalty-shootout',
            data: options.penaltyShootout,
            updatedAt: new Date().toISOString(),
          });
        } catch (shootoutError) {
          console.error('Erro ao salvar disputa de pênaltis:', shootoutError);
          toast.error('Não foi possível salvar os detalhes da disputa de pênaltis.');
        }
      }

      const stageLabel = (game.stage || '').toLowerCase();
      const isGroupStage = stageLabel.includes('grupo') || stageLabel.includes('group');
      const isLeagueFormat = game.championship?.format === 'league';
      const shouldAdvanceWinner = !isLeagueFormat && !isGroupStage && Boolean(game.round);

      if (shouldAdvanceWinner) {
        if (options.winnerTeamId) {
          await advanceWinnerToNextPhase(
            game.round,
            options.winnerTeamId,
            options.winnerTeamName || 'Time vencedor'
          );
        } else if (homeScore !== awayScore) {
          const resolvedWinnerId = homeScore > awayScore ? game.homeTeamId : game.awayTeamId;
          const resolvedWinnerName = homeScore > awayScore ? homeTeam?.name : awayTeam?.name;
          if (resolvedWinnerId) {
            await advanceWinnerToNextPhase(
              game.round,
              resolvedWinnerId,
              resolvedWinnerName || 'Time vencedor'
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar resultado:', error);
      toast.error('Erro ao salvar resultado');
    }
  };

  const handleFinishMatch = async () => {
    if (!game || !homeTeam || !awayTeam) {
      toast.error('Partida não encontrada.');
      return;
    }

    const stageLabel = (game.stage || '').toLowerCase();
    const isGroupStage = stageLabel.includes('grupo') || stageLabel.includes('group');
    const isLeagueFormat = game.championship?.format === 'league';
    const isKnockoutMatch = !isLeagueFormat && !isGroupStage && Boolean(game.round);

    if (homeScore === awayScore && isKnockoutMatch) {
      setPenaltyAttempts([]);
      setShowPenaltyShootoutModal(true);
      toast('⚔️ Empate no mata-mata! Registre a disputa de pênaltis para definir o vencedor.');
      return;
    }

    const winnerTeamId = homeScore === awayScore ? undefined : homeScore > awayScore ? homeTeam.id : awayTeam.id;
    const winnerTeamName = winnerTeamId === homeTeam.id ? homeTeam.name : winnerTeamId === awayTeam.id ? awayTeam.name : undefined;

    await finalizeMatch({
      winnerTeamId,
      winnerTeamName,
    });
  };

  // Função para avançar o vencedor para a próxima fase
  const advanceWinnerToNextPhase = async (
    currentRound: number,
    winnerId: string,
    winnerName: string
  ) => {
    try {
      console.log(`🎯 Avançando vencedor...`, {
        gameId,
        currentRound,
        winnerId,
        winnerName
      });
      
      // Chamar a rota específica do backend que faz toda a lógica
      const response = await api.post(`/games/${gameId}/advance-winner`, {
        winnerId,
      });

      console.log('📨 Resposta completa do backend:', response);
      console.log('📨 Tipo da resposta:', typeof response);
      console.log('📨 Keys da resposta:', Object.keys(response || {}));

      // O interceptor pode ou não retornar response.data
      // Vamos verificar ambos os casos
      const data = response?.data || response;
      
      console.log('📦 Data extraído:', data);
      console.log('📦 Tipo do data:', typeof data);
      console.log('� isChampion:', data?.isChampion);
      console.log('📦 success:', data?.success);

      if (data && data.isChampion) {
        // É a final, não há próxima fase - vencedor é o campeão
        toast.success(`🏆 ${winnerName} é o CAMPEÃO!`, { duration: 5000 });
        console.log(`🏆 ${winnerName} é o CAMPEÃO do campeonato!`);
        
        // Aguardar um pouco para o usuário ver a mensagem e depois voltar
        setTimeout(() => {
          const championshipId = game?.championshipId || game?.championship?.id;
          if (championshipId) {
            console.log('🔄 Redirecionando para:', `/championship/${championshipId}`);
            navigate(`/championship/${championshipId}`, { replace: true });
          } else {
            console.error('❌ ChampionshipId não encontrado!');
            navigate('/championships', { replace: true });
          }
        }, 3000);
      } else if (data && data.success !== false) {
        // Vencedor avançou para próxima fase
        toast.success(`✨ ${winnerName} avançou para a próxima fase!`, { duration: 4000 });
        console.log(`✅ ${winnerName} avançou da rodada ${currentRound} para ${currentRound + 1}`);
        if (data.nextGame) {
          console.log('🎮 Próximo jogo:', data.nextGame);
        }
        
        // Voltar para a página do campeonato para ver o bracket atualizado
        setTimeout(() => {
          const championshipId = game?.championshipId || game?.championship?.id;
          if (championshipId) {
            console.log('🔄 Redirecionando para:', `/championship/${championshipId}`);
            navigate(`/championship/${championshipId}`, { replace: true });
          } else {
            console.error('❌ ChampionshipId não encontrado!');
            navigate('/championships', { replace: true });
          }
        }, 2000);
      } else {
        throw new Error(data?.message || 'Resposta inesperada do servidor');
      }
    } catch (error: any) {
      console.error('❌ Erro ao avançar vencedor:', error);
      console.error('📄 Detalhes do erro:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao avançar time para próxima fase';
      toast.error(errorMessage);
    }
  };

  const handleOpenEventModal = (type: EventType) => {
    setCurrentEventType(type);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventData: EventData) => {
    if (!homeTeam || !awayTeam) return;
    
    const currentTeam = eventData.teamId === homeTeam.id ? homeTeam : awayTeam;
    const player = currentTeam.players?.find(p => p.id === eventData.playerId);
    
    const newEvent: MatchEvent = {
      ...eventData,
      id: Date.now().toString(),
      playerName: player?.name,
      playerNumber: player?.number,
    };

    // Se for gol, adicionar info da assistência
    if (eventData.type === 'goal' && eventData.assistPlayerId) {
      const assistPlayer = currentTeam.players?.find(p => p.id === eventData.assistPlayerId);
      newEvent.assistPlayerName = assistPlayer?.name;
    }

    // Se for substituição, adicionar nomes dos jogadores
    if (eventData.type === 'substitution') {
      const playerOut = currentTeam.players?.find(p => p.id === eventData.playerOutId);
      const playerIn = currentTeam.players?.find(p => p.id === eventData.playerInId);
      newEvent.playerOutName = playerOut?.name;
      newEvent.playerInName = playerIn?.name;
    }

    setEvents(prev => [...prev, newEvent]);

    // Se for gol, registrar no backend e verificar gamificação
    if (eventData.type === 'goal') {
      try {
        const response = await api.post(`/games/${gameId}/goals`, {
          gameId,
          playerId: eventData.playerId,
          teamId: eventData.teamId,
          minute: eventData.minute,
          type: eventData.goalType || 'normal',
          assistPlayerId: eventData.assistPlayerId || null,
        });

        console.log('📊 [Gol] Resposta da API:', response);

        // O interceptor já extrai response.data, então acessamos direto response.data
        const responseData = response.data || response;
        
        // Verificar se retornou gamificação
        if (responseData.gamification) {
          const { xpGained, levelInfo, achievements } = responseData.gamification;
          
          if (achievements && achievements.length > 0) {
            console.log('🏆 [Conquistas] Desbloqueadas:', achievements);
            setAchievementNotification({
              achievements,
              xpGained,
              levelInfo
            });
          }
          
          // Toast com XP ganho
          toast.success(`⚽ GOL! ${currentTeam.name} (+${xpGained} XP)`, { duration: 3000 });
        } else {
          toast.success(`⚽ GOL! ${currentTeam.name}`, { duration: 3000 });
        }
      } catch (error: any) {
        console.error('❌ [Gol] Erro ao registrar:', error);
        console.error('📄 [Gol] Error completo:', JSON.stringify(error, null, 2));
        console.error('📄 [Gol] Detalhes do erro:', error.response?.data);
        console.error('📄 [Gol] Status:', error.response?.status);
        console.error('📄 [Gol] Message:', error.message);
        
        const errorMessage = error.response?.data?.message 
          || error.message 
          || 'Erro ao registrar gol no servidor';
        
        toast.error(`Erro ao registrar gol: ${errorMessage}`);
        
        // Reverter o evento adicionado localmente
        setEvents(prev => prev.filter(e => e.id !== newEvent.id));
      }

      // Atualizar placar
      if (eventData.teamId === homeTeam.id) {
        setHomeScore(prev => prev + 1);
      } else {
        setAwayScore(prev => prev + 1);
      }
    } else if (eventData.type === 'yellow_card') {
      toast(`🟨 Cartão amarelo para ${player?.name}`);
    } else if (eventData.type === 'red_card') {
      toast.error(`🟥 Cartão vermelho! ${player?.name} foi expulso`);
      if (isFutsal) {
        if (eventData.teamId === homeTeam.id && eventData.playerId) {
          setHomeStartingPlayers(prev => prev.filter(id => id !== eventData.playerId));
        }
        if (eventData.teamId === awayTeam.id && eventData.playerId) {
          setAwayStartingPlayers(prev => prev.filter(id => id !== eventData.playerId));
        }
      }
    } else if (eventData.type === 'substitution') {
      toast(`🔄 Substituição realizada`);
      if (isFutsal) {
        const adjustLineup = (current: string[], outId?: string, inId?: string) => {
          let next = current;
          if (outId) {
            next = next.filter(id => id !== outId);
          }
          if (inId && !next.includes(inId)) {
            next = [...next, inId];
          }
          return next;
        };

        if (eventData.teamId === homeTeam.id) {
          setHomeStartingPlayers(prev =>
            adjustLineup(prev, eventData.playerOutId, eventData.playerInId)
          );
        }
        if (eventData.teamId === awayTeam.id) {
          setAwayStartingPlayers(prev =>
            adjustLineup(prev, eventData.playerOutId, eventData.playerInId)
          );
        }
      }
    }
  };

  const handleEditEvent = (event: MatchEvent) => {
    // TODO: Implementar edição de eventos
    console.log('Edit event:', event);
    setCurrentEventType(event.type);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    setEvents(prev => prev.filter(e => e.id !== eventId));

    // Se for gol, atualizar placar
    if (event.type === 'goal') {
      if (event.teamId === homeTeam?.id) {
        setHomeScore(prev => Math.max(0, prev - 1));
      } else {
        setAwayScore(prev => Math.max(0, prev - 1));
      }
    }

    toast.success('🗑️ Evento removido');
  };

  const rawSportId =
    game?.championship?.sport ??
    (game as any)?.sport ??
    (game as any)?.sportId ??
    (game as any)?.sportType ??
    (game?.championship as any)?.sportId ??
    (game?.championship as any)?.sportType;

  const sportId = normalizeSportId(rawSportId);
  const isFutsal = sportId === 'futsal';

  const possibleSportTokens = [
    rawSportId,
    sportId,
    game?.championship?.sportConfig?.id,
    game?.championship?.sportConfig?.name,
  ]
    .filter(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0
    )
    .map((value) => value.trim().toLowerCase());

  const isChessMatch =
    sportId === 'chess' ||
    possibleSportTokens.some(
      (token) => token.includes('chess') || token.includes('xadrez')
    );

  useEffect(() => {
    if (
      !loading &&
      isFutsal &&
      homeTeam &&
      awayTeam &&
      (homeTeam.players?.length || 0) > 0 &&
      (awayTeam.players?.length || 0) > 0 &&
      !lineupConfirmed
    ) {
      setShowStartingLineupModal(true);
    }
  }, [loading, isFutsal, homeTeam, awayTeam, lineupConfirmed]);

  const currentMinute = Math.floor(currentTime / 60);
  const homePenaltyAttempts = homeTeam
    ? penaltyAttempts.filter((attempt) => attempt.teamId === homeTeam.id)
    : [];
  const awayPenaltyAttempts = awayTeam
    ? penaltyAttempts.filter((attempt) => attempt.teamId === awayTeam.id)
    : [];
  const homePenaltyGoals = homePenaltyAttempts.filter((attempt) => attempt.result === 'goal').length;
  const awayPenaltyGoals = awayPenaltyAttempts.filter((attempt) => attempt.result === 'goal').length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-slate-300">
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-b-transparent"></div>
          <p className="text-sm font-semibold uppercase tracking-wide">Carregando partida...</p>
        </div>
      </div>
    );
  }

  if (!game || !homeTeam || !awayTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-slate-300">
          <p className="mb-3 text-lg font-semibold uppercase tracking-wide">Partida não encontrada</p>
          <p className="mb-6 text-sm text-slate-500">Verifique se o link está correto e tente novamente.</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmStartingLineup = (homePlayers: string[], awayPlayers: string[]) => {
    setHomeStartingPlayers(homePlayers);
    setAwayStartingPlayers(awayPlayers);
    setLineupConfirmed(true);
    setShowStartingLineupModal(false);
  };

  const handleCloseStartingLineup = () => {
    setShowStartingLineupModal(false);
  };

  const generatePenaltyAttemptId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `pen-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const addPenaltyAttempt = (side: 'home' | 'away', result: PenaltyResult) => {
    if (!homeTeam || !awayTeam) {
      return;
    }

    const targetTeam = side === 'home' ? homeTeam : awayTeam;

    setPenaltyAttempts((previous) => {
      const nextOrder = previous.filter((attempt) => attempt.teamId === targetTeam.id).length + 1;
      return [
        ...previous,
        {
          id: generatePenaltyAttemptId(),
          teamId: targetTeam.id,
          teamName: targetTeam.name || (side === 'home' ? 'Mandante' : 'Visitante'),
          order: nextOrder,
          result,
        },
      ];
    });
  };

  const undoLastPenaltyAttempt = () => {
    setPenaltyAttempts((previous) => previous.slice(0, -1));
  };

  const handleCancelPenaltyShootout = () => {
    setPenaltyAttempts([]);
    setShowPenaltyShootoutModal(false);
  };

  const handleConfirmPenaltyShootout = async () => {
    if (!homeTeam || !awayTeam) {
      return;
    }

    const homeGoals = penaltyAttempts.filter(
      (attempt) => attempt.teamId === homeTeam.id && attempt.result === 'goal'
    ).length;
    const awayGoals = penaltyAttempts.filter(
      (attempt) => attempt.teamId === awayTeam.id && attempt.result === 'goal'
    ).length;

    if (penaltyAttempts.length === 0) {
      toast.error('Adicione pelo menos uma cobrança antes de finalizar a disputa.');
      return;
    }

    if (homeGoals === awayGoals) {
      toast.error('A disputa de pênaltis ainda está empatada. Registre cobranças extras.');
      return;
    }

    const winnerSide = homeGoals > awayGoals ? 'home' : 'away';
    const winnerTeam = winnerSide === 'home' ? homeTeam : awayTeam;

    const summary: PenaltyShootoutSummary = {
      winnerTeamId: winnerTeam.id,
      winnerTeamName: winnerTeam.name || (winnerSide === 'home' ? 'Mandante' : 'Visitante'),
      decidedAt: new Date().toISOString(),
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name || 'Mandante',
        goals: homeGoals,
        attempts: penaltyAttempts
          .filter((attempt) => attempt.teamId === homeTeam.id)
          .map((attempt) => ({ order: attempt.order, result: attempt.result })),
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name || 'Visitante',
        goals: awayGoals,
        attempts: penaltyAttempts
          .filter((attempt) => attempt.teamId === awayTeam.id)
          .map((attempt) => ({ order: attempt.order, result: attempt.result })),
      },
    };

    try {
      setIsSavingPenaltyShootout(true);
      await finalizeMatch({
        winnerTeamId: winnerTeam.id,
        winnerTeamName: winnerTeam.name,
        penaltyShootout: summary,
      });
      toast.success(
        `🎯 ${winnerTeam.name || 'Time vencedor'} venceu nos pênaltis (${homeGoals} x ${awayGoals}).`
      );
      setPenaltyAttempts([]);
      setShowPenaltyShootoutModal(false);
    } catch (error) {
      console.error('Erro ao finalizar disputa de pênaltis:', error);
      toast.error('Erro ao salvar disputa de pênaltis. Tente novamente.');
    } finally {
      setIsSavingPenaltyShootout(false);
    }
  };

  if (isChessMatch) {
    return (
      <ChessMatchEditor
        game={game}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-slate-200"
          >
            <ArrowLeftIcon className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span>Voltar</span>
          </button>

          <div className="text-center">
            <h1 className="text-xl font-semibold uppercase tracking-wide text-slate-100">
              Editor ao vivo
            </h1>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Controle manual de partida
            </p>
          </div>

          <button
            onClick={handleFinishMatch}
            disabled={status === 'finished'}
            className={`rounded-xl border px-5 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              status === 'finished'
                ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600'
                : 'border-rose-500/50 bg-rose-500/10 text-rose-200 hover:border-rose-400 hover:bg-rose-500/15'
            }`}
          >
            Finalizar partida
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1800px] space-y-6 px-6 py-8">
        {/* Scoreboard */}
        <LiveScoreboard
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeScore={homeScore}
          awayScore={awayScore}
          status={status}
          period={period}
          time={`${Math.floor(currentMinute).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`}
        />

        {/* Control Panel */}
        <MatchControlPanel
          status={status}
          onStart={handleStartMatch}
          onPause={handlePauseMatch}
          onResume={handleResumeMatch}
          onEndPeriod={handleEndPeriod}
          onFinish={handleFinishMatch}
          initialTime={currentTime}
        />

        {/* Event Buttons */}
        <EventButtons
          onGoal={() => handleOpenEventModal('goal')}
          onYellowCard={() => handleOpenEventModal('yellow_card')}
          onRedCard={() => handleOpenEventModal('red_card')}
          onSubstitution={() => handleOpenEventModal('substitution')}
          disabled={status !== 'in-progress'}
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline (takes 2/3 on large screens) */}
          <div className="lg:col-span-2">
            <EventTimeline
              events={events}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          </div>

          {/* Right Column - Lineups */}
          <div className="space-y-6">
            <TeamLineup
              team={homeTeam}
              events={events}
              isHome={true}
              activePlayerIds={isFutsal && lineupConfirmed ? homeStartingPlayers : undefined}
            />
            <TeamLineup
              team={awayTeam}
              events={events}
              isHome={false}
              activePlayerIds={isFutsal && lineupConfirmed ? awayStartingPlayers : undefined}
            />
          </div>
        </div>

        {/* Stats */}
        <BasicStats
          events={events}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      </div>

      {/* Penalty Shootout Modal */}
      {showPenaltyShootoutModal && homeTeam && awayTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-[0_25px_80px_-40px_rgba(8,10,20,0.85)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 px-6 py-5 text-white">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold uppercase tracking-wide">Disputa de pênaltis</h2>
                  <p className="text-sm text-slate-200/80">
                    Registre cada cobrança para definir o vencedor do mata-mata.
                  </p>
                </div>
                <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg font-semibold shadow-inner">
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wide text-slate-300">{homeTeam.name}</span>
                    <span className="text-3xl font-bold text-emerald-300">{homePenaltyGoals}</span>
                  </div>
                  <span className="text-xl font-semibold text-slate-300">x</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-sky-300">{awayPenaltyGoals}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-300 text-right">{awayTeam.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 px-6 py-5">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Home Team Column */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
                        {homeTeam.name}
                      </h3>
                      <p className="text-xs text-emerald-100/70">
                        {homePenaltyAttempts.length}{' '}
                        {homePenaltyAttempts.length === 1 ? 'cobrança' : 'cobranças'} registradas
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {homePenaltyGoals} gol{homePenaltyGoals === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {homePenaltyAttempts.length > 0 ? (
                      homePenaltyAttempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur ${
                            attempt.result === 'goal'
                              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                              : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs uppercase tracking-wide text-white/70">
                              {attempt.order}ª cobrança
                            </span>
                            <span>{attempt.result === 'goal' ? 'Gol convertido' : 'Cobrança perdida'}</span>
                          </div>
                          <span className="rounded border border-white/10 px-2 py-0.5 text-xs uppercase tracking-wide text-white/80">
                            {attempt.result === 'goal' ? 'Gol' : 'Erro'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-emerald-400/40 bg-emerald-500/5 px-4 py-6 text-center text-xs text-emerald-100/70">
                        Nenhuma cobrança registrada ainda
                      </div>
                    )}
                  </div>
                </div>

                {/* Away Team Column */}
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-right">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-200">
                        {awayTeam.name}
                      </h3>
                      <p className="text-xs text-sky-100/70">
                        {awayPenaltyAttempts.length}{' '}
                        {awayPenaltyAttempts.length === 1 ? 'cobrança' : 'cobranças'} registradas
                      </p>
                    </div>
                    <span className="rounded-full border border-sky-400/50 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                      {awayPenaltyGoals} gol{awayPenaltyGoals === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {awayPenaltyAttempts.length > 0 ? (
                      awayPenaltyAttempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur ${
                            attempt.result === 'goal'
                              ? 'border-sky-400/40 bg-sky-500/15 text-sky-100'
                              : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs uppercase tracking-wide text-white/70">
                              {attempt.order}ª cobrança
                            </span>
                            <span>{attempt.result === 'goal' ? 'Gol convertido' : 'Cobrança perdida'}</span>
                          </div>
                          <span className="rounded border border-white/10 px-2 py-0.5 text-xs uppercase tracking-wide text-white/80">
                            {attempt.result === 'goal' ? 'Gol' : 'Erro'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-sky-400/40 bg-sky-500/5 px-4 py-6 text-center text-xs text-sky-100/70">
                        Nenhuma cobrança registrada ainda
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                    Registrar {homeTeam.name}
                  </span>
                  <div className="flex flex-1 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addPenaltyAttempt('home', 'goal')}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/30"
                    >
                      Gol
                    </button>
                    <button
                      type="button"
                      onClick={() => addPenaltyAttempt('home', 'miss')}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-400 hover:bg-rose-500/20"
                    >
                      Erro
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-sky-200">
                    Registrar {awayTeam.name}
                  </span>
                  <div className="flex flex-1 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addPenaltyAttempt('away', 'goal')}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-400 hover:bg-sky-500/30"
                    >
                      Gol
                    </button>
                    <button
                      type="button"
                      onClick={() => addPenaltyAttempt('away', 'miss')}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-400 hover:bg-rose-500/20"
                    >
                      Erro
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={undoLastPenaltyAttempt}
                  disabled={penaltyAttempts.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                >
                  Desfazer última cobrança
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelPenaltyShootout}
                    disabled={isSavingPenaltyShootout}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPenaltyShootout}
                    disabled={isSavingPenaltyShootout || penaltyAttempts.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500/60 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:border-emerald-500/40 disabled:bg-emerald-500/20"
                  >
                    {isSavingPenaltyShootout ? 'Salvando...' : 'Encerrar disputa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={currentEventType}
        game={game}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        currentMinute={currentMinute}
        onSave={handleSaveEvent}
        activeHomePlayerIds={
          isFutsal && lineupConfirmed
            ? homeStartingPlayers
            : undefined
        }
        activeAwayPlayerIds={
          isFutsal && lineupConfirmed
            ? awayStartingPlayers
            : undefined
        }
      />

      {/* Notificação de Conquistas */}
      {achievementNotification && (
        <AchievementNotification
          achievements={achievementNotification.achievements}
          xpGained={achievementNotification.xpGained}
          levelInfo={achievementNotification.levelInfo}
          onClose={() => setAchievementNotification(null)}
        />
      )}

      {isFutsal && homeTeam && awayTeam && (
        <StartingLineupModal
          isOpen={showStartingLineupModal}
          onClose={handleCloseStartingLineup}
          onConfirm={handleConfirmStartingLineup}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          requiredCount={5}
        />
      )}
    </div>
  );
}
