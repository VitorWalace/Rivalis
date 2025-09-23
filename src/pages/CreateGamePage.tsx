import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  ArrowLeftIcon,
  PlusIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { gamesService } from '../services/gamesService';
import toast from 'react-hot-toast';

const createGameSchema = z.object({
  championshipId: z.string().min(1, 'Selecione um campeonato'),
  homeTeamId: z.string().min(1, 'Selecione o time mandante'),
  awayTeamId: z.string().min(1, 'Selecione o time visitante'),
  round: z.number().min(1, 'Rodada deve ser maior que 0').max(100, 'Rodada muito alta'),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  venue: z.string().optional(),
}).refine((data) => data.homeTeamId !== data.awayTeamId, {
  message: "Um time não pode jogar contra si mesmo",
  path: ["awayTeamId"],
});

type CreateGameData = z.infer<typeof createGameSchema>;

export function CreateGamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const championships = useChampionshipStore((state) => state.championships);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateGameData>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      championshipId: searchParams.get('championshipId') || '',
      homeTeamId: '',
      awayTeamId: '',
      round: 1,
      scheduledDate: '',
      scheduledTime: '',
      venue: '',
    },
  });

  const championshipId = watch('championshipId');
  const homeTeamId = watch('homeTeamId');

  // Buscar o campeonato selecionado
  const championship = championships.find(c => c.id === championshipId);
  const availableTeams = championship?.teams || [];

  // Sugerir próxima rodada baseada nos jogos existentes
  useEffect(() => {
    if (championship) {
      const maxRound = Math.max(0, ...championship.games.map(g => g.round));
      setValue('round', maxRound + 1);
    }
  }, [championship, setValue]);

  // Atualizar championship selecionado quando a URL muda
  useEffect(() => {
    const paramChampionshipId = searchParams.get('championshipId');
    if (paramChampionshipId) {
      setValue('championshipId', paramChampionshipId);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: CreateGameData) => {
    setIsSubmitting(true);
    
    try {
      // Combinar data e hora se fornecidas
      let scheduledAt: Date | undefined;
      if (data.scheduledDate) {
        const dateTime = data.scheduledTime 
          ? `${data.scheduledDate}T${data.scheduledTime}`
          : `${data.scheduledDate}T12:00`;
        scheduledAt = new Date(dateTime);
      }

      const gameData = {
        championshipId: data.championshipId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        round: data.round,
        venue: data.venue,
        scheduledAt,
      };

      await gamesService.createGame(gameData);
      
      toast.success('Jogo criado com sucesso!');
      navigate('/games');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar jogo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gerar múltiplos jogos automaticamente
  const handleGenerateRound = async () => {
    if (!championship || championship.teams.length < 2) {
      toast.error('É necessário pelo menos 2 times para gerar uma rodada');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const teams = championship.teams;
      const pairs: Array<{home: string, away: string}> = [];
      
      // Algoritmo simples para criar confrontos (round-robin parcial)
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          pairs.push({
            home: teams[i].id,
            away: teams[i + 1].id
          });
        }
      }

      const maxRound = Math.max(0, ...championship.games.map(g => g.round));
      const newRound = maxRound + 1;

      // Criar todos os jogos da rodada
      for (const pair of pairs) {
        await gamesService.createGame({
          championshipId: championship.id,
          homeTeamId: pair.home,
          awayTeamId: pair.away,
          round: newRound,
        });
      }

      toast.success(`Rodada ${newRound} gerada com ${pairs.length} jogos!`);
      navigate('/games');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar rodada');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'football':
        return '⚽';
      case 'futsal':
        return '🏀';
      default:
        return '🎯';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/60 border-b border-slate-200/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/games')}
                className="p-2 hover:bg-white/60 rounded-xl transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-slate-600" />
              </button>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                    <PlusIcon className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-emerald-900 bg-clip-text text-transparent">
                    Criar Novo Jogo
                  </h1>
                </div>
                <p className="text-xl text-slate-600">
                  Agende e configure um novo jogo para seu campeonato
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário principal */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Seleção do Campeonato */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                  <span>Campeonato e Times</span>
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campeonato *
                    </label>
                    <select
                      {...register('championshipId')}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um campeonato</option>
                      {championships.map(championship => (
                        <option key={championship.id} value={championship.id}>
                          {getSportIcon(championship.sport)} {championship.name} ({championship.teams.length} times)
                        </option>
                      ))}
                    </select>
                    {errors.championshipId && (
                      <p className="text-red-500 text-sm mt-1">{errors.championshipId.message}</p>
                    )}
                  </div>

                  {championship && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time Mandante *
                          </label>
                          <select
                            {...register('homeTeamId')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Selecione o time da casa</option>
                            {availableTeams.map(team => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                          {errors.homeTeamId && (
                            <p className="text-red-500 text-sm mt-1">{errors.homeTeamId.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time Visitante *
                          </label>
                          <select
                            {...register('awayTeamId')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Selecione o time visitante</option>
                            {availableTeams
                              .filter(team => team.id !== homeTeamId)
                              .map(team => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                          </select>
                          {errors.awayTeamId && (
                            <p className="text-red-500 text-sm mt-1">{errors.awayTeamId.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rodada
                        </label>
                        <input
                          {...register('round', { valueAsNumber: true })}
                          type="number"
                          min="1"
                          max="100"
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.round && (
                          <p className="text-red-500 text-sm mt-1">{errors.round.message}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Agendamento */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                  <span>Agendamento</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data do Jogo
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('scheduledDate')}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('scheduledTime')}
                        type="time"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local do Jogo
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('venue')}
                      type="text"
                      placeholder="Ex: Estádio Municipal, Quadra da Escola..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/games')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Jogo'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar com ações rápidas */}
          <div className="space-y-6">
            {/* Gerar rodada automaticamente */}
            {championship && championship.teams.length >= 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Ação Rápida
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Gere uma rodada completa automaticamente com todos os confrontos possíveis.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateRound}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Gerando...' : 'Gerar Rodada Completa'}
                </button>
              </div>
            )}

            {/* Informações do campeonato */}
            {championship && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <span className="text-2xl">{getSportIcon(championship.sport)}</span>
                  <span>Informações</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Campeonato:</span>
                    <span className="font-medium">{championship.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Times:</span>
                    <span className="font-medium">{championship.teams.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jogos:</span>
                    <span className="font-medium">{championship.games.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última rodada:</span>
                    <span className="font-medium">
                      {championship.games.length > 0 
                        ? Math.max(...championship.games.map(g => g.round))
                        : 'Nenhuma'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dicas */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/60">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                💡 Dicas
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Data e horário são opcionais</li>
                <li>• Use "Gerar Rodada" para criar múltiplos jogos</li>
                <li>• O status inicial será "Agendado"</li>
                <li>• Você pode editar o jogo depois</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}