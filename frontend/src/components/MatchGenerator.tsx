import { Fragment, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { generateKnockout, generateGroupsAndPlayoffs, type GroupInfo } from '../utils/matchGenerators';
import { scheduleMatches, calculateScheduleStats } from '../utils/dateScheduler';
import type { Team } from '../types';
import type { ScheduledMatch } from '../utils/dateScheduler';

type Format = 'knockout' | 'groups-playoffs';

const isPowerOfTwo = (value: number) => value > 0 && Number.isInteger(Math.log2(value));

interface MatchGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onGenerate: (matches: ScheduledMatch[], format: Format) => Promise<void>;
}

export default function MatchGenerator({ isOpen, onClose, teams, onGenerate }: MatchGeneratorProps) {
  console.log('🟢 MatchGenerator renderizado:', { isOpen, teamsCount: teams.length });
  
  const [format, setFormat] = useState<Format>('groups-playoffs');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const teamsPerGroup = numGroups > 0 ? Math.floor(teams.length / numGroups) : 0;

  // Validações
  const validations = useMemo(() => {
    const errors: string[] = [];

    if (teams.length < 2) {
      errors.push('São necessários pelo menos 2 times cadastrados');
    }

    if (format === 'knockout') {
      if (!isPowerOfTwo(teams.length)) {
        errors.push('Formato mata-mata requer 2, 4, 8, 16... times. Ajuste a quantidade de participantes.');
      }
    }

    if (format === 'groups-playoffs') {
      if (teams.length < numGroups * 2) {
        errors.push(`São necessários pelo menos ${numGroups * 2} times para ${numGroups} grupos`);
      }

      if (teams.length % numGroups !== 0) {
        errors.push('O número de times deve ser divisível pelo número de grupos');
      }

      if (teamsPerGroup > 0 && qualifyPerGroup >= teamsPerGroup) {
        errors.push('Classificados por grupo deve ser menor que times por grupo');
      }

      if (qualifyPerGroup < 1) {
        errors.push('É necessário pelo menos 1 classificado por grupo');
      }

      const totalQualified = numGroups * qualifyPerGroup;
      if (!isPowerOfTwo(totalQualified)) {
        errors.push('Número de classificados para o mata-mata deve ser uma potência de 2 (2, 4, 8, 16...).');
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

    const groupPlayoffIssues = useMemo(() => {
      if (format !== 'groups-playoffs') return [] as string[];

      const issues: string[] = [];

      if (teams.length < numGroups * 2) {
        issues.push(`Adicione mais times: este formato precisa de pelo menos ${numGroups * 2} participantes para ${numGroups} grupos.`);
      }

      if (teams.length % numGroups !== 0) {
        issues.push('Distribua os times para que o total seja divisível pelo número de grupos.');
      }

      if (teamsPerGroup > 0 && qualifyPerGroup >= teamsPerGroup) {
        issues.push('Reduza o número de classificados por grupo: ele deve ser menor que a quantidade de times em cada grupo.');
      }

      if (qualifyPerGroup < 1) {
        issues.push('Defina pelo menos 1 classificado por grupo.');
      }

      const totalQualified = numGroups * qualifyPerGroup;
      if (!isPowerOfTwo(totalQualified)) {
        issues.push('A fase mata-mata precisa receber 2, 4, 8, 16... equipes. Ajuste grupos ou classificados até chegar em uma potência de 2.');
      }

      return issues;
    }, [format, teams.length, numGroups, teamsPerGroup, qualifyPerGroup]);

  // Preview da geração
  const preview = useMemo(() => {
    if (validations.length > 0) {
      console.log('Preview bloqueado por validações:', validations);
      return null;
    }

    try {
      let matches;
      let groups: GroupInfo[] | null = null;

      switch (format) {
        case 'knockout':
          matches = generateKnockout(teams);
          break;
        case 'groups-playoffs':
          const result = generateGroupsAndPlayoffs(teams, numGroups, qualifyPerGroup);
          matches = result.matches;
          groups = result.groups;
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
        groups,
      };
    } catch (error) {
      console.error('Erro no preview:', error);
      return null;
    }
  }, [validations, format, teams, numGroups, qualifyPerGroup, startDate, defaultTime, intervalDays, defaultVenue]);

  const handleGenerate = async () => {
    console.log('handleGenerate chamado!');
    console.log('Preview:', preview);
    console.log('Validations:', validations);
    console.log('Format:', format);
    
    if (!preview || validations.length > 0) {
      console.log('Validação falhou:', { preview, validations });
      toast.error('Por favor, corrija os erros antes de gerar');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Gerando partidas:', preview.matches.length, 'no formato:', format);
      await onGenerate(preview.matches, format);
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-2xl backdrop-blur transition-all">
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
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 border border-purple-400/40 text-purple-200 rounded-full font-bold text-sm backdrop-blur">
                        1
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100">Formato do Campeonato</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                      <button
                        onClick={() => setFormat('knockout')}
                        className={`p-4 rounded-xl border-2 transition-all text-left backdrop-blur ${
                          format === 'knockout'
                            ? 'border-purple-400/60 bg-purple-500/20 shadow-md'
                            : 'border-white/20 hover:border-white/30 bg-slate-800/40'
                        }`}
                      >
                        <div className="font-semibold text-slate-100 mb-2">🏆 Mata-mata</div>
                        <p className="text-xs text-slate-300">Eliminação simples</p>
                      </button>

                      <button
                        onClick={() => setFormat('groups-playoffs')}
                        className={`p-4 rounded-xl border-2 transition-all text-left backdrop-blur ${
                          format === 'groups-playoffs'
                            ? 'border-purple-400/60 bg-purple-500/20 shadow-md'
                            : 'border-white/20 hover:border-white/30 bg-slate-800/40'
                        }`}
                      >
                        <div className="font-semibold text-slate-100 mb-2">⚡ Grupos + Playoffs</div>
                        <p className="text-xs text-slate-300">Fase de grupos + mata-mata</p>
                      </button>
                    </div>
                  </div>

                  {/* Warning: Invalid Knockout Team Count */}
                  {format === 'knockout' && teams.length > 0 && !isPowerOfTwo(teams.length) && (
                    <div className="bg-red-500/20 border-2 border-red-400/40 rounded-xl p-4 backdrop-blur">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-200 mb-2">⚠️ Ajuste a quantidade de times</h4>
                          <p className="text-sm text-red-300 mb-2">
                            O formato mata-mata exige uma quantidade de participantes que seja potência de 2 (2, 4, 8, 16, ...).
                          </p>
                          <p className="text-sm text-red-300">
                            Adicione ou remova times até atingir um desses números antes de gerar o chaveamento.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 2: Advanced Config */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 border border-blue-400/40 text-blue-200 rounded-full font-bold text-sm backdrop-blur">
                        2
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100">Configurações Avançadas</h3>
                    </div>

                    <div className="pl-11 space-y-4">
                      {format === 'groups-playoffs' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Número de Grupos
                            </label>
                            <input
                              type="number"
                              min="2"
                              max="8"
                              value={numGroups}
                              onChange={(e) => setNumGroups(parseInt(e.target.value) || 2)}
                              className="w-full px-4 py-2 border border-white/20 bg-slate-800/40 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Times por Grupo
                            </label>
                            <input
                              type="number"
                              value={teamsPerGroup}
                              disabled
                              className="w-full px-4 py-2 border border-white/10 bg-slate-700/40 text-slate-400 rounded-lg backdrop-blur"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Classificam
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={teamsPerGroup - 1}
                              value={qualifyPerGroup}
                              onChange={(e) => setQualifyPerGroup(parseInt(e.target.value) || 1)}
                              className="w-full px-4 py-2 border border-white/20 bg-slate-800/40 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur"
                            />
                          </div>
                        </div>
                      )}

                      {format === 'groups-playoffs' && groupPlayoffIssues.length > 0 && (
                        <div className="bg-red-500/20 border border-red-400/40 rounded-lg p-4 space-y-2 backdrop-blur">
                          <div className="flex items-start gap-3">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1 text-sm text-red-300">
                              <p className="font-semibold text-red-200">Ajuste a configuração dos grupos:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                {groupPlayoffIssues.map((issue, index) => (
                                  <li key={index}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Dates */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 rounded-full font-bold text-sm backdrop-blur">
                        3
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100">Datas e Horários</h3>
                    </div>

                    <div className="pl-11 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            📅 Data de Início
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 border border-white/20 bg-slate-800/40 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            ⏱️ Horário Padrão
                          </label>
                          <input
                            type="time"
                            value={defaultTime}
                            onChange={(e) => setDefaultTime(e.target.value)}
                            className="w-full px-4 py-2 border border-white/20 bg-slate-800/40 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            📆 Intervalo (dias)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="7"
                            value={intervalDays}
                            onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-2 border border-white/20 bg-slate-800/40 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          📍 Local Padrão (opcional)
                        </label>
                        <input
                          type="text"
                          value={defaultVenue}
                          onChange={(e) => setDefaultVenue(e.target.value)}
                          placeholder="Ex: Ginásio Central"
                          className="w-full px-4 py-2 border border-white/20 bg-slate-800/40 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Preview/Validation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-amber-500/20 border border-amber-400/40 text-amber-200 rounded-full font-bold text-sm backdrop-blur">
                        4
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100">Preview da Geração</h3>
                    </div>

                    <div className="pl-11">
                      {validations.length > 0 ? (
                        <div className="bg-red-500/20 border border-red-400/40 rounded-lg p-4 backdrop-blur">
                          <div className="flex items-start gap-3">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                              <p className="font-semibold text-red-200">Problemas encontrados:</p>
                              <ul className="space-y-1 text-sm text-red-300">
                                {validations.map((error, index) => (
                                  <li key={index}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : preview ? (
                        <>
                          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-lg p-4 backdrop-blur">
                            <div className="flex items-start gap-3">
                              <CheckCircleIcon className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                              <div className="space-y-2 text-sm">
                                <p className="font-semibold text-emerald-200">Tudo pronto para gerar!</p>
                                <div className="space-y-1 text-emerald-300">
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

                          {/* Visualização dos Grupos Gerados */}
                          {preview.groups && preview.groups.length > 0 && (
                            <div className="mt-4 bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur">
                              <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 px-4 py-3 border-b border-white/10 backdrop-blur">
                                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                                  <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Grupos Sorteados
                                </h4>
                              </div>
                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {preview.groups.map((group) => (
                                  <div key={group.name} className="bg-slate-700/40 border border-white/10 rounded-lg overflow-hidden backdrop-blur">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2">
                                      <h5 className="font-bold text-white text-center">{group.name}</h5>
                                    </div>
                                    <div className="p-3 space-y-2">
                                      {group.teams.map((team, index) => (
                                        <div key={team.id} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2 border border-white/10 backdrop-blur">
                                          <span className="flex items-center justify-center w-6 h-6 bg-slate-600/60 text-slate-200 rounded-full text-xs font-bold">
                                            {index + 1}
                                          </span>
                                          {team.logo ? (
                                            <img 
                                              src={team.logo} 
                                              alt={team.name} 
                                              className="w-8 h-8 rounded-lg object-cover border border-white/20"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center border border-white/20">
                                              <span className="text-xs font-bold text-slate-300">{team.name.charAt(0)}</span>
                                            </div>
                                          )}
                                          <span className="flex-1 font-medium text-slate-200 text-sm">
                                            {team.name}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-amber-500/20 border-t border-amber-400/40 px-4 py-2.5 backdrop-blur">
                                <p className="text-xs text-amber-200 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Os <strong>{qualifyPerGroup}</strong> primeiros de cada grupo avançam para o mata-mata</span>
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-800/60 border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3 backdrop-blur">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-slate-300 hover:bg-slate-700/40 border border-white/10 rounded-lg font-medium transition-colors backdrop-blur"
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
