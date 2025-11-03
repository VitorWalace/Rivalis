import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowsRightLeftIcon, FlagIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, ClockIcon, PauseIcon, PlayIcon, SparklesIcon } from '@heroicons/react/24/solid';
import api from '../../services/api';
import type { Game, Team } from '../../types';
import CustomChessboard from '../match-editor/CustomChessboard';
import { calculateChessGamification, type ChessGamificationSummary } from '../../utils/gamification/chess';

interface ChessMatchEditorProps {
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  onBack: () => void;
}

interface MoveComment {
  moveIndex: number;
  comment: string;
}

interface MoveLogEntry {
  moveNumber: number;
  san: string;
  color: 'w' | 'b';
  fen: string;
  from: Square;
  to: Square;
  captured?: string;
  check?: boolean;
  checkmate?: boolean;
  clocksAfter: ClockState;
  clocksBefore: ClockState;
  timestamp: number;
}

interface ClockState {
  w: number;
  b: number;
}

interface SavedChessState {
  fen: string;
  history: MoveLogEntry[];
  comments: MoveComment[];
  clocks: ClockState;
  increment: number;
  turn: 'w' | 'b';
  orientation: Orientation;
  result?: MatchResult;
}

type Orientation = 'white' | 'black';

type MatchResult =
  | { status: 'in-progress' }
  | { status: 'checkmate'; winner: 'w' | 'b' }
  | { status: 'draw'; reason: string }
  | { status: 'resignation'; winner: 'w' | 'b' }
  | { status: 'time'; winner: 'w' | 'b' };

type PendingPromotion = {
  from: Square;
  to: Square;
  color: 'w' | 'b';
};

const STORAGE_PREFIX = 'rivalis-chess-editor-state-';

const DEFAULT_CLOCK: ClockState = {
  w: 10 * 60,
  b: 10 * 60,
};

const formatClock = (seconds: number) => {
  const mins = Math.max(0, Math.floor(seconds / 60));
  const secs = Math.max(0, seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatMatchDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(0, seconds % 60);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) {
    return `${hours}h ${String(remainingMins).padStart(2, '0')}m`;
  }
  return `${remainingMins}m ${String(secs).padStart(2, '0')}s`;
};

const chessColorToTeam = (color: 'w' | 'b', homeTeam: Team, awayTeam: Team) =>
  color === 'w' ? homeTeam : awayTeam;

function getMoveAnnotation(move: Move): {
  san: string;
  captured?: string;
  check?: boolean;
  checkmate?: boolean;
} {
  const san = move.san;
  return {
    san,
    captured: move.captured ?? undefined,
    check: san.includes('+'),
    checkmate: san.includes('#'),
  };
}

export default function ChessMatchEditor({ game, homeTeam, awayTeam, onBack }: ChessMatchEditorProps) {
  const [orientation, setOrientation] = useState<Orientation>('white');
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState<string>(chessRef.current.fen());
  const [lastMoveSquares, setLastMoveSquares] = useState<[Square, Square] | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveLogEntry[]>([]);
  const [moveComments, setMoveComments] = useState<Record<number, string>>({});
  const [manualMove, setManualMove] = useState('');
  const [clockSettings, setClockSettings] = useState({ ...DEFAULT_CLOCK, increment: 5 });
  const [clocks, setClocks] = useState<ClockState>({ ...DEFAULT_CLOCK });
  const clockRef = useRef<ClockState>(clocks);
  const [activeClock, setActiveClock] = useState<'w' | 'b'>('w');
  const [clockRunning, setClockRunning] = useState(false);
  const lastTickRef = useRef<number | null>(null);
  const [result, setResult] = useState<MatchResult>({ status: 'in-progress' });
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [notesVisible, setNotesVisible] = useState(true);
  const [gamificationSummary, setGamificationSummary] = useState<ChessGamificationSummary | null>(null);

  const activeChess = chessRef.current;

  useEffect(() => {
    clockRef.current = clocks;
  }, [clocks]);

  const handleGamification = useCallback(
    (finalResult: MatchResult, history: MoveLogEntry[]) => {
      if (finalResult.status === 'in-progress') {
        return;
      }

      const summary = calculateChessGamification({
        result: finalResult,
        moves: history.map((move) => ({
          color: move.color,
          captured: move.captured,
          check: move.check,
          checkmate: move.checkmate,
          timestamp: move.timestamp,
        })),
        clocks: {
          initial: { w: clockSettings.w, b: clockSettings.b },
          final: clockRef.current,
          increment: clockSettings.increment,
        },
        teams: {
          white: { team: homeTeam, player: homeTeam.players?.[0] ?? null },
          black: { team: awayTeam, player: awayTeam.players?.[0] ?? null },
        },
      });

      if (summary) {
        setGamificationSummary(summary);
        summary.notifications.forEach((notification) => {
          toast.success(`${notification.message} (+${notification.xp} XP)`, {
            duration: 4500,
          });
        });
      }
    },
    [awayTeam, clockSettings, homeTeam]
  );

  useEffect(() => {
    if (!clockRunning) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = Date.now();
    const timer = window.setInterval(() => {
      setClocks(prev => {
        const now = Date.now();
        const lastTick = lastTickRef.current ?? now;
        const deltaSeconds = Math.floor((now - lastTick) / 1000);
        if (deltaSeconds <= 0) {
          return prev;
        }
        lastTickRef.current = now;
        const nextValue = Math.max(0, prev[activeClock] - deltaSeconds);
        const updated: ClockState = {
          ...prev,
          [activeClock]: nextValue,
        };
        if (nextValue === 0) {
          handleTimeExpired(activeClock === 'w' ? 'b' : 'w');
        }
        return updated;
      });
    }, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, [clockRunning, activeClock]);

  const applyResult = (nextResult: MatchResult, announce = true, historyOverride?: MoveLogEntry[]) => {
    setResult(nextResult);
    setClockRunning(false);
    if (nextResult.status !== 'in-progress' && !gamificationSummary) {
      handleGamification(nextResult, historyOverride ?? moveHistory);
    }
    if (announce) {
      if (nextResult.status === 'checkmate') {
        const winnerTeam = chessColorToTeam(nextResult.winner, homeTeam, awayTeam);
        toast.success(`♛ Xeque-mate! ${winnerTeam.name} vence.`);
      } else if (nextResult.status === 'draw') {
        toast(`🤝 Empate (${nextResult.reason})`);
      } else if (nextResult.status === 'resignation') {
        const winnerTeam = chessColorToTeam(nextResult.winner, homeTeam, awayTeam);
        toast.success(`🏳️ Abandono. ${winnerTeam.name} vence.`);
      } else if (nextResult.status === 'time') {
        const winnerTeam = chessColorToTeam(nextResult.winner, homeTeam, awayTeam);
        toast.success(`⏱️ Tempo esgotado! Vitória de ${winnerTeam.name}.`);
      }
    }
  };

  const handleTimeExpired = (winner: 'w' | 'b') => {
    applyResult({ status: 'time', winner }, true, moveHistory);
  };

  const persistState = async (state: SavedChessState, options: { silent?: boolean } = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setIsSaving(true);
    }
    try {
      const payload = {
        type: 'chess-state',
        data: state,
        updatedAt: new Date().toISOString(),
      };

      try {
        await api.post(`/games/${game.id}/state`, payload);
      } catch (apiError) {
        console.warn('⚠️ Falha ao persistir no backend, salvando localmente:', apiError);
      }

      localStorage.setItem(`${STORAGE_PREFIX}${game.id}`, JSON.stringify(payload));
      if (!silent) {
        toast.success('💾 Estado salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar estado do xadrez:', error);
      toast.error('Não foi possível salvar o estado.');
    } finally {
      if (!silent) {
        setIsSaving(false);
      }
    }
  };

  const buildStateSnapshot = (): SavedChessState => ({
    fen,
    history: moveHistory,
    comments: Object.entries(moveComments).map(([moveIndex, comment]) => ({ moveIndex: Number(moveIndex), comment })),
    clocks,
    increment: clockSettings.increment,
    turn: activeChess.turn(),
    orientation,
    result,
  });

  const loadPersistedState = async () => {
    try {
      const localState = localStorage.getItem(`${STORAGE_PREFIX}${game.id}`);
      if (localState) {
        const parsed = JSON.parse(localState) as { data: SavedChessState };
        restoreState(parsed.data, false);
        return;
      }

      try {
        const response = await api.get(`/games/${game.id}/state`);
        const stateData = response?.data?.data as SavedChessState | undefined;
        if (stateData) {
          restoreState(stateData, false);
          return;
        }
      } catch (apiError) {
        console.info('Sem estado salvo no backend:', apiError);
      }

      // Fallback: se partida já trouxer metadata com FEN
      const metadata = (game as any)?.metadata;
      if (metadata?.fen) {
        restoreState({
          fen: metadata.fen,
          history: metadata.history ?? [],
          comments: metadata.comments ?? [],
          clocks: metadata.clocks ?? { ...DEFAULT_CLOCK },
          increment: metadata.increment ?? 0,
          turn: metadata.turn ?? 'w',
          orientation: metadata.orientation ?? 'white',
          result: metadata.result ?? { status: 'in-progress' },
        }, false);
      }
    } finally {
      setIsLoadingState(false);
    }
  };

  useEffect(() => {
    loadPersistedState().catch(error => {
      console.error('Erro ao carregar estado de xadrez:', error);
      setIsLoadingState(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAfterMove = (moveData: Move, clocksBeforeMove: ClockState) => {
    const { san, captured, check, checkmate } = getMoveAnnotation(moveData);
    const moveNumber = moveHistory.length + 1;
    const updatedHistory: MoveLogEntry[] = [
      ...moveHistory,
      {
        moveNumber,
        san,
        color: moveData.color,
        fen: activeChess.fen(),
        from: moveData.from,
        to: moveData.to,
        captured,
        check,
        checkmate,
        clocksBefore: clocksBeforeMove,
        clocksAfter: clockRef.current,
        timestamp: Date.now(),
      },
    ];
    setMoveHistory(updatedHistory);
    setFen(activeChess.fen());
    setLastMoveSquares([moveData.from as Square, moveData.to as Square]);
    setRedoStack([]);

    if (activeChess.isCheckmate()) {
      applyResult({ status: 'checkmate', winner: moveData.color === 'w' ? 'w' : 'b' }, true, updatedHistory);
      return;
    }

    if (activeChess.isDraw()) {
      const reason = activeChess.isStalemate()
        ? 'afogamento'
        : activeChess.isInsufficientMaterial()
          ? 'material insuficiente'
          : activeChess.isThreefoldRepetition()
            ? 'repetição tripla'
            : '50 lances';
      applyResult({ status: 'draw', reason }, true, updatedHistory);
      return;
    }

    if (activeChess.isCheck()) {
      const attacker = chessColorToTeam(activeChess.turn() === 'w' ? 'b' : 'w', homeTeam, awayTeam);
      toast(`⚠️ Xeque em ${attacker.name}!`);
    }

    lastTickRef.current = Date.now();
  };

  const handleMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (result.status !== 'in-progress') {
      toast.error('A partida já foi concluída.');
      return false;
    }

    const moveStartedAt = lastTickRef.current ?? Date.now();
    const clocksBeforeMove = { ...clockRef.current };
    const activeColor = activeChess.turn();

    const options: Parameters<Chess['move']>[0] = promotion
      ? { from, to, promotion }
      : { from, to };

    const moveData = activeChess.move(options);
    if (!moveData) {
      toast.error('Movimento inválido.');
      return false;
    }

    const elapsed = Math.floor((Date.now() - moveStartedAt) / 1000);
    const currentClocks = clockRef.current;
    const updatedClockValue = Math.max(0, currentClocks[activeColor] - elapsed + clockSettings.increment);
    const updatedClocks: ClockState = {
      ...currentClocks,
      [activeColor]: updatedClockValue,
    };
    setClocks(updatedClocks);
    clockRef.current = updatedClocks;

    const nextTurn = activeChess.turn();
    setActiveClock(nextTurn);

    updateAfterMove(moveData, clocksBeforeMove);
    return true;
  };

  const handleBoardMove = (sourceSquare: Square, targetSquare: Square) => {
    const piece = activeChess.get(sourceSquare);
    if (!piece) {
      return;
    }

    const isPromotionMove =
      piece.type === 'p' &&
      ((piece.color === 'w' && targetSquare.endsWith('8')) || (piece.color === 'b' && targetSquare.endsWith('1')));

    if (isPromotionMove) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare, color: piece.color });
      return;
    }

    const success = handleMove(sourceSquare, targetSquare);
    if (!success) {
      setFen(activeChess.fen());
    }
  };

  const finalizePromotion = (piece: PieceSymbol) => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    const success = handleMove(from, to, piece);
    if (!success) {
      setFen(activeChess.fen());
    }
    setPendingPromotion(null);
  };

  const handleManualMove = () => {
    const trimmed = manualMove.trim();
    if (!trimmed) return;

    try {
      const lower = trimmed.toLowerCase();
      let move: Move | null = null;

      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(lower)) {
        const from = lower.slice(0, 2) as Square;
        const to = lower.slice(2, 4) as Square;
        const promotionChar = lower[4];
        move = activeChess.move({
          from,
          to,
          promotion: promotionChar ? (promotionChar as PieceSymbol) : undefined,
        });
      } else {
        move = activeChess.move(trimmed);
      }

      if (!move) {
        toast.error('Movimento inválido.');
        return;
      }

      const clocksBeforeMove = { ...clockRef.current };
      const moverColor = move.color;
      const updatedClocks: ClockState = {
        ...clockRef.current,
        [moverColor]: Math.max(0, clockRef.current[moverColor] + clockSettings.increment),
      };
      setClocks(updatedClocks);
      clockRef.current = updatedClocks;
      setActiveClock(activeChess.turn());

      updateAfterMove(move, clocksBeforeMove);
      setManualMove('');
    } catch (error) {
      console.error('Erro ao processar movimento manual:', error);
      toast.error('Não foi possível interpretar o movimento. Use notação SAN ou coordenadas (ex: e2e4).');
    }
  };

  const handleUndo = () => {
    const undone = activeChess.undo();
    if (!undone) {
      toast.error('Nenhum movimento para desfazer.');
      return;
    }

    const previousHistory = [...moveHistory];
    const removed = previousHistory.pop();
    setMoveHistory(previousHistory);
    setFen(activeChess.fen());
    const lastEntry = previousHistory.at(-1);
    setLastMoveSquares(lastEntry ? [lastEntry.from, lastEntry.to] : null);
    setActiveClock(activeChess.turn());
    setResult({ status: 'in-progress' });
    setRedoStack(prev => [undone.san, ...prev]);

    if (removed) {
      setClocks(removed.clocksBefore);
      clockRef.current = removed.clocksBefore;
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      toast.error('Nenhum movimento para refazer.');
      return;
    }
    const [nextSan, ...rest] = redoStack;
    const move = activeChess.move(nextSan);
    if (!move) {
      toast.error('Não foi possível refazer o movimento.');
      return;
    }
    const clocksBeforeMove = { ...clockRef.current };
    const activeColor = move.color;
    const updatedClocks: ClockState = {
      ...clockRef.current,
      [activeColor]: Math.max(0, clockRef.current[activeColor] + clockSettings.increment),
    };
    setClocks(updatedClocks);
    clockRef.current = updatedClocks;
    setActiveClock(activeChess.turn());
    updateAfterMove(move, clocksBeforeMove);
    setRedoStack(rest);
  };

  const handleStartMatch = () => {
    setClockRunning(true);
    setActiveClock('w');
    lastTickRef.current = Date.now();
    toast.success('♞ Partida iniciada.');
  };

  const handlePauseClocks = () => {
    setClockRunning(false);
    toast('⏸️ Relógios pausados');
  };

  const handleResumeClocks = () => {
    if (result.status !== 'in-progress') {
      toast.error('A partida já foi concluída.');
      return;
    }
    setClockRunning(true);
    lastTickRef.current = Date.now();
    toast.success('▶️ Relógios retomados');
  };

  const handleResetBoard = () => {
    chessRef.current = new Chess();
    setFen(chessRef.current.fen());
    setLastMoveSquares(null);
    setPendingPromotion(null);
    setMoveHistory([]);
    setMoveComments({});
    setClocks({ w: clockSettings.w, b: clockSettings.b });
    clockRef.current = { w: clockSettings.w, b: clockSettings.b };
    setActiveClock('w');
    setClockRunning(false);
    setResult({ status: 'in-progress' });
    setRedoStack([]);
    setGamificationSummary(null);
    toast.success('Tabuleiro reiniciado.');
  };

  const handleProposeDraw = () => {
    toast('🤝 Empate proposto ao adversário.');
  };

  const handleRegisterDraw = (reason: string) => {
    applyResult({ status: 'draw', reason }, true, moveHistory);
  };

  const handleResignation = (winner: 'w' | 'b') => {
    applyResult({ status: 'resignation', winner }, true, moveHistory);
  };

  const handleSaveState = () => {
    void persistState(buildStateSnapshot());
  };

  const computeOutcome = (): {
    homeScore: number;
    awayScore: number;
    winnerId: string | null;
    winnerName: string | null;
  } | null => {
    if (result.status === 'in-progress') {
      return null;
    }

    if (result.status === 'draw') {
      return {
        homeScore: 0,
        awayScore: 0,
        winnerId: null as string | null,
        winnerName: null as string | null,
      };
    }

    const winnerTeam = chessColorToTeam(result.winner, homeTeam, awayTeam);
    const winnerId = result.winner === 'w' ? (homeTeam.id ?? game.homeTeamId) : (awayTeam.id ?? game.awayTeamId);
    return {
      homeScore: result.winner === 'w' ? 1 : 0,
      awayScore: result.winner === 'b' ? 1 : 0,
      winnerId: winnerId ?? null,
      winnerName: winnerTeam.name,
    };
  };

  const finalizeMatch = async () => {
    const outcome = computeOutcome();
    if (!outcome) {
      toast.error('Defina um resultado antes de finalizar a partida.');
      return;
    }

    setIsFinalizing(true);
    try {
      await api.put(`/games/${game.id}`, {
        championshipId: game.championshipId,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        status: 'finalizado',
        homeScore: outcome.homeScore,
        awayScore: outcome.awayScore,
        endTime: new Date().toISOString(),
      });

      toast.success('Resultado do xadrez salvo com sucesso!');

      await persistState(buildStateSnapshot(), { silent: true });

      let redirectDelay = 1600;
      if (outcome.winnerId && outcome.winnerName && game.round) {
        try {
          const response = await api.post(`/games/${game.id}/advance-winner`, {
            winnerId: outcome.winnerId,
          });
          const data = response?.data ?? response;

          if (data?.isChampion) {
            toast.success(`🏆 ${outcome.winnerName} é o CAMPEÃO!`, { duration: 5000 });
            redirectDelay = 3200;
          } else if (data && data.success !== false) {
            toast.success(`✨ ${outcome.winnerName} avançou para a próxima fase!`, { duration: 4000 });
          }
        } catch (advanceError) {
          console.error('Erro ao avançar vencedor no xadrez:', advanceError);
          toast.error('Resultado salvo, mas não foi possível avançar o vencedor automaticamente.');
        }
      }

      setTimeout(() => {
        onBack();
      }, redirectDelay);
    } catch (error) {
      console.error('Erro ao registrar resultado do xadrez:', error);
      toast.error('Não foi possível salvar o resultado da partida.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const restoreState = (state: SavedChessState, showToast = true) => {
    chessRef.current = new Chess(state.fen);
    setFen(state.fen);
  setPendingPromotion(null);
    setMoveHistory(state.history ?? []);
    setMoveComments(
      (state.comments ?? []).reduce<Record<number, string>>((acc, item) => {
        acc[item.moveIndex] = item.comment;
        return acc;
      }, {})
    );
    setClocks(state.clocks ?? { ...DEFAULT_CLOCK });
    clockRef.current = state.clocks ?? { ...DEFAULT_CLOCK };
    setActiveClock(state.turn ?? 'w');
    setOrientation(state.orientation ?? 'white');
    const restoredResult = state.result ?? { status: 'in-progress' };
    setResult(restoredResult);
    setGamificationSummary(null);
    if (restoredResult.status !== 'in-progress') {
      handleGamification(restoredResult, state.history ?? []);
    }
    const lastEntry = state.history?.at(-1);
    setLastMoveSquares(lastEntry ? [lastEntry.from, lastEntry.to] : null);
    setRedoStack([]);
    if (showToast) {
      toast.success('Estado restaurado com sucesso.');
    }
  };

  const addCommentToMove = (moveNumber: number, comment: string) => {
    setMoveComments(prev => ({
      ...prev,
      [moveNumber]: comment,
    }));
  };

  const historyPairs = useMemo(() => {
    const pairs: Array<{ index: number; white?: MoveLogEntry; black?: MoveLogEntry }> = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        index: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1],
      });
    }
    return pairs;
  }, [moveHistory]);

  if (isLoadingState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-teal-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg font-semibold">Carregando estado da partida...</p>
        </div>
      </div>
    );
  }

  const chessboard = (
    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-white">
          <SparklesIcon className="h-6 w-6" />
          <h2 className="text-lg font-semibold">Tabuleiro</h2>
        </div>
        <button
          type="button"
          onClick={() => setOrientation(prev => (prev === 'white' ? 'black' : 'white'))}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition"
        >
          <ArrowsRightLeftIcon className="h-4 w-4" />
          Girar tabuleiro
        </button>
      </div>
      <CustomChessboard
        game={activeChess}
        onMove={handleBoardMove}
        orientation={orientation}
        lastMoveSquares={lastMoveSquares}
        disabled={result.status !== 'in-progress'}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-12">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Voltar
          </button>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-teal-300/80 mb-1">Match Editor</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              ♞ {homeTeam.name} vs {awayTeam.name}
            </h1>
            <p className="text-sm text-white/50">Controle completo da partida de xadrez com atualização em tempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={finalizeMatch}
              disabled={result.status === 'in-progress' || isFinalizing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FlagIcon className="h-5 w-5" />
              {isFinalizing ? 'Finalizando...' : 'Finalizar partida'}
            </button>
            <button
              type="button"
              onClick={handleSaveState}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold shadow-lg shadow-sky-500/30 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SparklesIcon className="h-5 w-5" />
              {isSaving ? 'Salvando...' : 'Salvar estado'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6 text-white">
        {/* Scoreboard */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm md:col-span-2">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Brancas</p>
                <h2 className="text-xl font-semibold">{homeTeam.name}</h2>
                <p className="text-white/50 text-sm">{homeTeam.players?.length ?? 0} jogadores cadastrados</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-teal-300 tracking-tight">
                  {formatClock(clocks.w)}
                </div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60 mt-1">Brancas</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Status</p>
              <h2 className="text-3xl font-bold">
                {result.status === 'in-progress'
                  ? clockRunning
                    ? 'Em andamento'
                    : 'Pausado'
                  : result.status === 'checkmate'
                    ? 'Xeque-mate'
                    : result.status === 'draw'
                      ? 'Empate'
                      : result.status === 'time'
                        ? 'Tempo esgotado'
                        : 'Abandono'}
              </h2>
              <p className="text-sm text-white/60">
                Turno das {activeChess.turn() === 'w' ? 'brancas' : 'pretas'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm md:col-span-2">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center order-2 md:order-1">
                <div className="text-5xl font-black text-indigo-300 tracking-tight">
                  {formatClock(clocks.b)}
                </div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60 mt-1">Pretas</p>
              </div>
              <div className="flex-1 order-1 md:order-2 text-right">
                <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Pretas</p>
                <h2 className="text-xl font-semibold">{awayTeam.name}</h2>
                <p className="text-white/50 text-sm">{awayTeam.players?.length ?? 0} jogadores cadastrados</p>
              </div>
            </div>
          </div>
        </section>

        {gamificationSummary && (
          <section className="rounded-3xl border border-teal-400/30 bg-teal-500/5 px-6 py-6 shadow-xl shadow-teal-500/10">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-teal-200/70">Gamificação</p>
                <h2 className="text-xl font-semibold text-teal-100">Resumo da partida</h2>
              </div>
              <div className="text-sm text-teal-200/80">
                {gamificationSummary.match.resultLabel}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {(['white', 'black'] as const).map((sideKey) => {
                const side = gamificationSummary.sides[sideKey];
                const isWhite = sideKey === 'white';
                const label = isWhite ? 'Brancas' : 'Pretas';

                return (
                  <div
                    key={sideKey}
                    className="rounded-2xl border border-teal-400/30 bg-slate-900/40 px-5 py-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-teal-200/60">{label}</p>
                        <h3 className="text-lg font-semibold text-white">{side.playerName}</h3>
                        <p className="text-sm text-teal-200/70">{side.teamName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-teal-300">+{side.totalXp}</p>
                        <p className="text-xs uppercase tracking-[0.35em] text-teal-100/70">XP total</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {side.bonuses.map((bonus) => (
                        <div
                          key={bonus.label}
                          className="flex items-center justify-between text-sm text-teal-100/80"
                        >
                          <span>{bonus.label}</span>
                          <span className="font-semibold text-teal-300">+{bonus.xp}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-teal-200/60 mb-2">Conquistas</p>
                      {side.achievementsUnlocked.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {side.achievementsUnlocked.map((achievement) => (
                            <span
                              key={achievement.id}
                              className="inline-flex items-center gap-2 rounded-full border border-teal-400/50 bg-teal-500/20 px-3 py-1 text-sm text-teal-100"
                            >
                              {achievement.name}
                              <span className="text-xs font-semibold text-teal-200/80">+{achievement.xp} XP</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-teal-200/60">Nenhuma conquista nova nesta partida.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-teal-200/70">
              <span>
                Movimentos: {gamificationSummary.match.totalMoves} ({gamificationSummary.match.totalPlys} lances)
              </span>
              {gamificationSummary.match.durationSeconds !== null && (
                <span>
                  Duração aproximada: {formatMatchDuration(gamificationSummary.match.durationSeconds)}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Main layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {chessboard}

            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-4">
                {clockRunning ? (
                  <button
                    type="button"
                    onClick={handlePauseClocks}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/30 transition"
                  >
                    <PauseIcon className="h-5 w-5" /> Pausar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={moveHistory.length === 0 ? handleStartMatch : handleResumeClocks}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/30 transition"
                  >
                    <PlayIcon className="h-5 w-5" /> {moveHistory.length === 0 ? 'Iniciar partida' : 'Retomar'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 transition"
                >
                  ↶ Desfazer
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 transition"
                >
                  ↷ Refazer
                </button>
                <button
                  type="button"
                  onClick={handleResetBoard}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400/50 bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-100 hover:bg-rose-500/30 transition"
                >
                  <ArrowPathIcon className="h-5 w-5" /> Reiniciar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="text-white/60">Tempo inicial (minutos)</span>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white"
                    value={clockSettings.w / 60}
                    onChange={event => {
                      const minutes = Number(event.target.value) || 1;
                      const seconds = minutes * 60;
                      setClockSettings(prev => ({ ...prev, w: seconds, b: seconds }));
                      if (moveHistory.length === 0) {
                        setClocks({ w: seconds, b: seconds });
                        clockRef.current = { w: seconds, b: seconds };
                      }
                    }}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-white/60">Incremento (segundos)</span>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white"
                    value={clockSettings.increment}
                    onChange={event => {
                      setClockSettings(prev => ({ ...prev, increment: Number(event.target.value) || 0 }));
                    }}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-white/60">Entrada manual (SAN ou coordenadas)</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualMove}
                      onChange={event => setManualMove(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          handleManualMove();
                        }
                      }}
                      placeholder="Ex: e2e4 ou Nf3"
                      className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      onClick={handleManualMove}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 transition"
                    >
                      Aplicar
                    </button>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-indigo-300" />
                  Histórico de lances
                </h2>
                <button
                  type="button"
                  onClick={() => setNotesVisible(prev => !prev)}
                  className="text-xs uppercase tracking-[0.3em] text-white/50 hover:text-white/80 transition"
                >
                  {notesVisible ? 'Ocultar notas' : 'Mostrar notas'}
                </button>
              </div>

              <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-2">
                {historyPairs.length === 0 ? (
                  <p className="text-sm text-white/50">Nenhum lance registrado ainda.</p>
                ) : (
                  historyPairs.map(pair => (
                    <div
                      key={pair.index}
                      className="grid grid-cols-[60px,1fr,1fr] gap-3 items-start rounded-xl bg-white/5 px-3 py-2"
                    >
                      <div className="text-xs text-white/40 mt-1">{pair.index}.</div>
                      {[pair.white, pair.black].map((entry, entryIndex) => (
                        <div key={entryIndex} className="space-y-1">
                          {entry ? (
                            <div>
                              <div className="flex items-center gap-2 text-sm">
                                <span>
                                  {entry.san}
                                  {entry.checkmate ? ' #️⃣' : entry.check ? ' +' : ''}
                                </span>
                                {entry.captured && (
                                  <span className="text-xs text-rose-200 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                    captura
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/40">
                                ⏱️ {formatClock(entry.clocksAfter[entry.color])}
                              </p>
                              {notesVisible && (
                                <textarea
                                  className="w-full mt-1 rounded-lg bg-slate-900/50 border border-white/10 px-2 py-1 text-xs text-white"
                                  placeholder="Adicionar comentário"
                                  value={moveComments[entry.moveNumber] ?? ''}
                                  onChange={event => addCommentToMove(entry.moveNumber, event.target.value)}
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-white/30 italic">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-3">Ações rápidas</h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleRegisterDraw('acordo mútuo')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 transition"
                >
                  🤝 Registrar empate
                </button>
                <button
                  type="button"
                  onClick={handleProposeDraw}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 transition"
                >
                  📨 Propor empate
                </button>
                <button
                  type="button"
                  onClick={() => handleResignation(activeChess.turn() === 'w' ? 'b' : 'w')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20 transition"
                >
                  <FlagIcon className="h-4 w-4" /> Marcar abandono
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-3">Resultado</h2>
              <div className="space-y-2 text-sm text-white/60">
                {result.status === 'in-progress' ? (
                  <p>Sem resultado definido. A partida segue em andamento.</p>
                ) : result.status === 'draw' ? (
                  <p>Empate registrado: {result.reason}.</p>
                ) : (
                  <p>
                    Vencedor: {chessColorToTeam(result.winner, homeTeam, awayTeam).name}
                    {result.status === 'checkmate' && ' por xeque-mate.'}
                    {result.status === 'resignation' && ' por abandono.'}
                    {result.status === 'time' && ' por tempo.'}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-3">Dicas de acessibilidade</h2>
              <ul className="text-xs text-white/50 space-y-2">
                <li>• Use a entrada manual para digitar lances (ex.: "e2e4", "Nf3").</li>
                <li>• Passe o mouse sobre as casas para ouvir a descrição com leitores de tela.</li>
                <li>• Utilize TAB para navegar entre controles e ENTER para confirmar.</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>

      {pendingPromotion && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <h2 className="text-xl font-semibold text-center">Escolha a peça para promoção</h2>
            <p className="text-sm text-white/60 text-center">
              Peão {pendingPromotion.color === 'w' ? 'branco' : 'preto'} alcançou a última fileira. Selecione a peça desejada.
            </p>
            <div className="grid grid-cols-4 gap-3">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(piece => (
                <button
                  key={piece}
                  type="button"
                  onClick={() => finalizePromotion(piece)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 hover:bg-white/10 transition"
                >
                  <span className="text-3xl">
                    {piece === 'q' && '♕'}
                    {piece === 'r' && '♖'}
                    {piece === 'b' && '♗'}
                    {piece === 'n' && '♘'}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-white/50">
                    {piece === 'q' && 'Rainha'}
                    {piece === 'r' && 'Torre'}
                    {piece === 'b' && 'Bispo'}
                    {piece === 'n' && 'Cavalo'}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPendingPromotion(null)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-white/60 hover:bg-white/10 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
