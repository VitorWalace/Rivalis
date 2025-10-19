import { useState } from 'react';
import { Undo, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TableTennisEditorProps {
  homePlayer: string;
  awayPlayer: string;
  onFinish: (data: MatchData) => void;
}

interface GameScore {
  home: number;
  away: number;
  winner: 'home' | 'away' | null;
}

interface MatchEvent {
  id: string;
  type: 'point';
  player: 'home' | 'away';
  game: number;
  timestamp: string;
}

interface MatchData {
  homeGames: number;
  awayGames: number;
  games: GameScore[];
  events: MatchEvent[];
}

export function SimpleTableTennisEditor({ homePlayer, awayPlayer, onFinish }: TableTennisEditorProps) {
  const [homeGames, setHomeGames] = useState(0);
  const [awayGames, setAwayGames] = useState(0);
  const [currentGame, setCurrentGame] = useState(1);
  const [games, setGames] = useState<GameScore[]>([
    { home: 0, away: 0, winner: null },
  ]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [servingPlayer, setServingPlayer] = useState<'home' | 'away'>('home');

  const getCurrentGame = () => games[currentGame - 1];

  const addPoint = (player: 'home' | 'away') => {
    const event: MatchEvent = {
      id: crypto.randomUUID(),
      type: 'point',
      player,
      game: currentGame,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => [...prev, event]);

    const updatedGames = [...games];
    const game = updatedGames[currentGame - 1];

    if (player === 'home') {
      game.home += 1;
    } else {
      game.away += 1;
    }

    setGames(updatedGames);
    setTotalPoints((prev) => prev + 1);

    // Alternar saque a cada 2 pontos (ou 1 ponto se estiver 10-10 ou mais)
    const newTotal = totalPoints + 1;
    const isDeuce = game.home >= 10 && game.away >= 10;
    const shouldChangeServe = isDeuce ? newTotal % 1 === 0 : newTotal % 2 === 0;

    if (shouldChangeServe) {
      setServingPlayer((prev) => (prev === 'home' ? 'away' : 'home'));
    }

    // Verificar se o game foi vencido
    const minPoints = 11;
    const minAdvantage = 2;

    if (game.home >= minPoints || game.away >= minPoints) {
      const diff = Math.abs(game.home - game.away);
      if (diff >= minAdvantage) {
        const winner = game.home > game.away ? 'home' : 'away';
        game.winner = winner;

        if (winner === 'home') {
          setHomeGames((prev) => prev + 1);
          toast.success(`🎉 ${homePlayer} venceu o ${currentGame}º game!`);
        } else {
          setAwayGames((prev) => prev + 1);
          toast.success(`🎉 ${awayPlayer} venceu o ${currentGame}º game!`);
        }

        // Verificar se a partida terminou (melhor de 5 ou 7 games)
        const newHomeGames = winner === 'home' ? homeGames + 1 : homeGames;
        const newAwayGames = winner === 'away' ? awayGames + 1 : awayGames;

        const maxGames = 4; // Melhor de 7 = primeiro a 4
        if (newHomeGames < maxGames && newAwayGames < maxGames) {
          // Continuar para próximo game
          setTimeout(() => {
            if (confirm(`Iniciar ${currentGame + 1}º game?`)) {
              setCurrentGame((prev) => prev + 1);
              setGames((prev) => [...prev, { home: 0, away: 0, winner: null }]);
              setTotalPoints(0);
              setServingPlayer('home'); // Alternar saque inicial
            }
          }, 1000);
        } else {
          toast.success(`🏆 ${newHomeGames > newAwayGames ? homePlayer : awayPlayer} venceu a partida!`);
        }
      }
    }
  };

  const undoLast = () => {
    if (events.length === 0) {
      toast.error('Nenhum evento para desfazer');
      return;
    }

    const lastEvent = events[events.length - 1];
    setEvents((prev) => prev.slice(0, -1));

    const updatedGames = [...games];
    const game = updatedGames[lastEvent.game - 1];

    if (lastEvent.player === 'home') {
      game.home = Math.max(0, game.home - 1);
    } else {
      game.away = Math.max(0, game.away - 1);
    }

    // Se o game estava finalizado, desfinalizar
    if (game.winner) {
      if (game.winner === 'home') {
        setHomeGames((prev) => Math.max(0, prev - 1));
      } else {
        setAwayGames((prev) => Math.max(0, prev - 1));
      }
      game.winner = null;
    }

    setGames(updatedGames);
    setTotalPoints((prev) => Math.max(0, prev - 1));

    toast.success('Último ponto desfeito');
  };

  const handleFinish = () => {
    const data: MatchData = {
      homeGames,
      awayGames,
      games,
      events,
    };

    onFinish(data);
    toast.success('Partida finalizada!');
  };

  const currentGameData = getCurrentGame();
  const isGameFinished = currentGameData.winner !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Placar de Games */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              🏓 Game {currentGame}
            </h2>
          </div>

          <div className="grid grid-cols-3 items-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-700 mb-2">
                {homePlayer}
              </div>
              <div className="text-6xl font-bold text-green-600">
                {homeGames}
              </div>
              <div className="text-sm text-slate-500 mt-1">games</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-slate-400">×</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-slate-700 mb-2">
                {awayPlayer}
              </div>
              <div className="text-6xl font-bold text-orange-600">
                {awayGames}
              </div>
              <div className="text-sm text-slate-500 mt-1">games</div>
            </div>
          </div>

          {/* Placar do Game Atual */}
          <div className="bg-gradient-to-r from-green-50 to-orange-50 rounded-xl p-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-700">
                  {currentGameData.home}
                </div>
                {servingPlayer === 'home' && (
                  <div className="text-green-600 text-2xl mt-1">●</div>
                )}
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-slate-400">Game Atual</div>
              </div>

              <div className="text-center">
                <div className="text-5xl font-bold text-orange-700">
                  {currentGameData.away}
                </div>
                {servingPlayer === 'away' && (
                  <div className="text-orange-600 text-2xl mt-1">●</div>
                )}
              </div>
            </div>

            <div className="text-center mt-3 text-sm text-slate-600">
              {servingPlayer === 'home' ? `Sacando: ${homePlayer}` : `Sacando: ${awayPlayer}`}
            </div>
          </div>
        </div>

        {/* Marcar Ponto */}
        {!isGameFinished && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              🏓 MARCAR PONTO
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => addPoint('home')}
                className="h-24 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-2xl shadow-lg hover:shadow-xl transition-all"
              >
                +1 {homePlayer}
              </button>
              <button
                onClick={() => addPoint('away')}
                className="h-24 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-2xl shadow-lg hover:shadow-xl transition-all"
              >
                +1 {awayPlayer}
              </button>
            </div>
          </div>
        )}

        {/* Game Finalizado */}
        {isGameFinished && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-green-900 mb-2 text-center">
              ✅ Game {currentGame} Finalizado
            </h3>
            <p className="text-center text-lg text-slate-700">
              Vencedor: <strong>{currentGameData.winner === 'home' ? homePlayer : awayPlayer}</strong>
            </p>
            <p className="text-center text-slate-600 mt-1">
              Placar: {currentGameData.home} × {currentGameData.away}
            </p>
          </div>
        )}

        {/* Histórico de Games */}
        {games.length > 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">📊 Histórico de Games</h3>
            <div className="grid gap-2">
              {games.map((game, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    index === currentGame - 1
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-slate-50'
                  }`}
                >
                  <span className="font-semibold text-slate-700">
                    Game {index + 1}
                  </span>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-lg font-bold ${
                        game.winner === 'home' ? 'text-green-600' : 'text-slate-600'
                      }`}
                    >
                      {game.home}
                    </span>
                    <span className="text-slate-400">×</span>
                    <span
                      className={`text-lg font-bold ${
                        game.winner === 'away' ? 'text-orange-600' : 'text-slate-600'
                      }`}
                    >
                      {game.away}
                    </span>
                  </div>
                  {game.winner && (
                    <span className="text-sm text-green-600 font-semibold">
                      ✓ {game.winner === 'home' ? homePlayer : awayPlayer}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-4">
          <button
            onClick={undoLast}
            className="flex-1 h-16 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Undo className="h-5 w-5" />
            Desfazer
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Flag className="h-5 w-5" />
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
