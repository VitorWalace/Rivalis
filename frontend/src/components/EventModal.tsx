import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Team, Game } from '../types';

type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EventType;
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  currentMinute: number;
  onSave: (eventData: EventData) => void;
  activeHomePlayerIds?: string[];
  activeAwayPlayerIds?: string[];
}

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

const EVENT_THEMES: Record<EventType, {
  headerGradient: string;
  accentBorder: string;
  accentRing: string;
  accentHighlight: string;
  accentText: string;
  confirmGradient: string;
  confirmShadow: string;
}> = {
  goal: {
    headerGradient: 'from-emerald-500 to-emerald-600',
    accentBorder: 'border-emerald-500/60',
    accentRing: 'ring-emerald-400/30',
    accentHighlight: 'bg-emerald-500/10',
    accentText: 'text-emerald-200',
    confirmGradient: 'from-emerald-500 to-emerald-600',
    confirmShadow: 'shadow-emerald-500/25',
  },
  yellow_card: {
    headerGradient: 'from-amber-500 to-yellow-500',
    accentBorder: 'border-amber-400/60',
    accentRing: 'ring-amber-300/30',
    accentHighlight: 'bg-amber-400/15',
    accentText: 'text-amber-200',
    confirmGradient: 'from-amber-500 to-amber-600',
    confirmShadow: 'shadow-amber-500/25',
  },
  red_card: {
    headerGradient: 'from-rose-500 to-red-600',
    accentBorder: 'border-rose-500/60',
    accentRing: 'ring-rose-400/30',
    accentHighlight: 'bg-rose-500/10',
    accentText: 'text-rose-200',
    confirmGradient: 'from-rose-500 to-rose-600',
    confirmShadow: 'shadow-rose-500/25',
  },
  substitution: {
    headerGradient: 'from-sky-500 to-indigo-500',
    accentBorder: 'border-sky-500/60',
    accentRing: 'ring-sky-400/30',
    accentHighlight: 'bg-sky-500/10',
    accentText: 'text-sky-200',
    confirmGradient: 'from-sky-500 to-indigo-500',
    confirmShadow: 'shadow-sky-500/25',
  },
};

export default function EventModal({
  isOpen,
  onClose,
  type,
  homeTeam,
  awayTeam,
  currentMinute,
  onSave,
  activeHomePlayerIds,
  activeAwayPlayerIds,
}: EventModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [minute, setMinute] = useState(currentMinute);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [assistPlayerId, setAssistPlayerId] = useState('');
  const [playerOutId, setPlayerOutId] = useState('');
  const [playerInId, setPlayerInId] = useState('');
  const [goalType, setGoalType] = useState<'normal' | 'penalty' | 'own_goal' | 'free_kick'>('normal');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const theme = EVENT_THEMES[type];

  const currentTeam = selectedTeam === 'home' ? homeTeam : awayTeam;
  const teamPlayers = currentTeam.players || [];
  const activePlayerIds = selectedTeam === 'home' ? activeHomePlayerIds : activeAwayPlayerIds;
  const normalizedActiveIds = Array.isArray(activePlayerIds) ? activePlayerIds : undefined;
  const hasDefinedLineup = !!normalizedActiveIds && normalizedActiveIds.length > 0;
  const playersOnCourt = hasDefinedLineup
    ? teamPlayers.filter(player => normalizedActiveIds.includes(player.id))
    : teamPlayers;
  const benchPlayers = hasDefinedLineup
    ? teamPlayers.filter(player => !normalizedActiveIds.includes(player.id))
    : teamPlayers;

  useEffect(() => {
    if (isOpen) {
      setMinute(currentMinute);
      setSelectedPlayerId('');
      setAssistPlayerId('');
      setPlayerOutId('');
      setPlayerInId('');
      setGoalType('normal');
      setDescription('');
      setSearchTerm('');
    }
  }, [isOpen, currentMinute]);

  useEffect(() => {
    if (!isOpen) return;

    if (type === 'substitution') {
      if (playerOutId && !playersOnCourt.some(player => player.id === playerOutId)) {
        setPlayerOutId('');
      }
      if (playerInId && !benchPlayers.some(player => player.id === playerInId)) {
        setPlayerInId('');
      }
    } else {
      if (selectedPlayerId && !playersOnCourt.some(player => player.id === selectedPlayerId)) {
        setSelectedPlayerId('');
      }
      if (assistPlayerId && !playersOnCourt.some(player => player.id === assistPlayerId)) {
        setAssistPlayerId('');
      }
    }
  }, [
    isOpen,
    type,
    playersOnCourt,
    benchPlayers,
    selectedPlayerId,
    assistPlayerId,
    playerOutId,
    playerInId,
  ]);

  const filteredPlayers = playersOnCourt.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.number?.toString().includes(searchTerm)
  );

  const handleSubmit = () => {
    // Se for gol contra, o gol deve ser contabilizado para o time adversário
    const isOwnGoal = goalType === 'own_goal';
    const actualTeamId = isOwnGoal 
      ? (selectedTeam === 'home' ? awayTeam.id : homeTeam.id)  // Time que recebe o gol
      : (selectedTeam === 'home' ? homeTeam.id : awayTeam.id); // Time que marcou
    
    const eventData: EventData = {
      type,
      teamId: actualTeamId,
      minute,
      playerId: selectedPlayerId,
      description: isOwnGoal ? `Gol contra de ${currentTeam.players?.find(p => p.id === selectedPlayerId)?.name || 'jogador'}` : description,
    };

    if (type === 'goal') {
      eventData.assistPlayerId = assistPlayerId || undefined;
      eventData.goalType = goalType;
    }

    if (type === 'substitution') {
      eventData.playerOutId = playerOutId;
      eventData.playerInId = playerInId;
    }

    onSave(eventData);
    onClose();
  };

  const isValid = () => {
    if (type === 'substitution') {
      return (
        playerOutId &&
        playerInId &&
        playerOutId !== playerInId &&
        playersOnCourt.some(player => player.id === playerOutId) &&
        benchPlayers.some(player => player.id === playerInId)
      );
    }
    // Minuto pode ser 0 (início do jogo), então verificamos >= 0
    return (
      selectedPlayerId &&
      minute >= 0 &&
      playersOnCourt.some(player => player.id === selectedPlayerId)
    );
  };

  const getTitle = () => {
    switch (type) {
      case 'goal':
        return '⚽ REGISTRAR GOL';
      case 'yellow_card':
        return '🟨 REGISTRAR CARTÃO AMARELO';
      case 'red_card':
        return '🟥 REGISTRAR CARTÃO VERMELHO';
      case 'substitution':
        return '🔄 REGISTRAR SUBSTITUIÇÃO';
      default:
        return 'REGISTRAR EVENTO';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution':
        return '🔄';
      default:
        return '📝';
    }
  };

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.85)] transition-all">
                {/* Header */}
                <div className={`bg-gradient-to-r ${theme.headerGradient} px-6 py-5 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{getIcon()}</div>
                      <div>
                        <Dialog.Title className="text-2xl font-semibold">
                          {getTitle()}
                        </Dialog.Title>
                        <p className="text-sm text-white/90 mt-0.5">
                          Preencha as informações abaixo
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Seleção de Time */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-300">
                      Time:
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedTeam('home')}
                        className={`flex items-stretch rounded-2xl border bg-slate-900/70 p-4 text-left transition-all ${
                          selectedTeam === 'home'
                            ? `${theme.accentBorder} ${theme.accentHighlight} ring-2 ${theme.accentRing} shadow-[0_16px_40px_-20px_rgba(14,23,42,0.85)]`
                            : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/90 hover:shadow-[0_10px_28px_-20px_rgba(15,23,42,0.8)]'
                        }`}
                      >
                        <div className="flex w-full items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-slate-200">
                            {homeTeam.logo ? (
                              <img src={homeTeam.logo} alt={homeTeam.name} className="h-full w-full rounded-xl object-cover" />
                            ) : (
                              homeTeam.name?.charAt(0) ?? 'T'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-100">{homeTeam.name}</div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">🏠 Casa</div>
                          </div>
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                              selectedTeam === 'home'
                                ? `${theme.accentHighlight} ${theme.accentText}`
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {selectedTeam === 'home' ? '✓' : ''}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedTeam('away')}
                        className={`flex items-stretch rounded-2xl border bg-slate-900/70 p-4 text-left transition-all ${
                          selectedTeam === 'away'
                            ? `${theme.accentBorder} ${theme.accentHighlight} ring-2 ${theme.accentRing} shadow-[0_16px_40px_-20px_rgba(14,23,42,0.85)]`
                            : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/90 hover:shadow-[0_10px_28px_-20px_rgba(15,23,42,0.8)]'
                        }`}
                      >
                        <div className="flex w-full items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-slate-200">
                            {awayTeam.logo ? (
                              <img src={awayTeam.logo} alt={awayTeam.name} className="h-full w-full rounded-xl object-cover" />
                            ) : (
                              awayTeam.name?.charAt(0) ?? 'T'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-100">{awayTeam.name}</div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">🚗 Visitante</div>
                          </div>
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                              selectedTeam === 'away'
                                ? `${theme.accentHighlight} ${theme.accentText}`
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {selectedTeam === 'away' ? '✓' : ''}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Minuto */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Minuto: ⏱️
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={minute}
                        onChange={(e) => setMinute(Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-lg font-semibold text-slate-100 shadow-inner"
                        readOnly
                        disabled
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                        ⏰ Cronômetro
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      📍 O minuto é definido automaticamente pelo cronômetro da partida
                    </p>
                  </div>

                  {/* Seleção de Jogador(es) */}
                  {type !== 'substitution' ? (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        {type === 'goal' ? 'Jogador que marcou:' : 'Jogador:'}
                      </label>
                      
                      {/* Busca */}
                      <div className="relative mb-3">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar jogador por nome ou número..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full rounded-2xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-3 text-sm font-medium text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700"
                        />
                      </div>

                      {/* Lista de Jogadores */}
                      <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                        {filteredPlayers.length > 0 ? (
                          filteredPlayers.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => setSelectedPlayerId(player.id)}
                              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                                selectedPlayerId === player.id
                                  ? `${theme.accentHighlight} ${theme.accentBorder} shadow-[0_20px_45px_-30px_rgba(14,23,42,0.9)]`
                                  : 'border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-900/80'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-200">
                                  #{player.number}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-100">{player.name}</div>
                                  {player.position && (
                                    <div className="text-xs text-slate-400">{player.position}</div>
                                  )}
                                </div>
                              </div>
                              {selectedPlayerId === player.id && (
                                <div className={`ml-auto h-7 w-7 rounded-full text-sm font-semibold ${theme.accentHighlight} ${theme.accentText} flex items-center justify-center`}>
                                  ✓
                                </div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-400">
                            <p>
                              {teamPlayers.length === 0
                                ? 'Nenhum jogador disponível'
                                : 'Nenhum jogador elegível em quadra'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Jogador SAI */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Jogador que SAI: ⬆️
                        </label>
                        <select
                          value={playerOutId}
                          onChange={(e) => setPlayerOutId(e.target.value)}
                          className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700"
                        >
                          <option value="">Selecione...</option>
                          {playersOnCourt.map((player) => (
                            <option key={player.id} value={player.id}>
                              #{player.number} - {player.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seta */}
                      <div className="text-center text-3xl text-slate-400">⬇️</div>

                      {/* Jogador ENTRA */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Jogador que ENTRA: ⬇️
                        </label>
                        <select
                          value={playerInId}
                          onChange={(e) => setPlayerInId(e.target.value)}
                          className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700"
                        >
                          <option value="">Selecione...</option>
                          {benchPlayers
                            .filter((player) => player.id !== playerOutId)
                            .map((player) => (
                            <option key={player.id} value={player.id}>
                              #{player.number} - {player.name}
                            </option>
                            ))}
                        </select>
                        {hasDefinedLineup && benchPlayers.length === 0 && (
                          <p className="mt-2 text-xs text-slate-400">
                            Nenhum jogador disponível no banco.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Campos específicos para GOL */}
                  {type === 'goal' && selectedPlayerId && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Assistência (opcional):
                        </label>
                        <select
                          value={assistPlayerId}
                          onChange={(e) => setAssistPlayerId(e.target.value)}
                          className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700"
                        >
                          <option value="">Nenhuma</option>
                          {playersOnCourt
                            .filter(p => p.id !== selectedPlayerId)
                            .map((player) => (
                            <option key={player.id} value={player.id}>
                              #{player.number} - {player.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-semibold text-slate-300">
                          Tipo de gol:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'normal', label: 'Normal', icon: '⚽' },
                            { value: 'penalty', label: 'Pênalti', icon: '🎯' },
                            { value: 'own_goal', label: 'Contra', icon: '🔄' },
                            { value: 'free_kick', label: 'Falta', icon: '🚀' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setGoalType(option.value as any)}
                              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                                goalType === option.value
                                  ? `${theme.accentHighlight} ${theme.accentBorder} ring-2 ${theme.accentRing}`
                                  : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{option.icon}</span>
                                <span className="font-semibold text-slate-100">{option.label}</span>
                                {goalType === option.value && (
                                  <span className={`ml-auto text-sm font-semibold ${theme.accentText}`}>✓</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Alerta de Gol Contra */}
                        {goalType === 'own_goal' && (
                          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                            <div className="flex items-start gap-3 text-amber-100">
                              <div className="text-2xl">⚠️</div>
                              <div className="flex-1">
                                <h4 className="mb-1 font-semibold uppercase tracking-wide">
                                  Atenção: Gol Contra
                                </h4>
                                <p className="text-sm text-amber-100/90">
                                  O gol será contabilizado para <strong>{selectedTeam === 'home' ? awayTeam.name : homeTeam.name}</strong>{' '}
                                  (time adversário), mas o jogador selecionado de <strong>{currentTeam.name}</strong> será registrado como autor do gol contra.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Descrição (opcional) */}
                  {type !== 'substitution' && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Observações (opcional):
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Ex: Falta violenta, discussão com árbitro..."
                        className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700"
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 rounded-b-2xl bg-slate-900/70 px-6 py-4">
                  <button
                    onClick={onClose}
                    className="rounded-2xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid()}
                    className={`rounded-2xl px-8 py-3 text-sm font-semibold text-white transition-all ${
                      isValid()
                        ? `bg-gradient-to-r ${theme.confirmGradient} ${theme.confirmShadow} hover:shadow-xl hover:brightness-105`
                        : 'cursor-not-allowed bg-slate-700 text-slate-400'
                    }`}
                  >
                    ✅ CONFIRMAR
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
