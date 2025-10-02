import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';

const basicInfoSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  game: z.string().min(1, 'Selecione um jogo'),
  maxParticipants: z.number().min(2, 'Mínimo 2 participantes').max(128, 'Máximo 128 participantes'),
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
    basicInfo: {} as BasicInfo,
    config: {} as Config,
    prize: {} as Prize,
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

  const games = [
    'League of Legends',
    'Counter-Strike 2',
    'Valorant',
    'Dota 2',
    'FIFA 24',
    'Rocket League',
    'Fortnite',
    'PUBG',
    'Call of Duty',
    'Apex Legends'
  ];

  const formatOptions = [
    { value: 'elimination', label: 'Eliminação Simples', description: 'Formato clássico de mata-mata' },
    { value: 'swiss', label: 'Sistema Suíço', description: 'Todos jogam o mesmo número de partidas' },
    { value: 'roundRobin', label: 'Todos contra Todos', description: 'Cada participante joga contra todos os outros' },
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Público', description: 'Qualquer pessoa pode se inscrever' },
    { value: 'private', label: 'Privado', description: 'Apenas pessoas com convite podem participar' },
    { value: 'inviteOnly', label: 'Somente Convite', description: 'Você deve convidar cada participante' },
  ];

  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await basicInfoForm.trigger();
      if (isValid) {
        setFormData(prev => ({
          ...prev,
          basicInfo: basicInfoForm.getValues()
        }));
        toast.success('✅ Informações básicas salvas!');
      }
    } else if (currentStep === 2) {
      isValid = await configForm.trigger();
      if (isValid) {
        setFormData(prev => ({
          ...prev,
          config: configForm.getValues()
        }));
        toast.success('✅ Configurações salvas!');
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

    setIsSubmitting(true);
    const prizeData = prizeForm.getValues();
    
    const finalData = {
      ...formData.basicInfo,
      ...formData.config,
      hasEntryFee: prizeData.hasEntryFee || false,
      entryFee: prizeData.entryFee || 0,
      prizePool: prizeData.prizePool || 0,
      prizeDistribution: prizeData.prizeDistribution || '',
      organizerId: user?.id || '',
      status: 'upcoming',
      currentParticipants: 0,
    };

    try {
      await createChampionship(finalData);
      toast.success('🎉 Campeonato criado com sucesso!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao criar campeonato:', error);
      toast.error(error?.message || 'Erro ao criar campeonato. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: 'Informações Básicas', icon: TrophyIcon },
    { id: 2, name: 'Configurações', icon: UserGroupIcon },
    { id: 3, name: 'Premiação', icon: CurrencyDollarIcon },
  ];

  const getProgressPercentage = () => {
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Criar Novo Campeonato
              </h1>
              <p className="mt-1 text-gray-600">
                Configure seu campeonato em 3 passos simples
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="relative">
            <div className="overflow-hidden h-2 mb-6 text-xs flex rounded-full bg-gray-200">
              <div
                style={{ width: `${getProgressPercentage()}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
              />
            </div>
          </div>
          
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((step) => (
                <li key={step.id} className="relative flex-1 flex flex-col items-center">
                  <div
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                      step.id < currentStep
                        ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg scale-110'
                        : step.id === currentStep
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl scale-125 ring-4 ring-indigo-200'
                        : 'bg-white border-2 border-gray-300'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <CheckIcon className="h-7 w-7 text-white" />
                    ) : (
                      <step.icon
                        className={`h-7 w-7 ${
                          step.id === currentStep ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-3 block text-sm font-semibold ${
                      step.id <= currentStep ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-8 sm:p-10">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrophyIcon className="h-7 w-7 text-indigo-600" />
                    Informações Básicas
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Defina o nome, jogo e capacidade do seu campeonato
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome do Campeonato *
                    </label>
                    <input
                      type="text"
                      {...basicInfoForm.register('name')}
                      className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Ex: Campeonato de Verão 2025"
                    />
                    {basicInfoForm.formState.errors.name && (
                      <p className="mt-2 text-sm text-red-600">
                        {basicInfoForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descrição *
                    </label>
                    <textarea
                      {...basicInfoForm.register('description')}
                      rows={4}
                      className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Descreva seu campeonato..."
                    />
                    {basicInfoForm.formState.errors.description && (
                      <p className="mt-2 text-sm text-red-600">
                        {basicInfoForm.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="game" className="block text-sm font-medium text-gray-700">
                      Jogo *
                    </label>
                    <select
                      {...basicInfoForm.register('game')}
                      className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Selecione um jogo</option>
                      {games.map((game) => (
                        <option key={game} value={game}>
                          {game}
                        </option>
                      ))}
                    </select>
                    {basicInfoForm.formState.errors.game && (
                      <p className="mt-2 text-sm text-red-600">
                        {basicInfoForm.formState.errors.game.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                      Máximo de Participantes *
                    </label>
                    <input
                      type="number"
                      {...basicInfoForm.register('maxParticipants', { valueAsNumber: true })}
                      min="2"
                      max="128"
                      className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {basicInfoForm.formState.errors.maxParticipants && (
                      <p className="mt-2 text-sm text-red-600">
                        {basicInfoForm.formState.errors.maxParticipants.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Configurações do Campeonato
                  </h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Formato do Campeonato *
                  </label>
                  <div className="space-y-3">
                    {formatOptions.map((option) => (
                      <label key={option.value} className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none">
                        <input
                          type="radio"
                          {...configForm.register('format')}
                          value={option.value}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3 flex flex-col">
                          <span className="block text-sm font-medium text-gray-900">
                            {option.label}
                          </span>
                          <span className="block text-sm text-gray-500">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Visibilidade *
                  </label>
                  <div className="space-y-3">
                    {visibilityOptions.map((option) => (
                      <label key={option.value} className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none">
                        <input
                          type="radio"
                          {...configForm.register('visibility')}
                          value={option.value}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3 flex flex-col">
                          <span className="block text-sm font-medium text-gray-900">
                            {option.label}
                          </span>
                          <span className="block text-sm text-gray-500">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700">
                      <ClockIcon className="inline h-4 w-4 mr-1" />
                      Data Limite para Inscrições *
                    </label>
                    <input
                      type="datetime-local"
                      {...configForm.register('registrationDeadline')}
                      className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      <ClockIcon className="inline h-4 w-4 mr-1" />
                      Data de Início *
                    </label>
                    <input
                      type="datetime-local"
                      {...configForm.register('startDate')}
                      className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Prizes */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Configuração de Premiação
                  </h2>
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...prizeForm.register('hasEntryFee')}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Este campeonato tem taxa de inscrição
                    </label>
                  </div>
                </div>

                {prizeForm.watch('hasEntryFee') && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="entryFee" className="block text-sm font-medium text-gray-700">
                        Taxa de Inscrição (R$)
                      </label>
                      <input
                        type="number"
                        {...prizeForm.register('entryFee', { valueAsNumber: true })}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="prizePool" className="block text-sm font-medium text-gray-700">
                        Prêmio Total (R$)
                      </label>
                      <input
                        type="number"
                        {...prizeForm.register('prizePool', { valueAsNumber: true })}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="prizeDistribution" className="block text-sm font-medium text-gray-700">
                    Distribuição dos Prêmios
                  </label>
                  <textarea
                    {...prizeForm.register('prizeDistribution')}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: 1º lugar: 50%, 2º lugar: 30%, 3º lugar: 20%"
                  />
                </div>

                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <TrophyIcon className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Revisão Final
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p><strong>Nome:</strong> {formData.basicInfo.name || '-'}</p>
                        <p><strong>Jogo:</strong> {formData.basicInfo.game || '-'}</p>
                        <p><strong>Participantes:</strong> {formData.basicInfo.maxParticipants || '-'}</p>
                        <p><strong>Formato:</strong> {formatOptions.find(f => f.value === formData.config.format)?.label || '-'}</p>
                        <p><strong>Visibilidade:</strong> {visibilityOptions.find(v => v.value === formData.config.visibility)?.label || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  currentStep === 1
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Anterior
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Próximo
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Campeonato'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
