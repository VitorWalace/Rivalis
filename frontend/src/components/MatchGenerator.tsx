import { Fragment, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { generateRoundRobin, generateKnockout, generateGroupsAndPlayoffs } from '../utils/matchGenerators';
import { scheduleMatches, calculateScheduleStats } from '../utils/dateScheduler';
import type { Team } from '../types';
import type { ScheduledMatch } from '../utils/dateScheduler';

type Format = 'round-robin' | 'knockout' | 'groups-playoffs';

interface MatchGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onGenerate: (matches: ScheduledMatch[]) => Promise<void>;
}

export default function MatchGenerator({ isOpen, onClose, teams, onGenerate }: MatchGeneratorProps) {
  console.log('🟢 MatchGenerator renderizado:', { isOpen, teamsCount: teams.length });
  
  const [format, setFormat] = useState<Format>('round-robin');
  const [isGenerating, setIsGenerating] = useState(false);

  // Round-robin config
  const [doubleRound, setDoubleRound] = useState(true);

  // Groups config
  const [numGroups, setNumGroups] = useState(4);
  const [qualifyPerGroup, setQualifyPerGroup] = useState(2);

  // Schedule config
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [defaultTime, setDefaultTime] = useState('14:00');
  const [intervalDays, setIntervalDays] = useState(2);
  const [defaultVenue, setDefaultVenue] = useState('');

  const teamsPerGroup = Math.floor(teams.length / numGroups);

  // Validações
  const validations = useMemo(() => {
    const errors: string[] = [];

    if (teams.length < 2) {
      errors.push('São necessários pelo menos 2 times cadastrados');
    }

    if (format === 'groups-playoffs') {
      if (teams.length < numGroups * 2) {
        errors.push(`São necessários pelo menos ${numGroups * 2} times para ${numGroups} grupos`);
      }

      if (teams.length % numGroups !== 0) {
        errors.push('O número de times deve ser divisível pelo número de grupos');
      }

      if (qualifyPerGroup >= teamsPerGroup) {
        errors.push('Classificados por grupo deve ser menor que times por grupo');
      }

      if (qualifyPerGroup < 1) {
        errors.push('É necessário pelo menos 1 classificado por grupo');
      }
    }

    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      errors.push('A data de início deve ser hoje ou no futuro');
    }

    return errors;
  }, [teams.length, format, numGroups, teamsPerGroup, qualifyPerGroup, startDate]);

  // Preview da geração
  const preview = useMemo(() => {
    if (validations.length > 0) {
      console.log('Preview bloqueado por validações:', validations);
      return null;
    }

    try {
      let matches;

      switch (format) {
        case 'round-robin':
          matches = generateRoundRobin(teams, doubleRound);
          break;
        case 'knockout':
          matches = generateKnockout(teams);
          break;
        case 'groups-playoffs':
          matches = generateGroupsAndPlayoffs(teams, numGroups, qualifyPerGroup);
          break;
      }

      console.log('Matches gerados:', matches.length);

      const scheduled = scheduleMatches(matches, {
        startDate: new Date(startDate),
        defaultTime,
        intervalDays,
        defaultVenue,
        matchesPerDay: 2,
      });

      console.log('Matches agendados:', scheduled.length);

      const stats = calculateScheduleStats(scheduled);

      console.log('Stats calculadas:', stats);

      return {
        matches: scheduled,
        stats,
      };
    } catch (error) {
      console.error('Erro no preview:', error);
      return null;
    }
  }, [validations, format, teams, doubleRound, numGroups, qualifyPerGroup, startDate, defaultTime, intervalDays, defaultVenue]);

  const handleGenerate = async () => {
    console.log('handleGenerate chamado!');
    console.log('Preview:', preview);
    console.log('Validations:', validations);
    
    if (!preview || validations.length > 0) {
      console.log('Validação falhou:', { preview, validations });
      toast.error('Por favor, corrija os erros antes de gerar');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Gerando partidas:', preview.matches.length);
      await onGenerate(preview.matches);
      toast.success('Chaveamento gerado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao gerar partidas:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar partidas');
    } finally {
      setIsGenerating(false);
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-bold text-white">
                          Gerar Partidas Automaticamente
                        </Dialog.Title>
                        <p className="text-sm text-purple-100 mt-0.5">
                          Configure o formato e deixe o sistema criar toda a tabela
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
                <div className="p-6 space-y-8">
                  {/* Section 1: Format */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold text-sm">
                        1
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Formato do Campeonato</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                      <button
                        onClick={() => setFormat('round-robin')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          format === 'round-robin'
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 mb-2">🔄 Round-robin</div>
                        <p className="text-xs text-slate-600">Todos contra todos</p>
                      </button>

                      <button
                        onClick={() => setFormat('knockout')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          format === 'knockout'
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 mb-2">🏆 Mata-mata</div>
                        <p className="text-xs text-slate-600">Eliminação simples</p>
                      </button>

                      <button
                        onClick={() => setFormat('groups-playoffs')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          format === 'groups-playoffs'
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 mb-2">⚡ Grupos + Playoffs</div>
                        <p className="text-xs text-slate-600">Fase de grupos + mata-mata</p>
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Advanced Config */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                        2
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Configurações Avançadas</h3>
                    </div>

                    <div className="pl-11 space-y-4">
                      {format === 'round-robin' && (
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={doubleRound}
                            onChange={(e) => setDoubleRound(e.target.checked)}
                            className="w-5 h-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            Ida e volta (cada time joga em casa e fora)
                          </span>
                        </label>
                      )}

                      {format === 'groups-playoffs' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Número de Grupos
                            </label>
                            <input
                              type="number"
                              min="2"
                              max="8"
                              value={numGroups}
                              onChange={(e) => setNumGroups(parseInt(e.target.value) || 2)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Times por Grupo
                            </label>
                            <input
                              type="number"
                              value={teamsPerGroup}
                              disabled
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Classificam
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={teamsPerGroup - 1}
                              value={qualifyPerGroup}
                              onChange={(e) => setQualifyPerGroup(parseInt(e.target.value) || 1)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Dates */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full font-bold text-sm">
                        3
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Datas e Horários</h3>
                    </div>

                    <div className="pl-11 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            📅 Data de Início
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ⏱️ Horário Padrão
                          </label>
                          <input
                            type="time"
                            value={defaultTime}
                            onChange={(e) => setDefaultTime(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            📆 Intervalo (dias)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="7"
                            value={intervalDays}
                            onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          📍 Local Padrão (opcional)
                        </label>
                        <input
                          type="text"
                          value={defaultVenue}
                          onChange={(e) => setDefaultVenue(e.target.value)}
                          placeholder="Ex: Ginásio Central"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Preview/Validation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-full font-bold text-sm">
                        4
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Preview da Geração</h3>
                    </div>

                    <div className="pl-11">
                      {validations.length > 0 ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                              <p className="font-semibold text-red-900">Problemas encontrados:</p>
                              <ul className="space-y-1 text-sm text-red-700">
                                {validations.map((error, index) => (
                                  <li key={index}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : preview ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2 text-sm">
                              <p className="font-semibold text-emerald-900">Tudo pronto para gerar!</p>
                              <div className="space-y-1 text-emerald-700">
                                <div>✓ Serão geradas <strong>{preview.stats.totalMatches}</strong> partidas</div>
                                {format === 'groups-playoffs' && (
                                  <>
                                    <div>✓ Fase de grupos + mata-mata</div>
                                  </>
                                )}
                                <div>✓ Duração estimada: <strong>{preview.stats.estimatedWeeks}</strong> semanas</div>
                                {preview.stats.lastDate && (
                                  <div>
                                    ✓ Final prevista para: <strong>{preview.stats.lastDate.toLocaleDateString('pt-BR')}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔴 BOTÃO CLICADO!');
                      console.log('Estado do botão:', {
                        validations: validations.length,
                        preview: !!preview,
                        isGenerating,
                        disabled: validations.length > 0 || !preview || isGenerating
                      });
                      handleGenerate();
                    }}
                    disabled={validations.length > 0 || !preview || isGenerating}
                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5" />
                        Gerar Chaveamento
                      </>
                    )}
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
