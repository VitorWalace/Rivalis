import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  PlusIcon, 
  UserIcon, 
  TrashIcon, 
  PencilIcon, 
  ArrowLeftIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useChampionshipStore } from '../store/championshipStore';

interface PlayerFormData {
  name: string;
}

export function TeamPlayersPage() {
  const { championshipId, teamId } = useParams<{ championshipId: string; teamId: string }>();
  const navigate = useNavigate();
  const { championships, updateChampionship } = useChampionshipStore();
  
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState<PlayerFormData>({ name: '' });

  const championship = championships.find(c => c.id === championshipId);
  const team = championship?.teams.find(t => t.id === teamId);

  if (!championship || !team) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Time não encontrado</h2>
          <Link to={`/championship/${championshipId}/teams`} className="text-indigo-600 hover:text-indigo-700">
            Voltar para times
          </Link>
        </div>
      </div>
    );
  }

  const handleAddPlayer = () => {
    if (!playerForm.name.trim()) {
      toast.error('Nome do jogador é obrigatório');
      return;
    }

    const newPlayer = {
      id: `player_${Date.now()}`,
      name: playerForm.name.trim(),
      teamId: team.id,
      stats: {
        games: 0,
        goals: 0,
        assists: 0,
        wins: 0,
        losses: 0,
        draws: 0
      },
      achievements: [],
      xp: 0
    };

    const updatedTeams = championship.teams.map(t => 
      t.id === team.id 
        ? { ...t, players: [...t.players, newPlayer] }
        : t
    );

    const updatedChampionship = {
      ...championship,
      teams: updatedTeams
    };

    updateChampionship(championship.id, updatedChampionship);
    setPlayerForm({ name: '' });
    setIsAddingPlayer(false);
    toast.success('Jogador adicionado com sucesso!');
  };

  const handleEditPlayer = (playerId: string) => {
    const player = team.players.find(p => p.id === playerId);
    if (player) {
      setPlayerForm({ name: player.name });
      setEditingPlayer(playerId);
    }
  };

  const handleSaveEdit = () => {
    if (!playerForm.name.trim()) {
      toast.error('Nome do jogador é obrigatório');
      return;
    }

    const updatedPlayers = team.players.map(player => 
      player.id === editingPlayer 
        ? { ...player, name: playerForm.name.trim() }
        : player
    );

    const updatedTeams = championship.teams.map(t => 
      t.id === team.id 
        ? { ...t, players: updatedPlayers }
        : t
    );

    const updatedChampionship = {
      ...championship,
      teams: updatedTeams
    };

    updateChampionship(championship.id, updatedChampionship);
    setEditingPlayer(null);
    setPlayerForm({ name: '' });
    toast.success('Jogador atualizado com sucesso!');
  };

  const handleDeletePlayer = (playerId: string) => {
    if (window.confirm('Tem certeza que deseja remover este jogador? Esta ação não pode ser desfeita.')) {
      const updatedPlayers = team.players.filter(player => player.id !== playerId);
      
      const updatedTeams = championship.teams.map(t => 
        t.id === team.id 
          ? { ...t, players: updatedPlayers }
          : t
      );

      const updatedChampionship = {
        ...championship,
        teams: updatedTeams
      };

      updateChampionship(championship.id, updatedChampionship);
      toast.success('Jogador removido com sucesso!');
    }
  };

  const playerAvatars = [
    '👤', '🧑', '👨', '👩', '🧔', '👱', '👨‍💼', '👩‍💼', '⚽', '🏃'
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/championship/${championshipId}/teams`)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Jogadores do {team.name}</h1>
              <p className="text-lg text-slate-600">{championship.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <UserIcon className="h-4 w-4" />
              {team.players.length} jogadores cadastrados
            </div>
            
            <button
              onClick={() => setIsAddingPlayer(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Adicionar Jogador
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Player Form */}
        {isAddingPlayer && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Adicionar Novo Jogador</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({ name: e.target.value })}
                  placeholder="Nome do jogador"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddPlayer}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setIsAddingPlayer(false);
                    setPlayerForm({ name: '' });
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Players Grid */}
        {team.players.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <UserIcon className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Nenhum jogador cadastrado
            </h3>
            <p className="text-slate-600 mb-6">
              Comece adicionando os jogadores que irão compor o time {team.name}
            </p>
            <button
              onClick={() => setIsAddingPlayer(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Adicionar Primeiro Jogador
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {team.players.map((player, index) => (
              <div
                key={player.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-2xl">
                      {playerAvatars[index % playerAvatars.length]}
                    </div>
                    <div>
                      {editingPlayer === player.id ? (
                        <input
                          type="text"
                          value={playerForm.name}
                          onChange={(e) => setPlayerForm({ name: e.target.value })}
                          className="text-lg font-semibold bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') {
                              setEditingPlayer(null);
                              setPlayerForm({ name: '' });
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-slate-900">{player.name}</h3>
                          <p className="text-sm text-slate-600">#{index + 1}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {editingPlayer === player.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingPlayer(null);
                            setPlayerForm({ name: '' });
                          }}
                          className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditPlayer(player.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Player Stats */}
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <ChartBarIcon className="h-3 w-3" />
                      Jogos:
                    </span>
                    <span className="font-medium">{player.stats.games}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gols:</span>
                    <span className="font-medium text-green-600">{player.stats.goals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assistências:</span>
                    <span className="font-medium text-blue-600">{player.stats.assists}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <TrophyIcon className="h-3 w-3" />
                      XP:
                    </span>
                    <span className="font-bold text-amber-600">{player.xp}</span>
                  </div>
                </div>

                {/* Player Achievements */}
                {player.achievements.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {player.achievements.slice(0, 3).map((achievement) => (
                        <span
                          key={achievement.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                        >
                          {achievement.icon}
                          {achievement.name}
                        </span>
                      ))}
                      {player.achievements.length > 3 && (
                        <span className="text-xs text-slate-500">
                          +{player.achievements.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Team Summary */}
        {team.players.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumo do Time</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">{team.players.length}</div>
                <div className="text-sm text-slate-600">Jogadores</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {team.players.reduce((sum, p) => sum + p.stats.goals, 0)}
                </div>
                <div className="text-sm text-slate-600">Gols Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {team.players.reduce((sum, p) => sum + p.stats.assists, 0)}
                </div>
                <div className="text-sm text-slate-600">Assistências</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {team.players.reduce((sum, p) => sum + p.xp, 0)}
                </div>
                <div className="text-sm text-slate-600">XP Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}