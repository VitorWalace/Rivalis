import { useMemo, useState, type ComponentType, type FormEvent } from 'react';
import { PlusIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useChampionshipStore } from '../store/championshipStore.ts';
import { useAuthStore } from '../store/authStore.ts';
import { teamService } from '../services/teamService.ts';

interface QuickActionProps {
  title: string;
  description: string;
  icon: ComponentType<any>;
  onClick: () => void;
  color: 'blue' | 'green';
  disabled?: boolean;
}

const colorClasses: Record<QuickActionProps['color'], string> = {
  blue: 'bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-sky-500/20 border-blue-400/30 text-blue-50 hover:from-blue-500/30 hover:to-sky-500/30 focus-visible:ring-blue-400/30',
  green: 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-teal-500/20 border-emerald-400/30 text-emerald-50 hover:from-emerald-500/30 hover:to-teal-500/30 focus-visible:ring-emerald-400/30',
};

function QuickActionCard({ title, description, icon: Icon, onClick, color, disabled = false }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative block w-full overflow-hidden rounded-2xl border-2 px-6 py-7 text-left transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${colorClasses[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/40'}`}
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.6),transparent_65%)]" />
      <div className="relative flex items-center space-x-4">
        <div className="flex-shrink-0 rounded-xl bg-black/10 p-3 text-white">
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white drop-shadow-sm">{title}</h3>
          <p className="text-sm text-white/80">{description}</p>
        </div>
      </div>
      {disabled && (
        <span className="absolute inset-x-0 bottom-4 text-center text-xs font-medium text-white/60 backdrop-blur">
          Crie um campeonato primeiro
        </span>
      )}
    </button>
  );
}

export function QuickActions() {
  const navigate = useNavigate();
  const championships = useChampionshipStore((state) => state.championships);
  const fetchUserChampionships = useChampionshipStore((state) => state.fetchUserChampionships);
  const user = useAuthStore((state) => state.user);

  const ownedChampionships = useMemo(
    () =>
      championships.filter((championship) => {
        if (championship.isOwner) return true;
        if (user?.id && (championship.adminId === user.id || championship.createdBy === user.id)) return true;
        return false;
      }),
    [championships, user?.id]
  );

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string>('');
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#10b981');
  const [teamLogo, setTeamLogo] = useState('');
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  const openTeamModal = () => {
    if (ownedChampionships.length === 0) {
      toast.error('Você precisa ter um campeonato próprio para adicionar um time.');
      return;
    }

    const firstChampionshipId = ownedChampionships[0]?.id ?? '';
    setSelectedChampionshipId((current) => {
      const stillValid = ownedChampionships.some((championship) => championship.id === current);
      return stillValid ? current : firstChampionshipId;
    });
    setTeamName('');
    setTeamColor('#10b981');
    setTeamLogo('');
    setIsTeamModalOpen(true);
  };

  const closeTeamModal = () => {
    if (isSavingTeam) return;
    setIsTeamModalOpen(false);
  };

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedChampionshipId) {
      toast.error('Selecione o campeonato para cadastrar o time.');
      return;
    }

    if (!teamName.trim()) {
      toast.error('Informe o nome da equipe.');
      return;
    }

    const payload = {
      name: teamName.trim(),
      color: teamColor,
      logo: teamLogo.trim() || undefined,
    };

    try {
      setIsSavingTeam(true);
      const response = await teamService.createTeam(selectedChampionshipId, payload);

      const createdTeam = response?.data?.team ?? response?.team ?? null;
      const wasSuccessful = response?.success === false ? false : (response?.success === true || Boolean(createdTeam));

      if (wasSuccessful) {
        toast.success('Time adicionado com sucesso!');
        await fetchUserChampionships();
        setTeamName('');
        setTeamLogo('');
        setTeamColor('#10b981');
        setIsTeamModalOpen(false);
      } else {
        toast.error(response?.message || 'Não foi possível adicionar o time.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao adicionar time.';
      toast.error(message);
    } finally {
      setIsSavingTeam(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/40 backdrop-blur-xl">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.35),transparent_60%)]" />
      <h2 className="relative mb-6 flex items-center text-xl font-semibold text-white">
        <PlusIcon className="mr-2 h-6 w-6 text-blue-300" />
        Ações Rápidas
      </h2>
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
        <QuickActionCard
          title="Novo Campeonato"
          description="Criar um novo torneio"
          icon={TrophyIcon}
          color="blue"
          onClick={() => navigate('/championship/create')}
        />

        <QuickActionCard
          title="Adicionar Time"
          description="Cadastrar nova equipe"
          icon={UserGroupIcon}
          color="green"
          onClick={openTeamModal}
          disabled={ownedChampionships.length === 0}
        />
      </div>

      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-white shadow-2xl shadow-slate-950/60 backdrop-blur-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Adicionar novo time</h3>
                <p className="text-sm text-slate-300">Selecione um dos seus campeonatos e informe os dados da equipe.</p>
              </div>
              <button
                type="button"
                onClick={closeTeamModal}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateTeam}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Campeonato</label>
                <select
                  value={selectedChampionshipId}
                  onChange={(event) => setSelectedChampionshipId(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/60 p-2.5 text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                >
                  {ownedChampionships.map((championship) => (
                    <option key={championship.id} value={championship.id}>
                      {championship.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Nome do time</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="Ex.: Astros FC"
                  className="w-full rounded-lg border border-white/10 bg-slate-900/60 p-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">Cor principal</label>
                  <input
                    type="color"
                    value={teamColor}
                    onChange={(event) => setTeamColor(event.target.value)}
                    className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-slate-900/60 p-1"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-300">Pré-visualização</span>
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg shadow-black/40"
                    style={{ backgroundColor: teamColor }}
                  >
                    {teamName ? teamName.charAt(0).toUpperCase() : 'T'}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Logo (URL opcional)</label>
                <input
                  type="url"
                  value={teamLogo}
                  onChange={(event) => setTeamLogo(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-white/10 bg-slate-900/60 p-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTeamModal}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
                  disabled={isSavingTeam}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60"
                  disabled={isSavingTeam}
                >
                  {isSavingTeam ? 'Salvando...' : 'Adicionar Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}