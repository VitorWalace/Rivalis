import { Link } from 'react-router-dom';
import { TrophyIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';

export default function BrowseChampionshipsPage() {
  const championships = useChampionshipStore((state) => state.championships);
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Campeonatos</h1>
          <Link to="/championship/create" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Criar Campeonato
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {championships.map((champ) => (
            <Link key={champ.id} to={`/championship/${champ.id}`} className="bg-white rounded-lg shadow p-6 hover:shadow-lg">
              <div className="flex items-center mb-4">
                <TrophyIcon className="h-8 w-8 text-indigo-600 mr-3" />
                <h3 className="text-xl font-bold">{champ.name}</h3>
              </div>
              <p className="text-gray-600">Times: {champ.teams?.length || 0}</p>
              <p className="text-gray-600">Partidas: {champ.games?.length || 0}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
