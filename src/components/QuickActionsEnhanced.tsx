import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrophyIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CogIcon,
  RocketLaunchIcon,
  BoltIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  gradient: string;
  badge?: string;
  isNew?: boolean;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  to, 
  gradient,
  badge,
  isNew = false
}) => {
  return (
    <Link 
      to={to}
      className="group relative block"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/20 blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 blur-xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        {/* New Badge */}
        {isNew && (
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-yellow-900 rounded-full text-xs font-bold">
              <StarIcon className="h-3 w-3" />
              NOVO
            </div>
          </div>
        )}
        
        {/* Badge */}
        {badge && (
          <div className="absolute top-4 right-4 z-20">
            <div className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium border border-white/30">
              {badge}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 mb-4 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
            <Icon className="h-7 w-7 text-white" />
          </div>
          
          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
              {title}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">
              {description}
            </p>
          </div>
          
          {/* Arrow Indicator */}
          <div className="flex items-center mt-4 text-white/60 group-hover:text-white/80 transition-colors">
            <span className="text-sm font-medium">Começar</span>
            <svg 
              className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        
        {/* Hover Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      </div>
    </Link>
  );
};

export const QuickActionsEnhanced: React.FC = () => {
  const actions = [
    {
      title: 'Criar Campeonato',
      description: 'Configure um novo torneio com times, jogadores e sistema de pontuação personalizado.',
      icon: TrophyIcon,
      to: '/create-championship',
      gradient: 'from-yellow-500 to-orange-600',
      badge: 'Popular',
      isNew: false
    },
    {
      title: 'Adicionar Time',
      description: 'Registre novos times com jogadores e configure suas informações básicas.',
      icon: UserGroupIcon,
      to: '/create-team',
      gradient: 'from-blue-500 to-purple-600',
      isNew: false
    },
    {
      title: 'Agendar Jogo',
      description: 'Organize partidas entre times, defina horários e locais dos confrontos.',
      icon: CalendarDaysIcon,
      to: '/schedule-game',
      gradient: 'from-green-500 to-emerald-600',
      isNew: false
    },
    {
      title: 'Ver Estatísticas',
      description: 'Analise performance dos times, rankings e estatísticas detalhadas dos jogadores.',
      icon: ChartBarIcon,
      to: '/statistics',
      gradient: 'from-pink-500 to-rose-600',
      isNew: false
    },
    {
      title: 'Configurações',
      description: 'Personalize sua conta, notificações e preferências da plataforma.',
      icon: CogIcon,
      to: '/settings',
      gradient: 'from-gray-500 to-slate-600',
      isNew: false
    },
    {
      title: 'Modo Pro',
      description: 'Desbloqueie recursos avançados como analytics, relatórios e muito mais.',
      icon: RocketLaunchIcon,
      to: '/upgrade',
      gradient: 'from-purple-500 to-indigo-600',
      badge: 'Premium',
      isNew: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BoltIcon className="h-7 w-7 text-yellow-400" />
            Ações Rápidas
          </h2>
          <p className="text-white/70 mt-1">Acesse rapidamente as principais funcionalidades</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white/80 text-sm font-medium">Sistema Online</span>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Precisa de ajuda?
            </h3>
            <p className="text-white/80 text-sm">
              Acesse nosso centro de suporte ou assista aos tutoriais em vídeo
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium backdrop-blur-sm border border-white/30">
              Suporte
            </button>
            <button className="px-4 py-2 bg-white text-blue-600 hover:bg-white/90 rounded-lg transition-colors text-sm font-medium">
              Ver Tutoriais
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};