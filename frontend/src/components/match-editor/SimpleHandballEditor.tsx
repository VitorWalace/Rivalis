import { useState, useEffect } from 'react';
import { Clock, Undo, Pause, Play, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HandballEditorProps {
  homeTeam: string;
  awayTeam: string;
  onFinish: (data: MatchData) => void;
}

interface Exclusion {
  id: string;
  team: 'home' | 'away';
  startTime: number;
  endTime: number;
}

interface MatchEvent {
  id: string;
  time: number;
  type: 'goal' | 'penalty' | 'yellow' | 'exclusion' | 'red';
  team: 'home' | 'away';
  timestamp: string;
}

interface MatchData {
  homeScore: number;
  awayScore: number;
  homeYellows: number;
  awayYellows: number;
  homeReds: number;
  awayReds: number;
  events: MatchEvent[];
  duration: number;
  period: 1 | 2;
}

export function SimpleHandballEditor({ homeTeam, awayTeam, onFinish }: HandballEditorProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeYellows, setHomeYellows] = useState(0);
  const [awayYellows, setAwayYellows] = useState(0);
  const [homeReds, setHomeReds] = useState(0);
  const [awayReds, setAwayReds] = useState(0);
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [period, setPeriod] = useState<1 | 2>(1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          
          // Verificar exclusões que terminaram
          setExclusions((prevExclusions) => {
            const updatedExclusions = prevExclusions.filter((exc) => {
              if (newTime >= exc.endTime) {
                toast.success(
                  `⏱️ Jogador de ${exc.team === 'home' ? homeTeam : awayTeam} voltou!`,
                  { icon: '✅' }
                );
                return false;
              }
              return true;
            });
            return updatedExclusions;
          });
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, homeTeam, awayTeam]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addEvent = (type: 'goal' | 'penalty' | 'yellow' | 'exclusion' | 'red', team: 'home' | 'away') => {
    const event: MatchEvent = {
      id: crypto.randomUUID(),
      time,
      type,
      team,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => [...prev, event]);

    if (type === 'goal' || type === 'penalty') {
      if (team === 'home') {
        setHomeScore((prev) => prev + 1);
        toast.success(`🥅 Gol do ${homeTeam}!`);
      } else {
        setAwayScore((prev) => prev + 1);
        toast.success(`🥅 Gol do ${awayTeam}!`);
      }
    } else if (type === 'yellow') {
      if (team === 'home') {
        setHomeYellows((prev) => prev + 1);
        toast.error(`🟨 Cartão amarelo para ${homeTeam}`);
      } else {
        setAwayYellows((prev) => prev + 1);
        toast.error(`🟨 Cartão amarelo para ${awayTeam}`);
      }
    } else if (type === 'exclusion') {
      const exclusion: Exclusion = {
        id: crypto.randomUUID(),
        team,
        startTime: time,
        endTime: time + 120, // 2 minutos = 120 segundos
      };
      setExclusions((prev) => [...prev, exclusion]);
      toast.error(`⏱️ Exclusão de 2 minutos para ${team === 'home' ? homeTeam : awayTeam}`);
    } else if (type === 'red') {
      if (team === 'home') {
        setHomeReds((prev) => prev + 1);
        toast.error(`🟥 Cartão vermelho para ${homeTeam}`);
      } else {
        setAwayReds((prev) => prev + 1);
        toast.error(`🟥 Cartão vermelho para ${awayTeam}`);
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

    if (lastEvent.type === 'goal' || lastEvent.type === 'penalty') {
      if (lastEvent.team === 'home') {
        setHomeScore((prev) => Math.max(0, prev - 1));
      } else {
        setAwayScore((prev) => Math.max(0, prev - 1));
      }
    } else if (lastEvent.type === 'yellow') {
      if (lastEvent.team === 'home') {
        setHomeYellows((prev) => Math.max(0, prev - 1));
      } else {
        setAwayYellows((prev) => Math.max(0, prev - 1));
      }
    } else if (lastEvent.type === 'exclusion') {
      // Remover a exclusão mais recente
      setExclusions((prev) => prev.slice(0, -1));
    } else if (lastEvent.type === 'red') {
      if (lastEvent.team === 'home') {
        setHomeReds((prev) => Math.max(0, prev - 1));
      } else {
        setAwayReds((prev) => Math.max(0, prev - 1));
      }
    }

    toast.success('Último evento desfeito');
  };

  const handleFinish = () => {
    const data: MatchData = {
      homeScore,
      awayScore,
      homeYellows,
      awayYellows,
      homeReds,
      awayReds,
      events,
      duration: time,
      period,
    };

    onFinish(data);
    toast.success('Partida finalizada!');
  };

  const activeExclusions = exclusions.filter((exc) => time < exc.endTime);
  const homeExclusions = activeExclusions.filter((exc) => exc.team === 'home');
  const awayExclusions = activeExclusions.filter((exc) => exc.team === 'away');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Placar */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              <span className="text-3xl font-bold text-slate-900">
                {formatTime(time)}
              </span>
              <span className="text-lg text-slate-600">
                [{period}º Tempo]
              </span>
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
              <div className="text-7xl font-bold text-blue-600">
                {homeScore}
              </div>
              {homeExclusions.length > 0 && (
                <div className="text-sm text-red-600 font-semibold mt-2">
                  ⚠️ {homeExclusions.length} excluído(s)
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-slate-400">×</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-slate-700 mb-2">
                {awayTeam}
              </div>
              <div className="text-7xl font-bold text-red-600">
                {awayScore}
              </div>
              {awayExclusions.length > 0 && (
                <div className="text-sm text-red-600 font-semibold mt-2">
                  ⚠️ {awayExclusions.length} excluído(s)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Marcar Gol */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            🥅 MARCAR GOL
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => addEvent('goal', 'home')}
              className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
            >
              Gol {homeTeam}
            </button>
            <button
              onClick={() => addEvent('goal', 'away')}
              className="h-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all"
            >
              Gol {awayTeam}
            </button>
          </div>
        </div>

        {/* 7 Metros */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            🎯 GOL DE 7 METROS
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => addEvent('penalty', 'home')}
              className="h-16 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              7m {homeTeam}
            </button>
            <button
              onClick={() => addEvent('penalty', 'away')}
              className="h-16 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              7m {awayTeam}
            </button>
          </div>
        </div>

        {/* Cartões e Exclusões */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            📋 CARTÕES E EXCLUSÕES
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => addEvent('yellow', 'home')}
                className="h-14 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                🟨 Amarelo {homeTeam}
              </button>
              <button
                onClick={() => addEvent('yellow', 'away')}
                className="h-14 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                🟨 Amarelo {awayTeam}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => addEvent('exclusion', 'home')}
                className="h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                ⏱️ Exclusão 2min {homeTeam}
              </button>
              <button
                onClick={() => addEvent('exclusion', 'away')}
                className="h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                ⏱️ Exclusão 2min {awayTeam}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => addEvent('red', 'home')}
                className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                🟥 Vermelho {homeTeam}
              </button>
              <button
                onClick={() => addEvent('red', 'away')}
                className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                🟥 Vermelho {awayTeam}
              </button>
            </div>
          </div>
        </div>

        {/* Jogadores em Exclusão */}
        {activeExclusions.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">
              ⚠️ Jogadores em Exclusão
            </h3>
            <div className="space-y-2">
              {activeExclusions.map((exc) => {
                const remaining = exc.endTime - time;
                return (
                  <div
                    key={exc.id}
                    className="bg-white p-3 rounded-lg flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-700">
                      {exc.team === 'home' ? homeTeam : awayTeam}
                    </span>
                    <span className="text-red-600 font-bold">
                      Volta em: {formatTime(remaining)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">📊 Resumo</h3>
          <div className="space-y-2 text-slate-700">
            <div>
              <strong>{homeTeam}:</strong> {homeScore} gols
              {homeYellows > 0 && `, ${homeYellows} amarelo(s)`}
              {homeReds > 0 && `, ${homeReds} vermelho(s)`}
            </div>
            <div>
              <strong>{awayTeam}:</strong> {awayScore} gols
              {awayYellows > 0 && `, ${awayYellows} amarelo(s)`}
              {awayReds > 0 && `, ${awayReds} vermelho(s)`}
            </div>
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
            onClick={() => setPeriod(period === 1 ? 2 : 1)}
            className="flex-1 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {period === 1 ? '2º Tempo' : '1º Tempo'}
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
