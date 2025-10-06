import React from 'react';
import { PlusIcon, TrophyIcon, UsersIcon, CalendarIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant: 'primary' | 'secondary' | 'accent' | 'neutral';
  onClick: () => void;
}

interface QuickActionsProps {
  onCreateChampionship: () => void;
  onCreateTournament: () => void;
  onInviteTeam: () => void;
  onScheduleMatch: () => void;
}

const ActionCard: React.FC<{
  action: QuickAction;
  className?: string;
}> = ({ action, className = '' }) => {
  const baseClasses = 'group relative overflow-hidden rounded-xl border transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]';
  
  const variantClasses = {
    primary: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 focus:ring-blue-500',
    secondary: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 focus:ring-emerald-500',
    accent: 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 focus:ring-purple-500',
    neutral: 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-200/50 focus:ring-slate-500'
  };

  const iconColorClasses = {
    primary: 'text-blue-600 group-hover:text-blue-700',
    secondary: 'text-emerald-600 group-hover:text-emerald-700',
    accent: 'text-purple-600 group-hover:text-purple-700',
    neutral: 'text-slate-600 group-hover:text-slate-700'
  };

  const arrowColorClasses = {
    primary: 'text-blue-400 group-hover:text-blue-600',
    secondary: 'text-emerald-400 group-hover:text-emerald-600',
    accent: 'text-purple-400 group-hover:text-purple-600',
    neutral: 'text-slate-400 group-hover:text-slate-600'
  };

  return (
    <button
      onClick={action.onClick}
      className={`${baseClasses} ${variantClasses[action.variant]} ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm transition-colors duration-300 ${iconColorClasses[action.variant]}`}>
              <action.icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-800">
                {action.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {action.description}
              </p>
            </div>
          </div>
          
          <ArrowRightIcon 
            className={`h-5 w-5 transition-all duration-300 group-hover:translate-x-1 ${arrowColorClasses[action.variant]}`}
            strokeWidth={1.5}
          />
        </div>
      </div>
    </button>
  );
};

export const QuickActionsEnhanced: React.FC<QuickActionsProps> = ({
  onCreateChampionship,
  onCreateTournament,
  onInviteTeam,
  onScheduleMatch
}) => {
  const actions: QuickAction[] = [
    {
      id: 'championship',
      title: 'Criar Campeonato',
      description: 'Configure um novo campeonato completo com formato, premiações e cronograma',
      icon: TrophyIcon,
      variant: 'primary',
      onClick: onCreateChampionship
    },
    {
      id: 'tournament',
      title: 'Novo Torneio',
      description: 'Organize torneios rápidos com eliminação direta ou formato de liga',
      icon: PlusIcon,
      variant: 'secondary',
      onClick: onCreateTournament
    },
    {
      id: 'invite',
      title: 'Convidar Equipe',
      description: 'Envie convites para times participarem dos seus eventos',
      icon: UsersIcon,
      variant: 'accent',
      onClick: onInviteTeam
    },
    {
      id: 'schedule',
      title: 'Agendar Partida',
      description: 'Marque horários de jogos e envie notificações automáticas',
      icon: CalendarIcon,
      variant: 'neutral',
      onClick: onScheduleMatch
    }
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Ações Rápidas
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Gerencie seus eventos esportivos com facilidade e eficiência
        </p>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            className="h-full"
          />
        ))}
      </div>

      {/* Bottom hint */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <SparklesIcon className="h-5 w-5 text-slate-500" />
          <p className="text-sm text-slate-600 font-medium">
            Dica: personalize seus convites com mensagens especiais para cada equipe
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Estamos aqui para te ajudar
        </span>
      </div>
    </section>
  );
};