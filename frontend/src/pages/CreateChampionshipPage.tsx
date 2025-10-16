import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  UserGroupIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  CalendarIcon,
  EyeIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';

const basicInfoSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  game: z.string().min(1, 'Selecione uma modalidade'),
  maxParticipants: z.number().min(2, 'Mínimo 2 times').max(128, 'Máximo 128 times'),
});

const configSchema = z.object({
  format: z.enum(['groupStageKnockout', 'league', 'knockout']),
  visibility: z.enum(['public', 'private', 'inviteOnly']),
  registrationDeadline: z.string().min(1, 'Data limite é obrigatória'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
});

const prizeSchema = z.object({
  hasEntryFee: z.boolean(),
  entryFee: z.number().optional(),
  prizePool: z.number().optional(),
  prizeDistribution: z.string().optional(),
});

type BasicInfo = z.infer<typeof basicInfoSchema>;
type Config = z.infer<typeof configSchema>;
type Prize = z.infer<typeof prizeSchema>;

export default function CreateChampionshipPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createChampionship } = useChampionshipStore();

  const [formData, setFormData] = useState({
    basicInfo: {} as Partial<BasicInfo>,
    config: {} as Partial<Config>,
    prize: {} as Partial<Prize>,
  });

  const basicInfoForm = useForm<BasicInfo>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: formData.basicInfo,
    mode: 'onChange',
  });

  const configForm = useForm<Config>({
    resolver: zodResolver(configSchema),
    defaultValues: formData.config,
    mode: 'onChange',
  });

  const prizeForm = useForm<Prize>({
    resolver: zodResolver(prizeSchema),
    defaultValues: formData.prize,
    mode: 'onChange',
  });

  const gameCategories = useMemo(
    () => [
      {
        title: 'Modalidades disponíveis',
        description: 'Seis esportes oficiais para criação de campeonatos escolares.',
        items: [
          {
            value: 'futsal',
            label: 'Futsal',
            description: 'Quadra indoor • Equipes 5x5',
            emoji: '⚽',
            badge: 'Popular',
            tags: ['Indoor', '5x5'],
          },
          {
            value: 'basketball',
            label: 'Basquete',
            description: 'Quadra • Equipes 5x5',
            emoji: '🏀',
            tags: ['Quadra', '5x5'],
          },
          {
            value: 'handball',
            label: 'Handebol',
            description: 'Quadra • Equipes 7x7',
            emoji: '🤾',
            tags: ['Quadra', '7x7'],
          },
          {
            value: 'volleyball',
            label: 'Vôlei',
            description: 'Quadra • Equipes 6x6',
            emoji: '🏐',
            tags: ['Quadra', '6x6'],
          },
          {
            value: 'table-tennis',
            label: 'Tênis de Mesa',
            description: 'Mesas oficiais • Rápido e técnico',
            emoji: '🏓',
            tags: ['Indoor', '1x1'],
          },
          {
            value: 'chess',
            label: 'Xadrez',
            description: 'Tabuleiro clássico • Estratégia pura',
            emoji: '♟️',
            tags: ['Estratégia', '1x1'],
          },
        ],
      },
    ],
    []
  );

  const allGameOptions = useMemo(
    () => gameCategories.flatMap((category) => category.items),
    [gameCategories]
  );

  const selectedGame = basicInfoForm.watch('game');
  const selectedGameOption = allGameOptions.find((option) => option.value === selectedGame);
  const [activeGameCategory, setActiveGameCategory] = useState(gameCategories[0]?.title ?? '');
  const [gameSearchTerm, setGameSearchTerm] = useState('');
  const filteredGameCategories = useMemo(() => {
    const search = gameSearchTerm.trim().toLowerCase();
    if (!search) return gameCategories.map((category) => ({ ...category, filteredItems: category.items }));
    return gameCategories
      .map((category) => {
        const filteredItems = category.items.filter((item) => {
          const text = `${item.label} ${item.description} ${item.tags?.join(' ')}`.toLowerCase();
          return text.includes(search);
        });
        return filteredItems.length ? { ...category, filteredItems } : null;
      })
      .filter(Boolean) as Array<typeof gameCategories[number] & { filteredItems: typeof gameCategories[number]['items'] }>;
  }, [gameCategories, gameSearchTerm]);
  const activeCategoryWithFallback = filteredGameCategories.find((category) => category.title === activeGameCategory) ?? filteredGameCategories[0];
  const activeItems = activeCategoryWithFallback?.filteredItems ?? [];
  const { ref: gameRef, ...gameField } = basicInfoForm.register('game');
  const gameError = basicInfoForm.formState.errors.game;

  const handleGameSelect = (value: string) => {
    basicInfoForm.setValue('game', value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleClearGame = () => {
    basicInfoForm.setValue('game', '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const formatOptions = [
    {
      value: 'groupStageKnockout',
      label: 'Fase de Grupos + Mata-mata',
      description: 'Etapa de grupos seguida por eliminação direta',
      emoji: '🧩',
    },
    {
      value: 'league',
      label: 'Pontos Corridos',
      description: 'Todos os times se enfrentam em turno(s) corrido(s)',
      emoji: '🔄',
    },
    {
      value: 'knockout',
      label: 'Mata-mata',
      description: 'Eliminação direta desde o início',
      emoji: '🏆',
    },
  ];

  const visibilityOptions = [
    {
      value: 'public',
      label: 'Público',
      description: 'Qualquer pessoa pode se inscrever',
      emoji: '🌍',
    },
    {
      value: 'private',
      label: 'Privado',
      description: 'Apenas com convite',
      emoji: '🔒',
    },
    {
      value: 'inviteOnly',
      label: 'Somente Convite',
      description: 'Você convida cada participante',
      emoji: '✉️',
    },
  ];

  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await basicInfoForm.trigger();
      if (isValid) {
        setFormData((prev) => ({
          ...prev,
          basicInfo: basicInfoForm.getValues(),
        }));
        toast.success('Informações salvas!');
      }
    } else if (currentStep === 2) {
      isValid = await configForm.trigger();
      if (isValid) {
        setFormData((prev) => ({
          ...prev,
          config: configForm.getValues(),
        }));
        toast.success('Configurações salvas!');
      }
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const isPrizeValid = await prizeForm.trigger();
    if (!isPrizeValid) return;

    if (!formData.basicInfo?.name || !formData.config?.format) {
      toast.error('Por favor, preencha todos os passos anteriores.');
      return;
    }

    setIsSubmitting(true);
    const prizeData = prizeForm.getValues();

    const finalData = {
      name: formData.basicInfo.name,
      description: formData.basicInfo.description || '',
      game: formData.basicInfo.game || '',
      sport: formData.basicInfo.game || '',
      maxParticipants: formData.basicInfo.maxParticipants || 0,
  format: formData.config.format || 'groupStageKnockout',
      visibility: formData.config.visibility || 'public',
      registrationDeadline: formData.config.registrationDeadline || '',
      startDate: formData.config.startDate || '',
      hasEntryFee: prizeData.hasEntryFee || false,
      entryFee: prizeData.entryFee || 0,
      prizePool: prizeData.prizePool || 0,
      prizeDistribution: prizeData.prizeDistribution || '',
      organizerId: user?.id || '',
      status: 'active',
      currentParticipants: 0,
      teams: [],
      games: [],
    };

    try {
      await createChampionship(finalData);
      toast.success('Campeonato criado com sucesso!');
      setTimeout(() => {
        navigate('/championships');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao criar campeonato:', error);
      toast.error(error?.message || 'Erro ao criar campeonato. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: 'Informações Básicas', icon: TrophyIcon, description: 'Nome e descrição' },
    { id: 2, name: 'Configurações', icon: ChartBarIcon, description: 'Formato e datas' },
    { id: 3, name: 'Premiação', icon: CurrencyDollarIcon, description: 'Taxas e prêmios' },
  ];

  return (
    <div className="min-h-screen bg-[#fdf6ef] py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <Link
            to="/championships"
            className="group mb-6 inline-flex items-center text-sm font-medium text-amber-700 transition-all hover:text-amber-800"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Voltar para Campeonatos
          </Link>

          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_20px_45px_-20px_rgba(251,146,60,0.7)]">
              <SparklesIcon className="h-5 w-5 text-white" />
              Novo Campeonato
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Crie seu Campeonato
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Construa uma competição inesquecível com uma jornada guiada e acolhedora em três etapas.
            </p>
          </div>
        </div>

        <div className="mb-8 sm:mb-12">
          <div className="rounded-2xl border border-amber-100/60 bg-[#fffdf9] p-6 shadow-[0_25px_60px_-40px_rgba(251,191,36,0.5)] sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">Progresso</h3>
              <span className="text-sm font-bold text-amber-600">Passo {currentStep} de 3</span>
            </div>

            <div className="relative">
              <div className="absolute left-0 top-8 h-1 w-full rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                />
              </div>

              <div className="relative flex items-start justify-between">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center" style={{ width: '33.333%' }}>
                    <div
                      className={`relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 transform ${
                        step.id < currentStep
                          ? 'scale-100 bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-400 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.6)]'
                          : step.id === currentStep
                          ? 'scale-110 bg-gradient-to-br from-orange-400 via-amber-500 to-rose-400 shadow-[0_20px_45px_-18px_rgba(251,146,60,0.65)] ring-4 ring-orange-100'
                          : 'scale-90 border-2 border-amber-200 bg-white'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckIcon className="h-8 w-8 text-white" />
                      ) : (
                        <step.icon className={`h-8 w-8 ${step.id === currentStep ? 'text-white' : 'text-amber-400'}`} />
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <span className={`block text-sm font-bold transition-colors ${step.id <= currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.name}
                      </span>
                      <span className="mt-1 hidden text-xs text-slate-500 sm:block">{step.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-[0_35px_90px_-50px_rgba(251,191,36,0.5)]">
          <div className="px-6 py-8 sm:p-12">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center pb-6">
                  <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 via-amber-100 to-rose-100 p-3">
                    <TrophyIcon className="h-8 w-8 text-amber-500" />
                  </div>
                  <h2 className="mb-2 text-3xl font-bold text-slate-900">Informações Básicas</h2>
                  <p className="text-slate-600">Vamos começar com o essencial do seu campeonato</p>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label htmlFor="name" className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                      Nome do Campeonato *
                    </label>
                    <input
                      type="text"
                      {...basicInfoForm.register('name')}
                      className="block w-full rounded-xl border-2 border-amber-100 px-5 py-4 text-slate-900 placeholder-slate-400 transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100 group-hover:border-amber-200 text-lg"
                      placeholder="Ex: Copa de Futsal Verão 2025"
                    />
                    {basicInfoForm.formState.errors.name && (
                      <p className="mt-3 text-sm text-red-600 flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                        <InformationCircleIcon className="h-5 w-5" />
                        {basicInfoForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label htmlFor="description" className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                      Descrição Completa *
                    </label>
                    <textarea
                      {...basicInfoForm.register('description')}
                      rows={5}
                      className="block w-full resize-none rounded-xl border-2 border-amber-100 px-5 py-4 text-slate-900 placeholder-slate-400 transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100 group-hover:border-amber-200"
                      placeholder="Descreva seu campeonato: objetivos, regras, local, categoria..."
                    />
                    {basicInfoForm.formState.errors.description && (
                      <p className="mt-3 text-sm text-red-600 flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                        <InformationCircleIcon className="h-5 w-5" />
                        {basicInfoForm.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                            Modalidade *
                          </label>
                          <p className="mt-1 text-sm text-slate-500">
                            Escolha o esporte ou jogo que melhor representa o seu campeonato.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <div className="relative min-w-[220px] flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={gameSearchTerm}
                              onChange={(event) => {
                                setGameSearchTerm(event.target.value);
                                if (event.target.value.trim() && filteredGameCategories.length) {
                                  const firstCategory = filteredGameCategories[0];
                                  if (firstCategory) {
                                    setActiveGameCategory(firstCategory.title);
                                  }
                                }
                              }}
                              placeholder="Buscar modalidade..."
                              className="w-full rounded-lg border border-amber-100 py-2 pl-9 pr-3 text-sm transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                            />
                          </div>
                          {selectedGameOption && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                <span className="text-sm leading-none">{selectedGameOption.emoji}</span>
                                {selectedGameOption.label}
                              </span>
                              <button
                                type="button"
                                onClick={handleClearGame}
                                className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
                              >
                                Limpar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <input type="hidden" {...gameField} ref={gameRef} value={selectedGame || ''} />

                      <div className="mt-4">
                        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-amber-100 pb-2">
                          {filteredGameCategories.length === 0 ? (
                            <p className="text-sm text-slate-500">Nenhuma modalidade encontrada. Ajuste sua busca.</p>
                          ) : (
                            filteredGameCategories.map((category) => (
                              <button
                                key={category.title}
                                type="button"
                                onClick={() => setActiveGameCategory(category.title)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  category.title === activeCategoryWithFallback?.title
                                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-200/40'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                {category.title}
                              </button>
                            ))
                          )}
                        </div>

                        {activeCategoryWithFallback ? (
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                                    {activeCategoryWithFallback.title.charAt(0)}
                                  </span>
                                  {activeCategoryWithFallback.title}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500">
                                  {activeCategoryWithFallback.description}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-slate-400">
                                {activeItems.length} opções nesta categoria
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {activeItems.map((game) => {
                                const isSelected = selectedGame === game.value;
                                return (
                                  <button
                                    type="button"
                                    key={game.value}
                                    onClick={() => handleGameSelect(game.value)}
                                    aria-pressed={isSelected}
                                    className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                                  >
                                    <div
                                      className={`h-full rounded-2xl border-2 p-5 transition-all duration-200 ${
                                        isSelected
                                          ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-200/40'
                                          : 'border-amber-100 bg-white hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                          <span className="text-3xl leading-none">{game.emoji}</span>
                                          <div>
                                            <p className="text-base font-semibold text-slate-900">{game.label}</p>
                                            <p className="text-sm text-slate-500">{game.description}</p>
                                          </div>
                                        </div>
                                        {isSelected ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                            <CheckIcon className="h-4 w-4" />
                                            Selecionado
                                          </span>
                                        ) : (
                                          game.badge && (
                                            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                                              {game.badge}
                                            </span>
                                          )
                                        )}
                                      </div>
                                      {game.tags && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                          {game.tags.map((tag) => (
                                            <span
                                              key={tag}
                                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                                isSelected ? 'bg-white/70 text-amber-600' : 'bg-amber-50 text-amber-600'
                                              }`}
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                            Nenhuma categoria corresponde à sua busca.
                          </div>
                        )}
                      </div>

                      {gameError && (
                        <p className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                          <InformationCircleIcon className="h-5 w-5" />
                          {gameError.message}
                        </p>
                      )}
                    </div>

                    <div className="group">
                      <label htmlFor="maxParticipants" className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                        Máximo de Times *
                      </label>
                      <input
                        type="number"
                        {...basicInfoForm.register('maxParticipants', { valueAsNumber: true })}
                        min="2"
                        max="128"
                        className="block w-full rounded-xl border-2 border-amber-100 px-5 py-4 text-slate-900 transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100 group-hover:border-amber-200 text-lg"
                        placeholder="16"
                      />
                      {basicInfoForm.formState.errors.maxParticipants && (
                        <p className="mt-3 text-sm text-red-600 flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                          <InformationCircleIcon className="h-5 w-5" />
                          {basicInfoForm.formState.errors.maxParticipants.message}
                        </p>
                      )}
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <UserGroupIcon className="h-4 w-4 text-amber-500" />
                        Entre 2 e 128 times
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center pb-6">
                  <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 via-orange-100 to-amber-100 p-3">
                    <ChartBarIcon className="h-8 w-8 text-rose-500" />
                  </div>
                  <h2 className="mb-2 text-3xl font-bold text-slate-900">Configurações do Torneio</h2>
                  <p className="text-slate-600">Escolha o formato e a visibilidade</p>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
                      <ShieldCheckIcon className="h-6 w-6 text-amber-500" />
                      Formato do Campeonato *
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {formatOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`group relative flex cursor-pointer flex-col rounded-2xl border-[3px] p-6 transition-all hover:shadow-xl ${
                            configForm.watch('format') === option.value
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-amber-100 bg-white hover:border-amber-200'
                          }`}
                        >
                          <input type="radio" {...configForm.register('format')} value={option.value} className="sr-only" />
                          <div className="mb-4 text-center text-4xl">{option.emoji}</div>
                          <span className="mb-2 block text-center text-lg font-bold text-slate-900">{option.label}</span>
                          <span className="block text-center text-sm text-slate-600">{option.description}</span>
                          {configForm.watch('format') === option.value && (
                            <div className="absolute top-3 right-3">
                              <CheckIcon className="h-6 w-6 text-amber-500" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-amber-100 pt-8">
                    <label className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
                      <EyeIcon className="h-6 w-6 text-amber-500" />
                      Visibilidade *
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {visibilityOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`group relative flex cursor-pointer flex-col rounded-2xl border-[3px] p-6 transition-all hover:shadow-xl ${
                            configForm.watch('visibility') === option.value
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-amber-100 bg-white hover:border-amber-200'
                          }`}
                        >
                          <input type="radio" {...configForm.register('visibility')} value={option.value} className="sr-only" />
                          <div className="mb-4 text-center text-4xl">{option.emoji}</div>
                          <span className="mb-2 block text-center text-lg font-bold text-slate-900">{option.label}</span>
                          <span className="block text-center text-sm text-slate-600">{option.description}</span>
                          {configForm.watch('visibility') === option.value && (
                            <div className="absolute top-3 right-3">
                              <CheckIcon className="h-6 w-6 text-amber-500" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-amber-100 pt-8">
                    <label className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
                      <CalendarIcon className="h-6 w-6 text-amber-500" />
                      Datas Importantes
                    </label>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="group">
                        <label htmlFor="registrationDeadline" className="mb-3 block text-sm font-semibold text-slate-700">
                          Prazo para Inscrições *
                        </label>
                        <input
                          type="datetime-local"
                          {...configForm.register('registrationDeadline')}
                          className="block w-full rounded-xl border-2 border-amber-100 px-5 py-4 text-slate-900 transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100 group-hover:border-amber-200"
                        />
                      </div>

                      <div className="group">
                        <label htmlFor="startDate" className="mb-3 block text-sm font-semibold text-slate-700">
                          Data de Início *
                        </label>
                        <input
                          type="datetime-local"
                          {...configForm.register('startDate')}
                          className="block w-full rounded-xl border-2 border-amber-100 px-5 py-4 text-slate-900 transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100 group-hover:border-amber-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center pb-6">
                  <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 p-3">
                    <CurrencyDollarIcon className="h-8 w-8 text-amber-500" />
                  </div>
                  <h2 className="mb-2 text-3xl font-bold text-slate-900">Premiação e Taxas</h2>
                  <p className="text-slate-600">Configure taxas e prêmios (opcional)</p>
                </div>

                <div className="space-y-6">
                  <label className="relative flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 transition-all hover:shadow-lg">
                    <input
                      type="checkbox"
                      {...prizeForm.register('hasEntryFee')}
                      className="mt-1 h-6 w-6 cursor-pointer rounded-lg border-amber-300 text-amber-500 focus:ring-amber-400"
                    />
                    <div className="flex-1">
                      <span className="mb-1 block text-lg font-bold text-slate-900">
                        Este campeonato possui taxa de inscrição
                      </span>
                      <span className="block text-sm text-slate-600">Marque se os times precisam pagar para participar</span>
                    </div>
                  </label>

                  {prizeForm.watch('hasEntryFee') && (
                    <div className="space-y-6 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-8">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="entryFee" className="mb-3 block text-sm font-bold text-slate-700">
                            Taxa de Inscrição (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-5 top-4 text-lg font-bold text-amber-500">R$</span>
                            <input
                              type="number"
                              {...prizeForm.register('entryFee', { valueAsNumber: true })}
                              min="0"
                              step="0.01"
                              className="block w-full rounded-xl border-2 border-amber-100 py-4 pl-14 pr-5 text-lg text-slate-900 transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                              placeholder="0,00"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="prizePool" className="mb-3 block text-sm font-bold text-slate-700">
                            Prêmio Total (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-5 top-4 text-lg font-bold text-amber-500">R$</span>
                            <input
                              type="number"
                              {...prizeForm.register('prizePool', { valueAsNumber: true })}
                              min="0"
                              step="0.01"
                              className="block w-full rounded-xl border-2 border-amber-100 py-4 pl-14 pr-5 text-lg text-slate-900 transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="prizeDistribution" className="mb-3 block text-sm font-bold text-slate-700">
                          Distribuição de Prêmios
                        </label>
                        <textarea
                          {...prizeForm.register('prizeDistribution')}
                          rows={4}
                          className="block w-full resize-none rounded-xl border-2 border-amber-100 px-5 py-4 text-slate-900 transition-all placeholder-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                          placeholder="Ex: 1º lugar: 50%, 2º lugar: 30%, 3º lugar: 20%"
                        />
                      </div>
                    </div>
                  )}

                  {!prizeForm.watch('hasEntryFee') && (
                    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-white p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-3xl">🎉</div>
                        <div>
                          <h4 className="mb-1 text-lg font-bold text-emerald-800">Campeonato Gratuito</h4>
                          <p className="text-sm text-emerald-600">Este será um campeonato totalmente gratuito para os times</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t-2 border-amber-100 pt-8">
                    <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-white via-amber-50 to-rose-50 p-8">
                      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <CheckIcon className="h-6 w-6 text-amber-500" />
                        Resumo do Campeonato
                      </h3>
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-amber-100 bg-white p-4">
                          <dt className="mb-1 text-sm font-semibold text-slate-500">Nome</dt>
                          <dd className="text-base font-bold text-slate-900">{formData.basicInfo?.name || '-'}</dd>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-white p-4">
                          <dt className="mb-1 text-sm font-semibold text-slate-500">Modalidade</dt>
                          <dd className="text-base font-bold text-slate-900">{formData.basicInfo?.game || '-'}</dd>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-white p-4">
                          <dt className="mb-1 text-sm font-semibold text-slate-500">Times</dt>
                          <dd className="text-base font-bold text-slate-900">{formData.basicInfo?.maxParticipants || '-'}</dd>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-white p-4">
                          <dt className="mb-1 text-sm font-semibold text-slate-500">Formato</dt>
                          <dd className="text-base font-bold text-slate-900">
                            {formatOptions.find((f) => f.value === formData.config?.format)?.label || '-'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 flex items-center justify-between border-t-2 border-amber-100 pt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center rounded-xl border-2 px-8 py-4 text-base font-bold transition-all ${
                  currentStep === 1
                    ? 'cursor-not-allowed border-amber-100 bg-amber-50 text-amber-300'
                    : 'border-amber-200 bg-white text-amber-700 hover:-translate-x-1 hover:border-amber-300 hover:bg-amber-50 hover:shadow-lg'
                }`}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Voltar
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center rounded-xl border-2 border-transparent px-8 py-4 text-base font-bold text-white transition-all hover:translate-x-1 hover:shadow-xl focus:ring-4 focus:ring-amber-200 bg-gradient-to-r from-orange-400 via-amber-500 to-rose-500 hover:from-orange-500 hover:to-rose-500"
                >
                  Continuar
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-xl border-2 border-transparent px-8 py-4 text-base font-bold text-white transition-all hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-emerald-200 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Criando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="mr-2 h-5 w-5" />
                      Criar Campeonato
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
