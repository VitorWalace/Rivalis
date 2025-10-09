import { Link } from 'react-router-dom';
import { TrophyIcon, CalendarIcon, UsersIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils';
import { getSportDisplayName, getSportIcon } from '../config/sportsCatalog.ts';

interface Championship {
  id: string;
  name: string;
  sport: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  maxTeams?: number;
  teams?: any[];
}

interface ChampionshipCardProps {
  championship: Championship;
}

function ChampionshipCard({ championship }: ChampionshipCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'finalizado':
        return 'bg-gray-100 text-gray-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl" aria-hidden>{getSportIcon(championship.sport)}</span>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{championship.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{getSportDisplayName(championship.sport)}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(championship.status)}`}>
            {championship.status}
          </span>
        </div>

        <div className="space-y-3">
          {championship.startDate && (
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Início: {formatDate(championship.startDate)}
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <UsersIcon className="w-4 h-4 mr-2" />
            Times: {championship.teams?.length || 0}
            {championship.maxTeams && ` / ${championship.maxTeams}`}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            to={`/championships/${championship.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  );
}

interface FeaturedChampionshipsProps {
  championships: Championship[];
}

export function FeaturedChampionships({ championships }: FeaturedChampionshipsProps) {
  const featuredChampionships = championships.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <TrophyIcon className="w-6 h-6 mr-2 text-blue-600" />
          Campeonatos em Destaque
        </h2>
      </div>

      <div className="p-6">
        {featuredChampionships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredChampionships.map((championship) => (
              <ChampionshipCard key={championship.id} championship={championship} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum campeonato encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Comece criando seu primeiro campeonato esportivo!
            </p>
            <Link
              to="/championships/create"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <TrophyIcon className="w-5 h-5 mr-2" />
              Criar Campeonato
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}