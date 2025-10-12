import { TrophyIcon, UsersIcon, UserGroupIcon, PlayIcon } from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

const colorClasses = {
  blue: 'bg-blue-500 text-blue-100',
  green: 'bg-green-500 text-green-100', 
  purple: 'bg-purple-500 text-purple-100',
  orange: 'bg-orange-500 text-orange-100'
};

export function StatsCard({ title, value, icon: Icon, color, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
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