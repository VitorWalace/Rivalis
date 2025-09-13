import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { useAuthStore } from '../store/authStore';
import { generateId } from '../utils';
import type { CreateChampionshipData, Championship, Team, Player, Game } from '../types';
import toast from 'react-hot-toast';

// Step 1 Schema
const step1Schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  sport: z.enum(['football', 'futsal'], {
    message: 'Selecione um esporte',
  }),
});

// Step 2 Schema
const step2Schema = z.object({
  teams: z.array(z.string().min(2, 'Nome do time deve ter pelo menos 2 caracteres'))
    .min(2, 'Adicione pelo menos 2 times')
    .max(20, 'Máximo de 20 times permitidos'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export function CreateChampionshipPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [championshipData, setChampionshipData] = useState<Partial<CreateChampionshipData>>({});
  const [teams, setTeams] = useState<string[]>(['']);
  const [players, setPlayers] = useState<Record<string, string[]>>({});
  
  const navigate = useNavigate();
  const addChampionship = useChampionshipStore((state) => state.addChampionship);
  const user = useAuthStore((state) => state.user);

  // Form for Step 1
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  });

  // Form for Step 2
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { teams },
  });

  const addTeam = () => {
    setTeams([...teams, '']);
  };

  const removeTeam = (index: number) => {
    const newTeams = teams.filter((_, i) => i !== index);
    setTeams(newTeams);
    
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
    const validTeams = data.teams.filter(team => team.trim() !== '');
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
    const teamsData: Team[] = championshipData.teams.map(teamName => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Criar Novo Campeonato</h1>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, index) => (
                <li key={step.number} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="flex items-center">
                    <div
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                        step.number < currentStep
                          ? 'bg-primary-600'
                          : step.number === currentStep
                          ? 'border-2 border-primary-600 bg-white'
                          : 'border-2 border-gray-300 bg-white'
                      }`}
                    >
                      {step.number < currentStep ? (
                        <CheckIcon className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            step.number === currentStep ? 'text-primary-600' : 'text-gray-500'
                          }`}
                        >
                          {step.number}
                        </span>
                      )}
                    </div>
                    <span
                      className={`ml-4 text-sm font-medium ${
                        step.number <= currentStep ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index !== steps.length - 1 && (
                    <div
                      className={`absolute top-4 left-4 -ml-px h-0.5 w-full ${
                        step.number < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="card p-8">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalhes do Campeonato</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Campeonato
                    </label>
                    <input
                      {...step1Form.register('name')}
                      type="text"
                      id="name"
                      className="input-field"
                      placeholder="Ex: Copa dos Amigos 2024"
                    />
                    {step1Form.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600">{step1Form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Esporte
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="relative">
                        <input
                          {...step1Form.register('sport')}
                          type="radio"
                          value="football"
                          className="sr-only peer"
                        />
                        <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-colors">
                          <div className="text-center">
                            <div className="text-2xl mb-2">⚽</div>
                            <div className="font-medium text-gray-900">Futebol de Campo</div>
                          </div>
                        </div>
                      </label>
                      
                      <label className="relative">
                        <input
                          {...step1Form.register('sport')}
                          type="radio"
                          value="futsal"
                          className="sr-only peer"
                        />
                        <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-colors">
                          <div className="text-center">
                            <div className="text-2xl mb-2">🥅</div>
                            <div className="font-medium text-gray-900">Futsal</div>
                          </div>
                        </div>
                      </label>
                    </div>
                    {step1Form.formState.errors.sport && (
                      <p className="mt-1 text-sm text-red-600">{step1Form.formState.errors.sport.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  Próximo
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Add Teams */}
          {currentStep === 2 && (
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Adicionar Times</h2>
                
                <div className="space-y-4">
                  {teams.map((team, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={team}
                        onChange={(e) => updateTeam(index, e.target.value)}
                        className="input-field"
                        placeholder={`Nome do time ${index + 1}`}
                      />
                      {teams.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTeam(index)}
                          className="p-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addTeam}
                    className="btn-secondary"
                  >
                    + Adicionar Time
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={goBack} className="btn-secondary">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Voltar
                </button>
                <button type="submit" className="btn-primary">
                  Próximo
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Add Players */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cadastrar Jogadores</h2>
              
              <div className="space-y-6">
                {championshipData.teams?.map((teamName) => (
                  <div key={teamName} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{teamName}</h3>
                    
                    <div className="space-y-2">
                      {(players[teamName] || ['']).map((player, playerIndex) => (
                        <div key={playerIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={player}
                            onChange={(e) => updatePlayer(teamName, playerIndex, e.target.value)}
                            className="input-field"
                            placeholder={`Jogador ${playerIndex + 1}`}
                          />
                          {(players[teamName]?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => removePlayer(teamName, playerIndex)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => addPlayer(teamName)}
                        className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        + Adicionar Jogador
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={goBack} className="btn-secondary">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Voltar
                </button>
                <button type="button" onClick={onStep3Submit} className="btn-primary">
                  Próximo
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Generate Games */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerar Jogos</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Resumo do Campeonato</h3>
                <div className="text-blue-800 space-y-1">
                  <p><strong>Nome:</strong> {championshipData.name}</p>
                  <p><strong>Esporte:</strong> {championshipData.sport === 'football' ? 'Futebol de Campo' : 'Futsal'}</p>
                  <p><strong>Times:</strong> {championshipData.teams?.length}</p>
                  <p><strong>Total de Jogadores:</strong> {Object.values(players).flat().filter(p => p.trim() !== '').length}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">Formato do Campeonato</h3>
                <p className="text-yellow-800">
                  O campeonato será gerado no formato <strong>Pontos Corridos (Turno Único)</strong>, 
                  onde todos os times jogam entre si uma vez. 
                  Total de jogos: <strong>{championshipData.teams ? Math.floor(championshipData.teams.length * (championshipData.teams.length - 1) / 2) : 0}</strong>
                </p>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={goBack} className="btn-secondary">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Voltar
                </button>
                <button type="button" onClick={onStep4Submit} className="btn-primary">
                  <CheckIcon className="mr-2 h-4 w-4" />
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