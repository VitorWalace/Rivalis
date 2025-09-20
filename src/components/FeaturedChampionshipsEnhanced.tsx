import React from 'react';
import { 
  TrophyIcon, 
  CalendarIcon, 
  UsersIcon, 
  ClockIcon,
  ArrowRightIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';

interface Championship {
  id: string;
  name: string;
  game: string;
  status: 'upcoming' | 'live' | 'completed';
  startDate: string;
  endDate?: string;
  participants: number;
  maxParticipants: number;
  prizePool?: string;
  image?: string;
  featured?: boolean;
  organizer: string;
}

interface FeaturedChampionshipsProps {
  championships: Championship[];
  onViewChampionship: (id: string) => void;
  onJoinChampionship: (id: string) => void;
}

const StatusBadge: React.FC<{ status: Championship['status'] }> = ({ status }) => {
  const variants = {
    upcoming: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      dot: 'bg-blue-500',
      label: 'Em Breve'
    },
    live: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-500',
      label: 'Ao Vivo'
    },
    completed: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      dot: 'bg-slate-500',
      label: 'Finalizado'
    }
  };

  const variant = variants[status];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${variant.bg} ${variant.text}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${variant.dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
      {variant.label}
    </div>
  );
};

const ChampionshipCard: React.FC<{
  championship: Championship;
  onView: () => void;
  onJoin: () => void;
  className?: string;
}> = ({ championship, onView, onJoin, className = '' }) => {
  const progressPercentage = (championship.participants / championship.maxParticipants) * 100;
  const isNearlyFull = progressPercentage >= 80;
  const isFull = progressPercentage >= 100;

  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 ${className}`}>
      {championship.featured && (
        <div className="absolute left-4 top-4 z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            <StarIcon className="h-3 w-3" />
            Featured
          </div>
        </div>
      )}

      {/* Header Image/Game */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {championship.image ? (
          <img 
            src={championship.image} 
            alt={championship.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <TrophyIconSolid className="h-16 w-16 text-white/80" />
          </div>
        )}
        
        {/* Status overlay */}
        <div className="absolute right-4 top-4">
          <StatusBadge status={championship.status} />
        </div>

        {/* Live indicator */}
        {championship.status === 'live' && (
          <div className="absolute bottom-4 left-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              <FireIcon className="h-4 w-4" />
              AO VIVO
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title and Game */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-900 line-clamp-2 group-hover:text-slate-700 transition-colors">
            {championship.name}
          </h3>
          <p className="text-sm font-medium text-slate-600">
            {championship.game}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarIcon className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            <span>{new Date(championship.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
          
          <div className="flex items-center gap-2 text-slate-600">
            <ClockIcon className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            <span>
              {championship.status === 'completed' ? 'Finalizado' : 
               championship.status === 'live' ? 'Em andamento' : 'Em breve'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <UsersIcon className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            <span>{championship.participants}/{championship.maxParticipants}</span>
          </div>

          {championship.prizePool && (
            <div className="flex items-center gap-2 text-slate-600">
              <TrophyIcon className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
              <span className="font-semibold text-emerald-600">{championship.prizePool}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Participação</span>
            <span className={`font-medium ${isNearlyFull ? 'text-amber-600' : 'text-slate-600'}`}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                isFull ? 'bg-red-500' : isNearlyFull ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Organizer */}
        <div className="text-xs text-slate-500">
          Organizado por <span className="font-medium text-slate-700">{championship.organizer}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onView}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Ver Detalhes
          </button>
          
          {championship.status === 'upcoming' && !isFull && (
            <button
              onClick={onJoin}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
            >
              Participar
              <ArrowRightIcon className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export const FeaturedChampionshipsEnhanced: React.FC<FeaturedChampionshipsProps> = ({
  championships,
  onViewChampionship,
  onJoinChampionship
}) => {
  const featuredChampionships = championships.filter(c => c.featured);
  const regularChampionships = championships.filter(c => !c.featured);

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Campeonatos em Destaque
          </h2>
          <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            Ver Todos
            <ArrowRightIcon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-base text-slate-600 leading-relaxed">
          Participe dos melhores campeonatos e torneios da plataforma
        </p>
      </div>

      {/* Featured Championships */}
      {featuredChampionships.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-amber-500" />
            Em Destaque
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredChampionships.map((championship) => (
              <ChampionshipCard
                key={championship.id}
                championship={championship}
                onView={() => onViewChampionship(championship.id)}
                onJoin={() => onJoinChampionship(championship.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Championships */}
      {regularChampionships.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Outros Campeonatos
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularChampionships.slice(0, 6).map((championship) => (
              <ChampionshipCard
                key={championship.id}
                championship={championship}
                onView={() => onViewChampionship(championship.id)}
                onJoin={() => onJoinChampionship(championship.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {championships.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-slate-100 p-6 mb-4">
            <TrophyIcon className="h-12 w-12 text-slate-400" strokeWidth={1} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nenhum campeonato encontrado
          </h3>
          <p className="text-slate-600 text-center max-w-md">
            Não há campeonatos disponíveis no momento. Seja o primeiro a criar um novo torneio!
          </p>
        </div>
      )}
    </section>
  );
};