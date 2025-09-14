import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';
import type { Championship, Team, Player, Game } from '../types';
import { generateId } from '../utils';

// Validation schemas
const step1Schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  sport: z.enum(['football', 'futsal']),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  pointsForWin: z.number().min(1, 'Pontos por vitória deve ser pelo menos 1'),
  pointsForDraw: z.number().min(0, 'Pontos por empate deve ser 0 ou mais'),
  pointsForLoss: z.number().min(0, 'Pontos por derrota deve ser 0 ou mais'),
});

const step2Schema = z.object({
  teams: z.array(z.string().min(2, 'Nome do time deve ter pelo menos 2 caracteres'))
    .min(2, 'É necessário pelo menos 2 times')
    .refine(teams => teams.filter(team => team.trim().length >= 2).length >= 2, {
      message: 'É necessário pelo menos 2 times com nomes válidos'
    }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface ExtendedChampionshipData {
  name?: string;
  sport?: 'football' | 'futsal';
  description?: string;
  startDate?: string;
  pointsForWin?: number;
  pointsForDraw?: number;
  pointsForLoss?: number;
  teams?: string[];
  players?: Record<string, string[]>;
}

export function CreateChampionshipPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [championshipData, setChampionshipData] = useState<Partial<ExtendedChampionshipData>>({});
  const [teams, setTeams] = useState<string[]>(['']);
  const [players, setPlayers] = useState<Record<string, string[]>>({});
  
  const navigate = useNavigate();
  const addChampionship = useChampionshipStore((state) => state.addChampionship);
  const user = useAuthStore((state) => state.user);

  // Form for Step 1
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
    }
  });

  // Form for Step 2
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { teams },
  });

  // Sync form with teams state
  useEffect(() => {
    step2Form.setValue('teams', teams);
  }, [teams, step2Form]);

  const addTeam = () => {
    const newTeams = [...teams, ''];
    setTeams(newTeams);
    step2Form.setValue('teams', newTeams);
  };

  const removeTeam = (index: number) => {
    const newTeams = teams.filter((_, i) => i !== index);
    setTeams(newTeams);
    step2Form.setValue('teams', newTeams);
    
    // Remove players from removed team
    const teamName = teams[index];
    if (teamName && players[teamName]) {
      const newPlayers = { ...players };
      delete newPlayers[teamName];
      setPlayers(newPlayers);
    }
  };

  const updateTeam = (index: number, value: string) => {
    const newTeams = [...teams];
    const oldName = newTeams[index];
    newTeams[index] = value;
    setTeams(newTeams);

    // Update form value immediately
    step2Form.setValue('teams', newTeams);

    // Update players object key
    if (oldName && players[oldName] && value !== oldName) {
      const newPlayers = { ...players };
      newPlayers[value] = newPlayers[oldName];
      delete newPlayers[oldName];
      setPlayers(newPlayers);
    }
  };

  const addPlayer = (teamName: string) => {
    setPlayers(prev => ({
      ...prev,
      [teamName]: [...(prev[teamName] || []), '']
    }));
  };

  const removePlayer = (teamName: string, playerIndex: number) => {
    setPlayers(prev => ({
      ...prev,
      [teamName]: prev[teamName]?.filter((_, i) => i !== playerIndex) || []
    }));
  };

  const updatePlayer = (teamName: string, playerIndex: number, value: string) => {
    setPlayers(prev => ({
      ...prev,
      [teamName]: prev[teamName]?.map((player, i) => i === playerIndex ? value : player) || []
    }));
  };

  const generateGames = (teamIds: string[]): Game[] => {
    const games: Game[] = [];
    let round = 1;
    
    // Generate round-robin matches
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        games.push({
          id: generateId(),
          championshipId: '', // Will be set later
          round,
          homeTeamId: teamIds[i],
          awayTeamId: teamIds[j],
          status: 'pending',
          goals: [],
        });
      }
    }
    
    return games;
  };

  const onStep1Submit = (data: Step1Data) => {
    setChampionshipData({ ...championshipData, ...data });
    setCurrentStep(2);
  };

  const onStep2Submit = (data: Step2Data) => {
    const validTeams = data.teams.filter(team => team.trim().length >= 2);
    
    if (validTeams.length < 2) {
      toast.error('É necessário pelo menos 2 times com nomes válidos');
      return;
    }
    
    setChampionshipData({ ...championshipData, teams: validTeams });
    
    // Initialize players for each team
    const initialPlayers: Record<string, string[]> = {};
    validTeams.forEach(team => {
      initialPlayers[team] = players[team] || [''];
    });
    setPlayers(initialPlayers);
    
    setCurrentStep(3);
  };

  const onStep3Submit = () => {
    // Validate that each team has at least one player
    const validPlayers: Record<string, string[]> = {};
    let hasValidPlayers = true;

    Object.entries(players).forEach(([teamName, teamPlayers]) => {
      const filteredPlayers = teamPlayers.filter(p => p.trim() !== '');
      if (filteredPlayers.length === 0) {
        hasValidPlayers = false;
        toast.error(`Time "${teamName}" precisa ter pelo menos um jogador`);
      } else {
        validPlayers[teamName] = filteredPlayers;
      }
    });

    if (!hasValidPlayers) return;

    setChampionshipData({ ...championshipData, players: validPlayers });
    setCurrentStep(4);
  };

  const onStep4Submit = () => {
    if (!user || !championshipData.name || !championshipData.sport || !championshipData.teams) {
      toast.error('Dados incompletos');
      return;
    }

    // Create championship
    const championshipId = generateId();
    
    // Create teams
    const teamsData: Team[] = championshipData.teams.map((teamName: string) => {
      const teamId = generateId();
      const teamPlayers: Player[] = (players[teamName] || []).map(playerName => ({
        id: generateId(),
        name: playerName,
        teamId,
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
      }));

      return {
        id: teamId,
        name: teamName,
        championshipId,
        players: teamPlayers,
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
      };
    });

    // Generate games
    const games = generateGames(teamsData.map(t => t.id));
    games.forEach(game => game.championshipId = championshipId);

    const championship: Championship = {
      id: championshipId,
      name: championshipData.name,
      sport: championshipData.sport,
      adminId: user.id,
      teams: teamsData,
      games,
      status: 'active',
      createdAt: new Date(),
    };

    addChampionship(championship);
    toast.success('Campeonato criado com sucesso!');
    navigate(`/championship/${championshipId}`);
  };

  const goBack = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const steps = [
    { number: 1, title: 'Detalhes Básicos' },
    { number: 2, title: 'Adicionar Times' },
    { number: 3, title: 'Cadastrar Jogadores' },
    { number: 4, title: 'Gerar Jogos' },
  ];

  return (
    <div className="min-h-screen gradient-background py-8 relative overflow-hidden">
      {/* Background Floating Elements */}
      <div className="floating-element w-64 h-64 bg-white/5 top-10 left-10 animate-float"></div>
      <div className="floating-element w-48 h-48 bg-blue-500/10 top-40 right-20 animate-glow"></div>
      <div className="floating-element w-32 h-32 bg-purple-500/10 bottom-20 left-1/4 animate-pulse"></div>
      <div className="floating-element w-40 h-40 bg-cyan-500/10 bottom-40 right-1/3 animate-float" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Enhanced Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white text-shadow-lg">
              Criar Novo Campeonato
            </h1>
            <p className="text-white/80 mt-1">Configure seu torneio em poucos passos</p>
          </div>
        </div>

        <div className="auth-glass p-8 md:p-10">
          {/* Enhanced Progress Indicator */}
          <div className="mb-10">
            <div className="flex justify-between items-center relative">
              {/* Progress Line Background */}
              <div className="absolute top-6 left-6 right-6 h-1 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-6 left-6 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `calc(${((currentStep - 1) / 3) * 100}% - 1.5rem)` }}
              ></div>
              
              {steps.map((step) => (
                <div key={step.number} className="relative flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-300 transform hover:scale-110 relative z-10 shadow-lg
                    ${currentStep >= step.number 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                      : 'bg-white/20 text-white/70 backdrop-blur-sm border border-white/30'
                    }
                  `}>
                    {currentStep > step.number ? (
                      <CheckIcon className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className="text-xs text-white/80 mt-3 font-medium text-center max-w-16">
                    {step.title.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2 text-shadow-lg">
                {steps[currentStep - 1]?.title || 'Passo'}
              </h2>
              <p className="text-white/80 text-sm">
                Passo {currentStep} de 4
              </p>
            </div>
          </div>
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalhes do Campeonato</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="form-label">
                      Nome do Campeonato
                    </label>
                    <input
                      {...step1Form.register('name')}
                      type="text"
                      className="auth-input"
                      placeholder="Ex: Copa dos Amigos 2024"
                    />
                    {step1Form.formState.errors.name && (
                      <p className="text-red-400 text-sm mt-1">{step1Form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label mb-4">
                      Modalidade
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="relative cursor-pointer">
                        <input
                          {...step1Form.register('sport')}
                          type="radio"
                          value="football"
                          className="sr-only peer"
                        />
                        <div className="p-6 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl hover:bg-white/20 peer-checked:border-blue-400 peer-checked:bg-blue-500/20 transition-all duration-200">
                          <div className="text-center">
                            <div className="text-3xl mb-3">⚽</div>
                            <div className="font-semibold text-white">Futebol de Campo</div>
                          </div>
                        </div>
                      </label>
                      
                      <label className="relative cursor-pointer">
                        <input
                          {...step1Form.register('sport')}
                          type="radio"
                          value="futsal"
                          className="sr-only peer"
                        />
                        <div className="p-6 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl hover:bg-white/20 peer-checked:border-blue-400 peer-checked:bg-blue-500/20 transition-all duration-200">
                          <div className="text-center">
                            <div className="text-3xl mb-3">🥅</div>
                            <div className="font-semibold text-white">Futsal</div>
                          </div>
                        </div>
                      </label>
                    </div>
                    {step1Form.formState.errors.sport && (
                      <p className="text-red-400 text-sm mt-1">{step1Form.formState.errors.sport.message}</p>
                    )}
                  </div>

                  <div>
                    <div>
                      <label className="form-label">
                        Data de Início
                      </label>
                      <input
                        {...step1Form.register('startDate')}
                        type="date"
                        className="auth-input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Descrição (opcional)</label>
                    <textarea
                      {...step1Form.register('description')}
                      className="auth-input h-24 resize-none"
                      placeholder="Descreva seu campeonato, regras especiais, premiação..."
                    />
                  </div>

                  <div>
                    <h3 className="form-label mb-4">Sistema de Pontuação</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="form-label text-xs">Vitória</label>
                        <input
                          {...step1Form.register('pointsForWin', { valueAsNumber: true })}
                          type="number"
                          min="1"
                          defaultValue={3}
                          className="auth-input text-center"
                        />
                      </div>
                      <div>
                        <label className="form-label text-xs">Empate</label>
                        <input
                          {...step1Form.register('pointsForDraw', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          defaultValue={1}
                          className="auth-input text-center"
                        />
                      </div>
                      <div>
                        <label className="form-label text-xs">Derrota</label>
                        <input
                          {...step1Form.register('pointsForLoss', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          defaultValue={0}
                          className="auth-input text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="auth-button gradient-primary">
                  Próximo
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Add Teams */}
          {currentStep === 2 && (
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="form-label">
                    Times do Campeonato
                  </h3>
                  <button
                    type="button"
                    onClick={addTeam}
                    className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/30"
                  >
                    <span className="mr-2">➕</span>
                    Adicionar Time
                  </button>
                </div>
                
                <div className="space-y-4">
                  {teams.map((team, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={team}
                          onChange={(e) => updateTeam(index, e.target.value)}
                          className="auth-input"
                          placeholder={`Nome do Time ${index + 1}`}
                        />
                      </div>
                      {teams.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeTeam(index)}
                          className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Validation Errors */}
                {step2Form.formState.errors.teams && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-lg">
                    <p className="text-sm">{step2Form.formState.errors.teams.message}</p>
                  </div>
                )}
                
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-white/80 text-sm">
                    💡 <strong>Dica:</strong> Você pode adicionar quantos times quiser. É necessário pelo menos 2 times para criar o campeonato.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={goBack} className="auth-button bg-white/10 hover:bg-white/20 text-white">
                  <ArrowLeftIcon className="mr-2 h-5 w-5" />
                  Voltar
                </button>
                <button type="submit" className="auth-button gradient-primary">
                  Próximo
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Add Players */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <h3 className="form-label">
                ⭐ Cadastrar Jogadores
              </h3>
              
              <div className="grid gap-6">
                {championshipData.teams?.map((teamName: string) => (
                  <div key={teamName} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        🏆 {teamName}
                      </h4>
                      <button
                        type="button"
                        onClick={() => addPlayer(teamName)}
                        className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all duration-200"
                      >
                        <span className="mr-1">➕</span>
                        Adicionar
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {(players[teamName] || ['']).map((player, playerIndex) => (
                        <div key={playerIndex} className="flex items-center space-x-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={player}
                              onChange={(e) => updatePlayer(teamName, playerIndex, e.target.value)}
                              className="auth-input"
                              placeholder={`Jogador ${playerIndex + 1}`}
                            />
                          </div>
                          {(players[teamName]?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => removePlayer(teamName, playerIndex)}
                              className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-white/70 text-xs">
                        {(players[teamName] || []).filter(p => p.trim() !== '').length} jogador(es) cadastrado(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={goBack} className="auth-button bg-white/10 hover:bg-white/20 text-white">
                  <ArrowLeftIcon className="mr-2 h-5 w-5" />
                  Voltar
                </button>
                <button type="button" onClick={onStep3Submit} className="auth-button gradient-primary">
                  Próximo
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Generate Games */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h3 className="form-label">
                ✅ Revisar e Criar Campeonato
              </h3>
              
              <div className="grid gap-6">
                {/* Championship Summary */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                    🏆 {championshipData.name}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white/90">
                    <div>
                      <p className="text-sm text-white/70">Modalidade</p>
                      <p className="font-semibold">{championshipData.sport === 'football' ? '⚽ Futebol de Campo' : '🥅 Futsal'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Data de Início</p>
                      <p className="font-semibold">{championshipData.startDate ? new Date(championshipData.startDate).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Times</p>
                      <p className="font-semibold">{championshipData.teams?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Jogadores</p>
                      <p className="font-semibold">{Object.values(players).flat().filter(p => p.trim() !== '').length}</p>
                    </div>
                  </div>
                  {championshipData.description && (
                    <div className="mt-4">
                      <p className="text-sm text-white/70">Descrição</p>
                      <p className="text-white/90">{championshipData.description}</p>
                    </div>
                  )}
                </div>

                {/* Tournament Format */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    📋 Formato do Torneio
                  </h4>
                  <div className="text-white/90 space-y-2">
                    <p>• <strong>Pontos Corridos (Turno Único)</strong> - Todos os times jogam entre si uma vez</p>
                    <p>• <strong>Total de Jogos:</strong> {championshipData.teams ? Math.floor(championshipData.teams.length * (championshipData.teams.length - 1) / 2) : 0}</p>
                    <p>• <strong>Pontuação:</strong> {championshipData.pointsForWin || 3} pts (vitória), {championshipData.pointsForDraw || 1} pt (empate), {championshipData.pointsForLoss || 0} pts (derrota)</p>
                  </div>
                </div>

                {/* Teams Overview */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    👥 Times e Jogadores
                  </h4>
                  <div className="grid gap-4">
                    {championshipData.teams?.map((teamName: string) => (
                      <div key={teamName} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="font-medium text-white flex items-center">
                          🏆 {teamName}
                        </span>
                        <span className="text-sm text-white/70">
                          {(players[teamName] || []).filter(p => p.trim() !== '').length} jogadores
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ready to Create */}
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 text-center">
                  <div className="text-4xl mb-3">🚀</div>
                  <h4 className="text-lg font-semibold text-white mb-2">Tudo Pronto!</h4>
                  <p className="text-white/80 text-sm">
                    Seu campeonato será criado com todos os times, jogadores e jogos configurados.
                    Clique em "Criar Campeonato" para finalizar.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={goBack} className="auth-button bg-white/10 hover:bg-white/20 text-white">
                  <ArrowLeftIcon className="mr-2 h-5 w-5" />
                  Voltar
                </button>
                <button type="button" onClick={onStep4Submit} className="auth-button gradient-success">
                  <CheckIcon className="mr-2 h-5 w-5" />
                  Criar Campeonato
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}