import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  CheckIcon,
  ClockIcon,
  EyeIcon,
  FireIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SparklesIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useChampionshipStore } from '../store/championshipStore';
import type { Championship, SportId } from '../types/index.ts';
import { getSportDisplayName, getSportIcon } from '../config/sportsCatalog.ts';

const statusMeta: Record<Championship['status'], { label: string; color: string; icon: typeof FireIcon }> = {
  active: {
    label: 'Em andamento',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: FireIcon,
  },
  draft: {
    label: 'Em preparação',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: ClockIcon,
  },
  finished: {
    label: 'Finalizado',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: CheckBadgeIcon,
  },
};

const visibilityMeta: Record<NonNullable<Championship['visibility']>, { label: string; color: string }> = {
  public: {
    label: 'Público',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  private: {
    label: 'Privado',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  inviteOnly: {
    label: 'Somente convite',
    color: 'bg-purple-100 text-purple-600 border-purple-200',
  },
};

const formatDate = (value?: Date | string) => {
  if (!value) return 'Data em definição';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Data em definição';

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const parseDate = (value?: Date | string) => {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const computeStats = (items: Championship[]) => ({
  total: items.length,
  active: items.filter((item) => item.status === 'active').length,
  draft: items.filter((item) => item.status === 'draft').length,
  finished: items.filter((item) => item.status === 'finished').length,
});

const getStatusBadge = (status: Championship['status']) => {
  const config = statusMeta[status];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors duration-200',
        config.color
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

const getVisibilityBadge = (visibility?: Championship['visibility']) => {
  const key = visibility ?? 'public';
  const config = visibilityMeta[key];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border transition-colors duration-200',
        config.color
      )}
    >
      <ShieldCheckIcon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

export default function BrowseChampionshipsPage() {
  const championships = useChampionshipStore((state) => state.championships);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Championship['status']>('all');
  const [sportFilter, setSportFilter] = useState<'all' | SportId>('all');

  const overview = useMemo(() => computeStats(championships), [championships]);

  const availableSports = useMemo(() => {
    const unique = new Set<SportId>();
    championships.forEach((championship) => {
      if (championship.sport) {
        unique.add(championship.sport);
      }
    });

    return Array.from(unique).sort((a, b) =>
      getSportDisplayName(a).localeCompare(getSportDisplayName(b), 'pt-BR', { sensitivity: 'base' })
    );
  }, [championships]);

  const filteredChampionships = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return championships.filter((championship) => {
      const matchesSearch =
        term.length === 0 ||
        [championship.name, championship.description, championship.location, championship.format]
          .filter(Boolean)
          .some((field) => field!.toString().toLowerCase().includes(term)) ||
        getSportDisplayName(championship.sport).toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'all' || championship.status === statusFilter;
      const matchesSport = sportFilter === 'all' || championship.sport === sportFilter;
      return matchesSearch && matchesStatus && matchesSport;
    });
  }, [championships, searchTerm, statusFilter, sportFilter]);

  const sortedChampionships = useMemo(() => {
    const toTimestamp = (championship: Championship) => {
      const priorityDate =
        parseDate(championship.startDate) ??
        parseDate(championship.registrationDeadline) ??
        parseDate(championship.createdAt);

      return priorityDate ? priorityDate.getTime() : 0;
    };

    return [...filteredChampionships].sort((a, b) => toTimestamp(b) - toTimestamp(a));
  }, [filteredChampionships]);

  const sections = useMemo(() => {
    const base = [
      {
        key: 'active' as Championship['status'],
        title: 'Acontecendo agora',
        description: 'Competições em andamento para acompanhar de perto os resultados e tabelas.',
      },
      {
        key: 'draft' as Championship['status'],
        title: 'Em preparação',
        description: 'Torneios que estão sendo estruturados e logo ficarão disponíveis.',
      },
      {
        key: 'finished' as Championship['status'],
        title: 'Finalizados recentemente',
        description: 'Histórico de campeonatos concluídos para relembrar os campeões.',
      },
    ];

    if (statusFilter !== 'all') {
      const target = base.find((section) => section.key === statusFilter);
      if (!target) return [];

      return [
        {
          ...target,
          items: sortedChampionships.filter((championship) => championship.status === statusFilter),
        },
      ];
    }

    return base.map((section) => ({
      ...section,
      items: sortedChampionships.filter((championship) => championship.status === section.key),
    }));
  }, [sortedChampionships, statusFilter]);

  const totalVisible = sortedChampionships.length;

  const statusFilterOptions: Array<{
    value: 'all' | Championship['status'];
    label: string;
    icon: typeof FireIcon;
    count: number;
  }> = [
    { value: 'all', label: 'Todos', icon: FunnelIcon, count: overview.total },
    { value: 'active', label: 'Em andamento', icon: FireIcon, count: overview.active },
    { value: 'draft', label: 'Em preparação', icon: ClockIcon, count: overview.draft },
    { value: 'finished', label: 'Finalizados', icon: CheckBadgeIcon, count: overview.finished },
  ];

  const sportFilterOptions = availableSports.map((sportId) => ({
    value: sportId,
    label: getSportDisplayName(sportId),
    icon: getSportIcon(sportId),
  }));

  return (
    <div className="min-h-screen bg-[#fdf6ef] pb-16 pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-amber-100/70 bg-[#fffdf9] shadow-[0_35px_90px_-55px_rgba(253,186,116,0.4)]">
          <div className="grid gap-10 px-8 py-10 sm:px-12 sm:py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
                Gestão de campeonatos
              </span>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  Tudo o que você cria e descobre em um só lugar
                </h1>
                <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
                  Inicie novos campeonatos com uma jornada guiada e acompanhe as ligas públicas da comunidade. As duas experiências convivem na mesma página para facilitar a navegação.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/championship/create"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-amber-500 to-rose-500 px-5 py-4 text-center text-sm font-semibold text-white shadow-[0_25px_55px_-30px_rgba(251,146,60,0.65)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-28px_rgba(251,146,60,0.75)]"
                >
                  <SparklesIcon className="h-5 w-5" />
                  Criar novo campeonato
                </Link>
                <a
                  href="#explorar"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/80 bg-[#fff7eb] px-5 py-4 text-center text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  Explorar campeonatos públicos
                </a>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-600 shadow-sm">
                  <CheckIcon className="h-4 w-4 text-emerald-500" />
                  Fluxo guiado em 3 passos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-600 shadow-sm">
                  <ChartBarIcon className="h-4 w-4 text-amber-500" />
                  Acompanhamento em tempo real
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-600 shadow-sm">
                  <ShieldCheckIcon className="h-4 w-4 text-indigo-500" />
                  Visibilidade sob controle
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100/70 bg-gradient-to-br from-white via-[#fff8f1] to-white p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.45em] text-amber-600">Resumo rápido</h2>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-500 transition hover:text-amber-600"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Voltar ao dashboard
                </Link>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Monitore os números gerais para decidir se cria algo novo ou acompanha um campeonato existente.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Total cadastrados</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{overview.total}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                    <FireIcon className="h-4 w-4 text-emerald-500" />
                    Inclui todos os status
                  </span>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Ativos agora</p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-600">{overview.active}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                    <ClockIcon className="h-4 w-4 text-emerald-500" />
                    Em andamento
                  </span>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Em preparação</p>
                  <p className="mt-2 text-3xl font-semibold text-amber-600">{overview.draft}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                    <ChartBarIcon className="h-4 w-4 text-amber-500" />
                    Ajustes finais
                  </span>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Finalizados</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-700">{overview.finished}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                    <CheckBadgeIcon className="h-4 w-4 text-slate-500" />
                    Histórico disponível
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section id="explorar" className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-amber-100/70 bg-[#fffdf9] p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Criação guiada em três etapas</h2>
              <p className="mt-2 text-sm text-slate-600">
                Planeje o nome, formato e premiação sem perder nenhuma informação importante.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  {
                    title: 'Informações básicas',
                    description: 'Defina nome, descrição, modalidade e número de times.'
                  },
                  {
                    title: 'Configurações do torneio',
                    description: 'Escolha formato, visibilidade e datas chave com ajuda visual.'
                  },
                  {
                    title: 'Premiação e inscrições',
                    description: 'Controle taxas, prêmios e comunicação com os participantes.'
                  },
                ].map((item, index) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-sm font-semibold text-amber-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/championship/create"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
              >
                <ArrowRightIcon className="h-4 w-4" />
                Iniciar criação agora
              </Link>
            </div>

            <div className="rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-white via-emerald-50 to-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-emerald-700">Dicas rápidas para explorar</h3>
              <ul className="mt-4 space-y-3 text-sm text-emerald-700/80">
                <li className="flex items-start gap-2">
                  <MagnifyingGlassIcon className="mt-1 h-4 w-4 text-emerald-500" />
                  Use a busca global para localizar campeonatos por local, formato ou palavra-chave.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheckIcon className="mt-1 h-4 w-4 text-emerald-500" />
                  Filtre pela visibilidade adequada antes de compartilhar convites.
                </li>
                <li className="flex items-start gap-2">
                  <CalendarIcon className="mt-1 h-4 w-4 text-emerald-500" />
                  Priorize eventos com datas próximas para garantir inscrições no prazo.
                </li>
              </ul>
            </div>
          </aside>

          <div className="space-y-8">
            <div className="rounded-3xl border border-amber-100/70 bg-[#fffdf9] p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Buscar campeonatos públicos
                  </label>
                  <div className="relative mt-2">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Nome, modalidade, formato ou local..."
                      className="w-full rounded-2xl border border-amber-100 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Status</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {statusFilterOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStatusFilter(option.value)}
                          className={clsx(
                            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-sm',
                            option.value === statusFilter
                              ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                              : 'border-amber-100 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600'
                          )}
                        >
                          <option.icon className="h-4 w-4" />
                          <span>{option.label}</span>
                          <span
                            className={clsx(
                              'rounded-full px-2 py-0.5 text-[11px] font-bold',
                              option.value === statusFilter ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
                            )}
                          >
                            {option.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Modalidade</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSportFilter('all')}
                        className={clsx(
                          'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-sm',
                          sportFilter === 'all'
                            ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                            : 'border-amber-100 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600'
                        )}
                      >
                        <FunnelIcon className="h-4 w-4" />
                        Todas
                      </button>

                      {sportFilterOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSportFilter(option.value)}
                          className={clsx(
                            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-sm',
                            sportFilter === option.value
                              ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                              : 'border-amber-100 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600'
                          )}
                        >
                          <span className="text-base">{option.icon}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                <span>
                  Exibindo <strong className="text-amber-600">{totalVisible}</strong> campeonato(s)
                </span>
                {(searchTerm || statusFilter !== 'all' || sportFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setSportFilter('all');
                    }}
                    className="text-amber-600 transition hover:text-amber-500"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            {totalVisible === 0 ? (
              <div className="rounded-3xl border border-amber-100 bg-white p-16 text-center shadow-[0_20px_60px_-40px_rgba(251,191,36,0.5)]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50">
                  <TrophyIcon className="h-10 w-10 text-amber-500" />
                </div>
                <h2 className="mt-8 text-2xl font-semibold text-slate-900">Nenhum campeonato encontrado com os filtros atuais</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Ajuste os filtros ou limpe a pesquisa para visualizar todas as opções disponíveis.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {sections.map((section) => (
                  <section key={section.key} className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
                        <p className="text-sm text-slate-500">{section.description}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-[#fff9f0] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
                        <span>Total</span>
                        <span className="text-sm text-amber-700">{section.items.length}</span>
                      </span>
                    </div>

                    {section.items.length === 0 ? (
                      <div className="rounded-3xl border border-amber-100 bg-white p-8 text-center text-sm text-slate-500">
                        Nenhum campeonato nesse estágio com os filtros atuais.
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {section.items.map((championship) => {
                          const teamsCount = championship.teams?.length ?? 0;
                          const gamesCount = championship.games?.length ?? 0;
                          const startLabel = formatDate(
                            championship.startDate ?? championship.registrationDeadline ?? championship.createdAt
                          );

                          return (
                            <Link
                              key={championship.id}
                              to={`/championship/${championship.id}`}
                              className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-amber-100/70 bg-[#fffdf9] p-6 shadow-[0_25px_60px_-45px_rgba(253,186,116,0.45)] transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_35px_70px_-50px_rgba(253,186,116,0.55)]"
                            >
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-3xl" aria-hidden>
                                      {getSportIcon(championship.sport)}
                                    </span>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600/90">
                                        {getSportDisplayName(championship.sport)}
                                      </p>
                                      <h3 className="text-xl font-semibold text-slate-900 transition-colors group-hover:text-amber-600">
                                        {championship.name}
                                      </h3>
                                    </div>
                                  </div>
                                  {getStatusBadge(championship.status)}
                                </div>

                                {championship.description && (
                                  <p className="line-clamp-3 text-[15px] leading-relaxed text-slate-600">
                                    {championship.description}
                                  </p>
                                )}

                                <div className="space-y-3 rounded-2xl border border-amber-100/70 bg-[#fff7eb] p-4 text-sm text-slate-600">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-white text-amber-500">
                                        <UserGroupIcon className="h-4 w-4" />
                                      </span>
                                      <span className="text-sm font-medium text-slate-600">Times inscritos</span>
                                    </div>
                                    <span className="text-base font-semibold text-slate-900">{teamsCount}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-white text-amber-500">
                                        <CalendarIcon className="h-4 w-4" />
                                      </span>
                                      <span className="text-sm font-medium text-slate-600">Partidas geradas</span>
                                    </div>
                                    <span className="text-base font-semibold text-slate-900">{gamesCount}</span>
                                  </div>
                                  <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-amber-100 bg-white text-amber-500">
                                      <MapPinIcon className="h-4 w-4" />
                                    </span>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600/80">Local</p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {championship.location || 'Local a confirmar'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-amber-100 bg-white text-amber-500">
                                      <ClockIcon className="h-4 w-4" />
                                    </span>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600/80">Início previsto</p>
                                      <p className="text-sm font-semibold text-slate-900">{startLabel}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                                {getVisibilityBadge(championship.visibility)}
                                <span className="inline-flex items-center gap-2 font-semibold text-amber-600">
                                  Ver detalhes
                                  <EyeIcon className="h-4 w-4" />
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
