import { ClockIcon, TrophyIcon, UserGroupIcon, PlayIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils';

interface Activity {
  id: string;
  type: 'championship' | 'team' | 'game';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
}

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.type) {
      case 'championship':
        return TrophyIcon;
      case 'team':
        return UserGroupIcon;
      case 'game':
        return PlayIcon;
      default:
        return ClockIcon;
    }
  };

  const getIconColor = () => {
    switch (activity.type) {
      case 'championship':
        return 'text-blue-100 bg-blue-500/20 border border-blue-400/30 backdrop-blur';
      case 'team':
        return 'text-emerald-100 bg-emerald-500/20 border border-emerald-400/30 backdrop-blur';
      case 'game':
        return 'text-purple-100 bg-purple-500/20 border border-purple-400/30 backdrop-blur';
      default:
        return 'text-slate-200 bg-slate-700/40 border border-white/10 backdrop-blur';
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex items-start space-x-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
      <div className={`rounded-lg p-2 ${getIconColor()}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">{activity.title}</p>
        <p className="text-sm text-slate-300">{activity.description}</p>
        <div className="mt-2 flex items-center space-x-4">
          <p className="text-xs text-slate-400">
            {formatDate(activity.timestamp)}
          </p>
          {activity.status && (
            <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-100">
              {activity.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl shadow-slate-950/40 backdrop-blur">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.25),transparent_60%)]" />
      <div className="relative border-b border-white/10 p-6">
        <h2 className="flex items-center text-xl font-semibold text-white">
          <ClockIcon className="mr-2 h-6 w-6 text-blue-300" />
          Atividades Recentes
        </h2>
      </div>

      <div className="relative p-4">
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-slate-300">
            <ClockIcon className="mb-4 h-12 w-12 text-blue-300" />
            <p className="font-medium text-white">Nenhuma atividade recente</p>
            <p className="mt-1 text-sm text-slate-400">
              Comece criando seu primeiro campeonato!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}