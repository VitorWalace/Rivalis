import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, TrophyIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';
import { Logo } from '../components/Logo';
import { formatDate } from '../utils';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const championships = useChampionshipStore((state) => state.championships);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="md" variant="colored" showText={true} />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
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
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
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
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Criar Campeonato
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {championships.map((championship) => (
              <div key={championship.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {championship.name}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {championship.sport === 'football' ? 'Futebol de Campo' : 'Futsal'}
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
                    {championship.status === 'active' && 'Ativo'}
                    {championship.status === 'draft' && 'Rascunho'}
                    {championship.status === 'finished' && 'Finalizado'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Times:</span>
                    <span className="font-medium">{championship.teams.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jogos:</span>
                    <span className="font-medium">{championship.games.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Criado em:</span>
                    <span className="font-medium">{formatDate(championship.createdAt)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {championship.adminId === user?.id ? 'Administrador' : 'Participante'}
                  </span>
                  <Link
                    to={`/championship/${championship.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
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