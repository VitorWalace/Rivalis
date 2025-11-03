import { Link } from 'react-router-dom';
import { TrophyIcon, CalendarIcon, UsersIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils';
import { getSportDisplayName, getSportIcon } from '../config/sportsCatalog.ts';
import type { Championship } from '../types/index.ts';

interface ChampionshipCardProps {
  championship: Championship;
}

const statusDisplayMap: Record<Championship['status'], string> = {
  active: 'Em andamento',
  finished: 'Finalizado',
  draft: 'Em preparação',
};

function ChampionshipCard({ championship }: ChampionshipCardProps) {
  const getStatusColor = (status: Championship['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30';
      case 'finished':
        return 'bg-slate-400/10 text-slate-200 border border-slate-500/30';
      case 'draft':
      default:
        return 'bg-blue-500/20 text-blue-100 border border-blue-400/30';
    }
  };

  const legacyMaxTeams = (championship as unknown as { maxTeams?: number }).maxTeams;
  const maxParticipants = championship.maxParticipants ?? legacyMaxTeams;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/60">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_65%)]" />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl" aria-hidden>{getSportIcon(championship.sport)}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">{championship.name}</h3>
              <p className="text-sm capitalize text-slate-300">{getSportDisplayName(championship.sport)}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur ${getStatusColor(championship.status)}`}>
            {statusDisplayMap[championship.status] ?? championship.status}
          </span>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          {championship.startDate && (
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-200" />
              Início: {formatDate(championship.startDate)}
            </div>
          )}

          <div className="flex items-center">
            <UsersIcon className="mr-2 h-4 w-4 text-slate-200" />
            Times: {championship.teams?.length || 0}
            {typeof maxParticipants === 'number' && ` / ${maxParticipants}`}
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Link
            to={`/championships/${championship.id}`}
            className="inline-flex items-center text-sm font-medium text-blue-300 transition hover:text-blue-200"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  );
}

interface FeaturedChampionshipsProps {
  championships: Championship[];
  isLoading?: boolean;
}

export function FeaturedChampionships({ championships, isLoading = false }: FeaturedChampionshipsProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-slate-950/50">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.35),transparent_60%)]" />
        <div className="relative p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/80 via-sky-500/70 to-indigo-500/80 text-white">
              <TrophyIcon className="w-5 h-5" />
            </span>
            Campeonatos em Destaque
          </h2>
        </div>
        <div className="relative p-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse space-y-3">
              <div className="h-5 rounded bg-white/10 w-2/3" />
              <div className="h-4 rounded bg-white/10 w-1/2" />
              <div className="h-20 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const featuredChampionships = championships.slice(0, 3);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-slate-950/50">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.35),transparent_60%)]" />
      <div className="relative p-6 border-b border-white/10">
        <h2 className="flex items-center text-xl font-semibold text-white">
          <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/80 via-sky-500/70 to-indigo-500/80 text-white">
            <TrophyIcon className="w-5 h-5" />
          </span>
          Campeonatos em Destaque
        </h2>
      </div>

      <div className="relative p-6">
        {featuredChampionships.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredChampionships.map((championship) => (
              <ChampionshipCard key={championship.id} championship={championship} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 py-12 text-center text-slate-200">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <TrophyIcon className="h-8 w-8 text-blue-300" />
            </div>
            <h3 className="mb-2 text-lg font-medium">
              Nenhum campeonato encontrado
            </h3>
            <p className="mb-6 max-w-sm text-sm text-slate-300">
              Comece criando seu primeiro campeonato esportivo!
            </p>
            <Link
              to="/championship/create"
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500/90 via-sky-500/90 to-indigo-500/90 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-900/40 transition hover:shadow-xl hover:shadow-blue-900/60"
            >
              <TrophyIcon className="mr-2 h-5 w-5" />
              Criar Campeonato
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}