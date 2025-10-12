import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  TrophyIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';
import { Logo } from '../components/Logo';
import { formatDate } from '../utils';
import { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/enhancedApi';

interface DashboardStats {
  totalChampionships: number;
  activeChampionships: number;
  totalTeams: number;
  totalPlayers: number;
  totalGames: number;
  finishedGames: number;
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const championships = useChampionshipStore((state) => state.championships);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response: any = await dashboardAPI.getStats();
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getChampionshipStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'finished':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChampionshipStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'draft':
        return 'Rascunho';
      case 'finished':
        return 'Finalizado';
      default:
        return 'Cancelado';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="md" variant="colored" showText={true} />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/60 px-3 py-1.5 rounded-full">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                title="Sair"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user?.name}! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Gerencie seus campeonatos e acompanhe o desempenho dos times
          </p>
        </div>

        {/* Statistics Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-2xl p-6 h-32">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <TrophyIcon className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.totalChampionships}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">Total de Campeonatos</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <FireIcon className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.activeChampionships}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">Campeonatos Ativos</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <UserGroupIcon className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.totalTeams}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">Times Cadastrados</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <UserIcon className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">Jogadores</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <PlayIcon className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.totalGames}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">Total de Jogos</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <CheckCircleIcon className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.finishedGames}</span>
              </div>
              <p className="text-gray-600 text-sm font-medium">Jogos Finalizados</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            to="/championship/create"
            className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Criar Novo Campeonato
          </Link>
          
          <button className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors duration-200 shadow-sm hover:shadow-md">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Ver Estatísticas
          </button>

          <button className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors duration-200 shadow-sm hover:shadow-md">
            <StarIcon className="h-5 w-5 mr-2" />
            Rankings
          </button>
        </div>

        {/* Championships Section */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Meus Campeonatos</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>Atualizados recentemente</span>
            </div>
          </div>

          {/* Championships Grid */}
          {championships.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <TrophyIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Nenhum campeonato encontrado</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Comece criando seu primeiro campeonato e organize torneios incríveis!
              </p>
              <Link
                to="/championship/create"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <PlusIcon className="h-6 w-6 mr-3" />
                Criar Primeiro Campeonato
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {championships.map((championship) => (
                <div 
                  key={championship.id} 
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {championship.name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        {championship.sport === 'football' ? 'Futebol de Campo' : 
                         championship.sport === 'futsal' ? 'Futsal' : championship.sport}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getChampionshipStatusColor(championship.status)}`}
                    >
                      {getChampionshipStatusText(championship.status)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        Times
                      </span>
                      <span className="font-semibold text-gray-900">{championship.teams?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center">
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Jogos
                      </span>
                      <span className="font-semibold text-gray-900">{championship.games?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Criado em
                      </span>
                      <span className="font-semibold text-gray-900">{formatDate(championship.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <StarIcon className="h-4 w-4 mr-1" />
                      <span>{championship.adminId === user?.id ? 'Administrador' : 'Participante'}</span>
                    </div>
                    <Link
                      to={`/championship/${championship.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm group-hover:text-blue-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ver campeonato
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 rounded-lg p-2 mr-3">
                <TrophyIcon className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Campeonatos</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Crie e gerencie seus torneios de forma profissional
            </p>
            <Link
              to="/championship/create"
              className="text-gray-700 hover:text-gray-900 font-medium text-sm"
            >
              Criar campeonato →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 rounded-lg p-2 mr-3">
                <ChartBarIcon className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Estatísticas</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Acompanhe o desempenho e evolução dos seus campeonatos
            </p>
            <button className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              Ver relatórios →
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 rounded-lg p-2 mr-3">
                <UserGroupIcon className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Comunidade</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Conecte-se com outros organizadores e jogadores
            </p>
            <button className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              Explorar →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}