import { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, TrophyIcon, ChartBarIcon, UsersIcon, CalendarIcon, ScaleIcon } from '@heroicons/react/24/outline';
import type { Team } from '../types';
import TeamStatsOverview from './TeamStatsOverview';
import TeamStatsPerformance from './TeamStatsPerformance';
import TeamStatsPlayers from './TeamStatsPlayers';
import TeamMatchHistory from './TeamMatchHistory';
import TeamComparison from './TeamComparison';

interface TeamStatsModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  championshipId: string;
}

const TeamStatsModal = ({ team, isOpen, onClose, championshipId }: TeamStatsModalProps) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: 'Resumo Geral', icon: TrophyIcon },
    { name: 'Desempenho', icon: ChartBarIcon },
    { name: 'Jogadores Destaque', icon: UsersIcon },
    { name: 'Histórico', icon: CalendarIcon },
    { name: 'Comparação', icon: ScaleIcon },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div 
                  className="relative p-8 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${team.color || '#3B82F6'} 0%, ${adjustColorBrightness(team.color || '#3B82F6', -20)} 100%)`
                  }}
                >
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>

                  <div className="flex items-center gap-6">
                    {team.logo ? (
                      <img 
                        src={team.logo} 
                        alt={team.name}
                        className="h-24 w-24 rounded-2xl border-4 border-white shadow-xl bg-white object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-2xl border-4 border-white shadow-xl bg-white/20 flex items-center justify-center">
                        <TrophyIcon className="h-12 w-12 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-4xl font-bold mb-2">{team.name}</h2>
                      <div className="flex items-center gap-4 text-white/90">
                        <span className="flex items-center gap-2">
                          <TrophyIcon className="h-5 w-5" />
                          {team.points || 0} pontos
                        </span>
                        <span className="flex items-center gap-2">
                          <UsersIcon className="h-5 w-5" />
                          {team.players?.length || 0} jogadores
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                  <Tab.List className="flex border-b border-slate-200 bg-slate-50 px-8">
                    {tabs.map((tab, index) => (
                      <Tab key={index} as={Fragment}>
                        {({ selected }) => (
                          <button
                            className={`
                              flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all
                              ${selected 
                                ? 'border-b-2 border-blue-600 text-blue-600' 
                                : 'text-slate-600 hover:text-slate-900'
                              }
                            `}
                          >
                            <tab.icon className="h-5 w-5" />
                            {tab.name}
                          </button>
                        )}
                      </Tab>
                    ))}
                  </Tab.List>

                  <Tab.Panels className="p-8 max-h-[calc(100vh-24rem)] overflow-y-auto">
                    <Tab.Panel>
                      <TeamStatsOverview team={team} championshipId={championshipId} />
                    </Tab.Panel>
                    <Tab.Panel>
                      <TeamStatsPerformance team={team} championshipId={championshipId} />
                    </Tab.Panel>
                    <Tab.Panel>
                      <TeamStatsPlayers team={team} />
                    </Tab.Panel>
                    <Tab.Panel>
                      <TeamMatchHistory team={team} championshipId={championshipId} />
                    </Tab.Panel>
                    <Tab.Panel>
                      <TeamComparison team={team} championshipId={championshipId} />
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

export default TeamStatsModal;
