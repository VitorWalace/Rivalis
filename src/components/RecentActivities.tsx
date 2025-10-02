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
        return 'text-blue-600 bg-blue-100';
      case 'team':
        return 'text-green-600 bg-green-100';
      case 'game':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${getIconColor()}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{activity.title}</p>
        <p className="text-sm text-gray-600">{activity.description}</p>
        <div className="flex items-center space-x-4 mt-2">
          <p className="text-xs text-gray-500">
            {formatDate(activity.timestamp)}
          </p>
          {activity.status && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <ClockIcon className="w-6 h-6 mr-2 text-blue-600" />
          Atividades Recentes
        </h2>
      </div>
      
      <div className="p-2">
        {activities.length > 0 ? (
          <div className="space-y-1">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma atividade recente</p>
            <p className="text-sm text-gray-500 mt-1">
              Comece criando seu primeiro campeonato!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}