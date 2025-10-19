import { useState, useEffect } from 'react';
import { Clock, Undo, Pause, Play, Flag, SkipForward } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BasketballEditorProps {
  homeTeam: string;
  awayTeam: string;
  onFinish: (data: MatchData) => void;
}

interface MatchEvent {
  id: string;
  time: number;
  type: 'points' | 'foul';
  team: 'home' | 'away';
  points?: 1 | 2 | 3;
  quarter: number;
  timestamp: string;
}

interface MatchData {
  homeScore: number;
  awayScore: number;
  homeFouls: number;
  awayFouls: number;
  quarterScores: { home: number; away: number }[];
  events: MatchEvent[];
  duration: number;
  quarter: number;
}

export function SimpleBasketballEditor({ homeTeam, awayTeam, onFinish }: BasketballEditorProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeFouls, setHomeFouls] = useState(0);
  const [awayFouls, setAwayFouls] = useState(0);
  const [quarter, setQuarter] = useState(1);
  const [quarterScores, setQuarterScores] = useState([
    { home: 0, away: 0 },
    { home: 0, away: 0 },
    { home: 0, away: 0 },
    { home: 0, away: 0 },
  ]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addPoints = (team: 'home' | 'away', points: 1 | 2 | 3) => {
    const event: MatchEvent = {
      id: crypto.randomUUID(),
      time,
      type: 'points',
      team,
      points,
      quarter,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => [...prev, event]);

    if (team === 'home') {
      setHomeScore((prev) => prev + points);
      setQuarterScores((prev) => {
        const newScores = [...prev];
        newScores[quarter - 1].home += points;
        return newScores;
      });
      toast.success(`🏀 +${points} para ${homeTeam}!`);
    } else {
      setAwayScore((prev) => prev + points);
      setQuarterScores((prev) => {
        const newScores = [...prev];
        newScores[quarter - 1].away += points;
        return newScores;
      });
      toast.success(`🏀 +${points} para ${awayTeam}!`);
    }
  };

  const addFoul = (team: 'home' | 'away') => {
    const event: MatchEvent = {
      id: crypto.randomUUID(),
      time,
      type: 'foul',
      team,
      quarter,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => [...prev, event]);

    if (team === 'home') {
      setHomeFouls((prev) => prev + 1);
      toast.error(`🚨 Falta de ${homeTeam}`);
    } else {
      setAwayFouls((prev) => prev + 1);
      toast.error(`🚨 Falta de ${awayTeam}`);
    }
  };

  const undoLast = () => {
    if (events.length === 0) {
      toast.error('Nenhum evento para desfazer');
      return;
    }

    const lastEvent = events[events.length - 1];
    setEvents((prev) => prev.slice(0, -1));

    if (lastEvent.type === 'points' && lastEvent.points) {
      if (lastEvent.team === 'home') {
        setHomeScore((prev) => Math.max(0, prev - lastEvent.points!));
        setQuarterScores((prev) => {
          const newScores = [...prev];
          newScores[lastEvent.quarter - 1].home = Math.max(
            0,
            newScores[lastEvent.quarter - 1].home - lastEvent.points!
          );
          return newScores;
        });
      } else {
        setAwayScore((prev) => Math.max(0, prev - lastEvent.points!));
        setQuarterScores((prev) => {
          const newScores = [...prev];
          newScores[lastEvent.quarter - 1].away = Math.max(
            0,
            newScores[lastEvent.quarter - 1].away - lastEvent.points!
          );
          return newScores;
        });
      }
    } else if (lastEvent.type === 'foul') {
      if (lastEvent.team === 'home') {
        setHomeFouls((prev) => Math.max(0, prev - 1));
      } else {
        setAwayFouls((prev) => Math.max(0, prev - 1));
      }
    }

    toast.success('Último evento desfeito');
  };

  const nextQuarter = () => {
    if (quarter < 4) {
      setQuarter((prev) => prev + 1);
      setHomeFouls(0);
      setAwayFouls(0);
      toast.success(`${quarter + 1}º Quarto iniciado!`);
    } else {
      toast.error('Partida já está no último quarto');
    }
  };

  const handleFinish = () => {
    const data: MatchData = {
      homeScore,
      awayScore,
      homeFouls,
      awayFouls,
      quarterScores,
      events,
      duration: time,
      quarter,
    };

    onFinish(data);
    toast.success('Partida finalizada!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Placar */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-600" />
              <span className="text-3xl font-bold text-slate-900">
                {formatTime(time)}
              </span>
              <span className="text-lg text-slate-600">[{quarter}Q]</span>
            </div>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {isRunning ? (
                <Pause className="h-6 w-6 text-slate-700" />
              ) : (
                <Play className="h-6 w-6 text-slate-700" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-700 mb-2">
                {homeTeam}
              </div>
              <div className="text-7xl font-bold text-orange-600">
                {homeScore}
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-slate-400">×</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-slate-700 mb-2">
                {awayTeam}
              </div>
              <div className="text-7xl font-bold text-purple-600">
                {awayScore}
              </div>
            </div>
          </div>
        </div>

        {/* Marcar Pontos - Home */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            🏀 {homeTeam}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => addPoints('home', 1)}
              className="h-20 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
            >
              +1 Livre
            </button>
            <button
              onClick={() => addPoints('home', 2)}
              className="h-20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
            >
              +2 Cesta
            </button>
            <button
              onClick={() => addPoints('home', 3)}
              className="h-20 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
            >
              +3 Triplo
            </button>
          </div>
        </div>

        {/* Marcar Pontos - Away */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            🏀 {awayTeam}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => addPoints('away', 1)}
              className="h-20 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
            >
              +1 Livre
            </button>
            <button
              onClick={() => addPoints('away', 2)}
              className="h-20 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
            >
              +2 Cesta
            </button>
            <button
              onClick={() => addPoints('away', 3)}
              className="h-20 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
            >
              +3 Triplo
            </button>
          </div>
        </div>

        {/* Faltas */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">🚨 Faltas</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => addFoul('home')}
              className="h-16 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Falta {homeTeam} ({homeFouls})
            </button>
            <button
              onClick={() => addFoul('away')}
              className="h-16 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Falta {awayTeam} ({awayFouls})
            </button>
          </div>
        </div>

        {/* Placar por Quarto */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            📊 Placar por Quarto
          </h3>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="font-semibold text-slate-700"></div>
            <div className="font-semibold text-slate-700">1Q</div>
            <div className="font-semibold text-slate-700">2Q</div>
            <div className="font-semibold text-slate-700">3Q</div>
            <div className="font-semibold text-slate-700">4Q</div>

            <div className="font-semibold text-slate-700">{homeTeam}</div>
            {quarterScores.map((score, idx) => (
              <div key={`home-${idx}`} className="text-lg font-bold text-orange-600">
                {score.home || '--'}
              </div>
            ))}

            <div className="font-semibold text-slate-700">{awayTeam}</div>
            {quarterScores.map((score, idx) => (
              <div key={`away-${idx}`} className="text-lg font-bold text-purple-600">
                {score.away || '--'}
              </div>
            ))}
          </div>
        </div>

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
            onClick={nextQuarter}
            disabled={quarter >= 4}
            className="flex-1 h-16 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <SkipForward className="h-5 w-5" />
            Próximo Quarto
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
