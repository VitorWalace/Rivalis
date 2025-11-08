import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { Team } from '../types';

type PlayerSelectionMap = Record<string, boolean>;

interface StartingLineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (homePlayers: string[], awayPlayers: string[]) => void;
  homeTeam: Team;
  awayTeam: Team;
  requiredCount?: number;
}

interface SelectionState {
  home: PlayerSelectionMap;
  away: PlayerSelectionMap;
}

const DEFAULT_REQUIRED = 5;

export default function StartingLineupModal({
  isOpen,
  onClose,
  onConfirm,
  homeTeam,
  awayTeam,
  requiredCount = DEFAULT_REQUIRED,
}: StartingLineupModalProps) {
  const [selection, setSelection] = useState<SelectionState>({
    home: {},
    away: {},
  });
  const [touched, setTouched] = useState(false);

  const maxHome = useMemo(
    () => Math.min(requiredCount, homeTeam.players?.length || 0),
    [homeTeam.players, requiredCount]
  );
  const maxAway = useMemo(
    () => Math.min(requiredCount, awayTeam.players?.length || 0),
    [awayTeam.players, requiredCount]
  );

  useEffect(() => {
    if (!isOpen) return;

    const initializeSelection = (team: Team, limit: number) => {
      const map: PlayerSelectionMap = {};
      team.players?.slice(0, limit).forEach(player => {
        map[player.id] = true;
      });
      return map;
    };

    setSelection({
      home: initializeSelection(homeTeam, maxHome || requiredCount),
      away: initializeSelection(awayTeam, maxAway || requiredCount),
    });
    setTouched(false);
  }, [isOpen, homeTeam, awayTeam, maxHome, maxAway, requiredCount]);

  const countSelected = (teamKey: 'home' | 'away') => {
    return Object.values(selection[teamKey]).filter(Boolean).length;
  };

  const togglePlayer = (teamKey: 'home' | 'away', playerId: string, limit: number) => {
    setSelection(prev => {
      const current = prev[teamKey];
      const isSelected = !!current[playerId];
      const currentCount = Object.values(current).filter(Boolean).length;

      if (isSelected) {
        return {
          ...prev,
          [teamKey]: { ...current, [playerId]: false },
        };
      }

      if (currentCount >= limit) {
        return prev;
      }

      return {
        ...prev,
        [teamKey]: { ...current, [playerId]: true },
      };
    });
  };

  const buildSelectedIds = (teamKey: 'home' | 'away') => {
    return Object.entries(selection[teamKey])
      .filter(([, selected]) => selected)
      .map(([playerId]) => playerId);
  };

  const homeSelected = buildSelectedIds('home');
  const awaySelected = buildSelectedIds('away');

  const requiredHome = maxHome || requiredCount;
  const requiredAway = maxAway || requiredCount;

  const homeValid = requiredHome === 0 || homeSelected.length === requiredHome;
  const awayValid = requiredAway === 0 || awaySelected.length === requiredAway;

  const isValid = () => homeValid && awayValid;

  const handleConfirm = () => {
    setTouched(true);
    if (!isValid()) return;
    onConfirm(homeSelected, awaySelected);
  };

  const renderTeamList = (team: Team, teamKey: 'home' | 'away', limit: number) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{team.name}</span>
        <span>
          {countSelected(teamKey)} / {limit}
        </span>
      </div>
      <div className="space-y-2">
        {(team.players || []).map(player => {
          const isSelected = !!selection[teamKey][player.id];
          const disabled = !isSelected && countSelected(teamKey) >= limit;

          return (
            <button
              key={player.id}
              type="button"
              onClick={() => togglePlayer(teamKey, player.id, limit)}
              disabled={disabled}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300">
                  #{player.number || '?'}
                </div>
                <div>
                  <div className="text-sm font-medium">{player.name}</div>
                  {player.position && (
                    <div className="text-[11px] text-slate-400">{player.position}</div>
                  )}
                </div>
              </div>
              <div
                className={`h-4 w-4 rounded border ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-400'
                    : 'border-slate-600 bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
      {team.players?.length === 0 && (
        <p className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-4 text-xs text-slate-400">
          Nenhum jogador disponível.
        </p>
      )}
    </div>
  );

  const showError = touched && !isValid();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-all">
                <div className="border-b border-slate-800 bg-slate-900/70 px-6 py-5">
                  <Dialog.Title className="text-lg font-semibold uppercase tracking-wide text-slate-200">
                    Defina os titulares
                  </Dialog.Title>
                  <p className="mt-1 text-xs text-slate-400">
                    Escolha {requiredCount} jogadores para iniciar a partida em cada equipe.
                  </p>
                </div>

                <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
                  {renderTeamList(homeTeam, 'home', requiredHome)}
                  {renderTeamList(awayTeam, 'away', requiredAway)}
                </div>

                {showError && (
                  <div className="px-6">
                    <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-rose-200">
                      Selecione {requiredHome} jogadores mandantes e {requiredAway} visitantes para continuar.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/70 px-6 py-4">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Você poderá registrar substituições durante o jogo normalmente.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/15"
                    >
                      Confirmar escalação
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
