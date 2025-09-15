import { PlusIcon, TrophyIcon, UserGroupIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'indigo';
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
  green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
  purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
  indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700'
};

function QuickActionCard({ title, description, icon: Icon, href, color }: QuickActionProps) {
  return (
    <Link
      to={href}
      className={`block p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${colorClasses[color]}`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <PlusIcon className="w-6 h-6 mr-2 text-blue-600" />
        Ações Rápidas
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionCard
          title="Novo Campeonato"
          description="Criar um novo torneio"
          icon={TrophyIcon}
          href="/championships/create"
          color="blue"
        />
        <QuickActionCard
          title="Adicionar Time"
          description="Cadastrar nova equipe"
          icon={UserGroupIcon}
          href="/teams/create"
          color="green"
        />
        <QuickActionCard
          title="Agendar Jogo"
          description="Marcar nova partida"
          icon={CalendarIcon}
          href="/games/create"
          color="purple"
        />
      </div>
    </div>
  );
}