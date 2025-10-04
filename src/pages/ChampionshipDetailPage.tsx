import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PencilSquareIcon,
  ChartBarIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { toast } from 'react-hot-toast';
import type { Team } from '../types';

export default function ChampionshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { championships, setCurrentChampionship, deleteChampionship, updateChampionship } = useChampionshipStore();
  const [championship, setChampionship] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'games' | 'stats'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Estados para criação de time
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamPlayers, setTeamPlayers] = useState<Array<{ name: string; number: string; position: string; avatar?: string }>>([]);
  const [currentPlayer, setCurrentPlayer] = useState({ name: '', number: '', position: 'Atacante', avatar: '' });

  // Estados para criação de partidas
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameMode, setGameMode] = useState<'manual' | 'auto'>('manual');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameLocation, setGameLocation] = useState('');
  const [gameRound, setGameRound] = useState(1);
  const [tournamentFormat, setTournamentFormat] = useState<'round-robin' | 'knockout'>('round-robin');

  useEffect(() => {
    if (id) {
      const found = championships.find(c => c.id === id);
      if (found) {
        setChampionship(found);
        setCurrentChampionship(found);
      } else {
        navigate('/championships');
      }
    }
  }, [id, championships, navigate, setCurrentChampionship]);

  if (!championship) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteChampionship(championship.id);
    toast.success('Campeonato excluído com sucesso');
    navigate('/championships');
  };

  const handleTeamLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlayerAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPlayer({ ...currentPlayer, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlayer = () => {
    if (currentPlayer.name && currentPlayer.number) {
      setTeamPlayers([...teamPlayers, currentPlayer]);
      setCurrentPlayer({ name: '', number: '', position: 'Atacante', avatar: '' });
      toast.success('Jogador adicionado!');
    }
  };

  const handleRemovePlayer = (index: number) => {
    setTeamPlayers(teamPlayers.filter((_, i) => i !== index));
    toast.success('Jogador removido');
  };

  const handleCreateTeam = () => {
    if (!teamName.trim()) {
      toast.error('Digite o nome do time');
      return;
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      name: teamName,
      logo: teamLogo,
      championshipId: championship.id,
      players: teamPlayers.map(p => ({
        id: Date.now().toString() + Math.random(),
        name: p.name,
        number: parseInt(p.number),
        position: p.position,
        avatar: p.avatar,
        teamId: Date.now().toString(),
        stats: {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          matchesPlayed: 0,
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        },
        achievements: [],
        xp: 0,
        level: 1,
      })),
      stats: {
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        games: 0,
        position: 0,
      },
    };

    const updatedTeams = [...(championship.teams || []), newTeam];
    updateChampionship(championship.id, { teams: updatedTeams });
    setChampionship({ ...championship, teams: updatedTeams });

    // Reset form
    setTeamName('');
    setTeamLogo('');
    setTeamPlayers([]);
    setCurrentPlayer({ name: '', number: '', position: 'Atacante', avatar: '' });
    setShowTeamForm(false);
    toast.success('Time criado com sucesso!');
  };

  const handleCreateManualGame = () => {
    if (!homeTeamId || !awayTeamId) {
      toast.error('Selecione os dois times');
      return;
    }
    if (homeTeamId === awayTeamId) {
      toast.error('Selecione times diferentes');
      return;
    }

    const homeTeam = championship.teams?.find((t: any) => t.id === homeTeamId);
    const awayTeam = championship.teams?.find((t: any) => t.id === awayTeamId);

    const newGame = {
      id: Date.now().toString(),
      championshipId: championship.id,
      homeTeamId,
      awayTeamId,
      homeTeamName: homeTeam?.name || '',
      awayTeamName: awayTeam?.name || '',
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
      round: gameRound,
      date: gameDate || undefined,
      location: gameLocation || undefined,
    };

    const updatedGames = [...(championship.games || []), newGame];
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });

    // Reset
    setHomeTeamId('');
    setAwayTeamId('');
    setGameDate('');
    setGameLocation('');
    toast.success('Partida criada com sucesso!');
  };

  const handleGenerateRoundRobin = () => {
    const teams = championship.teams || [];
    if (teams.length < 2) {
      toast.error('É necessário pelo menos 2 times');
      return;
    }

    const games: any[] = [];

    // Gera todos contra todos (ida e volta)
    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams.length; j++) {
        if (i !== j) {
          games.push({
            id: Date.now().toString() + Math.random(),
            championshipId: championship.id,
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id,
            homeTeamName: teams[i].name,
            awayTeamName: teams[j].name,
            homeScore: 0,
            awayScore: 0,
            status: 'scheduled',
            round: Math.ceil(games.length / Math.floor(teams.length / 2)) || 1,
          });
        }
      }
    }

    const updatedGames = [...(championship.games || []), ...games];
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });
    setShowGameForm(false);
    toast.success(`${games.length} partidas geradas!`);
  };

  const handleGenerateKnockout = () => {
    const teams = championship.teams || [];
    if (teams.length < 2) {
      toast.error('É necessário pelo menos 2 times');
      return;
    }

    // Verifica se é potência de 2
    const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
    if (!isPowerOfTwo(teams.length)) {
      toast.error('Para mata-mata, o número de times deve ser 2, 4, 8, 16, etc.');
      return;
    }

    const games: any[] = [];
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledTeams.length; i += 2) {
      games.push({
        id: Date.now().toString() + Math.random(),
        championshipId: championship.id,
        homeTeamId: shuffledTeams[i].id,
        awayTeamId: shuffledTeams[i + 1].id,
        homeTeamName: shuffledTeams[i].name,
        awayTeamName: shuffledTeams[i + 1].name,
        homeScore: 0,
        awayScore: 0,
        status: 'scheduled',
        round: 1,
        stage: `Oitavas de Final`,
      });
    }

    const updatedGames = [...(championship.games || []), ...games];
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });
    setShowGameForm(false);
    toast.success(`${games.length} partidas geradas!`);
  };

  const handleDeleteGame = (gameId: string) => {
    const updatedGames = championship.games.filter((g: any) => g.id !== gameId);
    updateChampionship(championship.id, { games: updatedGames });
    setChampionship({ ...championship, games: updatedGames });
    toast.success('Partida excluída');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/championships"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{championship.name}</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {championship.sport} • {championship.format}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Excluir Campeonato
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Times</p>
                <p className="text-2xl font-bold text-slate-900">{championship.teams?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Partidas</p>
                <p className="text-2xl font-bold text-slate-900">{championship.games?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <UsersIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Jogadores</p>
                <p className="text-2xl font-bold text-slate-900">
                  {championship.teams?.reduce((acc: number, team: any) => acc + (team.players?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <p className="text-lg font-semibold text-slate-900">{championship.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex">
              {[
                { id: 'overview', label: 'Visão Geral', icon: TrophyIcon },
                { id: 'teams', label: 'Times', icon: UserGroupIcon },
                { id: 'games', label: 'Partidas', icon: CalendarIcon },
                { id: 'stats', label: 'Estatísticas', icon: ChartBarIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Informações do Campeonato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                      <MapPinIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-600">Local</p>
                        <p className="text-slate-900">{championship.location || 'Não especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-600">Período</p>
                        <p className="text-slate-900">
                          {championship.startDate ? new Date(championship.startDate).toLocaleDateString('pt-BR') : 'Não definido'}
                          {championship.endDate && ` - ${new Date(championship.endDate).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {championship.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Descrição</h3>
                    <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">{championship.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div>
                {!showTeamForm && (
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Times Cadastrados ({championship.teams?.length || 0})
                    </h3>
                    <button
                      onClick={() => setShowTeamForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Novo Time
                    </button>
                  </div>
                )}

                {/* Team Form */}
                {showTeamForm && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">Cadastrar Novo Time</h3>
                      <button
                        onClick={() => setShowTeamForm(false)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-slate-600" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Team Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nome do Time *
                          </label>
                          <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Digite o nome do time"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Logo do Time
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleTeamLogoUpload}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {teamLogo && (
                            <div className="mt-2 flex items-center gap-2">
                              <img src={teamLogo} alt="Logo" className="h-12 w-12 object-cover rounded" />
                              <button
                                onClick={() => setTeamLogo('')}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remover
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Players */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 mb-3">Jogadores</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <input
                            type="text"
                            value={currentPlayer.name}
                            onChange={(e) => setCurrentPlayer({ ...currentPlayer, name: e.target.value })}
                            placeholder="Nome do jogador"
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={currentPlayer.number}
                            onChange={(e) => setCurrentPlayer({ ...currentPlayer, number: e.target.value })}
                            placeholder="Número"
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <select
                            value={currentPlayer.position}
                            onChange={(e) => setCurrentPlayer({ ...currentPlayer, position: e.target.value })}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option>Goleiro</option>
                            <option>Defensor</option>
                            <option>Meio-campo</option>
                            <option>Atacante</option>
                          </select>
                          <button
                            onClick={handleAddPlayer}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Adicionar
                          </button>
                        </div>

                        {/* Player Avatar */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Foto do Jogador
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePlayerAvatarUpload}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {currentPlayer.avatar && (
                            <div className="mt-2 flex items-center gap-2">
                              <img src={currentPlayer.avatar} alt="Avatar" className="h-12 w-12 object-cover rounded-full" />
                              <button
                                onClick={() => setCurrentPlayer({ ...currentPlayer, avatar: '' })}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remover
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Players List */}
                        {teamPlayers.length > 0 && (
                          <div className="space-y-2">
                            {teamPlayers.map((player, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3">
                                  {player.avatar && (
                                    <img src={player.avatar} alt={player.name} className="h-10 w-10 object-cover rounded-full" />
                                  )}
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      #{player.number} {player.name}
                                    </p>
                                    <p className="text-sm text-slate-600">{player.position}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemovePlayer(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleCreateTeam}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Criar Time
                      </button>
                    </div>
                  </div>
                )}

                {/* Teams Grid */}
                {!showTeamForm && championship.teams?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {championship.teams.map((team: any) => (
                      <div key={team.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="h-12 w-12 object-cover rounded" />
                          ) : (
                            <div className="h-12 w-12 bg-slate-100 rounded flex items-center justify-center">
                              <UserGroupIcon className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-slate-900">{team.name}</h4>
                            <p className="text-sm text-slate-600">{team.players?.length || 0} jogadores</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="bg-slate-50 rounded p-2">
                            <p className="text-slate-600">V</p>
                            <p className="font-semibold text-slate-900">{team.stats?.wins || 0}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2">
                            <p className="text-slate-600">E</p>
                            <p className="font-semibold text-slate-900">{team.stats?.draws || 0}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2">
                            <p className="text-slate-600">D</p>
                            <p className="font-semibold text-slate-900">{team.stats?.losses || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showTeamForm && (!championship.teams || championship.teams.length === 0) && (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                    <UserGroupIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum time cadastrado</h3>
                    <p className="text-sm text-slate-600 mb-6">Comece criando o primeiro time do campeonato</p>
                    <button
                      onClick={() => setShowTeamForm(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Criar Primeiro Time
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Games Tab */}
            {activeTab === 'games' && (
              <div>
                {!showGameForm && (
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Gestão de Partidas ({championship.games?.length || 0})
                    </h3>
                    <button
                      onClick={() => setShowGameForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Nova Partida
                    </button>
                  </div>
                )}

                {/* Game Form */}
                {showGameForm && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Cadastrar Partidas</h3>
                        <p className="text-sm text-slate-600 mt-1">Escolha o método de cadastro</p>
                      </div>
                      <button
                        onClick={() => setShowGameForm(false)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-slate-600" />
                      </button>
                    </div>

                    {/* Mode Selector */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Método de Cadastro
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => setGameMode('manual')}
                          className={`p-4 rounded-lg border-2 transition-colors text-left ${
                            gameMode === 'manual'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <PencilSquareIcon className={`h-5 w-5 mt-0.5 ${
                              gameMode === 'manual' ? 'text-blue-600' : 'text-slate-400'
                            }`} />
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-1">Manual</h5>
                              <p className="text-sm text-slate-600">Cadastre partidas individualmente</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setGameMode('auto')}
                          className={`p-4 rounded-lg border-2 transition-colors text-left ${
                            gameMode === 'auto'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <CalendarIcon className={`h-5 w-5 mt-0.5 ${
                              gameMode === 'auto' ? 'text-blue-600' : 'text-slate-400'
                            }`} />
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-1">Automático</h5>
                              <p className="text-sm text-slate-600">Gere tabela completa automaticamente</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Manual Mode */}
                    {gameMode === 'manual' && (
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-sm font-medium text-slate-900 mb-4">
                          Dados da Partida
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Time da Casa *
                            </label>
                            <select
                              value={homeTeamId}
                              onChange={(e) => setHomeTeamId(e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Selecione o time</option>
                              {championship.teams?.map((team: any) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Time Visitante *
                            </label>
                            <select
                              value={awayTeamId}
                              onChange={(e) => setAwayTeamId(e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Selecione o time</option>
                              {championship.teams?.map((team: any) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Rodada
                            </label>
                            <input
                              type="number"
                              value={gameRound}
                              onChange={(e) => setGameRound(parseInt(e.target.value))}
                              min="1"
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Data e Hora
                            </label>
                            <input
                              type="datetime-local"
                              value={gameDate}
                              onChange={(e) => setGameDate(e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Local da Partida
                            </label>
                            <input
                              type="text"
                              value={gameLocation}
                              onChange={(e) => setGameLocation(e.target.value)}
                              placeholder="Ex: Estádio Municipal, Ginásio ABC..."
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleCreateManualGame}
                          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                        >
                          Cadastrar Partida
                        </button>
                      </div>
                    )}

                    {/* Auto Mode */}
                    {gameMode === 'auto' && (
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-sm font-medium text-slate-900 mb-4">
                          Formato da Competição
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <button
                            onClick={() => setTournamentFormat('round-robin')}
                            className={`p-4 rounded-lg border-2 transition-colors text-left ${
                              tournamentFormat === 'round-robin'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <h5 className="font-semibold text-slate-900 mb-2">Pontos Corridos</h5>
                            <p className="text-sm text-slate-600 mb-3">Sistema de liga com turno e returno</p>
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>• Todos os times se enfrentam</div>
                              <div>• {championship.teams?.length || 0} times = {((championship.teams?.length || 0) * ((championship.teams?.length || 0) - 1))} partidas</div>
                            </div>
                          </button>
                          <button
                            onClick={() => setTournamentFormat('knockout')}
                            className={`p-4 rounded-lg border-2 transition-colors text-left ${
                              tournamentFormat === 'knockout'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <h5 className="font-semibold text-slate-900 mb-2">Eliminatória</h5>
                            <p className="text-sm text-slate-600 mb-3">Sistema de mata-mata por fases</p>
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>• Eliminação direta</div>
                              <div>• Requer 2, 4, 8, 16... times</div>
                            </div>
                          </button>
                        </div>
                        {tournamentFormat === 'round-robin' && (
                          <button
                            onClick={handleGenerateRoundRobin}
                            disabled={!championship.teams || championship.teams.length < 2}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            Gerar Tabela Completa ({((championship.teams?.length || 0) * ((championship.teams?.length || 0) - 1))} partidas)
                          </button>
                        )}
                        {tournamentFormat === 'knockout' && (
                          <button
                            onClick={handleGenerateKnockout}
                            disabled={!championship.teams || championship.teams.length < 2}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            Gerar Chaveamento ({Math.floor((championship.teams?.length || 0) / 2)} partidas iniciais)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Games List */}
                {!showGameForm && championship.games?.length > 0 && (
                  <div className="space-y-3">
                    {championship.games.map((game: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                Rodada {game.round}
                              </span>
                              {game.stage && (
                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                  {game.stage}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded text-xs font-medium ${
                                game.status === 'finished' 
                                  ? 'bg-green-100 text-green-700' 
                                  : game.status === 'in-progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {game.status === 'finished' ? 'Finalizado' : game.status === 'in-progress' ? 'Em Andamento' : 'Agendado'}
                              </span>
                              <button
                                onClick={() => handleDeleteGame(game.id)}
                                className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                title="Excluir partida"
                              >
                                <TrashIcon className="h-4 w-4 text-slate-400 hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 mb-1">{game.homeTeamName}</p>
                              <p className="text-3xl font-bold text-slate-900">{game.homeScore || 0}</p>
                            </div>
                            <div className="px-6">
                              <span className="text-lg font-medium text-slate-400">×</span>
                            </div>
                            <div className="flex-1 text-right">
                              <p className="font-semibold text-slate-900 mb-1">{game.awayTeamName}</p>
                              <p className="text-3xl font-bold text-slate-900">{game.awayScore || 0}</p>
                            </div>
                          </div>

                          {(game.date || game.location) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3 text-sm text-slate-600">
                              {game.date && (
                                <div className="flex items-center gap-1.5">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>{new Date(game.date).toLocaleString('pt-BR')}</span>
                                </div>
                              )}
                              {game.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPinIcon className="h-4 w-4" />
                                  <span>{game.location}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!showGameForm && (!championship.games || championship.games.length === 0) && (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                    <CalendarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma partida cadastrada</h3>
                    <p className="text-sm text-slate-600 mb-6">Cadastre partidas individualmente ou gere uma tabela completa</p>
                    {(!championship.teams || championship.teams.length < 2) && (
                      <p className="text-sm text-orange-600 mb-6">
                        É necessário cadastrar pelo menos 2 times antes de criar partidas
                      </p>
                    )}
                    <button
                      onClick={() => setShowGameForm(true)}
                      disabled={!championship.teams || championship.teams.length < 2}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Cadastrar Partidas
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                <ChartBarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Estatísticas em Desenvolvimento</h3>
                <p className="text-sm text-slate-600">As estatísticas detalhadas estarão disponíveis em breve</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Excluir Campeonato</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir o campeonato <span className="font-semibold text-slate-900">"{championship?.name}"</span>? 
              Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
