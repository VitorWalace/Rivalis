interface EventButtonsProps {
  onGoal: () => void;
  onYellowCard: () => void;
  onRedCard: () => void;
  onSubstitution: () => void;
  disabled?: boolean;
}

export default function EventButtons({
  onGoal,
  onYellowCard,
  onRedCard,
  onSubstitution,
  disabled = false,
}: EventButtonsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">🎯</span>
        REGISTRAR EVENTO
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Botão de Gol */}
        <button
          onClick={onGoal}
          disabled={disabled}
          className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:hover:scale-100"
        >
          <div className="relative z-10">
            <div className="text-6xl mb-3">⚽</div>
            <div className="font-bold text-xl">GOL</div>
            <div className="text-sm opacity-90 mt-1">Registrar gol</div>
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </button>

        {/* Botão de Cartão Amarelo */}
        <button
          onClick={onYellowCard}
          disabled={disabled}
          className="group relative overflow-hidden bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:hover:scale-100"
        >
          <div className="relative z-10">
            <div className="text-6xl mb-3">🟨</div>
            <div className="font-bold text-xl">AMARELO</div>
            <div className="text-sm opacity-90 mt-1">Cartão amarelo</div>
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </button>

        {/* Botão de Cartão Vermelho */}
        <button
          onClick={onRedCard}
          disabled={disabled}
          className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:hover:scale-100"
        >
          <div className="relative z-10">
            <div className="text-6xl mb-3">🟥</div>
            <div className="font-bold text-xl">VERMELHO</div>
            <div className="text-sm opacity-90 mt-1">Cartão vermelho</div>
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </button>

        {/* Botão de Substituição */}
        <button
          onClick={onSubstitution}
          disabled={disabled}
          className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:hover:scale-100"
        >
          <div className="relative z-10">
            <div className="text-6xl mb-3">🔄</div>
            <div className="font-bold text-xl">SUBSTITUIÇÃO</div>
            <div className="text-sm opacity-90 mt-1">Troca de jogador</div>
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </button>
      </div>

      {disabled && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 text-center font-medium">
            ⚠️ Inicie a partida para registrar eventos
          </p>
        </div>
      )}
    </div>
  );
}
