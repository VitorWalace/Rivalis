import { useState } from 'react';
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
  ChartBarIcon
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
    // Esportes Físicos
    'Futsal',
    'Futebol de Campo',
    'Society',
    'Beach Soccer (Futebol de Areia)',
    'Futebol Americano',
    'Basquete',
    'Vôlei',
    'Vôlei de Praia',
    'Handebol',
    'Tênis',
    'Tênis de Mesa',
    'Badminton',
    'Natação',
    'Atletismo',
    'Ciclismo',
    'Skate',
    'MMA / Artes Marciais',
    'Boxe',
    'Jiu-Jitsu',
    'Corrida de Rua',
    'Crossfit',
    // E-Sports
    'FIFA / EA Sports FC',
    'eFootball (PES)',
    'League of Legends',
    'Counter-Strike 2',
    'Valorant',
    'Dota 2',
    'Rocket League',
    'Fortnite',
    'Free Fire',
    'Call of Duty',
    'Rainbow Six Siege',
    'Apex Legends',
    'Mobile Legends'
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

    // Validar se os dados dos passos anteriores foram salvos
    if (!formData.basicInfo || !formData.config) {
      toast.error('Por favor, preencha todos os passos anteriores.');
      return;
    }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Criar Novo Campeonato
              </h1>
              <p className="mt-3 text-lg text-slate-600 max-w-2xl">
                Configure todos os detalhes do seu campeonato profissional em etapas simples e organizadas
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <InformationCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Passo {currentStep} de 3</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <nav aria-label="Progress" className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <ol className="flex items-center justify-between relative">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className="relative flex flex-col items-center flex-1">
                  {/* Connector Line */}
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute top-7 left-1/2 w-full h-0.5 -z-10" aria-hidden="true">
                      <div className={`h-full transition-colors duration-300 ${
                        step.id < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                      }`} />
                    </div>
                  )}
                  
                  <div className="relative flex flex-col items-center group z-10">
                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                        step.id < currentStep
                          ? 'bg-blue-600 shadow-md'
                          : step.id === currentStep
                          ? 'bg-blue-600 shadow-lg ring-4 ring-blue-100'
                          : 'bg-white border-2 border-slate-300'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckIcon className="h-6 w-6 text-white" />
                      ) : (
                        <step.icon
                          className={`h-6 w-6 ${
                            step.id === currentStep ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-3 text-sm font-semibold text-center transition-colors ${
                        step.id <= currentStep ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-lg rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-8 py-10 sm:p-12">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <TrophyIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Informações Básicas
                    </h2>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Defina o nome, descrição, modalidade esportiva e número máximo de times do seu campeonato
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                      Nome do Campeonato *
                    </label>
                    <input
                      type="text"
                      {...basicInfoForm.register('name')}
                      className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                      placeholder="Ex: Copa de Futsal Verão 2025"
                    />
                    {basicInfoForm.formState.errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <InformationCircleIcon className="h-4 w-4" />
                        {basicInfoForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                      Descrição Completa *
                    </label>
                    <textarea
                      {...basicInfoForm.register('description')}
                      rows={5}
                      className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors resize-none"
                      placeholder="Descreva detalhadamente seu campeonato: objetivos, regras, local de realização, categoria (sub-17, adulto, etc), prêmios e qualquer informação relevante para os atletas..."
                    />
                    {basicInfoForm.formState.errors.description && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <InformationCircleIcon className="h-4 w-4" />
                        {basicInfoForm.formState.errors.description.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Seja claro e objetivo para atrair os participantes certos
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="game" className="block text-sm font-semibold text-slate-700 mb-2">
                        Modalidade Esportiva *
                      </label>
                      <select
                        {...basicInfoForm.register('game')}
                        className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                      >
                        <option value="">Selecione uma modalidade</option>
                        <optgroup label="⚽ Esportes Físicos">
                          {games.slice(0, 21).map((game) => (
                            <option key={game} value={game}>
                              {game}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🎮 E-Sports">
                          {games.slice(21).map((game) => (
                            <option key={game} value={game}>
                              {game}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      {basicInfoForm.formState.errors.game && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <InformationCircleIcon className="h-4 w-4" />
                          {basicInfoForm.formState.errors.game.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="maxParticipants" className="block text-sm font-semibold text-slate-700 mb-2">
                        Máximo de Times *
                      </label>
                      <input
                        type="number"
                        {...basicInfoForm.register('maxParticipants', { valueAsNumber: true })}
                        min="2"
                        max="128"
                        className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                        placeholder="16"
                      />
                      {basicInfoForm.formState.errors.maxParticipants && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <InformationCircleIcon className="h-4 w-4" />
                          {basicInfoForm.formState.errors.maxParticipants.message}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        Entre 2 e 128 times
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Configurações do Torneio
                    </h2>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Defina o formato de competição, visibilidade e datas importantes do campeonato
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <ShieldCheckIcon className="h-5 w-5 text-slate-600" />
                      Formato do Campeonato *
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {formatOptions.map((option) => (
                        <label 
                          key={option.value} 
                          className="relative flex cursor-pointer rounded-lg border-2 border-slate-200 bg-white p-5 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                          <input
                            type="radio"
                            {...configForm.register('format')}
                            value={option.value}
                            className="mt-1 h-4 w-4 shrink-0 cursor-pointer border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-4 flex flex-col">
                            <span className="block text-base font-semibold text-slate-900 group-hover:text-blue-900">
                              {option.label}
                            </span>
                            <span className="block text-sm text-slate-600 mt-1">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <EyeIcon className="h-5 w-5 text-slate-600" />
                      Visibilidade e Acesso *
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {visibilityOptions.map((option) => (
                        <label 
                          key={option.value} 
                          className="relative flex cursor-pointer rounded-lg border-2 border-slate-200 bg-white p-5 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                          <input
                            type="radio"
                            {...configForm.register('visibility')}
                            value={option.value}
                            className="mt-1 h-4 w-4 shrink-0 cursor-pointer border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-4 flex flex-col">
                            <span className="block text-base font-semibold text-slate-900 group-hover:text-blue-900">
                              {option.label}
                            </span>
                            <span className="block text-sm text-slate-600 mt-1">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-slate-600" />
                      Datas e Prazos
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="registrationDeadline" className="block text-sm font-medium text-slate-700 mb-2">
                          Prazo para Inscrições *
                        </label>
                        <input
                          type="datetime-local"
                          {...configForm.register('registrationDeadline')}
                          className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Data limite para novos participantes se inscreverem
                        </p>
                      </div>

                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">
                          Data de Início do Campeonato *
                        </label>
                        <input
                          type="datetime-local"
                          {...configForm.register('startDate')}
                          className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Quando as partidas começarão
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Prizes */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Premiação e Taxas
                    </h2>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Configure as taxas de participação e a distribuição de prêmios (opcional)
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-3 p-5 bg-slate-50 border-2 border-slate-200 rounded-lg">
                    <input
                      type="checkbox"
                      {...prizeForm.register('hasEntryFee')}
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      id="hasEntryFee"
                    />
                    <label htmlFor="hasEntryFee" className="flex-1">
                      <span className="block text-base font-semibold text-slate-900">
                        Este campeonato possui taxa de inscrição
                      </span>
                      <span className="block text-sm text-slate-600 mt-1">
                        Marque esta opção se os times precisam pagar para se inscrever
                      </span>
                    </label>
                  </div>

                  {prizeForm.watch('hasEntryFee') && (
                    <div className="space-y-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="entryFee" className="block text-sm font-semibold text-slate-700 mb-2">
                            Taxa de Inscrição (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-3 text-slate-500 font-medium">R$</span>
                            <input
                              type="number"
                              {...prizeForm.register('entryFee', { valueAsNumber: true })}
                              min="0"
                              step="0.01"
                              className="block w-full rounded-lg border border-slate-300 pl-12 pr-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                              placeholder="0,00"
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-600">
                            Valor que cada time deve pagar
                          </p>
                        </div>

                        <div>
                          <label htmlFor="prizePool" className="block text-sm font-semibold text-slate-700 mb-2">
                            Prêmio Total (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-3 text-slate-500 font-medium">R$</span>
                            <input
                              type="number"
                              {...prizeForm.register('prizePool', { valueAsNumber: true })}
                              min="0"
                              step="0.01"
                              className="block w-full rounded-lg border border-slate-300 pl-12 pr-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                              placeholder="0,00"
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-600">
                            Valor total que será distribuído aos vencedores
                          </p>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="prizeDistribution" className="block text-sm font-semibold text-slate-700 mb-2">
                          Distribuição de Prêmios
                        </label>
                        <textarea
                          {...prizeForm.register('prizeDistribution')}
                          rows={4}
                          className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors resize-none"
                          placeholder="Ex:&#10;🥇 1º lugar: R$ 5.000,00 (50%)&#10;🥈 2º lugar: R$ 3.000,00 (30%)&#10;🥉 3º lugar: R$ 2.000,00 (20%)"
                        />
                        <p className="mt-2 text-xs text-slate-600">
                          Descreva como o prêmio será dividido entre os vencedores
                        </p>
                      </div>
                    </div>
                  )}

                  {!prizeForm.watch('hasEntryFee') && (
                    <div className="p-5 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex gap-3">
                        <TrophyIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-green-900">
                            Campeonato Gratuito
                          </h4>
                          <p className="text-sm text-green-700 mt-1">
                            Este será um campeonato totalmente gratuito para os times. Você pode adicionar prêmios ou reconhecimentos não-monetários na descrição do campeonato.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-slate-600" />
                        Resumo do Campeonato
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                          <dt className="font-medium text-slate-600">Nome:</dt>
                          <dd className="text-slate-900 mt-1">{formData.basicInfo?.name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-600">Modalidade:</dt>
                          <dd className="text-slate-900 mt-1">{formData.basicInfo?.game || '-'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-600">Máximo de Times:</dt>
                          <dd className="text-slate-900 mt-1">{formData.basicInfo?.maxParticipants || '-'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-600">Formato:</dt>
                          <dd className="text-slate-900 mt-1">{formatOptions.find(f => f.value === formData.config?.format)?.label || '-'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-600">Visibilidade:</dt>
                          <dd className="text-slate-900 mt-1">{visibilityOptions.find(v => v.value === formData.config?.visibility)?.label || '-'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-600">Taxa de Inscrição:</dt>
                          <dd className="text-slate-900 mt-1">
                            {prizeForm.watch('hasEntryFee') && prizeForm.watch('entryFee') 
                              ? `R$ ${prizeForm.watch('entryFee')?.toFixed(2)}` 
                              : 'Gratuito'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center px-6 py-3 border-2 text-sm font-semibold rounded-lg transition-all ${
                  currentStep === 1
                    ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center px-6 py-3 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all"
                >
                  Continuar
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-3 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Criando Campeonato...
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
