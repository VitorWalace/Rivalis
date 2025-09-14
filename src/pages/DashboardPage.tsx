import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, TrophyIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';
import { formatDate } from '../utils';
import { useEffect } from 'react';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const championships = useChampionshipStore((state) => state.championships);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('DashboardPage mounted');
    console.log('User:', user);
    console.log('Championships:', championships);
    
    // Debug: verificar cada campeonato
    championships.forEach((championship, index) => {
      console.log(`Championship ${index}:`, {
        id: championship.id,
        name: championship.name,
        createdAt: championship.createdAt,
        createdAtType: typeof championship.createdAt,
        isValidDate: championship.createdAt ? !isNaN(new Date(championship.createdAt).getTime()) : false
      });
    });
  }, [user, championships]);

  const handleLogout = () => {
    console.log('Fazendo logout...');
    logout();
    navigate('/login');
  };

  const handleClearStorage = () => {
    console.log('Limpando localStorage...');
    localStorage.clear();
    window.location.reload();
  };

  const handleFixDates = () => {
    console.log('Tentando corrigir datas inválidas...');
    // Verificar e corrigir dados dos campeonatos
    const fixedChampionships = championships.map(championship => ({
      ...championship,
      createdAt: championship.createdAt ? new Date(championship.createdAt) : new Date(),
      startDate: championship.startDate ? new Date(championship.startDate) : undefined,
      endDate: championship.endDate ? new Date(championship.endDate) : undefined,
    }));
    
    console.log('Campeonatos corrigidos:', fixedChampionships);
  };

  console.log('Renderizando DashboardPage...');

  if (!user) {
    console.log('⚠️ User não encontrado, renderizando fallback');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Problema de Autenticação</h2>
          <p className="text-gray-600 mb-6">Não foi possível carregar os dados do usuário.</p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              Ir para Login
            </Link>
            <button
              onClick={handleClearStorage}
              className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              Limpar Cache
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">Rivalis</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name || 'Usuário'}</span>
              </div>
              <Link
                to="/login"
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                Login
              </Link>
              <button
                onClick={handleFixDates}
                className="text-xs text-yellow-600 hover:text-yellow-800 px-2 py-1 rounded border border-yellow-300"
                title="Corrigir Datas (Debug)"
              >
                Fix Dates
              </button>
              <button
                onClick={handleClearStorage}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-300"
                title="Limpar Cache (Debug)"
              >
                Debug
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Meus Campeonatos</h2>
          <p className="text-gray-600">Gerencie seus torneios e acompanhe o desempenho dos jogadores</p>
        </div>

        {/* Create Championship Button */}
        <div className="mb-8">
          <Link
            to="/championship/create"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Criar Novo Campeonato
          </Link>
        </div>

        {/* Championships Grid */}
        {championships.length === 0 ? (
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum campeonato encontrado</h3>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro campeonato!</p>
            <Link
              to="/championship/create"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Criar Campeonato
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {championships.map((championship) => (
              <div key={championship.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {championship.name}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {championship.sport === 'football' ? 'Futebol de Campo' : 
                       championship.sport === 'futsal' ? 'Futsal' : 
                       championship.sport === 'futebol' ? 'Futebol' : championship.sport}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      championship.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : championship.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {championship.status === 'active' ? 'Ativo' :
                     championship.status === 'draft' ? 'Rascunho' :
                     championship.status === 'finished' ? 'Finalizado' : championship.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Times:</span>
                    <span className="font-medium">{championship.teams?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jogos:</span>
                    <span className="font-medium">{championship.games?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Criado em:</span>
                    <span className="font-medium">
                      {championship.createdAt ? formatDate(championship.createdAt) : 'Data não disponível'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {championship.adminId === user?.id ? 'Administrador' : 'Participante'}
                  </span>
                  <Link
                    to={`/championship/${championship.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Ver campeonato →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}