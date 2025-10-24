import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  CheckIcon,
  ClockIcon,
  FireIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SparklesIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserGroupIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useChampionshipStore } from '../store/championshipStore';
import { useConfirm } from '../store/confirmStore';
import { championshipService } from '../services/championshipService';
import type { Championship, SportId } from '../types/index.ts';
import { getSportDisplayName, getSportIcon } from '../config/sportsCatalog.ts';

const statusMeta: Record<Championship['status'], { label: string; color: string; icon: typeof FireIcon }> = {
  active: {
    label: 'Em andamento',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    icon: FireIcon,
  },
  draft: {
    label: 'Em preparação',
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: ClockIcon,
  },
  finished: {
    label: 'Finalizado',
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: CheckBadgeIcon,
  },
};

const visibilityMeta: Record<NonNullable<Championship['visibility']>, { label: string; color: string }> = {
  public: {
    label: 'Público',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  private: {
    label: 'Privado',
    color: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  inviteOnly: {
    label: 'Somente convite',
    color: 'bg-purple-50 text-purple-600 border-purple-200',
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
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-200 whitespace-nowrap',
        config.color
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{config.label}</span>
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
  const deleteChampionship = useChampionshipStore((state) => state.deleteChampionship);
  const fetchUserChampionships = useChampionshipStore((state) => state.fetchUserChampionships);
  const updateChampionship = useChampionshipStore((state) => state.updateChampionship);
  const isLoading = useChampionshipStore((state) => state.isLoading);
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Log para debug
  console.log('📊 BrowseChampionshipsPage - Championships no estado:', championships.length);

  // Buscar campeonatos do servidor quando a página carregar
  // Campeonatos públicos (de outros usuários)
  const [publicChampionships, setPublicChampionships] = useState<Championship[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  useEffect(() => {
    console.log('🔄 BrowseChampionshipsPage montada, buscando campeonatos...');
    fetchUserChampionships();
    (async () => {
      setIsLoadingPublic(true);
      try {
        const resp = await championshipService.getPublicChampionships();
        if (resp.success) {
          setPublicChampionships(resp.data.championships);
        }
      } catch (e) {
        console.error('Erro ao buscar campeonatos públicos', e);
      } finally {
        setIsLoadingPublic(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState<'all' | 'mine' | 'public'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Championship['status']>('all');
  const [sportFilter, setSportFilter] = useState<'all' | SportId>('all');

  const handleEditChampionship = (e: React.MouseEvent, championshipId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/championship/${championshipId}/edit`);
  };

  const handleDeleteChampionship = async (e: React.MouseEvent, championshipId: string, championshipName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm({
      title: 'Excluir Campeonato',
      message: `Tem certeza que deseja excluir o campeonato "${championshipName}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteChampionship(championshipId);
      toast.success('Campeonato excluído com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir campeonato');
    }
  };

  // União de "meus" + "públicos"
  const combinedChampionships = useMemo(() => {
    const map = new Map<string, Championship>();
    [...publicChampionships, ...championships].forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [publicChampionships, championships]);

  const myIds = useMemo(() => new Set(championships.map((c) => c.id)), [championships]);

  const overview = useMemo(() => {
    // Computar contadores sobre o conjunto visível de acordo com filtro de origem
    const myIdsLocal = new Set(championships.map((c) => c.id));
    const mine = combinedChampionships.filter((c) => myIdsLocal.has(c.id));
    const publics = combinedChampionships.filter((c) => !myIdsLocal.has(c.id));
    const base = originFilter === 'mine' ? mine : originFilter === 'public' ? publics : combinedChampionships;
    // Aplicar filtros de status e esporte antes do resumo
    const filtered = base.filter((championship) => {
      const matchesStatus = statusFilter === 'all' || championship.status === statusFilter;
      const matchesSport = sportFilter === 'all' || championship.sport === sportFilter;
      return matchesStatus && matchesSport;
    });
    return computeStats(filtered);
  }, [combinedChampionships, championships, originFilter, statusFilter, sportFilter]);

  const availableSports = useMemo(() => {
    const unique = new Set<SportId>();
    combinedChampionships.forEach((championship) => {
      if (championship.sport) {
        unique.add(championship.sport);
      }
    });

    return Array.from(unique).sort((a, b) =>
      getSportDisplayName(a).localeCompare(getSportDisplayName(b), 'pt-BR', { sensitivity: 'base' })
    );
  }, [combinedChampionships]);

  const filteredChampionships = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // Aplicar filtro de origem
    const myIdsLocal = new Set(championships.map((c) => c.id));
    const originFiltered = combinedChampionships.filter((c) => {
      if (originFilter === 'mine') return myIdsLocal.has(c.id);
      if (originFilter === 'public') return !myIdsLocal.has(c.id);
      return true;
    });

    return originFiltered.filter((championship) => {
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
  }, [combinedChampionships, searchTerm, statusFilter, sportFilter]);

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

  // Seções por origem: quando 'all', mostrar duas seções (Meus | Públicos);
  // quando 'mine' ou 'public', mostrar uma seção com os itens já filtrados.
  const originSections = useMemo<Array<{ key: string; title: string; description: string; items: Championship[] }>>(() => {
    const myIdsLocal = new Set(championships.map((c) => c.id));
    const mine = sortedChampionships.filter((c) => myIdsLocal.has(c.id));
    const publics = sortedChampionships.filter((c) => !myIdsLocal.has(c.id));

    if (originFilter === 'mine') {
      return [{ key: 'mine', title: 'Meus campeonatos', description: 'Campeonatos que você criou e pode gerenciar.', items: mine }];
    }
    if (originFilter === 'public') {
      return [{ key: 'public', title: 'Campeonatos públicos', description: 'Campeonatos de outros usuários para explorar.', items: publics }];
    }
    return [
      { key: 'mine', title: 'Meus campeonatos', description: 'Campeonatos que você criou e pode gerenciar.', items: mine },
      { key: 'public', title: 'Campeonatos públicos', description: 'Campeonatos de outros usuários para explorar.', items: publics },
    ];
  }, [sortedChampionships, championships, originFilter]);

  const totalVisible = sortedChampionships.length;

  const handleChangeStatus = async (e: React.MouseEvent, championshipId: string, status: Championship['status']) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateChampionship(championshipId, { status });
      toast.success(
        status === 'active' ? 'Campeonato ativado' : status === 'finished' ? 'Campeonato finalizado' : 'Status atualizado'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao mudar status');
    }
  };

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

  const originFilterOptions: Array<{
    value: 'all' | 'mine' | 'public';
    label: string;
    aria: string;
  }> = [
    { value: 'all', label: 'Todos', aria: 'Filtrar por origem: todos' },
    { value: 'mine', label: 'Meus', aria: 'Filtrar por origem: meus campeonatos' },
    { value: 'public', label: 'Públicos', aria: 'Filtrar por origem: campeonatos públicos' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 pb-20 pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <header className="rounded-3xl border border-gray-200 bg-white shadow-lg">
          <div className="grid gap-10 px-8 py-10 sm:px-12 sm:py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-blue-700">
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 text-center text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <SparklesIcon className="h-5 w-5" />
                  Criar novo campeonato
                </Link>
                <a
                  href="#explorar"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-5 py-4 text-center text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  Explorar campeonatos públicos
                </a>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-600 shadow-sm border border-gray-200">
                  <CheckIcon className="h-4 w-4 text-emerald-500" />
                  Fluxo guiado em 3 passos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-600 shadow-sm border border-gray-200">
                  <ChartBarIcon className="h-4 w-4 text-blue-500" />
                  Acompanhamento em tempo real
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-600 shadow-sm border border-gray-200">
                  <ShieldCheckIcon className="h-4 w-4 text-indigo-500" />
                  Visibilidade sob controle
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.45em] text-gray-700">Resumo rápido</h2>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 transition hover:text-blue-700"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Voltar ao dashboard
                </Link>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Monitore os números gerais para decidir se cria algo novo ou acompanha um campeonato existente.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Total cadastrados</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{overview.total}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                    <FireIcon className="h-4 w-4 text-blue-500" />
                    Inclui todos os status
                  </span>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Ativos agora</p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-600">{overview.active}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                    <ClockIcon className="h-4 w-4 text-emerald-500" />
                    Em andamento
                  </span>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Em preparação</p>
                  <p className="mt-2 text-3xl font-semibold text-blue-600">{overview.draft}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                    <ChartBarIcon className="h-4 w-4 text-blue-500" />
                    Ajustes finais
                  </span>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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

        {(isLoading || isLoadingPublic) && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-medium text-blue-900">Carregando campeonatos...</span>
            </div>
          </div>
        )}

        <section id="explorar" className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
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
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-sm font-semibold text-blue-700">
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
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              >
                <ArrowRightIcon className="h-4 w-4" />
                Iniciar criação agora
              </Link>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-white p-6 shadow-sm">
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
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
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
                      className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/30 p-3 min-w-0 overflow-hidden">
                    <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">Status</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {statusFilterOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStatusFilter(option.value)}
                          className={clsx(
                            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-sm',
                            option.value === statusFilter
                              ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-gray-300 bg-white text-slate-600 hover:border-gray-400 hover:bg-gray-50 hover:text-slate-700'
                          )}
                        >
                          <option.icon className="h-4 w-4" />
                          <span>{option.label}</span>
                          <span
                            className={clsx(
                              'rounded-full px-2 py-0.5 text-[11px] font-bold',
                              option.value === statusFilter ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-600'
                            )}
                          >
                            {option.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50/30 p-3 min-w-0 overflow-hidden">
                    <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">Modalidade</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSportFilter('all')}
                        className={clsx(
                          'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-sm',
                          sportFilter === 'all'
                            ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                            : 'border-gray-300 bg-white text-slate-600 hover:border-gray-400 hover:bg-gray-50 hover:text-slate-700'
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
                              ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-gray-300 bg-white text-slate-600 hover:border-gray-400 hover:bg-gray-50 hover:text-slate-700'
                          )}
                        >
                          <span className="text-base">{option.icon}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50/30 p-3 min-w-0 overflow-hidden">
                    <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">Origem</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {originFilterOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          aria-label={option.aria}
                          onClick={() => setOriginFilter(option.value)}
                          className={clsx(
                            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors shadow-sm',
                            originFilter === option.value
                              ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-gray-300 bg-white text-slate-600 hover:border-gray-400 hover:bg-gray-50 hover:text-slate-700'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                <span>
                  Exibindo <strong className="text-blue-600">{totalVisible}</strong> campeonato(s)
                </span>
                {(searchTerm || statusFilter !== 'all' || sportFilter !== 'all' || originFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setSportFilter('all');
                      setOriginFilter('all');
                    }}
                    className="text-blue-600 transition hover:text-blue-700"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            {totalVisible === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center shadow-lg">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50">
                  <TrophyIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="mt-8 text-2xl font-semibold text-slate-900">Nenhum campeonato encontrado com os filtros atuais</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Ajuste os filtros ou limpe a pesquisa para visualizar todas as opções disponíveis.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {originSections.map((section) => (
                  <section key={section.key} className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b-2 border-slate-200">
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">{section.title}</h2>
                        <p className="text-sm text-slate-600 font-medium">{section.description}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-700 shadow-sm">
                        <span className="uppercase tracking-wide">Total</span>
                        <span className="text-2xl font-bold text-blue-900">{section.items.length}</span>
                      </span>
                    </div>

                    {section.items.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                        <TrophyIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-base font-semibold text-slate-600">
                          Nenhum campeonato nesse estágio com os filtros atuais.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {section.items.map((championship) => {
                          const teamsCount = championship.teams?.length ?? 0;
                          const gamesCount = championship.games?.length ?? 0;
                          const startLabel = formatDate(
                            championship.startDate ?? championship.registrationDeadline ?? championship.createdAt
                          );
                          const isMine = myIds.has(championship.id);

                          return (
                            <div
                              key={championship.id}
                              className={clsx(
                                'group grid gap-4 md:grid-cols-12 items-start rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200',
                                isMine ? 'border-slate-200 hover:border-blue-300' : 'border-slate-200 hover:border-purple-300'
                              )}
                            >
                              {/* Zona 1 - Identificação (30%) */}
                              <div className="flex items-center gap-3 min-w-0 md:col-span-5 lg:col-span-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-slate-100 border border-slate-200 text-3xl">
                                  {getSportIcon(championship.sport)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                                      {getSportDisplayName(championship.sport)}
                                    </span>
                                  </div>
                                  <Link 
                                    to={`/championship/${championship.id}`}
                                    className="block hover:text-blue-600 transition-colors"
                                  >
                                    <h3 className="text-base font-bold text-slate-900 truncate mb-0.5">
                                      {championship.name}
                                    </h3>
                                  </Link>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                      <path fillRule="evenodd" d="M10 2a5 5 0 00-3.536 8.536c.12.12.219.26.292.415L8.5 13h3l1.744-2.049c.073-.155.172-.295.292-.415A5 5 0 0010 2zm-3 14a3 3 0 013-3h0a3 3 0 013 3v1H7v-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">
                                      {myIds.has(championship.id) ? 'Você' : (championship.creator?.name || 'Desconhecido')}
                                    </span>
                                  </div>
                                  {championship.description && (
                                    <p className="text-xs text-slate-600 line-clamp-1">{championship.description}</p>
                                  )}
                                </div>
                              </div>

                              {/* Zona 2 - Métricas (40%) */}
                              <div className="flex items-center gap-3 lg:justify-center min-w-0 flex-1 md:col-span-4 lg:col-span-5">
                                {/* Stats - Times e Jogos */}
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50/50 border border-blue-100">
                                    <UserGroupIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <div>
                                      <p className="text-[10px] text-slate-600 leading-none mb-0.5">Times</p>
                                      <p className="text-xl font-bold text-slate-900 leading-none">{teamsCount}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                    <CalendarIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                    <div>
                                      <p className="text-[10px] text-slate-600 leading-none mb-0.5">Jogos</p>
                                      <p className="text-xl font-bold text-slate-900 leading-none">{gamesCount}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Local e Data */}
                                <div className="hidden md:flex flex-wrap gap-2 ml-3">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-700 whitespace-nowrap">
                                    <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="max-w-[200px] truncate font-medium">{championship.location || 'A confirmar'}</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-700 whitespace-nowrap">
                                    <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="font-medium">{startLabel}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Zona 3 - Badges e Ações */}
                              <div className="flex items-center justify-end gap-2 flex-shrink-0 md:col-span-3 lg:col-span-3">
                                {/* Badges + Ações (linha única, com wrap) */}
                                <div className="flex flex-wrap items-center justify-end gap-2 min-w-[240px]">
                                  {getStatusBadge(championship.status)}
                                  {getVisibilityBadge(championship.visibility)}
                                  {!isMine && (
                                    <span
                                      className={clsx(
                                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border transition-colors',
                                        'bg-purple-50 text-purple-700 border-purple-200'
                                      )}
                                    >
                                      Público
                                    </span>
                                  )}

                                  {/* Ações de status (somente para meus campeonatos) */}
                                  {/* Ações de status (somente para meus campeonatos) */}
                                  {myIds.has(championship.id) && (
                                    <div className="flex items-center gap-1">
                                      {championship.status !== 'finished' && (
                                        <button
                                          onClick={(e) => handleChangeStatus(e, championship.id, 'finished')}
                                          className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
                                          title="Finalizar campeonato"
                                        >
                                          Finalizar
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {myIds.has(championship.id) && (
                                    <>
                                      <button
                                        onClick={(e) => handleEditChampionship(e, championship.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                        title="Editar campeonato"
                                      >
                                        <PencilSquareIcon className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={(e) => handleDeleteChampionship(e, championship.id, championship.name)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                        title="Excluir campeonato"
                                      >
                                        <TrashIcon className="h-5 w-5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
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
