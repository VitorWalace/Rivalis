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
  const buttonVariants: Record<string, string> = {
    goal: 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10',
    yellow_card: 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10',
    red_card: 'border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10',
    substitution: 'border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10',
  };

  const iconColors: Record<string, string> = {
    goal: 'text-emerald-300',
    yellow_card: 'text-amber-300',
    red_card: 'text-rose-300',
    substitution: 'text-sky-300',
  };

  const baseButtonClasses =
    'group relative flex h-full flex-col justify-between rounded-2xl border px-6 py-6 text-left transition focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 text-slate-100 shadow-xl">
      <h3 className="mb-4 text-lg font-semibold uppercase tracking-wide text-slate-300">
        Registrar evento
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Botão de Gol */}
        <button
          onClick={onGoal}
          disabled={disabled}
          className={`${baseButtonClasses} ${buttonVariants.goal}`}
        >
          <div className="flex flex-col gap-3">
            <span className={`text-3xl ${iconColors.goal}`}>⚽</span>
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide">Gol</div>
              <div className="text-xs text-slate-400">Registrar gol</div>
            </div>
          </div>
        </button>

        {/* Botão de Cartão Amarelo */}
        <button
          onClick={onYellowCard}
          disabled={disabled}
          className={`${baseButtonClasses} ${buttonVariants.yellow_card}`}
        >
          <div className="flex flex-col gap-3">
            <span className={`text-3xl ${iconColors.yellow_card}`}>🟨</span>
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide">Cartão amarelo</div>
              <div className="text-xs text-slate-400">Registrar advertência</div>
            </div>
          </div>
        </button>

        {/* Botão de Cartão Vermelho */}
        <button
          onClick={onRedCard}
          disabled={disabled}
          className={`${baseButtonClasses} ${buttonVariants.red_card}`}
        >
          <div className="flex flex-col gap-3">
            <span className={`text-3xl ${iconColors.red_card}`}>🟥</span>
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide">Cartão vermelho</div>
              <div className="text-xs text-slate-400">Registrar expulsão</div>
            </div>
          </div>
        </button>

        {/* Botão de Substituição */}
        <button
          onClick={onSubstitution}
          disabled={disabled}
          className={`${baseButtonClasses} ${buttonVariants.substitution}`}
        >
          <div className="flex flex-col gap-3">
            <span className={`text-3xl ${iconColors.substitution}`}>🔄</span>
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide">Substituição</div>
              <div className="text-xs text-slate-400">Trocar jogador em quadra</div>
            </div>
          </div>
        </button>
      </div>

      {disabled && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-center text-xs font-medium text-slate-400">
          Inicie a partida para registrar eventos.
        </div>
      )}
    </div>
  );
}
