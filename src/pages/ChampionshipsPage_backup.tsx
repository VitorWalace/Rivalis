import { Link } from 'react-router-dom';
import { PlusIcon, TrophyIcon, CalendarIcon, UsersIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { useEffect, useState } from 'react';
import { championshipAPI } from '../services/enhancedApi';
import toast from 'react-hot-toast';

// Banners por esporte
const getSportBanner = (sport: string) => {
  const banners = {
    football: {
      gradient: 'from-green-500 via-green-600 to-emerald-700',
      icon: '⚽',
      pattern: 'bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_20%,_transparent_21%)]'
    },
    futsal: {
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      icon: '🏐',
      pattern: 'bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.15)_15%,_transparent_16%)]'
    },
    basketball: {
      gradient: 'from-orange-500 via-orange-600 to-red-600',
      icon: '🏀',
      pattern: 'bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_10%,_transparent_11%)]'
    },
    volleyball: {
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      icon: '🏐',
      pattern: 'bg-[linear-gradient(45deg,_rgba(255,255,255,0.1)_25%,_transparent_25%)]'
    },
    tennis: {
      gradient: 'from-yellow-500 via-yellow-600 to-amber-600',
      icon: '🎾',
      pattern: 'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2)_25%,_transparent_26%)]'
    },
    default: {
      gradient: 'from-gray-500 via-gray-600 to-slate-700',
      icon: '🏆',
      pattern: 'bg-[linear-gradient(135deg,_rgba(255,255,255,0.1)_25%,_transparent_25%)]'
    }
  };
  
  return banners[sport as keyof typeof banners] || banners.default;
};

export function ChampionshipsPage() {
  const championships = useChampionshipStore((state) => state.championships);
  const [isLoading, setIsLoading] = useState(true);

  // Sincronizar com backend na inicialização
  useEffect(() => {
    const syncChampionships = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Buscando campeonatos do backend...');
        
        // PRIMEIRO: Limpar TODOS os dados fake do store
        console.log('🧹 Limpando dados fake do store...');
        useChampionshipStore.setState({ championships: [] });
        
        const resp: any = await championshipAPI.getAll();
        const backendChamps = resp?.data?.championships || resp?.championships || [];
        
        console.log('📋 Campeonatos recebidos do backend:', backendChamps.length);
        
        // Filtrar apenas campeonatos com UUIDs válidos (remover qualquer ID fake que tenha escapado)
        const validChamps = backendChamps.filter((champ: any) => {
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(champ.id);
          if (!isValidUUID) {
            console.warn('🚫 Removendo campeonato com ID inválido:', champ.id, champ.name);
          }
          return isValidUUID;
        });
        
        console.log('✅ Campeonatos válidos após filtro:', validChamps.length);
        validChamps.forEach((champ: any, index: number) => {
          console.log(`${index + 1}. ID: ${champ.id}, Nome: ${champ.name}`);
        });
        
        // Substituir pela lista limpa e validada
        useChampionshipStore.setState({
          championships: validChamps.map((champ: any) => ({
            ...champ, 
            teams: champ.teams || [], 
            games: champ.games || []
          }))
        });
        
        console.log('✅ Sincronização concluída com', validChamps.length, 'campeonatos válidos');
      } catch (error) {
        console.error('❌ Erro ao sincronizar campeonatos:', error);
        // Se falhar, deixar lista vazia em vez de manter dados fake
        console.log('🧹 Mantendo store limpo devido ao erro');
        useChampionshipStore.setState({ championships: [] });
      } finally {
        setIsLoading(false);
      }
    };

    syncChampionships();
  }, []); // Remover dependências para evitar loops

  const handleDeleteChampionship = async (e: React.MouseEvent, championshipId: string, championshipName: string) => {
    e.preventDefault(); // Evita navegação do Link
    e.stopPropagation();
    
    // VERIFICAÇÃO CRÍTICA: Bloquear IDs fake
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(championshipId);
    if (!isValidUUID) {
      console.error('🚫 Tentativa de excluir campeonato com ID inválido:', championshipId);
      toast.error('Erro: ID de campeonato inválido. Recarregue a página e tente novamente.');
      // Forçar sincronização
      window.location.reload();
      return;
    }
    
    // Verificar se o usuário está logado
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Você precisa estar logado para excluir campeonatos');
      return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir o campeonato "${championshipName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      console.log('🗑️ Iniciando exclusão do campeonato:', championshipId);
      console.log('🔑 Token presente:', token ? 'Sim' : 'Não');
      
      const response = await championshipAPI.delete(championshipId);
      console.log('✅ Resposta da exclusão:', response);
      
      // Força reload para sincronizar com backend
      window.location.reload();
      toast.success('Campeonato excluído com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro completo ao excluir campeonato:', error);
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      
      let errorMessage = 'Erro ao excluir campeonato. Tente novamente.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
        // Limpar dados da sessão
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (error.response?.status === 404) {
        errorMessage = 'Campeonato não encontrado ou você não tem permissão para excluí-lo.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para excluir este campeonato.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message.includes('Network Error')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando campeonatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header with enhanced gradient */}
      <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/60 border-b border-slate-200/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <TrophyIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
                  Campeonatos
                </h1>
              </div>
              <p className="text-xl text-slate-600 max-w-2xl">
                Gerencie todos os seus campeonatos e torneios com estilo e organização
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Botão temporário para debug - REMOVER depois */}
              <button
                onClick={() => {
                  // Limpar completamente o localStorage
                  localStorage.removeItem('championship-store');
                  useChampionshipStore.setState({ championships: [] });
                  console.log('🧹 Cache limpo! Recarregando...');
                  window.location.reload();
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                🧹 Limpar Cache
              </button>
              
              <Link
                to="/championships/create"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <PlusIcon className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                Novo Campeonato
              </Link>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {championships.length === 0 ? (
          // Enhanced Empty State
          <div className="text-center py-20">
            <div className="relative mx-auto mb-8">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto shadow-lg">
                <TrophyIcon className="h-16 w-16 text-indigo-600" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">✨</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
              Nenhum campeonato criado ainda
            </h3>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
              Comece criando seu primeiro campeonato e organize competições incríveis para seus amigos e comunidade!
            </p>
            <Link
              to="/championships/create"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
            >
              <PlusIcon className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              Criar Primeiro Campeonato
            </Link>
          </div>
        ) : (
          // Enhanced Championships Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {championships.map((championship) => {
              const banner = getSportBanner(championship.sport || 'default');
              
              return (
                <Link
                  key={championship.id}
                  to={`/championship/${championship.id}`}
                  className="group bg-white rounded-3xl border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 backdrop-blur-sm"
                >
                  {/* Sport Banner */}
                  <div className={`h-48 bg-gradient-to-br ${banner.gradient} ${banner.pattern} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-6 left-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-4xl drop-shadow-lg">{banner.icon}</span>
                        <div className="text-white">
                          <p className="text-sm font-medium opacity-90 capitalize">
                            {championship.sport === 'football' ? 'Futebol de Campo' : 
                             championship.sport === 'futsal' ? 'Futsal' : 
                             championship.sport || 'Esporte'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-6 right-6 flex items-center space-x-2">
                      <div className={`
                        px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20
                        ${championship.status === 'active' ? 'bg-green-500/90 text-white' : ''}
                        ${championship.status === 'draft' ? 'bg-yellow-500/90 text-white' : ''}
                        ${championship.status === 'finished' ? 'bg-slate-500/90 text-white' : ''}
                      `}>
                        {championship.status === 'active' ? '🟢 Ativo' : ''}
                        {championship.status === 'draft' ? '🟡 Rascunho' : ''}
                        {championship.status === 'finished' ? '⚫ Finalizado' : ''}
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteChampionship(e, championship.id, championship.name)}
                        className="p-2 bg-red-500/90 hover:bg-red-600/90 text-white rounded-full backdrop-blur-sm border border-white/20 transition-colors duration-200 shadow-lg hover:shadow-xl"
                        title="Excluir campeonato"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16"></div>
                    <div className="absolute top-1/2 right-4 w-16 h-16 bg-white/5 rounded-full"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-300 mb-2">
                        {championship.name}
                      </h3>
                      <p className="text-slate-600 text-sm">
                        Campeonato de {championship.sport === 'football' ? 'Futebol' : 'Futsal'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-center mb-2">
                          <UsersIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{championship.teams.length}</p>
                        <p className="text-xs text-slate-600 font-medium">Times</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-center mb-2">
                          <PlayIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{championship.games.length}</p>
                        <p className="text-xs text-slate-600 font-medium">Jogos</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-center mb-2">
                          <CalendarIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {championship.startDate ? 
                            new Date(championship.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 
                            '--'
                          }
                        </p>
                        <p className="text-xs text-slate-600 font-medium">Início</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                          Criado em {championship.createdAt.toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex items-center text-indigo-600 group-hover:text-indigo-700 font-medium text-sm">
                          <span>Ver detalhes</span>
                          <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}