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
import { useEffect, useMemo, useState } from 'react';
import { DashboardStats } from '../components/DashboardStats';
import { QuickActions } from '../components/QuickActions';
import { RecentActivities } from '../components/RecentActivities';
import { FeaturedChampionships } from '../components/FeaturedChampionships';
import { getSportDisplayName } from '../config/sportsCatalog.ts';
import { championshipService } from '../services/championshipService.ts';
import type { Championship } from '../types/index.ts';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const championships = useChampionshipStore((state) => state.championships);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [publicChampionships, setPublicChampionships] = useState<Championship[]>([]);
  const [isLoadingPublicChampionships, setIsLoadingPublicChampionships] = useState(true);

  useEffect(() => {
    console.log('🔗 API Base URL sendo usada no Dashboard');
    console.log('👤 Usuário logado:', user?.name);
    console.log('🏆 Campeonatos carregados:', championships.length);
  }, [user, championships]);

  useEffect(() => {
    let isMounted = true;

    const loadPublicChampionships = async () => {
      try {
        setIsLoadingPublicChampionships(true);
        const response = await championshipService.getPublicChampionships();

        if (!isMounted) return;

        if (response.success && response.data?.championships) {
          const sorted = [...response.data.championships].sort((a, b) => {
            const firstDate = a.startDate ? new Date(a.startDate).getTime() : Number.POSITIVE_INFINITY;
            const secondDate = b.startDate ? new Date(b.startDate).getTime() : Number.POSITIVE_INFINITY;
            return firstDate - secondDate;
          });
          setPublicChampionships(sorted);
        } else {
          setPublicChampionships([]);
        }
      } catch (error) {
        console.error('Erro ao carregar campeonatos públicos:', error);
        if (isMounted) {
          setPublicChampionships([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPublicChampionships(false);
        }
      }
    };

    void loadPublicChampionships();

    return () => {
      isMounted = false;
    };
  }, []);

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
    totalGames: championships.reduce((acc, c) => {
      const games = c.games ?? [];
      const finished = games.filter((game) => {
        const status = String(game?.status ?? '').toLowerCase();
        return ['finalizado', 'finished'].includes(status);
      }).length;
      return acc + finished;
    }, 0),
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

  const featuredPublicChampionships = useMemo(() => publicChampionships.slice(0, 6), [publicChampionships]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-slate-950/60 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <h1 className="text-xl font-bold text-white">Rivalis</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="rounded-md p-1 text-slate-300 hover:bg-white/10 lg:hidden"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-6">
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Minha gestão</p>
            <div className="mt-2 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-100 backdrop-blur hover:bg-blue-500/30"
              >
                <HomeIcon className="mr-3 h-5 w-5" />
                Dashboard
              </Link>

              <Link
                to="/championships"
                className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                🏆 Campeonatos
              </Link>
            </div>
          </div>

        </div>
      </nav>

      <div className="absolute inset-x-3 bottom-6">
        <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/80 text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || 'Usuário'}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.email || 'email@exemplo.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/30"
          >
            <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-2 text-slate-300 hover:bg-white/10 lg:hidden"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
                </h1>
                <p className="text-slate-400">
                  Bem-vindo ao seu painel de controle esportivo
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden items-center space-x-2 text-sm text-slate-300 md:flex">
                <UserIcon className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)] px-6 py-10">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Hero amigável */}
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-8 text-white shadow-2xl shadow-blue-950/40">
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
                      onClick={() => navigate('/championship/create')}
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

              <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40 backdrop-blur">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Próximos passos sugeridos
                  </p>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                      Confira inscrições pendentes dos seus campeonatos.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-blue-400" />
                      Agende as próximas partidas para manter a agenda organizada.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-purple-400" />
                      Avise as equipes sobre atualizações importantes pelo painel.
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-200">
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
                <FeaturedChampionships
                  championships={featuredPublicChampionships}
                  isLoading={isLoadingPublicChampionships}
                />
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