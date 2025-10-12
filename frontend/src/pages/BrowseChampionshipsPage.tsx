import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  TrophyIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  CalendarIcon,
  FireIcon,
  ClockIcon,
  CheckBadgeIcon,
  MapPinIcon,
  EyeIcon,
  TrashIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { useChampionshipStore } from '../store/championshipStore';
import { useAuthStore } from '../store/authStore';
import type { Championship } from '../types/index.ts';
import { getSportDisplayName } from '../config/sportsCatalog.ts';

const statusMeta: Partial<Record<string, { label: string; color: string; icon: typeof ClockIcon }>> = {
  draft: {
    label: 'Rascunho',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: ClockIcon,
  },
  active: {
    label: 'Em Andamento',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: FireIcon,
  },
  finished: {
    label: 'Finalizado',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: CheckBadgeIcon,
  },
};

const visibilityMeta: Partial<Record<string, { label: string; color: string }>> = {
  public: {
    label: 'Público',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  private: {
    label: 'Privado',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  inviteOnly: {
    label: 'Somente Convite',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
};

const statusLabels: Record<Championship['status'], string> = {
  draft: 'Rascunho',
  active: 'Em andamento',
  finished: 'Finalizado',
};

const formatDate = (date?: Date | string) => {
  if (!date) return 'Data não definida';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Data não definida';
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getSportLabel = (sport?: Championship['sport']) => getSportDisplayName(sport);

const isPublicChampionship = (champ: Championship) => {
  const visibility = champ.visibility ?? 'public';
  return visibility === 'public';
};

const computeStats = (list: Championship[]) => ({
  total: list.length,
  active: list.filter((item) => item.status === 'active').length,
  draft: list.filter((item) => item.status === 'draft').length,
  finished: list.filter((item) => item.status === 'finished').length,
});

const getStatusBadge = (status: Championship['status'] | undefined) => {
  const config = (status && statusMeta[status]) || statusMeta.draft!;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

const getVisibilityBadge = (visibility?: Championship['visibility']) => {
  const key = visibility ?? 'public';
  const config = visibilityMeta[key] ?? visibilityMeta.public!;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <ShieldCheckIcon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

export default function BrowseChampionshipsPage() {
  const championships = useChampionshipStore((state) => state.championships);
  const updateChampionship = useChampionshipStore((state) => state.updateChampionship);
  const deleteChampionship = useChampionshipStore((state) => state.deleteChampionship);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'active' | 'finished'>('all');
  const defaultTab = location.pathname.includes('/championships/explore') ? 'public' : 'my';
  const [activeTab, setActiveTab] = useState<'my' | 'public'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const tabDefinitions: Array<{
    id: 'my' | 'public';
    label: string;
    description: string;
    Icon: typeof TrophyIcon;
  }> = [
    {
      id: 'my',
      label: 'Meus Campeonatos',
      description: 'Controle total sobre os torneios que você organiza.',
      Icon: TrophyIcon,
    },
    {
      id: 'public',
      label: 'Campeonatos Públicos',
      description: 'Explore oportunidades abertas para acompanhar e participar.',
      Icon: GlobeAltIcon,
    },
  ];

  const myChampionships = useMemo(
    () => championships.filter((champ) => champ.adminId === user?.id),
    [championships, user?.id]
  );

  const orderedMyChampionships = useMemo(
    () =>
      [...myChampionships].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }),
    [myChampionships]
  );

  const publicChampionships = useMemo(
    () => championships.filter((champ) => champ.adminId !== user?.id && isPublicChampionship(champ)),
    [championships, user?.id]
  );

  const filteredPublicChampionships = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return publicChampionships.filter((champ) => {
      if (search.length === 0) {
        return filterStatus === 'all' || champ.status === filterStatus;
      }

      const nameValue = champ.name?.toLowerCase() ?? '';
      const sportValue = (champ.sport ? champ.sport.toString() : '').toLowerCase();
      const descriptionValue = champ.description?.toLowerCase() ?? '';
      const formatValue = (champ.format ? champ.format.toString() : '').toLowerCase();

      const matchesSearch =
        nameValue.includes(search) ||
        sportValue.includes(search) ||
        descriptionValue.includes(search) ||
        formatValue.includes(search);

      const matchesStatus = filterStatus === 'all' || champ.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [publicChampionships, searchTerm, filterStatus]);

  const myStats = useMemo(() => computeStats(myChampionships), [myChampionships]);
  const publicStats = useMemo(() => computeStats(publicChampionships), [publicChampionships]);

  const myOverviewStats = useMemo(
    () => [
      {
        label: 'Total',
        value: myStats.total,
        Icon: TrophyIcon,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        label: 'Rascunhos',
        value: myStats.draft,
        Icon: ClockIcon,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-600',
      },
      {
        label: 'Ativos',
        value: myStats.active,
        Icon: FireIcon,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        label: 'Finalizados',
        value: myStats.finished,
        Icon: CheckBadgeIcon,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
    ],
    [myStats]
  );

  const publicOverviewStats = useMemo(
    () => [
      {
        label: 'Total públicos',
        value: publicStats.total,
        Icon: GlobeAltIcon,
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
      },
      {
        label: 'Rascunhos',
        value: publicStats.draft,
        Icon: ClockIcon,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-600',
      },
      {
        label: 'Ativos',
        value: publicStats.active,
        Icon: FireIcon,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        label: 'Finalizados',
        value: publicStats.finished,
        Icon: CheckBadgeIcon,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
    ],
    [publicStats]
  );

  const handleStatusChange = (championship: Championship, nextStatus: Championship['status']) => {
    if (championship.status === nextStatus) {
      toast.success(`O campeonato já está marcado como ${statusLabels[nextStatus]}.`);
      return;
    }

    updateChampionship(championship.id, { status: nextStatus });
    toast.success(`Status de "${championship.name}" atualizado para ${statusLabels[nextStatus]}.`);
  };

  const handleDelete = (championship: Championship) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o campeonato "${championship.name}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    deleteChampionship(championship.id);
    toast.success('Campeonato excluído com sucesso.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Campeonatos</h1>
              <p className="mt-2 text-lg text-slate-600">
                Gerencie suas competições e descubra novos torneios públicos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold shadow-sm hover:bg-slate-200 hover:text-slate-900 transition-all"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Voltar ao Dashboard
              </Link>

              <Link
                to="/championship/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <PlusIcon className="h-5 w-5" />
                Criar Campeonato
              </Link>
            </div>
          </div>

          <div className="mt-10 space-y-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm px-6 py-8">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Painel de Campeonatos</p>
                  <h2 className="text-3xl font-bold text-slate-900 mt-2">Escolha a visão perfeita para organizar ou explorar</h2>
                  <p className="text-slate-600 mt-3">
                    Navegue pelos torneios que você administra ou acompanhe competições abertas da comunidade com filtros avançados.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3" role="tablist" aria-label="Alternar visão de campeonatos">
                  {tabDefinitions.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => {
                          if (tab.id === activeTab) return;
                          setActiveTab(tab.id);
                          const targetRoute = tab.id === 'public' ? '/championships/explore' : '/championships';
                          if (location.pathname !== targetRoute) {
                            navigate(targetRoute);
                          }
                        }}
                        className={clsx(
                          'group inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-white'
                        )}
                      >
                        <tab.Icon
                          className={clsx('h-5 w-5 transition-colors', isActive ? 'text-white' : 'text-blue-600')}
                        />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {(activeTab === 'my' ? myOverviewStats : publicOverviewStats).map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-slate-50 rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-4 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.2)]"
                  >
                    <div className={clsx('p-3 rounded-xl', stat.iconBg)}>
                      <stat.Icon className={clsx('h-6 w-6', stat.iconColor)} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {activeTab === 'my' ? (
              <section className="space-y-8" role="tabpanel" aria-label="Meus Campeonatos">
                {orderedMyChampionships.length === 0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-10 py-16 text-center shadow-inner">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm shadow-blue-100">
                      <TrophyIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-slate-900">Você ainda não criou campeonatos</h3>
                    <p className="mt-3 text-slate-600 max-w-xl mx-auto">
                      Comece agora mesmo definindo regras, convidando equipes e lançando a sua próxima competição profissional.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                      <Link
                        to="/championship/create"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Criar meu primeiro campeonato
                      </Link>
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors"
                      >
                        <ArrowLeftIcon className="h-5 w-5" />
                        Voltar ao dashboard
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900">Resumo rápido</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Atalhos poderosos para publicar, ajustar status e acompanhar resultados.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {orderedMyChampionships.map((championship) => (
                        <div
                          key={championship.id}
                          className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 p-6"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                              <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {championship.name}
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                {getSportLabel(championship.sport)} • {championship.format || 'Formato não definido'}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">Criado em {formatDate(championship.createdAt)}</p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-2">
                              {getStatusBadge(championship.status)}
                              {getVisibilityBadge(championship.visibility)}
                            </div>
                          </div>

                          {championship.description && (
                            <p className="mt-4 text-sm text-slate-600 line-clamp-3">{championship.description}</p>
                          )}

                          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-xs text-slate-500">Times cadastrados</p>
                              <p className="text-lg font-semibold text-slate-900">
                                {championship.teams?.length ?? 0}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-xs text-slate-500">Jogos criados</p>
                              <p className="text-lg font-semibold text-slate-900">
                                {championship.games?.length ?? 0}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-xs text-slate-500">Início previsto</p>
                              <p className="text-lg font-semibold text-slate-900">
                                {formatDate(championship.startDate)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                              to={`/championship/${championship.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                            >
                              <EyeIcon className="h-4 w-4" />
                              Gerenciar
                            </Link>

                            {championship.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(championship, 'active')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors"
                              >
                                Ativar
                              </button>
                            )}

                            {championship.status !== 'draft' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(championship, 'draft')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                              >
                                Marcar como rascunho
                              </button>
                            )}

                            {championship.status !== 'finished' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(championship, 'finished')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-200 transition-colors"
                              >
                                Finalizar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(championship)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="space-y-8" role="tabpanel" aria-label="Campeonatos Públicos">
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-8 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">Campeonatos Públicos em destaque</h2>
                      <p className="text-slate-600 mt-2 max-w-2xl">
                        Explore torneios compartilhados pela comunidade, filtre por status e encontre novas oportunidades para participar ou se inspirar.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2 block">
                          Busca Global
                        </label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar por nome, modalidade, formato ou organizador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2 block">
                          Status
                        </label>
                        <div className="flex items-center gap-3">
                          <FunnelIcon className="h-5 w-5 text-slate-600" />
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'draft' | 'active' | 'finished')}
                            className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                          >
                            <option value="all">Todos</option>
                            <option value="draft">Rascunhos</option>
                            <option value="active">Em andamento</option>
                            <option value="finished">Finalizados</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {filteredPublicChampionships.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                        <TrophyIcon className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="mt-6 text-xl font-semibold text-slate-900">Nenhum campeonato público encontrado</h3>
                      <p className="mt-2 text-slate-600 max-w-lg mx-auto">
                        {searchTerm || filterStatus !== 'all'
                          ? 'Ajuste os filtros ou limpe a busca para ver outras opções disponíveis.'
                          : 'Assim que novos organizadores publicarem campeonatos, eles aparecerão automaticamente por aqui.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredPublicChampionships.map((championship) => (
                        <Link
                          key={championship.id}
                          to={`/championship/${championship.id}`}
                          className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                        >
                          <div className="p-6 border-b border-slate-100">
                            <div className="flex items-start justify-between mb-3">
                              <div className="p-2.5 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors">
                                <TrophyIcon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                              </div>
                              {getStatusBadge(championship.status)}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                              {championship.name}
                            </h3>

                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPinIcon className="h-4 w-4" />
                              <span className="font-medium">{getSportLabel(championship.sport)}</span>
                            </div>
                          </div>

                          <div className="p-6 bg-slate-50">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-white rounded-lg">
                                  <UserGroupIcon className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 font-medium">Times</p>
                                  <p className="text-sm font-bold text-slate-900">{championship.teams?.length ?? 0}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-white rounded-lg">
                                  <CalendarIcon className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 font-medium">Partidas</p>
                                  <p className="text-sm font-bold text-slate-900">{championship.games?.length ?? 0}</p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                              <span>Início: {formatDate(championship.startDate)}</span>
                              {getVisibilityBadge(championship.visibility)}
                            </div>
                          </div>

                          <div className="px-6 py-3 bg-white border-t border-slate-100">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 font-medium">{championship.teams?.length ?? 0} times inscritos</span>
                              <span className="text-blue-600 font-semibold group-hover:underline">Ver detalhes →</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
