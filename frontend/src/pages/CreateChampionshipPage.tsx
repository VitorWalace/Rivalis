import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CalendarIcon,
	CheckIcon,
	CurrencyDollarIcon,
	InformationCircleIcon,
	ShieldCheckIcon,
	SparklesIcon,
	TrophyIcon,
	UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useChampionshipStore } from '../store/championshipStore';

type GameCatalogCategory = {
	title: string;
	description: string;
	items: { value: string; label: string; summary: string; tags?: string[] }[];
};

type StepDefinition = {
	id: number;
	label: string;
	description: string;
	icon: typeof CalendarIcon;
};

const basicInfoSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, 'Informe um nome com pelo menos 3 caracteres')
		.max(80, 'Use no máximo 80 caracteres'),
	description: z
		.string()
		.trim()
		.min(10, 'Use pelo menos 10 caracteres')
		.max(500, 'Use no máximo 500 caracteres'),
	game: z.string().min(1, 'Selecione uma modalidade'),
	maxParticipants: z.number().int().min(4, 'Defina ao menos 4 participantes').max(128, 'Limite máximo de 128 participantes'),
});

const configSchema = z.object({
	format: z.string().min(1, 'Selecione um formato'),
	visibility: z.string().min(1, 'Selecione a visibilidade'),
	startDate: z.string().min(1, 'Informe a data de início'),
	registrationDeadline: z.string().optional(),
});

const prizeSchema = z
	.object({
		hasEntryFee: z.boolean(),
		entryFee: z.string().optional(),
		prizePool: z.string().optional(),
		prizeDistribution: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.hasEntryFee) {
			const sanitized = parseCurrencyValue(data.entryFee);
			if (sanitized === undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['entryFee'],
					message: 'Informe o valor da inscrição',
				});
			}
		}

		if (data.prizePool) {
			const sanitizedPool = parseCurrencyValue(data.prizePool);
			if (sanitizedPool === undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['prizePool'],
					message: 'Informe um valor de premiação válido',
				});
			}
		}
	});

type BasicInfoForm = z.infer<typeof basicInfoSchema>;
type ConfigForm = z.infer<typeof configSchema>;
type PrizeForm = z.infer<typeof prizeSchema>;

const steps: StepDefinition[] = [
	{
		id: 1,
		label: 'Informações básicas',
		description: 'Nome, descrição e esporte do campeonato.',
		icon: SparklesIcon,
	},
	{
		id: 2,
		label: 'Configuração',
		description: 'Formato, visibilidade e cronograma.',
		icon: CalendarIcon,
	},
	{
		id: 3,
		label: 'Premiação',
		description: 'Taxas, premiação e destaques.',
		icon: TrophyIcon,
	},
];

const formatOptions = [
	{
		value: 'single-elimination',
		label: 'Eliminação simples',
		description: 'Chaves eliminatórias com confronto único até a final.',
	},
	{
		value: 'double-elimination',
		label: 'Eliminação dupla',
		description: 'Duas chaves garantindo repescagem e maior equilíbrio.',
	},
	{
		value: 'round-robin',
		label: 'Todos contra todos',
		description: 'Equipes se enfrentam em rodadas para somar pontos.',
	},
];

const visibilityOptions = [
	{
		value: 'public',
		icon: SparklesIcon,
		label: 'Público',
		description: 'Visível para toda a comunidade Rivalis.',
	},
	{
		value: 'private',
		icon: ShieldCheckIcon,
		label: 'Privado',
		description: 'Apenas participantes convidados visualizam e se inscrevem.',
	},
	{
		value: 'inviteOnly',
		icon: UserGroupIcon,
		label: 'Convites',
		description: 'Somente quem recebe convites personalizados acessa.',
	},
];

const gameCatalog: GameCatalogCategory[] = [
	{
		title: 'Esportes de quadra',
		description: 'Modalidades tradicionais para competições escolares.',
		items: [
			{ value: 'Futsal', label: 'Futsal', summary: 'Ritmo intenso em quadra reduzida.', tags: ['popular', 'dinâmico'] },
			{ value: 'Basquete', label: 'Basquete', summary: 'Equipes em busca de cestas decisivas.', tags: ['estratégia'] },
			{ value: 'Vôlei', label: 'Vôlei', summary: 'Jogadas rápidas e rallys emocionantes.', tags: ['coletivo'] },
			{ value: 'Handebol', label: 'Handebol', summary: 'Força e agilidade em quadra.', tags: ['resistência'] },
		],
	},
	{
		title: 'Arena e campo',
		description: 'Modalidades ideais para eventos ao ar livre.',
		items: [
			{ value: 'Futebol Society', label: 'Futebol Society', summary: 'Grama sintética e jogos de alta velocidade.' },
			{ value: 'Rugby Escolar', label: 'Rugby Escolar', summary: 'Modalidade adaptada para escolas e universidades.' },
			{ value: 'Atletismo', label: 'Atletismo', summary: 'Provas de pista e campo personalizadas.' },
			{ value: 'Beach Tennis', label: 'Beach Tennis', summary: 'Clima de praia com disputa acirrada.' },
		],
	},
	{
		title: 'Individuais e estratégia',
		description: 'Competições técnicas e de raciocínio.',
		items: [
			{ value: 'Xadrez', label: 'Xadrez', summary: 'Partidas pensadas com ritmo rápido.' },
			{ value: 'Tênis de mesa', label: 'Tênis de mesa', summary: 'Duelo de reflexos e precisão.' },
			{ value: 'Esgrima escolar', label: 'Esgrima escolar', summary: 'Versão adaptada com foco em técnica.' },
			{ value: 'E-sports', label: 'E-sports', summary: 'Torneios digitais com transmissão online.' },
		],
	},
];

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
	maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
	day: '2-digit',
	month: 'short',
	year: 'numeric',
});

function parseCurrencyValue(raw?: string | null): number | undefined {
	if (!raw) {
		return undefined;
	}
	const sanitized = raw.replace(/[\sR$]/g, '').replace(/\./g, '').replace(',', '.');
	const parsed = Number.parseFloat(sanitized);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return undefined;
	}
	return Math.round(parsed * 100) / 100;
}

function formatDateToISO(value?: string): string | undefined {
	if (!value) {
		return undefined;
	}
	const [year, month, day] = value.split('-').map(Number);
	if (!year || !month || !day) {
		return undefined;
	}
	const utcDate = new Date(Date.UTC(year, month - 1, day));
	return utcDate.toISOString();
}

function formatDatePreview(value?: string): string {
	if (!value) {
		return '—';
	}
	const iso = formatDateToISO(value);
	if (!iso) {
		return '—';
	}
	return dateFormatter.format(new Date(iso));
}

function classNames(...values: Array<string | false | null | undefined>): string {
	return values.filter(Boolean).join(' ');
}

export default function CreateChampionshipPage() {
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const createChampionship = useChampionshipStore((state) => state.createChampionship);

	const [currentStep, setCurrentStep] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [gameSearch, setGameSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState<string>(gameCatalog[0]?.title ?? '');

	const basicInfoForm = useForm<BasicInfoForm>({
		resolver: zodResolver(basicInfoSchema),
		mode: 'onChange',
		defaultValues: {
			name: '',
			description: '',
			game: '',
			maxParticipants: 16,
		},
	});

	const configForm = useForm<ConfigForm>({
		resolver: zodResolver(configSchema),
		mode: 'onChange',
		defaultValues: {
			format: 'single-elimination',
			visibility: 'public',
			startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
			registrationDeadline: '',
		},
	});

	const prizeForm = useForm<PrizeForm>({
		resolver: zodResolver(prizeSchema),
		mode: 'onChange',
		defaultValues: {
			hasEntryFee: false,
			entryFee: '',
			prizePool: '',
			prizeDistribution: '',
		},
	});

	const basicInfoValues = basicInfoForm.watch();
	const configValues = configForm.watch();
	const prizeValues = prizeForm.watch();

	const normalizedCatalog = useMemo(() => {
		if (!gameSearch.trim()) {
			return gameCatalog;
		}

		const input = gameSearch.trim().toLowerCase();

		return gameCatalog
			.map((category) => {
				const filteredItems = category.items.filter((item) => {
					const tagText = item.tags?.join(' ') ?? '';
					return `${item.label} ${item.summary} ${tagText}`.toLowerCase().includes(input);
				});
				if (!filteredItems.length) {
					return null;
				}
				return { ...category, items: filteredItems };
			})
			.filter(Boolean) as GameCatalogCategory[];
	}, [gameSearch]);

	useEffect(() => {
		const catalogToUse = normalizedCatalog.length ? normalizedCatalog : gameCatalog;
		setActiveCategory((current) => {
			if (catalogToUse.some((category) => category.title === current)) {
				return current;
			}
			return catalogToUse[0]?.title ?? '';
		});
	}, [normalizedCatalog]);

	const catalogToDisplay = normalizedCatalog.length ? normalizedCatalog : gameCatalog;
	const activeCategoryData = catalogToDisplay.find((category) => category.title === activeCategory) ?? catalogToDisplay[0];
	const activeItems = activeCategoryData?.items ?? [];

	const allGames = useMemo(() => gameCatalog.flatMap((category) => category.items), []);
	const selectedGameInfo = allGames.find((item) => item.value === basicInfoValues.game);
	const selectedFormat = formatOptions.find((option) => option.value === configValues.format);
	const selectedVisibility = visibilityOptions.find((option) => option.value === configValues.visibility);

	const parsedEntryFee = parseCurrencyValue(prizeValues.entryFee);
	const parsedPrizePool = parseCurrencyValue(prizeValues.prizePool);

	const forms = [basicInfoForm, configForm, prizeForm] as const;

	const handleNextStep = async () => {
		const form = forms[currentStep];
		const valid = await form.trigger();
		if (!valid) {
			toast.error('Revise os campos destacados antes de avançar.');
			return;
		}
		setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
	};

	const handlePreviousStep = () => {
		setCurrentStep((step) => Math.max(step - 1, 0));
	};

	const handleSubmit = async () => {
		const valid = await prizeForm.trigger();
		if (!valid) {
			toast.error('Revise as informações de premiação antes de finalizar.');
			return;
		}

		if (!user) {
			toast.error('Faça login para criar campeonatos.');
			navigate('/login');
			return;
		}

		setIsSubmitting(true);
		try {
			const basic = basicInfoForm.getValues();
			const config = configForm.getValues();
			const prize = prizeForm.getValues();

			await createChampionship({
				name: basic.name.trim(),
				description: basic.description.trim(),
				game: basic.game,
				maxParticipants: basic.maxParticipants,
				format: config.format,
				visibility: config.visibility,
				startDate: formatDateToISO(config.startDate) ?? new Date().toISOString(),
				registrationDeadline: formatDateToISO(config.registrationDeadline),
				hasEntryFee: prize.hasEntryFee,
				entryFee: prize.hasEntryFee ? parsedEntryFee : undefined,
				prizePool: parsedPrizePool,
				prizeDistribution: prize.prizeDistribution?.trim() || undefined,
				organizerId: user.id,
				status: 'draft',
				currentParticipants: 0,
			});

			toast.success('Campeonato criado com sucesso!');
			navigate('/championships');
		} catch (error) {
			console.error('Erro ao criar campeonato', error);
			toast.error('Não foi possível criar o campeonato, tente novamente.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<section className="relative isolate overflow-hidden">
				<div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 opacity-90" />
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
				<div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 sm:px-10">
					<div className="flex items-center gap-3 text-sm text-blue-100/80">
						<SparklesIcon className="h-5 w-5" />
						<span>Monte experiências competitivas memoráveis em poucos minutos</span>
					</div>
					<div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
						<div className="space-y-4">
							<h1 className="text-3xl font-semibold sm:text-4xl">Criar campeonato</h1>
							<p className="max-w-2xl text-sm text-blue-100/90 sm:text-base">
								Defina a identidade do torneio, configure fases e compartilhe com os participantes. A Rivalis organiza tudo para você.
							</p>
						</div>
						<Link
							to="/championships"
							className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
						>
							<ArrowLeftIcon className="h-4 w-4" />
							Voltar para campeonatos
						</Link>
					</div>
				</div>
			</section>

			<main className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 sm:px-10 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
				<section className="space-y-10">
					<nav className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-blue-950/30 backdrop-blur">
						<ol className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
							{steps.map((step, index) => {
								const reached = index < currentStep;
								const active = index === currentStep;
								return (
									<li key={step.id} className="flex flex-1 items-center gap-4">
										<div
											className={classNames(
												'relative flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition',
												reached && 'border-blue-400 bg-blue-500 text-white shadow shadow-blue-500/40',
												active && !reached && 'border-blue-300 bg-slate-950 text-blue-100',
												!active && !reached && 'border-slate-800 bg-slate-900 text-slate-300'
											)}
										>
											<step.icon className="h-5 w-5" />
											{reached && <CheckIcon className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-blue-500 text-white" />}
										</div>
										<div className="space-y-1">
											<span className="text-xs uppercase tracking-wide text-slate-400">Passo {step.id}</span>
											<p className="font-medium text-slate-100">{step.label}</p>
											<p className="text-xs text-slate-400 sm:text-sm">{step.description}</p>
										</div>
										{index < steps.length - 1 && <div className="hidden flex-1 border-t border-dashed border-slate-800 md:flex" aria-hidden />}
									</li>
								);
							})}
						</ol>
					</nav>

					<div className="space-y-12">
						{currentStep === 0 && (
							<form className="space-y-10" onSubmit={(event) => event.preventDefault()}>
								<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-blue-950/30 backdrop-blur">
									<div className="mb-6 flex items-start justify-between gap-4">
										<div>
											<h2 className="text-lg font-semibold text-white">Identidade do campeonato</h2>
											<p className="text-sm text-slate-400">Defina nome, descrição e público que deseja alcançar.</p>
										</div>
										<InformationCircleIcon className="h-5 w-5 text-slate-500" />
									</div>

									<div className="grid gap-6 md:grid-cols-2">
										<div className="md:col-span-2">
											<label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="championship-name">
												Nome do campeonato
											</label>
											<input
												id="championship-name"
												type="text"
												maxLength={80}
												className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
												{...basicInfoForm.register('name')}
											/>
											{basicInfoForm.formState.errors.name && <p className="mt-2 text-xs text-red-400">{basicInfoForm.formState.errors.name.message}</p>}
										</div>

										<div className="md:col-span-2">
											<label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="championship-description">
												Descrição
											</label>
											<textarea
												id="championship-description"
												rows={4}
												className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
												{...basicInfoForm.register('description')}
											/>
											{basicInfoForm.formState.errors.description && <p className="mt-2 text-xs text-red-400">{basicInfoForm.formState.errors.description.message}</p>}
										</div>

										<div>
											<label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="max-participants">
												Número máximo de equipes
											</label>
											<input
												id="max-participants"
												type="number"
												min={4}
												max={128}
												className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
												{...basicInfoForm.register('maxParticipants', { valueAsNumber: true })}
											/>
											{basicInfoForm.formState.errors.maxParticipants && <p className="mt-2 text-xs text-red-400">{basicInfoForm.formState.errors.maxParticipants.message}</p>}
										</div>

										<div className="space-y-3 md:col-span-2">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div>
													<h3 className="text-sm font-semibold text-slate-200">Modalidade esportiva</h3>
													<p className="text-xs text-slate-400">Escolha a modalidade que melhor representa o campeonato.</p>
												</div>
												<input
													aria-label="Buscar modalidade"
													type="search"
													placeholder="Buscar por esporte ou característica"
													value={gameSearch}
													onChange={(event) => setGameSearch(event.target.value)}
													className="w-60 rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
												/>
											</div>

											<div className="flex flex-wrap gap-2">
												{catalogToDisplay.map((category) => (
													<button
														key={category.title}
														type="button"
														onClick={() => setActiveCategory(category.title)}
														className={classNames(
															'rounded-full border px-4 py-2 text-xs font-medium transition',
															activeCategory === category.title
																? 'border-blue-400 bg-blue-500/20 text-blue-100'
																: 'border-slate-800 bg-slate-950 text-slate-300 hover:border-blue-400/60 hover:text-blue-100'
														)}
													>
														{category.title}
													</button>
												))}
											</div>

											<div className="mt-4 grid gap-4 md:grid-cols-2">
												{activeItems.map((item) => {
													const selected = basicInfoValues.game === item.value;
													return (
														<button
															key={item.value}
															type="button"
															onClick={() => {
																basicInfoForm.setValue('game', item.value, { shouldDirty: true, shouldValidate: true });
																toast.dismiss();
															}}
															className={classNames(
																'flex h-full flex-col gap-3 rounded-xl border bg-slate-950/80 p-4 text-left transition hover:border-blue-400/60 hover:bg-slate-900/80',
																selected ? 'border-blue-400 shadow-lg shadow-blue-500/20' : 'border-slate-800'
															)}
														>
															<div className="flex items-center justify-between">
																<span className="text-sm font-semibold text-slate-100">{item.label}</span>
																{selected && <CheckIcon className="h-4 w-4 text-blue-300" />}
															</div>
															<p className="text-xs text-slate-400">{item.summary}</p>
															{item.tags && (
																<div className="flex flex-wrap gap-1">
																	{item.tags.map((tag) => (
																		<span key={tag} className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] uppercase tracking-wide text-blue-200">
																			{tag}
																		</span>
																	))}
																</div>
															)}
														</button>
													);
												})}
											</div>
											{basicInfoForm.formState.errors.game && <p className="text-xs text-red-400">{basicInfoForm.formState.errors.game.message}</p>}
										</div>
									</div>
								</div>
							</form>
						)}

						{currentStep === 1 && (
							<form className="space-y-10" onSubmit={(event) => event.preventDefault()}>
								<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-blue-950/30 backdrop-blur">
									<div className="mb-6 flex items-start justify-between gap-4">
										<div>
											<h2 className="text-lg font-semibold text-white">Formato e visibilidade</h2>
											<p className="text-sm text-slate-400">Defina como os confrontos acontecem e quem pode acompanhar o campeonato.</p>
										</div>
										<InformationCircleIcon className="h-5 w-5 text-slate-500" />
									</div>

									<div className="space-y-6">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-200">Formato do torneio</h3>
											<div className="grid gap-4 lg:grid-cols-3">
												{formatOptions.map((option) => {
													const selected = configValues.format === option.value;
													return (
														<button
															key={option.value}
															type="button"
															onClick={() => configForm.setValue('format', option.value, { shouldDirty: true, shouldValidate: true })}
															className={classNames(
																'flex h-full flex-col rounded-xl border bg-slate-950/80 p-4 text-left transition hover:border-blue-400/60 hover:bg-slate-900/80',
																selected ? 'border-blue-400 shadow-lg shadow-blue-500/20' : 'border-slate-800'
															)}
														>
															<span className="text-sm font-semibold text-slate-100">{option.label}</span>
															<p className="mt-2 text-xs text-slate-400">{option.description}</p>
															{selected && <CheckIcon className="mt-3 h-4 w-4 text-blue-300" />}
														</button>
													);
												})}
											</div>
											{configForm.formState.errors.format && <p className="mt-2 text-xs text-red-400">{configForm.formState.errors.format.message}</p>}
										</div>

										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-200">Visibilidade</h3>
											<div className="grid gap-4 md:grid-cols-3">
												{visibilityOptions.map((option) => {
													const selected = configValues.visibility === option.value;
													const Icon = option.icon;
													return (
														<button
															key={option.value}
															type="button"
															onClick={() => configForm.setValue('visibility', option.value, { shouldDirty: true, shouldValidate: true })}
															className={classNames(
																'flex h-full flex-col gap-3 rounded-xl border bg-slate-950/80 p-4 text-left transition hover:border-blue-400/60 hover:bg-slate-900/80',
																selected ? 'border-blue-400 shadow-lg shadow-blue-500/20' : 'border-slate-800'
															)}
														>
															<Icon className="h-5 w-5 text-blue-300" />
															<div>
																<p className="text-sm font-semibold text-slate-100">{option.label}</p>
																<p className="mt-1 text-xs text-slate-400">{option.description}</p>
															</div>
															{selected && <CheckIcon className="mt-auto h-4 w-4 text-blue-300" />}
														</button>
													);
												})}
											</div>
											{configForm.formState.errors.visibility && <p className="mt-2 text-xs text-red-400">{configForm.formState.errors.visibility.message}</p>}
										</div>

										<div className="grid gap-6 md:grid-cols-2">
											<div>
												<label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="start-date">
													Data de início
												</label>
												<input
													id="start-date"
													type="date"
													className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
													{...configForm.register('startDate')}
												/>
												{configForm.formState.errors.startDate && <p className="mt-2 text-xs text-red-400">{configForm.formState.errors.startDate.message}</p>}
											</div>

											<div>
												<label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="registration-deadline">
													Limite de inscrições (opcional)
												</label>
												<input
													id="registration-deadline"
													type="date"
													className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
													{...configForm.register('registrationDeadline')}
												/>
												{configForm.formState.errors.registrationDeadline && <p className="mt-2 text-xs text-red-400">{configForm.formState.errors.registrationDeadline.message}</p>}
											</div>
										</div>
									</div>
								</div>
							</form>
						)}

						{currentStep === 2 && (
							<form className="space-y-10" onSubmit={(event) => event.preventDefault()}>
								<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-blue-950/30 backdrop-blur">
									<div className="mb-6 flex items-start justify-between gap-4">
										<div>
											<h2 className="text-lg font-semibold text-white">Premiação e destaque</h2>
											<p className="text-sm text-slate-400">Defina taxas, premiação e mensagens importantes para os participantes.</p>
										</div>
										<CurrencyDollarIcon className="h-5 w-5 text-slate-500" />
									</div>

									<div className="space-y-6">
										<div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3">
											<div>
												<p className="text-sm font-medium text-slate-100">Cobrar taxa de inscrição?</p>
												<p className="text-xs text-slate-400">Permite custear arbitragem, uniformes ou premiações.</p>
											</div>
											<label className="inline-flex items-center gap-2 text-sm text-slate-200">
												<input
													type="checkbox"
													className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-400/40"
													{...prizeForm.register('hasEntryFee')}
												/>
												Sim
											</label>
										</div>

										{prizeValues.hasEntryFee && (
											<div>
												<label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="entry-fee">
													Valor da inscrição por equipe
												</label>
												<input
													id="entry-fee"
													type="text"
													inputMode="decimal"
													placeholder="Ex: 150,00"
													className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
													{...prizeForm.register('entryFee')}
												/>
												{prizeForm.formState.errors.entryFee && <p className="mt-2 text-xs text-red-400">{prizeForm.formState.errors.entryFee.message}</p>}
											</div>
										)}

										<div>
											<label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="prize-pool">
												Premiação total (opcional)
											</label>
											<input
												id="prize-pool"
												type="text"
												inputMode="decimal"
												placeholder="Ex: 1.000,00"
												className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
												{...prizeForm.register('prizePool')}
											/>
											{prizeForm.formState.errors.prizePool && <p className="mt-2 text-xs text-red-400">{prizeForm.formState.errors.prizePool.message}</p>}
										</div>

										<div>
											<label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="prize-distribution">
												Mensagem para os participantes (opcional)
											</label>
											<textarea
												id="prize-distribution"
												rows={4}
												placeholder="Descreva como funcionará a premiação e destaques do torneio."
												className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
												{...prizeForm.register('prizeDistribution')}
											/>
										</div>
									</div>
								</div>
							</form>
						)}

						<div className="flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:justify-between">
							<button
								type="button"
								onClick={handlePreviousStep}
								disabled={currentStep === 0 || isSubmitting}
								className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500 sm:w-auto"
							>
								<ArrowLeftIcon className="h-4 w-4" />
								Voltar
							</button>

							{currentStep < steps.length - 1 ? (
								<button
									type="button"
									onClick={handleNextStep}
									className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-blue-500 bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 sm:w-auto"
								>
									Avançar
									<ArrowRightIcon className="h-4 w-4" />
								</button>
							) : (
								<button
									type="button"
									onClick={handleSubmit}
									disabled={isSubmitting}
									className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:border-emerald-700 disabled:bg-emerald-700 sm:w-auto"
								>
									{isSubmitting ? 'Criando campeonato...' : 'Finalizar criação'}
								</button>
							)}
						</div>
					</div>
				</section>

				<aside className="space-y-6">
					<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-blue-950/30 backdrop-blur">
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-sm font-semibold text-slate-200">Resumo do campeonato</h2>
							<TrophyIcon className="h-5 w-5 text-blue-300" />
						</div>
						<dl className="space-y-4 text-sm">
							<div className="flex items-start justify-between gap-3">
								<dt className="text-slate-400">Nome</dt>
								<dd className="max-w-[60%] text-right text-slate-100">{basicInfoValues.name.trim() || 'Defina o nome do campeonato'}</dd>
							</div>
							<div className="flex items-start justify-between gap-3">
								<dt className="text-slate-400">Modalidade</dt>
								<dd className="max-w-[60%] text-right text-slate-100">{selectedGameInfo?.label ?? 'Selecione a modalidade'}</dd>
							</div>
							<div className="flex items-start justify-between gap-3">
								<dt className="text-slate-400">Participantes</dt>
								<dd className="text-right text-slate-100">{basicInfoValues.maxParticipants || '—'}</dd>
							</div>
							<div className="flex items-start justify-between gap-3">
								<dt className="text-slate-400">Formato</dt>
								<dd className="max-w-[60%] text-right text-slate-100">{selectedFormat?.label ?? 'Selecione o formato'}</dd>
							</div>
							<div className="flex items-start justify-between gap-3">
								<dt className="text-slate-400">Visibilidade</dt>
								<dd className="max-w-[60%] text-right text-slate-100">{selectedVisibility?.label ?? 'Defina a visibilidade'}</dd>
							</div>
							<div className="flex items-start justify-between gap-3">
								<dt className="text-slate-400">Início</dt>
								<dd className="text-right text-slate-100">{formatDatePreview(configValues.startDate)}</dd>
							</div>
							<div className="flex items-start justify-between gap-3">
								<dt className="text-slate-400">Inscrições</dt>
								<dd className="text-right text-slate-100">
									{configValues.registrationDeadline ? formatDatePreview(configValues.registrationDeadline) : 'Sem limite definido'}
								</dd>
							</div>
						</dl>
						<div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm">
							<h3 className="mb-2 flex items-center gap-2 font-medium text-slate-200">
								<CurrencyDollarIcon className="h-4 w-4 text-blue-300" />
								Finanças
							</h3>
							<ul className="space-y-2 text-sm text-slate-300">
								<li className="flex items-center justify-between">
									<span>Taxa de inscrição</span>
									<span>{prizeValues.hasEntryFee ? currencyFormatter.format(parsedEntryFee ?? 0) : 'Sem cobrança'}</span>
								</li>
								<li className="flex items-center justify-between">
									<span>Premiação</span>
									<span>{parsedPrizePool !== undefined ? currencyFormatter.format(parsedPrizePool) : 'A definir'}</span>
								</li>
							</ul>
						</div>
					</div>

					<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-lg shadow-blue-950/30 backdrop-blur">
						<h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
							<InformationCircleIcon className="h-4 w-4 text-blue-300" />
							Dicas rápidas
						</h3>
						<ul className="space-y-2">
							<li>• Use descrições claras sobre critérios de classificação.</li>
							<li>• Compartilhe o link do campeonato com antecedência.</li>
							<li>• Atualize os resultados em tempo real para engajar o público.</li>
						</ul>
					</div>
				</aside>
			</main>
		</div>
	);
}
