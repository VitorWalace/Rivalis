import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRightOnRectangleIcon, 
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';
import { useEffect, useState } from 'react';
import { DashboardStatsEnhanced } from '../components/DashboardStatsEnhanced';
import { QuickActions } from '../components/QuickActions';
import { RecentActivities } from '../components/RecentActivities';
import { FeaturedChampionshipsEnhanced } from '../components/FeaturedChampionshipsEnhanced';
import CreateChampionshipForm from '../components/CreateChampionshipForm';
import ChampionshipDetails from '../components/ChampionshipDetails';
import AddTeamModal from '../components/AddTeamModal';
import api from '../services/api';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const championships = useChampionshipStore((state) => state.championships);
  const addChampionship = useChampionshipStore((state) => state.addChampionship);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedChampionship, setSelectedChampionship] = useState<any>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

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

  // Funções para gerenciar campeonatos
  const handleCreateChampionship = async (formData: any) => {
    try {
      // Preparar dados para envio
      // Mapear valores do formulário (ingles/novo) para enums do backend
      const sportMap: Record<string,string> = {
        football: 'futebol',
        futsal: 'futsal',
        basketball: 'basquete',
        volleyball: 'volei'
      };
      const formatMap: Record<string,string> = {
        'league': 'pontos-corridos',
        'round-robin': 'pontos-corridos',
        'knockout': 'eliminatorias',
        'group_knockout': 'grupos',
        'groups': 'grupos'
      };
      const statusMap: Record<string,string> = {
        draft: 'rascunho',
        upcoming: 'rascunho',
        active: 'ativo',
        finished: 'finalizado'
      };

      const championshipData = {
        name: formData.name,
        description: formData.description,
        sport: sportMap[formData.modality] || 'futebol',
        status: statusMap[formData.status || 'draft'] || 'rascunho',
        startDate: formData.startDate,
        endDate: formData.endDate,
        registrationStart: formData.registrationStart,
        registrationEnd: formData.registrationEnd,
        maxTeams: formData.maxTeams,
        format: formatMap[formData.format] || 'pontos-corridos',
        rules: formData.rules
      };

      const response = await api.post('/championships', championshipData);
      
      // Adicionar banner se foi fornecido
      let bannerUrl = '';
      if (formData.banner) {
        // Aqui você implementaria upload de imagem - por enquanto usar placeholder
        bannerUrl = formData.bannerPreview;
      }

      const apiChamp = response.data?.data?.championship || response.data?.data || response.data;
      const newChampionship = {
        ...(apiChamp || {}),
        banner: bannerUrl,
        teams: apiChamp?.teams || [],
        games: apiChamp?.games || []
      };

      addChampionship(newChampionship);
      setShowCreateForm(false);
      setSelectedChampionship(newChampionship);
      
      console.log('✅ Campeonato criado:', newChampionship);
    } catch (error) {
      console.error('❌ Erro ao criar campeonato:', error);
    }
  };

  const handleAddTeam = async (teamData: any) => {
    if (!selectedChampionship) return;

    try {
      const response = await api.post('/teams', {
        ...teamData,
        championshipId: selectedChampionship.id
      });

      // Atualizar o campeonato selecionado com novo time
      const updatedChampionship = {
        ...selectedChampionship,
        teams: [...(selectedChampionship.teams || []), response.data.data]
      };
      
      setSelectedChampionship(updatedChampionship);
      setShowAddTeamModal(false);
      
      console.log('✅ Time adicionado:', response.data.data);
    } catch (error) {
      console.error('❌ Erro ao adicionar time:', error);
    }
  };

  const handleGenerateRound = async (championshipId: string) => {
    try {
      const response = await api.post(`/games/generate-round/${championshipId}`);
      console.log('✅ Rodada gerada:', response.data);
      
      // Atualizar dados do campeonato
      if (selectedChampionship && selectedChampionship.id === championshipId) {
        const updatedGames = [...(selectedChampionship.games || []), ...response.data.data.games];
        setSelectedChampionship({
          ...selectedChampionship,
          games: updatedGames
        });
      }
    } catch (error) {
      console.error('❌ Erro ao gerar rodada:', error);
    }
  };

  // Se está exibindo detalhes de um campeonato
  if (selectedChampionship) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedChampionship(null)}
                  className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  ← Voltar
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {selectedChampionship.name}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                  <span className="text-gray-700">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <ChampionshipDetails
            championship={selectedChampionship}
            onGenerateRound={handleGenerateRound}
          />
        </main>

        {/* Add Team Modal */}
        <AddTeamModal
          isOpen={showAddTeamModal}
          onClose={() => setShowAddTeamModal(false)}
          onAddTeam={handleAddTeam}
          championshipId={selectedChampionship.id}
        />
      </div>
    );
  }

  // Se está exibindo formulário de criação
  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">
                Criar Novo Campeonato
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                  <span className="text-gray-700">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <CreateChampionshipForm
            onSubmit={handleCreateChampionship}
            onCancel={() => setShowCreateForm(false)}
          />
        </main>
      </div>
    );
  }

  // Gerar atividades recentes mock (você pode integrar com dados reais depois)
  const recentActivities = championships.slice(0, 5).map(championship => ({
    id: championship.id,
    type: 'championship' as const,
    title: `Campeonato ${championship.name}`,
    description: `Campeonato de ${championship.sport} foi criado`,
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
        <div className="space-y-1">
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
          
          <Link
            to="/teams"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
          >
            👥 Times
          </Link>
          
          <Link
            to="/players"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
          >
            👤 Jogadores
          </Link>
          
          <Link
            to="/games"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
          >
            ⚽ Jogos
          </Link>
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
            {/* Cards de Estatísticas */}
            <DashboardStatsEnhanced 
              stats={{
                totalChampionships: stats.totalChampionships,
                totalTeams: stats.totalTeams,
                totalPlayers: stats.totalPlayers,
                totalGames: stats.totalGames
              }}
            />

            {/* Ações Rápidas */}
            <QuickActions onCreateChampionship={() => setShowCreateForm(true)} />

            {/* Grid de conteúdo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Campeonatos Criados */}
              <div className="lg:col-span-2">
                {championships.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Meus Campeonatos</h2>
                    <div className="grid gap-4">
                      {championships.map((championship) => (
                        <div
                          key={championship.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedChampionship(championship)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{championship.name}</h3>
                              <p className="text-gray-600">{championship.sport === 'football' ? 'Futebol' : 'Futsal'}</p>
                              <p className="text-sm text-gray-500">
                                {championship.teams?.length || 0} times • {championship.games?.length || 0} jogos
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              championship.status === 'active' ? 'bg-green-100 text-green-800' :
                              championship.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {championship.status === 'draft' ? 'Rascunho' : 
                               championship.status === 'active' ? 'Ativo' : 'Finalizado'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <FeaturedChampionshipsEnhanced 
                    championships={featuredChampionships}
                    onViewChampionship={(id) => navigate(`/championships/${id}`)}
                    onJoinChampionship={(id) => console.log('Joining championship:', id)}
                  />
                )}
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
