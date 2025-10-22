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

export default function EventModal({
  isOpen,
  onClose,
  type,
  homeTeam,
  awayTeam,
  currentMinute,
  onSave,
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

  const currentTeam = selectedTeam === 'home' ? homeTeam : awayTeam;
  const activePlayers = currentTeam.players || [];
  const filteredPlayers = activePlayers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.number?.toString().includes(searchTerm)
  );

  const handleSubmit = () => {
    const teamId = selectedTeam === 'home' ? homeTeam.id : awayTeam.id;
    
    const eventData: EventData = {
      type,
      teamId,
      minute,
      playerId: selectedPlayerId,
      description,
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
      return playerOutId && playerInId && playerOutId !== playerInId;
    }
    return selectedPlayerId && minute > 0;
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

  const getColor = () => {
    switch (type) {
      case 'goal':
        return 'from-green-600 to-emerald-600';
      case 'yellow_card':
        return 'from-yellow-500 to-amber-600';
      case 'red_card':
        return 'from-red-600 to-rose-700';
      case 'substitution':
        return 'from-blue-600 to-indigo-600';
      default:
        return 'from-slate-600 to-slate-700';
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className={`bg-gradient-to-r ${getColor()} px-6 py-5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{getIcon()}</div>
                      <div>
                        <Dialog.Title className="text-2xl font-bold text-white">
                          {getTitle()}
                        </Dialog.Title>
                        <p className="text-sm text-white/80 mt-0.5">
                          Preencha as informações abaixo
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Seleção de Time */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Time:
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedTeam('home')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedTeam === 'home'
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {homeTeam.logo ? (
                            <img src={homeTeam.logo} alt={homeTeam.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                              <span className="text-xl font-bold text-blue-600">{homeTeam.name?.charAt(0)}</span>
                            </div>
                          )}
                          <div className="text-left flex-1">
                            <div className="font-bold text-slate-900">{homeTeam.name}</div>
                            <div className="text-xs text-slate-500">🏠 Casa</div>
                          </div>
                          {selectedTeam === 'home' && (
                            <div className="text-blue-500 text-xl">✓</div>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedTeam('away')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedTeam === 'away'
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {awayTeam.logo ? (
                            <img src={awayTeam.logo} alt={awayTeam.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                              <span className="text-xl font-bold text-purple-600">{awayTeam.name?.charAt(0)}</span>
                            </div>
                          )}
                          <div className="text-left flex-1">
                            <div className="font-bold text-slate-900">{awayTeam.name}</div>
                            <div className="text-xs text-slate-500">🚗 Visitante</div>
                          </div>
                          {selectedTeam === 'away' && (
                            <div className="text-purple-500 text-xl">✓</div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Minuto */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Minuto: ⏱️
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={minute}
                      onChange={(e) => setMinute(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                    />
                  </div>

                  {/* Seleção de Jogador(es) */}
                  {type !== 'substitution' ? (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                          className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Lista de Jogadores */}
                      <div className="max-h-64 overflow-y-auto border-2 border-slate-200 rounded-xl divide-y divide-slate-100">
                        {filteredPlayers.length > 0 ? (
                          filteredPlayers.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => setSelectedPlayerId(player.id)}
                              className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                                selectedPlayerId === player.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                                  #{player.number}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-900">{player.name}</div>
                                  {player.position && (
                                    <div className="text-xs text-slate-500">{player.position}</div>
                                  )}
                                </div>
                                {selectedPlayerId === player.id && (
                                  <div className="text-blue-500 text-xl">✓</div>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-500">
                            <p>Nenhum jogador encontrado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Jogador SAI */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Jogador que SAI: ⬆️
                        </label>
                        <select
                          value={playerOutId}
                          onChange={(e) => setPlayerOutId(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione...</option>
                          {activePlayers.map((player) => (
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
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Jogador que ENTRA: ⬇️
                        </label>
                        <select
                          value={playerInId}
                          onChange={(e) => setPlayerInId(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione...</option>
                          {activePlayers.filter(p => p.id !== playerOutId).map((player) => (
                            <option key={player.id} value={player.id}>
                              #{player.number} - {player.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Campos específicos para GOL */}
                  {type === 'goal' && selectedPlayerId && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Assistência (opcional):
                        </label>
                        <select
                          value={assistPlayerId}
                          onChange={(e) => setAssistPlayerId(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Nenhuma</option>
                          {activePlayers.filter(p => p.id !== selectedPlayerId).map((player) => (
                            <option key={player.id} value={player.id}>
                              #{player.number} - {player.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                              className={`p-3 rounded-lg border-2 transition-all ${
                                goalType === option.value
                                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{option.icon}</span>
                                <span className="font-semibold text-slate-900">{option.label}</span>
                                {goalType === option.value && (
                                  <span className="ml-auto text-green-500">✓</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Descrição (opcional) */}
                  {type !== 'substitution' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Observações (opcional):
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Ex: Falta violenta, discussão com árbitro..."
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid()}
                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                      isValid()
                        ? `bg-gradient-to-r ${getColor()} hover:shadow-xl hover:scale-105`
                        : 'bg-slate-300 cursor-not-allowed'
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
