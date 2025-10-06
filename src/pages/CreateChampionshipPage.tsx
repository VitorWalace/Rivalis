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
  format: z.enum(['elimination', 'swiss', 'roundRobin']),
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
        title: 'Futebol & Quadra',
        description: 'Modalidades com bola em gramados e quadras.',
        items: [
          {
            value: 'Futsal',
            label: 'Futsal',
            description: 'Quadra indoor • Equipes 5x5',
            emoji: '⚽',
            badge: 'Popular',
            tags: ['Indoor', '5x5'],
          },
          {
            value: 'Futebol de Campo',
            label: 'Futebol de Campo',
            description: 'Gramado oficial • Equipes 11x11',
            emoji: '🏟️',
            tags: ['Ar livre', '11x11'],
          },
          {
            value: 'Society',
            label: 'Society',
            description: 'Gramado sintético • Equipes 7x7',
            emoji: '🥅',
            tags: ['Sintético', '7x7'],
          },
          {
            value: 'Beach Soccer',
            label: 'Beach Soccer',
            description: 'Areia • Equipes 5x5',
            emoji: '🏖️',
            tags: ['Areia', '5x5'],
          },
        ],
      },
      {
        title: 'Esportes Coletivos',
        description: 'Times em quadra com muita estratégia e intensidade.',
        items: [
          {
            value: 'Basquete',
            label: 'Basquete',
            description: 'Quadra • Equipes 5x5',
            emoji: '🏀',
            badge: 'Clássico',
            tags: ['Quadra', '5x5'],
          },
          {
            value: 'Vôlei',
            label: 'Vôlei',
            description: 'Quadra • Equipes 6x6',
            emoji: '🏐',
            tags: ['Quadra', '6x6'],
          },
          {
            value: 'Vôlei de Praia',
            label: 'Vôlei de Praia',
            description: 'Areia • Duplas ou quartetos',
            emoji: '🏝️',
            tags: ['Areia', 'Duplas'],
          },
          {
            value: 'Handebol',
            label: 'Handebol',
            description: 'Quadra • Equipes 7x7',
            emoji: '🤾',
            tags: ['Quadra', '7x7'],
          },
        ],
      },
      {
        title: 'Esportes Individuais',
        description: 'Competições para atletas solo ou pequenos grupos.',
        items: [
          {
            value: 'Tênis',
            label: 'Tênis',
            description: 'Quadra rápida ou saibro',
            emoji: '🎾',
            tags: ['Singles', 'Duplas'],
          },
          {
            value: 'Tênis de Mesa',
            label: 'Tênis de Mesa',
            description: 'Mesas oficiais • Rápido e técnico',
            emoji: '🏓',
            tags: ['Indoor', '1x1'],
          },
          {
            value: 'Natação',
            label: 'Natação',
            description: 'Piscina olímpica ou curta',
            emoji: '🏊',
            tags: ['Piscina', 'Baterias'],
          },
          {
            value: 'Atletismo',
            label: 'Atletismo',
            description: 'Pista e campo • Múltiplas provas',
            emoji: '🏃',
            tags: ['Pista', 'Multievento'],
          },
          {
            value: 'Skate',
            label: 'Skate',
            description: 'Street ou park',
            emoji: '🛹',
            tags: ['Park', 'Street'],
          },
          {
            value: 'MMA',
            label: 'MMA',
            description: 'Octógono ou ringue',
            emoji: '🥋',
            tags: ['Combate', '1x1'],
          },
        ],
      },
      {
        title: 'Esportes Eletrônicos',
        description: 'Competições digitais em equipes ou solo.',
        items: [
          {
            value: 'FIFA / EA Sports FC',
            label: 'FIFA / EA Sports FC',
            description: 'Console ou PC • Partidas rápidas',
            emoji: '🎮',
            badge: 'E-sports',
            tags: ['Online', 'Futebol digital'],
          },
          {
            value: 'League of Legends',
            label: 'League of Legends',
            description: 'MOBA • Equipes 5v5',
            emoji: '🧙‍♂️',
            tags: ['MOBA', '5v5'],
          },
          {
            value: 'Counter-Strike 2',
            label: 'Counter-Strike 2',
            description: 'FPS competitivo • Equipes 5v5',
            emoji: '🎯',
            tags: ['FPS', '5v5'],
          },
          {
            value: 'Valorant',
            label: 'Valorant',
            description: 'FPS tático • Equipes 5v5',
            emoji: '💥',
            tags: ['FPS', '5v5'],
          },
          {
            value: 'Rocket League',
            label: 'Rocket League',
            description: 'Carros + futebol • Equipes 3v3',
            emoji: '🚗',
            tags: ['Arcade', '3v3'],
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
      value: 'elimination',
      label: 'Eliminação Simples',
      description: 'Formato clássico de mata-mata',
      emoji: '🏆',
    },
    {
      value: 'swiss',
      label: 'Sistema Suíço',
      description: 'Todos jogam o mesmo número de partidas',
      emoji: '⚖️',
    },
    {
      value: 'roundRobin',
      label: 'Todos contra Todos',
      description: 'Cada time enfrenta todos os outros',
      emoji: '🔄',
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
      format: formData.config.format || 'elimination',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <Link
            to="/championships"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-6 transition-all group"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Voltar para Campeonatos
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-semibold mb-4 shadow-lg">
              <SparklesIcon className="h-5 w-5" />
              Novo Campeonato
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              Crie seu Campeonato
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Configure todos os detalhes em apenas 3 passos simples
            </p>
          </div>
        </div>

        <div className="mb-8 sm:mb-12">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Progresso</h3>
              <span className="text-sm font-bold text-indigo-600">Passo {currentStep} de 3</span>
            </div>

            <div className="relative">
              <div className="absolute top-8 left-0 w-full h-1 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                />
              </div>

              <div className="relative flex items-start justify-between">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center" style={{ width: '33.333%' }}>
                    <div
                      className={`relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 transform ${
                        step.id < currentStep
                          ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg scale-100'
                          : step.id === currentStep
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl scale-110 ring-4 ring-blue-200'
                          : 'bg-white border-2 border-gray-300 scale-90'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckIcon className="h-8 w-8 text-white" />
                      ) : (
                        <step.icon className={`h-8 w-8 ${step.id === currentStep ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <span className={`block text-sm font-bold transition-colors ${step.id <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.name}
                      </span>
                      <span className="block text-xs text-gray-500 mt-1 hidden sm:block">{step.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-8 sm:p-12">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center pb-6">
                  <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
                    <TrophyIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Informações Básicas</h2>
                  <p className="text-gray-600">Vamos começar com o essencial do seu campeonato</p>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
                      Nome do Campeonato *
                    </label>
                    <input
                      type="text"
                      {...basicInfoForm.register('name')}
                      className="block w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-lg group-hover:border-gray-300"
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
                    <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
                      Descrição Completa *
                    </label>
                    <textarea
                      {...basicInfoForm.register('description')}
                      rows={5}
                      className="block w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none group-hover:border-gray-300"
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
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                        <div>
                          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
                            Modalidade *
                          </label>
                          <p className="text-sm text-gray-500 mt-1">
                            Escolha o esporte ou jogo que melhor representa o seu campeonato.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2">
                          <div className="relative flex-1 min-w-[220px]">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            />
                          </div>
                          {selectedGameOption && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                <span className="text-sm leading-none">{selectedGameOption.emoji}</span>
                                {selectedGameOption.label}
                              </span>
                              <button
                                type="button"
                                onClick={handleClearGame}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                Limpar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <input type="hidden" {...gameField} ref={gameRef} value={selectedGame || ''} />

                      <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                          {filteredGameCategories.length === 0 ? (
                            <p className="text-sm text-gray-500">Nenhuma modalidade encontrada. Ajuste sua busca.</p>
                          ) : (
                            filteredGameCategories.map((category) => (
                              <button
                                key={category.title}
                                type="button"
                                onClick={() => setActiveGameCategory(category.title)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  category.title === activeCategoryWithFallback?.title
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                                    {activeCategoryWithFallback.title.charAt(0)}
                                  </span>
                                  {activeCategoryWithFallback.title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {activeCategoryWithFallback.description}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-gray-400">
                                {activeItems.length} opções nesta categoria
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {activeItems.map((game) => {
                                const isSelected = selectedGame === game.value;
                                return (
                                  <button
                                    type="button"
                                    key={game.value}
                                    onClick={() => handleGameSelect(game.value)}
                                    aria-pressed={isSelected}
                                    className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                                  >
                                    <div
                                      className={`h-full rounded-2xl border-2 p-5 transition-all duration-200 ${
                                        isSelected
                                          ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                          <span className="text-3xl leading-none">{game.emoji}</span>
                                          <div>
                                            <p className="text-base font-semibold text-gray-900">{game.label}</p>
                                            <p className="text-sm text-gray-500">{game.description}</p>
                                          </div>
                                        </div>
                                        {isSelected ? (
                                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-sm">
                                            <CheckIcon className="h-4 w-4" />
                                            Selecionado
                                          </span>
                                        ) : (
                                          game.badge && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
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
                                                isSelected ? 'bg-white/80 text-indigo-600' : 'bg-gray-100 text-gray-600'
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
                        <p className="mt-3 text-sm text-red-600 flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                          <InformationCircleIcon className="h-5 w-5" />
                          {gameError.message}
                        </p>
                      )}
                    </div>

                    <div className="group">
                      <label htmlFor="maxParticipants" className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
                        Máximo de Times *
                      </label>
                      <input
                        type="number"
                        {...basicInfoForm.register('maxParticipants', { valueAsNumber: true })}
                        min="2"
                        max="128"
                        className="block w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-lg group-hover:border-gray-300"
                        placeholder="16"
                      />
                      {basicInfoForm.formState.errors.maxParticipants && (
                        <p className="mt-3 text-sm text-red-600 flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                          <InformationCircleIcon className="h-5 w-5" />
                          {basicInfoForm.formState.errors.maxParticipants.message}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4" />
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
                  <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4">
                    <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Configurações do Torneio</h2>
                  <p className="text-gray-600">Escolha o formato e a visibilidade</p>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                      Formato do Campeonato *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {formatOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`relative flex flex-col cursor-pointer rounded-2xl border-3 p-6 hover:shadow-xl transition-all group ${
                            configForm.watch('format') === option.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input type="radio" {...configForm.register('format')} value={option.value} className="sr-only" />
                          <div className="text-4xl mb-4 text-center">{option.emoji}</div>
                          <span className="block text-lg font-bold text-gray-900 text-center mb-2">{option.label}</span>
                          <span className="block text-sm text-gray-600 text-center">{option.description}</span>
                          {configForm.watch('format') === option.value && (
                            <div className="absolute top-3 right-3">
                              <CheckIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-100 pt-8">
                    <label className="block text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <EyeIcon className="h-6 w-6 text-indigo-600" />
                      Visibilidade *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {visibilityOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`relative flex flex-col cursor-pointer rounded-2xl border-3 p-6 hover:shadow-xl transition-all group ${
                            configForm.watch('visibility') === option.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input type="radio" {...configForm.register('visibility')} value={option.value} className="sr-only" />
                          <div className="text-4xl mb-4 text-center">{option.emoji}</div>
                          <span className="block text-lg font-bold text-gray-900 text-center mb-2">{option.label}</span>
                          <span className="block text-sm text-gray-600 text-center">{option.description}</span>
                          {configForm.watch('visibility') === option.value && (
                            <div className="absolute top-3 right-3">
                              <CheckIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-100 pt-8">
                    <label className="block text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6 text-indigo-600" />
                      Datas Importantes
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="group">
                        <label htmlFor="registrationDeadline" className="block text-sm font-semibold text-gray-700 mb-3">
                          Prazo para Inscrições *
                        </label>
                        <input
                          type="datetime-local"
                          {...configForm.register('registrationDeadline')}
                          className="block w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all group-hover:border-gray-300"
                        />
                      </div>

                      <div className="group">
                        <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-3">
                          Data de Início *
                        </label>
                        <input
                          type="datetime-local"
                          {...configForm.register('startDate')}
                          className="block w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all group-hover:border-gray-300"
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
                  <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl mb-4">
                    <CurrencyDollarIcon className="h-8 w-8 text-amber-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Premiação e Taxas</h2>
                  <p className="text-gray-600">Configure taxas e prêmios (opcional)</p>
                </div>

                <div className="space-y-6">
                  <label className="relative flex items-start gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl cursor-pointer hover:shadow-lg transition-all">
                    <input
                      type="checkbox"
                      {...prizeForm.register('hasEntryFee')}
                      className="mt-1 h-6 w-6 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="block text-lg font-bold text-gray-900 mb-1">
                        Este campeonato possui taxa de inscrição
                      </span>
                      <span className="block text-sm text-gray-600">Marque se os times precisam pagar para participar</span>
                    </div>
                  </label>

                  {prizeForm.watch('hasEntryFee') && (
                    <div className="space-y-6 p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="entryFee" className="block text-sm font-bold text-gray-700 mb-3">
                            Taxa de Inscrição (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-5 top-4 text-gray-500 font-bold text-lg">R$</span>
                            <input
                              type="number"
                              {...prizeForm.register('entryFee', { valueAsNumber: true })}
                              min="0"
                              step="0.01"
                              className="block w-full rounded-xl border-2 border-gray-200 pl-14 pr-5 py-4 text-gray-900 text-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                              placeholder="0,00"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="prizePool" className="block text-sm font-bold text-gray-700 mb-3">
                            Prêmio Total (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-5 top-4 text-gray-500 font-bold text-lg">R$</span>
                            <input
                              type="number"
                              {...prizeForm.register('prizePool', { valueAsNumber: true })}
                              min="0"
                              step="0.01"
                              className="block w-full rounded-xl border-2 border-gray-200 pl-14 pr-5 py-4 text-gray-900 text-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="prizeDistribution" className="block text-sm font-bold text-gray-700 mb-3">
                          Distribuição de Prêmios
                        </label>
                        <textarea
                          {...prizeForm.register('prizeDistribution')}
                          rows={4}
                          className="block w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all resize-none"
                          placeholder="Ex: 1º lugar: 50%, 2º lugar: 30%, 3º lugar: 20%"
                        />
                      </div>
                    </div>
                  )}

                  {!prizeForm.watch('hasEntryFee') && (
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 text-3xl">🎉</div>
                        <div>
                          <h4 className="text-lg font-bold text-green-900 mb-1">Campeonato Gratuito</h4>
                          <p className="text-sm text-green-700">Este será um campeonato totalmente gratuito para os times</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t-2 border-gray-100 pt-8">
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CheckIcon className="h-6 w-6 text-indigo-600" />
                        Resumo do Campeonato
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <dt className="text-sm font-semibold text-gray-500 mb-1">Nome</dt>
                          <dd className="text-base font-bold text-gray-900">{formData.basicInfo?.name || '-'}</dd>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <dt className="text-sm font-semibold text-gray-500 mb-1">Modalidade</dt>
                          <dd className="text-base font-bold text-gray-900">{formData.basicInfo?.game || '-'}</dd>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <dt className="text-sm font-semibold text-gray-500 mb-1">Times</dt>
                          <dd className="text-base font-bold text-gray-900">{formData.basicInfo?.maxParticipants || '-'}</dd>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <dt className="text-sm font-semibold text-gray-500 mb-1">Formato</dt>
                          <dd className="text-base font-bold text-gray-900">
                            {formatOptions.find((f) => f.value === formData.config?.format)?.label || '-'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 flex items-center justify-between pt-8 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center px-8 py-4 border-2 text-base font-bold rounded-xl transition-all ${
                  currentStep === 1
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg transform hover:-translate-x-1'
                }`}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Voltar
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center px-8 py-4 border-2 border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-indigo-200 shadow-lg hover:shadow-xl transition-all transform hover:translate-x-1"
                >
                  Continuar
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-4 border-2 border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-200 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                      <CheckIcon className="h-5 w-5 mr-2" />
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
