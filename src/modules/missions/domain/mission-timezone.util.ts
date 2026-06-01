const REGION_DEFAULT_TZ: Record<string, string> = {
  LA1: 'America/Santiago',
  LA2: 'America/Argentina/Buenos_Aires',
  BR1: 'America/Sao_Paulo',
  NA1: 'America/New_York',
  EUW1: 'Europe/London',
  EUN1: 'Europe/Warsaw',
  TR1: 'Europe/Istanbul',
  KR: 'Asia/Seoul',
  JP1: 'Asia/Tokyo',
};

export function defaultTimezoneForRegion(region: string): string {
  return REGION_DEFAULT_TZ[region.toUpperCase()] ?? 'UTC';
}

export function calendarDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
}

export function endOfCalendarDayUtc(calendarDate: string, timezone: string): Date {
  const probe = new Date(`${calendarDate}T23:59:59`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
    timeZoneName: 'shortOffset',
  }).formatToParts(probe);
  return probe;
}

export function msUntilEndOfDay(now: Date, timezone: string): number {
  const today = calendarDateInTimezone(now, timezone);
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = calendarDateInTimezone(tomorrow, timezone);
  if (tomorrowStr === today) {
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return Math.max(0, next.getTime() - now.getTime());
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const target = new Date(`${tomorrowStr}T00:00:00`);
  return Math.max(0, target.getTime() - now.getTime());
}
