import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon,
  TrophyIcon,
  CalendarIcon,
  UserGroupIcon,
  EyeIcon,
  CogIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';
import type { Championship, Team, Game } from '../types';
import { generateId } from '../utils';

// Enums e constantes
const SPORTS = {
  football: { 
    name: 'Futebol', 
    icon: '⚽', 
    color: 'from-green-500 to-emerald-600',
    defaultPlayers: 11,
    positions: ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-campo', 'Atacante']
  },
  futsal: { 
    name: 'Futsal', 
    icon: '🥅', 
    color: 'from-blue-500 to-indigo-600',
    defaultPlayers: 5,
    positions: ['Goleiro', 'Fixo', 'Ala', 'Pivô']
  }
} as const;

// Validation schemas
const step1Schema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  sport: z.enum(['football', 'futsal']),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  location: z.string()
    .min(2, 'Local deve ter pelo menos 2 caracteres')
    .max(100, 'Local deve ter no máximo 100 caracteres'),
  maxTeams: z.number()
    .min(2, 'Mínimo de 2 times')
    .max(64, 'Máximo de 64 times'),
  entryFee: z.number().min(0, 'Taxa deve ser 0 ou mais').optional(),
});

const step2Schema = z.object({
  pointsForWin: z.number().min(1, 'Pontos por vitória deve ser pelo menos 1'),
  pointsForDraw: z.number().min(0, 'Pontos por empate deve ser 0 ou mais'),
  pointsForLoss: z.number().min(0, 'Pontos por derrota deve ser 0 ou mais'),
  allowDraw: z.boolean(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface TeamData {
  name: string;
  color: string;
  players: string[];
}

export function CreateChampionshipPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data>>({});
  const [teams, setTeams] = useState<TeamData[]>([
    { name: '', color: '#3B82F6', players: [] },
    { name: '', color: '#EF4444', players: [] }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const addChampionship = useChampionshipStore((state) => state.addChampionship);
  const user = useAuthStore((state) => state.user);

  // Forms para cada step
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      maxTeams: 8,
      entryFee: 0,
    }
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      allowDraw: true,
    }
  });

  // Cores disponíveis para times
  const teamColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Função para adicionar time
  const addTeam = () => {
    if (teams.length < (formData.maxTeams || 8)) {
      const newColor = teamColors[teams.length % teamColors.length];
      setTeams([...teams, { name: '', color: newColor, players: [] }]);
    }
  };

  // Função para remover time
  const removeTeam = (index: number) => {
    if (teams.length > 2) {
      setTeams(teams.filter((_, i) => i !== index));
    }
  };

  // Função para atualizar time
  const updateTeam = (index: number, field: keyof TeamData, value: any) => {
    setTeams(teams.map((team, i) => 
      i === index ? { ...team, [field]: value } : team
    ));
  };

  // Função para adicionar jogador
  const addPlayer = (teamIndex: number) => {
    const sport = formData.sport || 'football';
    const maxPlayers = SPORTS[sport].defaultPlayers * 2; // Permitir suplentes
    
    if (teams[teamIndex].players.length < maxPlayers) {
      updateTeam(teamIndex, 'players', [...teams[teamIndex].players, '']);
    }
  };

  // Função para remover jogador
  const removePlayer = (teamIndex: number, playerIndex: number) => {
    const newPlayers = teams[teamIndex].players.filter((_, i) => i !== playerIndex);
    updateTeam(teamIndex, 'players', newPlayers);
  };

  // Função para atualizar jogador
  const updatePlayer = (teamIndex: number, playerIndex: number, value: string) => {
    const newPlayers = teams[teamIndex].players.map((player, i) => 
      i === playerIndex ? value : player
    );
    updateTeam(teamIndex, 'players', newPlayers);
  };

  // Validação de step
  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        return await step1Form.trigger();
      case 2:
        return await step2Form.trigger();
      case 3:
        // Validar times
        const validTeams = teams.filter(team => team.name.trim().length >= 2);
        if (validTeams.length < 2) {
          toast.error('É necessário pelo menos 2 times com nomes válidos');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // Avançar step
  const nextStep = async () => {
    if (await validateCurrentStep()) {
      // Salvar dados do step atual
      switch (currentStep) {
        case 1:
          const step1Data = step1Form.getValues();
          setFormData(prev => ({ ...prev, ...step1Data }));
          break;
        case 2:
          const step2Data = step2Form.getValues();
          setFormData(prev => ({ ...prev, ...step2Data }));
          break;
      }
      
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Voltar step
  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Gerar jogos
  const generateGames = (teamIds: string[]): Game[] => {
    const games: Game[] = [];
    
    // Todos contra todos
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        games.push({
          id: generateId(),
          championshipId: '',
          homeTeamId: teamIds[i],
          awayTeamId: teamIds[j],
          round: 1,
          status: 'pending',
          goals: [],
        });
      }
    }
    
    return games;
  };

  // Submeter formulário
  const handleSubmit = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um campeonato');
      return;
    }

    if (!(await validateCurrentStep())) {
      return;
    }

    setIsSubmitting(true);

    try {
      const validTeams = teams.filter(team => team.name.trim().length >= 2);
      
      // Criar times
      const createdTeams: Team[] = validTeams.map(team => ({
        id: generateId(),
        name: team.name.trim(),
        championshipId: '',
        players: team.players
          .filter(player => player.trim().length >= 2)
          .map(playerName => ({
            id: generateId(),
            name: playerName.trim(),
            teamId: '',
            stats: {
              games: 0,
              goals: 0,
              assists: 0,
              wins: 0,
              losses: 0,
              draws: 0,
            },
            achievements: [],
            xp: 0,
          })),
        stats: {
          games: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          position: 0,
        },
      }));

      // Criar campeonato
      const championship: Championship = {
        id: generateId(),
        name: formData.name!,
        sport: formData.sport!,
        status: 'draft',
        adminId: user.id,
        teams: createdTeams,
        games: generateGames(createdTeams.map(t => t.id)),
        createdAt: new Date(),
        startDate: new Date(formData.startDate!),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      };

      // Definir championshipId nas entidades relacionadas
      championship.teams.forEach(team => {
        team.championshipId = championship.id;
        team.players?.forEach(player => {
          player.teamId = team.id;
        });
      });
      championship.games.forEach(game => {
        game.championshipId = championship.id;
      });

      await addChampionship(championship);
      
      toast.success('Campeonato criado com sucesso!');
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Erro ao criar campeonato:', error);
      toast.error('Erro ao criar campeonato: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Headers dos steps
  const stepHeaders = [
    { 
      title: 'Informações Básicas', 
      icon: DocumentTextIcon, 
      description: 'Nome, esporte e configurações gerais' 
    },
    { 
      title: 'Configurações', 
      icon: CogIcon, 
      description: 'Pontuação e regras' 
    },
    { 
      title: 'Times e Jogadores', 
      icon: UsersIcon, 
      description: 'Adicione os times participantes' 
    },
    { 
      title: 'Revisão Final', 
      icon: EyeIcon, 
      description: 'Confira todos os dados antes de criar' 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 relative overflow-hidden">
      {/* Background Floating Elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl animate-bounce"></div>
      <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 right-1/3 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <TrophyIcon className="h-8 w-8 text-yellow-400" />
                Criar Novo Campeonato
              </h1>
              <p className="text-white/70 mt-1">Configure seu torneio de forma profissional</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <SparklesIcon className="h-5 w-5" />
            <span className="text-sm">Passo {currentStep} de 4</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center relative">
              {/* Progress Line Background */}
              <div className="absolute top-6 left-6 right-6 h-1 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-6 left-6 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `calc(${((currentStep - 1) / 3) * 100}% - 1.5rem)` }}
              ></div>
              
              {stepHeaders.map((step, index) => {
                const stepNumber = index + 1;
                const Icon = step.icon;
                return (
                  <div key={stepNumber} className="relative flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                      transition-all duration-300 transform hover:scale-110 relative z-10 shadow-lg
                      ${currentStep >= stepNumber 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                        : 'bg-white/20 text-white/70 backdrop-blur-sm border border-white/30'
                      }
                    `}>
                      {currentStep > stepNumber ? (
                        <CheckIcon className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-xs text-white/80 mt-3 font-medium text-center max-w-20">
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {stepHeaders[currentStep - 1]?.title}
              </h2>
              <p className="text-white/70">
                {stepHeaders[currentStep - 1]?.description}
              </p>
            </div>

            {/* Step 1: Informações Básicas */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Nome do Campeonato
                  </label>
                  <input
                    {...step1Form.register('name')}
                    type="text"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ex: Copa dos Amigos 2024"
                  />
                  {step1Form.formState.errors.name && (
                    <p className="text-red-300 text-sm mt-1">{step1Form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-4">
                    Modalidade Esportiva
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(SPORTS).map(([key, sport]) => (
                      <label key={key} className="relative cursor-pointer group">
                        <input
                          {...step1Form.register('sport')}
                          type="radio"
                          value={key}
                          className="sr-only peer"
                        />
                        <div className="p-4 bg-white/5 backdrop-blur-sm border-2 border-white/20 rounded-xl hover:bg-white/10 peer-checked:border-blue-400 peer-checked:bg-blue-500/20 transition-all duration-200 group-hover:scale-105">
                          <div className="text-center">
                            <div className="text-3xl mb-2">{sport.icon}</div>
                            <div className="font-medium text-white text-sm">{sport.name}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {step1Form.formState.errors.sport && (
                    <p className="text-red-300 text-sm mt-1">{step1Form.formState.errors.sport.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Data de Início
                    </label>
                    <input
                      {...step1Form.register('startDate')}
                      type="date"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {step1Form.formState.errors.startDate && (
                      <p className="text-red-300 text-sm mt-1">{step1Form.formState.errors.startDate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Data de Término (opcional)
                    </label>
                    <input
                      {...step1Form.register('endDate')}
                      type="date"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Local do Evento
                  </label>
                  <input
                    {...step1Form.register('location')}
                    type="text"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ex: Estádio Municipal, Quadra da Escola..."
                  />
                  {step1Form.formState.errors.location && (
                    <p className="text-red-300 text-sm mt-1">{step1Form.formState.errors.location.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      <UserGroupIcon className="h-4 w-4 inline mr-2" />
                      Máximo de Times
                    </label>
                    <input
                      {...step1Form.register('maxTeams', { valueAsNumber: true })}
                      type="number"
                      min="2"
                      max="64"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    {step1Form.formState.errors.maxTeams && (
                      <p className="text-red-300 text-sm mt-1">{step1Form.formState.errors.maxTeams.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Taxa de Inscrição (R$)
                    </label>
                    <input
                      {...step1Form.register('entryFee', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    {...step1Form.register('description')}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="Descreva seu campeonato, regras especiais, premiação..."
                  />
                  {step1Form.formState.errors.description && (
                    <p className="text-red-300 text-sm mt-1">{step1Form.formState.errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Configurações */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-yellow-400" />
                    Sistema de Pontuação
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Vitória</label>
                      <input
                        {...step2Form.register('pointsForWin', { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      {step2Form.formState.errors.pointsForWin && (
                        <p className="text-red-300 text-sm mt-1">{step2Form.formState.errors.pointsForWin.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Empate</label>
                      <input
                        {...step2Form.register('pointsForDraw', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      {step2Form.formState.errors.pointsForDraw && (
                        <p className="text-red-300 text-sm mt-1">{step2Form.formState.errors.pointsForDraw.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Derrota</label>
                      <input
                        {...step2Form.register('pointsForLoss', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      {step2Form.formState.errors.pointsForLoss && (
                        <p className="text-red-300 text-sm mt-1">{step2Form.formState.errors.pointsForLoss.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Configurações de Jogo</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-white font-medium">Permitir Empates</label>
                      <p className="text-white/60 text-sm">Jogos podem terminar empatados ou sempre haverá desempate</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        {...step2Form.register('allowDraw')}
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Times e Jogadores */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Times Participantes</h3>
                  <button
                    onClick={addTeam}
                    disabled={teams.length >= (formData.maxTeams || 8)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Adicionar Time
                  </button>
                </div>

                <div className="space-y-4">
                  {teams.map((team, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-white/30"
                            style={{ backgroundColor: team.color }}
                          ></div>
                          <input
                            type="text"
                            value={team.name}
                            onChange={(e) => updateTeam(index, 'name', e.target.value)}
                            className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder={`Nome do Time ${index + 1}`}
                          />
                          <div className="flex gap-2">
                            {teamColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => updateTeam(index, 'color', color)}
                                className={`w-6 h-6 rounded-full border-2 ${team.color === color ? 'border-white' : 'border-white/30'} hover:scale-110 transition-transform`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        {teams.length > 2 && (
                          <button
                            onClick={() => removeTeam(index)}
                            className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-white/90">Jogadores</label>
                          <button
                            onClick={() => addPlayer(index)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            + Adicionar Jogador
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {team.players.map((player, playerIndex) => (
                            <div key={playerIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={player}
                                onChange={(e) => updatePlayer(index, playerIndex, e.target.value)}
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder={`Jogador ${playerIndex + 1}`}
                              />
                              <button
                                onClick={() => removePlayer(index, playerIndex)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Revisão Final */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <EyeIcon className="h-6 w-6 text-blue-400" />
                    Revisão Final
                  </h3>
                  <p className="text-white/80">Confira todas as informações antes de criar o campeonato:</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Nome:</span>
                        <span className="text-white">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Esporte:</span>
                        <span className="text-white">{formData.sport && SPORTS[formData.sport]?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Data:</span>
                        <span className="text-white">{formData.startDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Local:</span>
                        <span className="text-white">{formData.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Configurações</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Vitória:</span>
                        <span className="text-white">{formData.pointsForWin} pontos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Empate:</span>
                        <span className="text-white">{formData.pointsForDraw} pontos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Derrota:</span>
                        <span className="text-white">{formData.pointsForLoss} pontos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Empates:</span>
                        <span className="text-white">{formData.allowDraw ? 'Permitidos' : 'Não permitidos'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h4 className="font-semibold text-white mb-3">Times Participantes ({teams.filter(t => t.name.trim()).length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teams.filter(team => team.name.trim()).map((team, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color }}
                        ></div>
                        <span className="text-white font-medium">{team.name}</span>
                        <span className="text-white/60 text-sm">
                          ({team.players.filter(p => p.trim()).length} jogadores)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={previousStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/40 text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Voltar
            </button>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Próximo
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Criar Campeonato
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}