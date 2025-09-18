import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';
import { useEffect, useState } from 'react';
import { DashboardStatsEnhanced } from '../components/DashboardStatsEnhanced';
import { QuickActionsEnhanced } from '../components/QuickActionsEnhanced';
import { RecentActivities } from '../components/RecentActivities';
import { FeaturedChampionshipsEnhanced } from '../components/FeaturedChampionshipsEnhanced';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const championships = useChampionshipStore((state) => state.championships);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  interface Player { id: string; name?: string; }
  interface Team { id: string; players?: Player[]; }
  interface Game { id: string; }
  interface Championship {
    id: string;
    name: string;
    sport: string;
    status?: string;
    createdAt?: Date | string;
    teams?: Team[];
    games?: Game[];
  }

  useEffect(() => {
    console.log('🔗 API Base URL sendo usada no Dashboard');
    console.log('👤 Usuário logado:', user?.name);
    console.log('🏆 Campeonatos carregados:', championships.length);
  }, [user, championships]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calcular estatísticas
  const stats = {
    totalChampionships: championships.length,
    totalTeams: championships.reduce((acc: number, c: Championship) => acc + (c.teams?.length || 0), 0),
    totalPlayers: championships.reduce((acc: number, c: Championship) => {
      const teamPlayers = c.teams?.reduce((teamAcc: number, t: Team) => teamAcc + (t.players?.length || 0), 0) || 0;
      return acc + teamPlayers;
    }, 0),
    totalGames: championships.reduce((acc: number, c: Championship) => acc + (c.games?.length || 0), 0)
  };

  // Gerar atividades recentes mock (você pode integrar com dados reais depois)
  const recentActivities = championships.slice(0, 5).map((championship: Championship) => ({
    id: championship.id,
    type: 'championship' as const,
    title: `Campeonato ${championship.name}`,
    description: `Campeonato de ${championship.sport} foi criado`,
    timestamp: championship.createdAt || new Date(),
    status: championship.status
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-14 px-5 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Rivalis</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100"
        >
          <XMarkIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <nav className="mt-4 px-3 text-sm">
        <ul className="space-y-1 font-medium">
          <li>
            <Link to="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 bg-gray-100 text-gray-900">
              <HomeIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/championships" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
              <TrophyIcon className="h-5 w-5" />
              <span>Campeonatos</span>
            </Link>
          </li>
          <li>
            <Link to="/teams" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
              <UserGroupIcon className="h-5 w-5" />
              <span>Times</span>
            </Link>
          </li>
          <li>
            <Link to="/players" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
              <UsersIcon className="h-5 w-5" />
              <span>Jogadores</span>
            </Link>
          </li>
          <li>
            <Link to="/games" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
              <PlayIcon className="h-5 w-5" />
              <span>Jogos</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
            <p className="truncate text-xs text-gray-500">{user?.email || 'email@exemplo.com'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
            title="Sair"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Bars3Icon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}
                </h1>
                <p className="text-sm text-gray-500">Painel de acompanhamento</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                <UserIcon className="h-4 w-4" />{user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="mx-auto max-w-7xl space-y-8">
            <DashboardStatsEnhanced 
              stats={{
                totalChampionships: stats.totalChampionships,
                totalTeams: stats.totalTeams,
                totalPlayers: stats.totalPlayers,
                totalGames: stats.totalGames
              }}
            />
            <QuickActionsEnhanced />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                <FeaturedChampionshipsEnhanced />
              </div>
              <div className="lg:col-span-1">
                <RecentActivities activities={recentActivities} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}