import { TrophyIcon, UsersIcon, UserGroupIcon, PlayIcon } from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

const iconColorClasses = {
  blue: 'bg-blue-500/20 text-blue-100 border border-blue-400/30',
  green: 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30',
  purple: 'bg-purple-500/20 text-purple-100 border border-purple-400/30',
  orange: 'bg-orange-500/20 text-orange-100 border border-orange-400/30',
};

export function StatsCard({ title, value, icon: Icon, color, subtitle }: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-2xl shadow-lg shadow-slate-950/50 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/70">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_70%)] opacity-60" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-200">{title}</p>
          <p className="text-3xl font-bold text-white drop-shadow-sm">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-xl p-3 backdrop-blur ${iconColorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  totalChampionships: number;
  totalTeams: number;
  totalPlayers: number;
  totalGames: number;
}

export function DashboardStats({ totalChampionships, totalTeams, totalPlayers, totalGames }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Campeonatos"
        value={totalChampionships}
        icon={TrophyIcon}
        color="blue"
        subtitle="Total criados"
      />
      <StatsCard
        title="Times"
        value={totalTeams}
        icon={UserGroupIcon}
        color="green"
        subtitle="Cadastrados"
      />
      <StatsCard
        title="Jogadores"
        value={totalPlayers}
        icon={UsersIcon}
        color="purple"
        subtitle="Registrados"
      />
      <StatsCard
        title="Jogos"
        value={totalGames}
        icon={PlayIcon}
        color="orange"
        subtitle="Realizados"
      />
    </div>
  );
}