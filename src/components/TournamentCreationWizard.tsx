import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { 
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  TrophyIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  PlusIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';

// =============== TYPES & SCHEMAS ===============

const step1Schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  sport: z.string().min(1, 'Selecione um esporte'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  banner: z.any().optional()
});

const step2Schema = z.object({
  format: z.string().min(1, 'Selecione um formato'),
  groupsCount: z.number().optional(),
  teamsPerGroup: z.number().optional(),
  qualifiedPerGroup: z.number().optional()
});

const step3Schema = z.object({
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  modality: z.enum(['online', 'presencial']),
  venues: z.array(z.object({
    name: z.string().min(1, 'Nome do local é obrigatório'),
    address: z.string().min(1, 'Endereço é obrigatório')
  })).optional()
});

const step4Schema = z.object({
  registrationType: z.enum(['open', 'invitation']),
  registrationDeadline: z.string().min(1, 'Data limite é obrigatória'),
  entryFee: z.number().min(0, 'Taxa deve ser 0 ou mais'),
  currency: z.string(),
  maxParticipants: z.number().min(2, 'Mínimo 2 participantes').max(256, 'Máximo 256 participantes')
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

interface TournamentData extends Step1Data, Step2Data, Step3Data, Step4Data {}

// =============== SPORTS DATA ===============

const SPORTS = [
  { id: 'football', name: 'Futebol', icon: '⚽', description: 'Futebol de campo tradicional' },
  { id: 'futsal', name: 'Futsal', icon: '🥅', description: 'Futebol de salão' },
  { id: 'basketball', name: 'Basquete', icon: '🏀', description: 'Basquetebol' },
  { id: 'volleyball', name: 'Vôlei', icon: '🏐', description: 'Voleibol' },
  { id: 'tennis', name: 'Tênis', icon: '🎾', description: 'Tênis individual ou duplas' },
  { id: 'esports', name: 'eSports', icon: '🎮', description: 'Esportes eletrônicos' },
];

const TOURNAMENT_FORMATS = [
  {
    id: 'single-elimination',
    name: 'Eliminação Simples',
    description: 'Os perdedores são eliminados a cada rodada. Ideal para torneios rápidos.',
    icon: '🏆',
    supportsGroups: false
  },
  {
    id: 'double-elimination',
    name: 'Eliminação Dupla',
    description: 'Cada time tem duas chances. Mais justo para competições importantes.',
    icon: '🔄',
    supportsGroups: false
  },
  {
    id: 'groups-elimination',
    name: 'Fase de Grupos + Eliminatórias',
    description: 'Fase de grupos seguida de mata-mata. Formato ideal para grandes torneios.',
    icon: '📊',
    supportsGroups: true
  },
  {
    id: 'round-robin',
    name: 'Pontos Corridos (Liga)',
    description: 'Todos jogam contra todos. Formato de liga tradicional.',
    icon: '🔄',
    supportsGroups: false
  }
];

// =============== STEP COMPONENTS ===============

const ProgressStepper: React.FC<{
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}> = ({ currentStep, totalSteps, stepTitles }) => {
  return (
    <div className="w-full bg-white border-b border-slate-200 px-6 py-6 mb-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300
                    ${isCompleted ? 'bg-indigo-600 text-white' : ''}
                    ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : ''}
                    ${isUpcoming ? 'bg-slate-200 text-slate-500' : ''}
                  `}>
                    {isCompleted ? (
                      <CheckIcon className="w-5 h-5" strokeWidth={2} />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  
                  {/* Step Title */}
                  <span className={`
                    mt-2 text-xs font-medium text-center max-w-20
                    ${isCurrent ? 'text-indigo-600' : ''}
                    ${isCompleted ? 'text-slate-700' : ''}
                    ${isUpcoming ? 'text-slate-400' : ''}
                  `}>
                    {title}
                  </span>
                </div>

                {/* Connector Line */}
                {index < totalSteps - 1 && (
                  <div className={`
                    flex-1 h-px mx-4 transition-colors duration-300
                    ${stepNumber < currentStep ? 'bg-indigo-600' : 'bg-slate-200'}
                  `} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SelectionCard: React.FC<{
  id: string;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}> = ({ title, description, icon, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${selected 
          ? 'border-indigo-600 bg-indigo-50 shadow-md' 
          : 'border-slate-200 bg-white hover:border-slate-300'
        }
      `}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-full">
            <CheckIcon className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
        </div>
      )}
      
      <div className="flex items-start space-x-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${selected ? 'text-indigo-900' : 'text-slate-900'}`}>
            {title}
          </h3>
          <p className={`mt-1 text-sm ${selected ? 'text-indigo-700' : 'text-slate-600'}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

const FileUpload: React.FC<{
  value?: File;
  onChange: (file: File | null) => void;
  accept?: string;
  placeholder?: string;
}> = ({ value, onChange, accept = "image/*", placeholder = "Arraste uma imagem ou clique para selecionar" }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onChange(files[0]);
    }
  }, [onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  }, [onChange]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer group hover:border-indigo-400 hover:bg-indigo-50/50
          ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50'}
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <CloudArrowUpIcon className={`
          mx-auto h-12 w-12 transition-colors duration-200
          ${dragOver ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-500'}
        `} />
        
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700">
            {placeholder}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PNG, JPG ou WEBP até 5MB
          </p>
        </div>
      </div>

      {value && (
        <div className="relative rounded-lg overflow-hidden bg-slate-100">
          <img
            src={URL.createObjectURL(value)}
            alt="Preview"
            className="w-full h-32 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// =============== MAIN COMPONENT ===============

export const TournamentCreationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tournamentData, setTournamentData] = useState<Partial<TournamentData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const addChampionship = useChampionshipStore((state) => state.addChampionship);

  const stepTitles = ['Informações', 'Formato', 'Cronograma', 'Inscrições', 'Revisão'];
  const totalSteps = stepTitles.length;

  // Forms for each step
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: tournamentData
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: tournamentData
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { modality: 'presencial', ...tournamentData }
  });

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: { 
      registrationType: 'open', 
      currency: 'BRL', 
      entryFee: 0, 
      maxParticipants: 16,
      ...tournamentData 
    }
  });

  const handleNext = useCallback(async () => {
    let isValid = false;
    let stepData = {};

    switch (currentStep) {
      case 1:
        isValid = await step1Form.trigger();
        if (isValid) stepData = step1Form.getValues();
        break;
      case 2:
        isValid = await step2Form.trigger();
        if (isValid) stepData = step2Form.getValues();
        break;
      case 3:
        isValid = await step3Form.trigger();
        if (isValid) stepData = step3Form.getValues();
        break;
      case 4:
        isValid = await step4Form.trigger();
        if (isValid) stepData = step4Form.getValues();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setTournamentData(prev => ({ ...prev, ...stepData }));
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  }, [currentStep, step1Form, step2Form, step3Form, step4Form, totalSteps]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um campeonato');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const finalData = { ...tournamentData };
      
      // Create championship object
      const championship = {
        id: `champ_${Date.now()}`,
        name: finalData.name!,
        sport: finalData.sport as 'football' | 'futsal',
        adminId: user.id,
        description: finalData.description || '',
        startDate: new Date(finalData.startDate!),
        endDate: finalData.endDate ? new Date(finalData.endDate) : undefined,
        location: finalData.modality === 'presencial' 
          ? finalData.venues?.[0]?.name || 'Local a definir'
          : 'Online',
        maxTeams: finalData.maxParticipants!,
        entryFee: finalData.entryFee || 0,
        status: 'draft' as const,
        createdAt: new Date(),
        teams: [],
        games: []
      };

      addChampionship(championship);
      toast.success('Campeonato criado com sucesso!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Erro ao criar campeonato:', error);
      toast.error('Erro ao criar campeonato. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [tournamentData, user, addChampionship, navigate]);

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900">Informações do Campeonato</h2>
        <p className="mt-2 text-lg text-slate-600">Comece definindo as informações básicas do seu evento</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Nome do Campeonato
          </label>
          <input
            {...step1Form.register('name')}
            type="text"
            placeholder="Ex: Copa de Futsal 2024"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
          />
          {step1Form.formState.errors.name && (
            <p className="mt-1 text-sm text-red-600">{step1Form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Selecione o Esporte
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SPORTS.map((sport) => (
              <SelectionCard
                key={sport.id}
                id={sport.id}
                title={sport.name}
                description={sport.description}
                icon={sport.icon}
                selected={step1Form.watch('sport') === sport.id}
                onClick={() => step1Form.setValue('sport', sport.id)}
              />
            ))}
          </div>
          {step1Form.formState.errors.sport && (
            <p className="mt-2 text-sm text-red-600">{step1Form.formState.errors.sport.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Descrição <span className="text-slate-500 font-normal">(opcional)</span>
          </label>
          <textarea
            {...step1Form.register('description')}
            rows={4}
            placeholder="Descreva seu campeonato, regras especiais, premiação..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-none"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>
              {step1Form.formState.errors.description?.message}
            </span>
            <span>
              {step1Form.watch('description')?.length || 0}/500
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Banner do Campeonato <span className="text-slate-500 font-normal">(opcional)</span>
          </label>
          <FileUpload
            value={step1Form.watch('banner')}
            onChange={(file) => step1Form.setValue('banner', file)}
            placeholder="Arraste uma imagem ou clique para selecionar"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Format and Rules
  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900">Escolha o Formato da Competição</h2>
        <p className="mt-2 text-lg text-slate-600">Defina como será a estrutura do seu campeonato</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOURNAMENT_FORMATS.map((format) => (
            <SelectionCard
              key={format.id}
              id={format.id}
              title={format.name}
              description={format.description}
              icon={format.icon}
              selected={step2Form.watch('format') === format.id}
              onClick={() => step2Form.setValue('format', format.id)}
            />
          ))}
        </div>

        {step2Form.formState.errors.format && (
          <p className="mt-4 text-sm text-red-600 text-center">{step2Form.formState.errors.format.message}</p>
        )}

        {/* Conditional fields for group stage format */}
        {step2Form.watch('format') === 'groups-elimination' && (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Configurações da Fase de Grupos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de Grupos
                </label>
                <select
                  {...step2Form.register('groupsCount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                >
                  <option value={2}>2 grupos</option>
                  <option value={4}>4 grupos</option>
                  <option value={8}>8 grupos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Times por Grupo
                </label>
                <select
                  {...step2Form.register('teamsPerGroup', { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                >
                  <option value={3}>3 times</option>
                  <option value={4}>4 times</option>
                  <option value={5}>5 times</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Classificados por Grupo
                </label>
                <select
                  {...step2Form.register('qualifiedPerGroup', { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                >
                  <option value={1}>1º colocado</option>
                  <option value={2}>1º e 2º colocados</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 3: Schedule and Location
  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900">Defina as Datas e Locais</h2>
        <p className="mt-2 text-lg text-slate-600">Configure quando e onde acontecerá o campeonato</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Data de Início
            </label>
            <input
              {...step3Form.register('startDate')}
              type="date"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            />
            {step3Form.formState.errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{step3Form.formState.errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Data de Término <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              {...step3Form.register('endDate')}
              type="date"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Modalidade
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => step3Form.setValue('modality', 'presencial')}
              className={`
                p-4 rounded-lg border-2 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                ${step3Form.watch('modality') === 'presencial'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <MapPinIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Presencial</div>
              <div className="text-sm opacity-75">Em local físico</div>
            </button>

            <button
              type="button"
              onClick={() => step3Form.setValue('modality', 'online')}
              className={`
                p-4 rounded-lg border-2 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                ${step3Form.watch('modality') === 'online'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <ClockIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Online</div>
              <div className="text-sm opacity-75">Via internet</div>
            </button>
          </div>
        </div>

        {step3Form.watch('modality') === 'presencial' && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Locais/Arenas
            </label>
            
            <div className="space-y-3">
              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nome do local"
                    className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    onChange={(e) => {
                      const venues = step3Form.getValues('venues') || [{ name: '', address: '' }];
                      venues[0] = { ...venues[0], name: e.target.value };
                      step3Form.setValue('venues', venues);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Endereço completo"
                    className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    onChange={(e) => {
                      const venues = step3Form.getValues('venues') || [{ name: '', address: '' }];
                      venues[0] = { ...venues[0], address: e.target.value };
                      step3Form.setValue('venues', venues);
                    }}
                  />
                </div>
              </div>
              
              <button
                type="button"
                className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Adicionar outro local
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: Registration
  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900">Gerenciamento de Inscrições</h2>
        <p className="mt-2 text-lg text-slate-600">Configure como os participantes irão se inscrever</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Tipo de Inscrição
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectionCard
              id="open"
              title="Aberta a todos"
              description="Qualquer pessoa pode se inscrever no campeonato"
              icon="🌐"
              selected={step4Form.watch('registrationType') === 'open'}
              onClick={() => step4Form.setValue('registrationType', 'open')}
            />
            <SelectionCard
              id="invitation"
              title="Apenas Convidados"
              description="Somente pessoas convidadas podem participar"
              icon="📧"
              selected={step4Form.watch('registrationType') === 'invitation'}
              onClick={() => step4Form.setValue('registrationType', 'invitation')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Data Limite para Inscrição
          </label>
          <input
            {...step4Form.register('registrationDeadline')}
            type="datetime-local"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
          />
          {step4Form.formState.errors.registrationDeadline && (
            <p className="mt-1 text-sm text-red-600">{step4Form.formState.errors.registrationDeadline.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Taxa de Inscrição
          </label>
          <div className="flex space-x-3">
            <select
              {...step4Form.register('currency')}
              className="px-3 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="BRL">R$</option>
              <option value="USD">US$</option>
              <option value="EUR">€</option>
            </select>
            <div className="flex-1 relative">
              <input
                {...step4Form.register('entryFee', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
              />
              {step4Form.watch('entryFee') === 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-emerald-600 font-medium">
                  Grátis
                </div>
              )}
            </div>
          </div>
          {step4Form.formState.errors.entryFee && (
            <p className="mt-1 text-sm text-red-600">{step4Form.formState.errors.entryFee.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Número Máximo de Participantes/Times
          </label>
          <input
            {...step4Form.register('maxParticipants', { valueAsNumber: true })}
            type="number"
            min="2"
            max="256"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
          />
          {step4Form.formState.errors.maxParticipants && (
            <p className="mt-1 text-sm text-red-600">{step4Form.formState.errors.maxParticipants.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Step 5: Review
  const renderStep5 = () => {
    const data = { ...tournamentData };
    const selectedSport = SPORTS.find(s => s.id === data.sport);
    const selectedFormat = TOURNAMENT_FORMATS.find(f => f.id === data.format);

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Revise e Publique seu Campeonato</h2>
          <p className="mt-2 text-lg text-slate-600">Confirme todas as informações antes de publicar</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                Informações Básicas
              </h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Nome</dt>
                  <dd className="text-slate-900 font-medium">{data.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Esporte</dt>
                  <dd className="text-slate-900 font-medium flex items-center gap-2">
                    <span>{selectedSport?.icon}</span>
                    {selectedSport?.name}
                  </dd>
                </div>
                {data.description && (
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Descrição</dt>
                    <dd className="text-slate-900">{data.description}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Format */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-indigo-600" />
                Formato
              </h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Tipo de Competição</dt>
                  <dd className="text-slate-900 font-medium flex items-center gap-2">
                    <span>{selectedFormat?.icon}</span>
                    {selectedFormat?.name}
                  </dd>
                </div>
                {data.format === 'groups-elimination' && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Configuração de Grupos</dt>
                      <dd className="text-slate-900">
                        {data.groupsCount} grupos, {data.teamsPerGroup} times por grupo, {data.qualifiedPerGroup} classificados por grupo
                      </dd>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Schedule and Location */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-600" />
                Cronograma e Local
              </h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Data de Início</dt>
                  <dd className="text-slate-900 font-medium">
                    {data.startDate ? new Date(data.startDate).toLocaleDateString('pt-BR') : '—'}
                  </dd>
                </div>
                {data.endDate && (
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Data de Término</dt>
                    <dd className="text-slate-900 font-medium">
                      {new Date(data.endDate).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-slate-500">Modalidade</dt>
                  <dd className="text-slate-900 font-medium capitalize">{data.modality}</dd>
                </div>
                {data.modality === 'presencial' && data.venues?.[0] && (
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Local</dt>
                    <dd className="text-slate-900">
                      {data.venues[0].name}<br />
                      <span className="text-sm text-slate-600">{data.venues[0].address}</span>
                    </dd>
                  </div>
                )}
              </div>
            </div>

            {/* Registration */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                Inscrições
              </h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Tipo de Inscrição</dt>
                  <dd className="text-slate-900 font-medium">
                    {data.registrationType === 'open' ? 'Aberta a todos' : 'Apenas Convidados'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Data Limite</dt>
                  <dd className="text-slate-900 font-medium">
                    {data.registrationDeadline 
                      ? new Date(data.registrationDeadline).toLocaleString('pt-BR')
                      : '—'
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Taxa de Inscrição</dt>
                  <dd className="text-slate-900 font-medium">
                    {data.entryFee === 0 ? (
                      <span className="text-emerald-600">Grátis</span>
                    ) : (
                      `${data.currency === 'BRL' ? 'R$' : data.currency === 'USD' ? 'US$' : '€'} ${data.entryFee?.toFixed(2)}`
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Máximo de Participantes</dt>
                  <dd className="text-slate-900 font-medium">{data.maxParticipants} times</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Final Action */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <TrophyIcon className="h-5 w-5" />
                  Publicar Campeonato
                </>
              )}
            </button>
            <p className="mt-3 text-sm text-slate-600">
              Após a publicação, você poderá gerenciar os participantes e gerar as chaves no seu dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress Stepper */}
      <ProgressStepper 
        currentStep={currentStep} 
        totalSteps={totalSteps} 
        stepTitles={stepTitles}
      />

      {/* Main Content */}
      <div className="px-6 pb-12">
        {renderCurrentStep()}
      </div>

      {/* Navigation Footer */}
      {currentStep < totalSteps && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 font-medium rounded-lg hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Voltar
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Próximo Passo
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};