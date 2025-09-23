import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  PlusIcon, 
  UsersIcon, 
  TrashIcon, 
  PencilIcon, 
  ArrowLeftIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useChampionshipStore } from '../store/championshipStore';
import { teamsAPI } from '../services/teamsAPI';

interface TeamFormData {
  name: string;
  color: string;
}

export function ChampionshipTeamsPage() {
  const { championshipId } = useParams<{ championshipId: string }>();
  const navigate = useNavigate();
  const { championships, updateChampionship } = useChampionshipStore();
  
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState<TeamFormData>({ name: '', color: '#3B82F6' });

  const championship = championships.find(c => c.id === championshipId);

  // Carregar times do backend quando a página carregar
  useEffect(() => {
    const loadTeams = async () => {
      if (!championshipId || !championship) return;
      
      try {
        const response = await teamsAPI.getTeamsByChampionship(championshipId);
        if (response.success && response.data.teams) {
          // Atualizar store com times do backend
          const updatedChampionship = {
            ...championship,
            teams: response.data.teams.map((team: any) => ({
              ...team,
              players: team.players || [],
              stats: team.stats || {
                games: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0,
                position: 0
              }
            }))
          };
          
          updateChampionship(championshipId, updatedChampionship);
        }
      } catch (error) {
        console.error('Erro ao carregar times:', error);
      }
    };

    loadTeams();
  }, [championshipId]); // Simplificar dependências

  if (!championship) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Campeonato não encontrado</h2>
          <Link to="/championships" className="text-indigo-600 hover:text-indigo-700">
            Voltar para campeonatos
          </Link>
        </div>
      </div>
    );
  }

  const handleAddTeam = async () => {
    if (!teamForm.name.trim()) {
      toast.error('Nome do time é obrigatório');
      return;
    }

    try {
      // Criar time no backend
      const response = await teamsAPI.createTeam(championship.id, {
        name: teamForm.name.trim(),
        color: teamForm.color
      });

      if (response.success) {
        const newTeam = response.data.team;
        
        // Atualizar store local com o time retornado do backend
        const updatedChampionship = {
          ...championship,
          teams: [...championship.teams, {
            ...newTeam,
            players: [],
            stats: {
              games: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0,
              position: championship.teams.length + 1
            }
          }]
        };

        updateChampionship(championship.id, updatedChampionship);
        setTeamForm({ name: '', color: '#3B82F6' });
        setIsAddingTeam(false);
        toast.success('Time adicionado com sucesso!');
      } else {
        toast.error(response.message || 'Erro ao criar time');
      }
    } catch (error: any) {
      console.error('Erro ao criar time:', error);
      const message = error?.response?.data?.message || error?.message || 'Erro ao criar time';
      toast.error(message);
    }
  };

  const handleEditTeam = (teamId: string) => {
    const team = championship.teams.find(t => t.id === teamId);
    if (team) {
      setTeamForm({ name: team.name, color: '#3B82F6' });
      setEditingTeam(teamId);
    }
  };

  const handleSaveEdit = () => {
    if (!teamForm.name.trim()) {
      toast.error('Nome do time é obrigatório');
      return;
    }

    const updatedTeams = championship.teams.map(team => 
      team.id === editingTeam 
        ? { ...team, name: teamForm.name.trim() }
        : team
    );

    const updatedChampionship = {
      ...championship,
      teams: updatedTeams
    };

    updateChampionship(championship.id, updatedChampionship);
    setEditingTeam(null);
    setTeamForm({ name: '', color: '#3B82F6' });
    toast.success('Time atualizado com sucesso!');
  };

  const handleDeleteTeam = (teamId: string) => {
    if (window.confirm('Tem certeza que deseja remover este time? Esta ação não pode ser desfeita.')) {
      const updatedTeams = championship.teams.filter(team => team.id !== teamId);
      
      const updatedChampionship = {
        ...championship,
        teams: updatedTeams
      };

      updateChampionship(championship.id, updatedChampionship);
      toast.success('Time removido com sucesso!');
    }
  };

  const teamColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/championship/${championshipId}`)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Times do Campeonato</h1>
              <p className="text-lg text-slate-600">{championship.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <UsersIcon className="h-4 w-4" />
              {championship.teams.length} times cadastrados
            </div>
            
            <button
              onClick={() => setIsAddingTeam(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Adicionar Time
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Team Form */}
        {isAddingTeam && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Adicionar Novo Time</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Nome do time"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddTeam}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setIsAddingTeam(false);
                    setTeamForm({ name: '', color: '#3B82F6' });
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        {championship.teams.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <UsersIcon className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Nenhum time cadastrado
            </h3>
            <p className="text-slate-600 mb-6">
              Comece adicionando os times que irão participar do campeonato
            </p>
            <button
              onClick={() => setIsAddingTeam(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Adicionar Primeiro Time
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {championship.teams.map((team, index) => (
              <div
                key={team.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: teamColors[index % teamColors.length] }}
                    >
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {editingTeam === team.id ? (
                        <input
                          type="text"
                          value={teamForm.name}
                          onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                          className="text-lg font-semibold bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') {
                              setEditingTeam(null);
                              setTeamForm({ name: '', color: '#3B82F6' });
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-lg font-semibold text-slate-900">{team.name}</h3>
                      )}
                      <p className="text-sm text-slate-600">{team.players.length} jogadores</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {editingTeam === team.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingTeam(null);
                            setTeamForm({ name: '', color: '#3B82F6' });
                          }}
                          className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditTeam(team.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex justify-between">
                    <span>Jogos:</span>
                    <span className="font-medium">{team.stats.games}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vitórias:</span>
                    <span className="font-medium text-green-600">{team.stats.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Empates:</span>
                    <span className="font-medium text-yellow-600">{team.stats.draws}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Derrotas:</span>
                    <span className="font-medium text-red-600">{team.stats.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pontos:</span>
                    <span className="font-bold text-slate-900">{team.stats.points}</span>
                  </div>
                </div>

                <Link
                  to={`/championship/${championshipId}/team/${team.id}/players`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  Gerenciar Jogadores
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}