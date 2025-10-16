import type { GeneratedMatch } from './matchGenerators';

export interface ScheduleConfig {
  startDate: Date;
  defaultTime: string;
  intervalDays: number;
  defaultVenue?: string;
  matchesPerDay?: number;
}

export interface ScheduledMatch extends GeneratedMatch {
  date: string;
  location?: string;
}

/**
 * Agenda datas e horários para as partidas geradas
 */
export function scheduleMatches(
  matches: GeneratedMatch[],
  config: ScheduleConfig
): ScheduledMatch[] {
  const { startDate, defaultTime, intervalDays, defaultVenue = '', matchesPerDay = 2 } = config;

  let currentDate = new Date(startDate);
  const [hours, minutes] = defaultTime.split(':').map(Number);

  const scheduled = matches.map((match, index) => {
    // Calcula qual jogo do dia é este
    const matchesThisDay = index % matchesPerDay;

    // Se não é o primeiro jogo do dia e passou pelo último, avança data
    if (matchesThisDay === 0 && index > 0) {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    // Define horário com offset para jogos no mesmo dia
    const matchTime = new Date(currentDate);
    matchTime.setHours(hours + matchesThisDay * 2); // 2h entre jogos
    matchTime.setMinutes(minutes);
    matchTime.setSeconds(0);
    matchTime.setMilliseconds(0);

    return {
      ...match,
      date: matchTime.toISOString(),
      location: defaultVenue || undefined,
    };
  });

  return scheduled;
}

/**
 * Calcula estatísticas sobre o calendário gerado
 */
export function calculateScheduleStats(matches: ScheduledMatch[]) {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      firstDate: null,
      lastDate: null,
      estimatedWeeks: 0,
    };
  }

  const dates = matches
    .map((m) => new Date(m.date))
    .sort((a, b) => a.getTime() - b.getTime());

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const durationMs = lastDate.getTime() - firstDate.getTime();
  const estimatedWeeks = Math.ceil(durationMs / (7 * 24 * 60 * 60 * 1000));

  return {
    totalMatches: matches.length,
    firstDate,
    lastDate,
    estimatedWeeks,
  };
}
