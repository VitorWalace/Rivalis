import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRightOnRectangleIcon, 
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';
import { useEffect, useState } from 'react';
import { DashboardStats } from '../components/DashboardStats';
import { QuickActions } from '../components/QuickActions';
import { RecentActivities } from '../components/RecentActivities';
import { FeaturedChampionships } from '../components/FeaturedChampionships';
import { getSportDisplayName } from '../config/sportsCatalog.ts';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const championships = useChampionshipStore((state) => state.championships);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    totalTeams: championships.reduce((acc, c) => acc + (c.teams?.length || 0), 0),
    totalPlayers: championships.reduce((acc, c) => 
      acc + (c.teams?.reduce((teamAcc, t) => teamAcc + (t.players?.length || 0), 0) || 0), 0
    ),
    totalGames: championships.reduce((acc, c) => acc + (c.games?.length || 0), 0)
  };

  // Gerar atividades recentes mock (você pode integrar com dados reais depois)
  const recentActivities = championships.slice(0, 5).map(championship => ({
    id: championship.id,
    type: 'championship' as const,
    title: `Campeonato ${championship.name}`,
    description: `Campeonato de ${getSportDisplayName(championship.sport)} foi criado`,
    timestamp: championship.createdAt || new Date(),
    status: championship.status
  }));

  // Gerar campeonatos em destaque mock
  const featuredChampionships = [
    {
      id: '1',
      name: 'Copa Brasil de Futsal 2024',
      game: 'Futsal',
      status: 'upcoming' as const,
      startDate: '2024-02-15',
      endDate: '2024-03-15',
      participants: 85,
      maxParticipants: 100,
      prizePool: 'R$ 50.000',
      featured: true,
      organizer: 'Liga Brasileira de Futsal'
    },
    {
      id: '2',
      name: 'Torneio Regional de Vôlei',
      game: 'Vôlei',
      status: 'live' as const,
      startDate: '2024-01-20',
      participants: 24,
      maxParticipants: 32,
      prizePool: 'R$ 15.000',
      featured: false,
      organizer: 'Federação Regional'
    },
    {
      id: '3',
      name: 'Campeonato Universitário de Basquete',
      game: 'Basquete',
      status: 'upcoming' as const,
      startDate: '2024-03-01',
      participants: 45,
      maxParticipants: 64,
      prizePool: 'R$ 25.000',
      featured: true,
      organizer: 'Liga Universitária'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Rivalis</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-6">
          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Minha gestão</p>
            <div className="mt-2 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg"
              >
                <HomeIcon className="w-5 h-5 mr-3" />
                Dashboard
              </Link>

              <Link
                to="/championships"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
              >
                🏆 Campeonatos
              </Link>
            </div>
          </div>

        </div>
      </nav>

      <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'email@exemplo.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
            Sair
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
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
                </h1>
                <p className="text-gray-600">
                  Bem-vindo ao seu painel de controle esportivo
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <UserIcon className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Hero amigável */}
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-8 text-white shadow-2xl">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)]" />
                <div className="relative flex flex-col gap-6">
                  <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                    <SparklesIcon className="h-5 w-5" />
                    Tudo pronto para jogar
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      Olá, {user?.name?.split(' ')[0] || 'organizador'}! Vamos dar um show hoje?
                    </h2>
                    <p className="max-w-xl text-base text-indigo-100">
                      Acompanhe o que está acontecendo agora mesmo, organize novas partidas e mantenha suas equipes animadas com novidades fresquinhas.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate('/championships/create')}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-900/20 transition-transform hover:-translate-y-0.5"
                    >
                      Criar novo campeonato
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => navigate('/championships')}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                    >
                      Ver todos os campeonatos
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Próximos passos sugeridos
                  </p>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      Confira inscrições pendentes dos seus campeonatos.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-blue-500" />
                      Agende as próximas partidas para manter a agenda organizada.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-purple-500" />
                      Avise as equipes sobre atualizações importantes pelo painel.
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Precisa de ajuda rápida? Entre em contato com o suporte Rivalis e resolva tudo em minutos.
                </div>
              </div>
            </div>

            {/* Cards de Estatísticas (versão simples) */}
            <DashboardStats
              totalChampionships={stats.totalChampionships}
              totalTeams={stats.totalTeams}
              totalPlayers={stats.totalPlayers}
              totalGames={stats.totalGames}
            />

            {/* Ações Rápidas (versão simples) */}
            <QuickActions />

            {/* Grid de conteúdo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Campeonatos em Destaque (versão simples) */}
              <div className="lg:col-span-2">
                <FeaturedChampionships championships={featuredChampionships as any} />
              </div>

              {/* Atividades Recentes */}
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