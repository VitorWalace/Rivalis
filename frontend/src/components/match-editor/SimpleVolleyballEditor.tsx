import { useState } from 'react';
import { Undo, Flag, SkipForward } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VolleyballEditorProps {
  homeTeam: string;
  awayTeam: string;
  onFinish: (data: MatchData) => void;
}

interface SetScore {
  home: number;
  away: number;
  winner?: 'home' | 'away';
}

interface MatchEvent {
  id: string;
  type: 'point';
  team: 'home' | 'away';
  set: number;
  timestamp: string;
}

interface MatchData {
  homeSets: number;
  awaySets: number;
  sets: SetScore[];
  events: MatchEvent[];
  currentSet: number;
}

export function SimpleVolleyballEditor({ homeTeam, awayTeam, onFinish }: VolleyballEditorProps) {
  const [homeSets, setHomeSets] = useState(0);
  const [awaySets, setAwaySets] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [sets, setSets] = useState<SetScore[]>([
    { home: 0, away: 0 },
  ]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [servingTeam, setServingTeam] = useState<'home' | 'away'>('home');

  const currentSetData = sets[currentSet - 1];
  const maxPoints = currentSet === 5 ? 15 : 25;

  const addPoint = (team: 'home' | 'away') => {
    const event: MatchEvent = {
      id: crypto.randomUUID(),
      type: 'point',
      team,
      set: currentSet,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => [...prev, event]);

    setSets((prev) => {
      const newSets = [...prev];
      if (team === 'home') {
        newSets[currentSet - 1].home += 1;
      } else {
        newSets[currentSet - 1].away += 1;
      }

      const homeScore = newSets[currentSet - 1].home;
      const awayScore = newSets[currentSet - 1].away;

      // Verificar se o set terminou
      if (homeScore >= maxPoints && homeScore - awayScore >= 2) {
        newSets[currentSet - 1].winner = 'home';
        setHomeSets((prev) => prev + 1);
        toast.success(`🏐 ${homeTeam} venceu o set ${currentSet}!`, {
          duration: 3000,
          icon: '🎉',
        });
        
        if (homeSets + 1 < 3 && awaySets < 3) {
          setTimeout(() => {
            if (confirm(`Iniciar set ${currentSet + 1}?`)) {
              nextSet();
            }
          }, 1000);
        }
      } else if (awayScore >= maxPoints && awayScore - homeScore >= 2) {
        newSets[currentSet - 1].winner = 'away';
        setAwaySets((prev) => prev + 1);
        toast.success(`🏐 ${awayTeam} venceu o set ${currentSet}!`, {
          duration: 3000,
          icon: '🎉',
        });
        
        if (awaySets + 1 < 3 && homeSets < 3) {
          setTimeout(() => {
            if (confirm(`Iniciar set ${currentSet + 1}?`)) {
              nextSet();
            }
          }, 1000);
        }
      }

      return newSets;
    });

    // Alternar saque quando o time que não estava sacando marca ponto
    if (team !== servingTeam) {
      setServingTeam(team);
    }

    toast.success(`Ponto para ${team === 'home' ? homeTeam : awayTeam}!`);
  };

  const undoLast = () => {
    if (events.length === 0) {
      toast.error('Nenhum evento para desfazer');
      return;
    }

    const lastEvent = events[events.length - 1];
    setEvents((prev) => prev.slice(0, -1));

    setSets((prev) => {
      const newSets = [...prev];
      const setIndex = lastEvent.set - 1;
      
      if (lastEvent.team === 'home') {
        newSets[setIndex].home = Math.max(0, newSets[setIndex].home - 1);
      } else {
        newSets[setIndex].away = Math.max(0, newSets[setIndex].away - 1);
      }

      // Remover winner se havia
      if (newSets[setIndex].winner) {
        if (newSets[setIndex].winner === 'home') {
          setHomeSets((prev) => Math.max(0, prev - 1));
        } else {
          setAwaySets((prev) => Math.max(0, prev - 1));
        }
        delete newSets[setIndex].winner;
      }

      return newSets;
    });

    toast.success('Último ponto desfeito');
  };

  const nextSet = () => {
    if (currentSet < 5) {
      setCurrentSet((prev) => prev + 1);
      setSets((prev) => [...prev, { home: 0, away: 0 }]);
      toast.success(`Set ${currentSet + 1} iniciado!`);
    } else {
      toast.error('Máximo de 5 sets');
    }
  };

  const handleFinish = () => {
    const data: MatchData = {
      homeSets,
      awaySets,
      sets,
      events,
      currentSet,
    };

    onFinish(data);
    toast.success('Partida finalizada!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Placar de Sets */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-3 items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-700 mb-2">
                {homeTeam}
              </div>
              <div className="text-7xl font-bold text-amber-600">
                {homeSets}
              </div>
              <div className="text-sm text-slate-600 mt-2">sets</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-slate-400">×</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-slate-700 mb-2">
                {awayTeam}
              </div>
              <div className="text-7xl font-bold text-red-600">
                {awaySets}
              </div>
              <div className="text-sm text-slate-600 mt-2">sets</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-center text-slate-700">
              <div className="text-lg font-semibold mb-2">
                Set {currentSet}: {currentSetData.home} × {currentSetData.away}
              </div>
              <div className="text-sm text-slate-600">
                Saque: {servingTeam === 'home' ? homeTeam : awayTeam} ●
              </div>
            </div>
          </div>
        </div>

        {/* Marcar Ponto */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            🏐 MARCAR PONTO
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => addPoint('home')}
              className="h-24 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-2xl shadow-lg hover:shadow-xl transition-all"
            >
              {homeTeam}
              <div className="text-sm mt-1">
                {servingTeam === 'home' && '● Saque'}
              </div>
            </button>
            <button
              onClick={() => addPoint('away')}
              className="h-24 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-2xl shadow-lg hover:shadow-xl transition-all"
            >
              {awayTeam}
              <div className="text-sm mt-1">
                {servingTeam === 'away' && '● Saque'}
              </div>
            </button>
          </div>
        </div>

        {/* Placar Detalhado */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            📊 Placar dos Sets
          </h3>
          <div className="space-y-2">
            {sets.map((set, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  idx === currentSet - 1
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'bg-slate-50'
                }`}
              >
                <span className="font-semibold text-slate-700">
                  Set {idx + 1}:
                </span>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xl font-bold ${
                      set.winner === 'home'
                        ? 'text-amber-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {set.home}
                  </span>
                  <span className="text-slate-400">×</span>
                  <span
                    className={`text-xl font-bold ${
                      set.winner === 'away'
                        ? 'text-red-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {set.away}
                  </span>
                  {set.winner && (
                    <span className="text-sm text-green-600 font-semibold ml-2">
                      ({set.winner === 'home' ? homeTeam : awayTeam})
                    </span>
                  )}
                  {idx === currentSet - 1 && !set.winner && (
                    <span className="text-sm text-blue-600 font-semibold ml-2">
                      (em andamento)
                    </span>
                  )}
                </div>
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
            onClick={nextSet}
            disabled={currentSet >= 5 || !currentSetData.winner}
            className="flex-1 h-16 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <SkipForward className="h-5 w-5" />
            Próximo Set
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
