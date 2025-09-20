import { Link } from 'react-router-dom';
import { PlusIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';

export function ChampionshipsPage() {
  const championships = useChampionshipStore((state) => state.championships);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Campeonatos</h1>
              <p className="mt-2 text-lg text-slate-600">
                Gerencie todos os seus campeonatos e torneios
              </p>
            </div>
            <Link
              to="/championships/create"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Novo Campeonato
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {championships.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
              <TrophyIcon className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Nenhum campeonato criado ainda
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Comece criando seu primeiro campeonato e organize competições incríveis!
            </p>
            <Link
              to="/championships/create"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Criar Primeiro Campeonato
            </Link>
          </div>
        ) : (
          // Championships Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {championships.map((championship) => (
              <Link
                key={championship.id}
                to={`/championship/${championship.id}`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {championship.name}
                    </h3>
                    <p className="text-sm text-slate-600 capitalize">
                      {championship.sport === 'football' ? 'Futebol' : 'Futsal'}
                    </p>
                  </div>
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${championship.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    ${championship.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${championship.status === 'finished' ? 'bg-slate-100 text-slate-800' : ''}
                  `}>
                    {championship.status === 'active' ? 'Ativo' : ''}
                    {championship.status === 'draft' ? 'Rascunho' : ''}
                    {championship.status === 'finished' ? 'Finalizado' : ''}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Times:</span>
                    <span className="font-medium">{championship.teams.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jogos:</span>
                    <span className="font-medium">{championship.games.length}</span>
                  </div>
                  {championship.startDate && (
                    <div className="flex justify-between">
                      <span>Início:</span>
                      <span className="font-medium">
                        {championship.startDate.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Criado em {championship.createdAt.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}