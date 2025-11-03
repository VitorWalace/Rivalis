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

  const handleFinishMatch = async () => {
    setStatus('finished');
    toast.success('🏁 Partida finalizada!');
    
    // Determinar vencedor
    const winnerId = homeScore > awayScore ? game?.homeTeamId : game?.awayTeamId;
    const winnerTeam = homeScore > awayScore ? homeTeam : awayTeam;
    
    // Salvar resultado final no backend
    try {
      console.log('🔄 Salvando resultado da partida...');
      // NOTA: O interceptor já retorna response.data
      const saveResponse = await api.put(`/games/${gameId}`, {
        championshipId: game?.championshipId,
        homeTeamId: game?.homeTeamId,
        awayTeamId: game?.awayTeamId,
        status: 'finalizado', // Backend usa 'finalizado' e não 'finished'
        homeScore,
        awayScore,
        endTime: new Date().toISOString(),
      });
      console.log('✅ Resultado salvo com sucesso!');
      console.log('📊 Resposta do save:', saveResponse);
      toast.success('✅ Resultado salvo com sucesso!');
      
      // PROGRESSÃO AUTOMÁTICA: Avançar vencedor para próxima fase (se tiver round)
      if (winnerId && game?.round) {
        console.log(`🚀 Iniciando avanço para próxima fase...`);
        console.log('📊 Dados do jogo:', {
          winnerId,
          round: game.round,
          championshipFormat: game?.championship?.format,
          championshipId: game.championshipId
        });
        await advanceWinnerToNextPhase(
          game.round,
          winnerId,
          winnerTeam?.name || 'Time vencedor'
        );
      }
    } catch (error) {
      console.error('❌ Erro ao salvar resultado:', error);
      toast.error('Erro ao salvar resultado');
    }
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
    } else if (eventData.type === 'substitution') {
      toast(`🔄 Substituição realizada`);
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

  const currentMinute = Math.floor(currentTime / 60);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl font-bold">Carregando partida...</p>
        </div>
      </div>
    );
  }

  if (!game || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-white text-xl font-bold mb-4">Partida não encontrada</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const rawSportId =
    game.championship?.sport ??
    (game as any)?.sport ??
    (game as any)?.sportId ??
    (game as any)?.sportType ??
    (game.championship as any)?.sportId ??
    (game.championship as any)?.sportType;

  const sportId = normalizeSportId(rawSportId);

  const possibleSportTokens = [
    rawSportId,
    sportId,
    game.championship?.sportConfig?.id,
    game.championship?.sportConfig?.name,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());

  const isChessMatch =
    sportId === 'chess' ||
    possibleSportTokens.some((token) => token.includes('chess') || token.includes('xadrez'));

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-8">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b-2 border-slate-700 sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white hover:text-slate-300 transition-colors group"
            >
              <ArrowLeftIcon className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold">Voltar</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1">
                ⚽ EDITOR AO VIVO
              </h1>
              <p className="text-sm text-slate-400">
                Controle manual de partida ao vivo
              </p>
            </div>

            <button
              onClick={handleFinishMatch}
              disabled={status === 'finished'}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                status === 'finished'
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 shadow-lg'
              }`}
            >
              🏁 FINALIZAR
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8 space-y-6">
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
            />
            <TeamLineup
              team={awayTeam}
              events={events}
              isHome={false}
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
    </div>
  );
}
