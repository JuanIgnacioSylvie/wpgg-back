/** Global mission day boundary for all users (IANA timezone). */
export const WPGG_MISSION_TIMEZONE = 'UTC';

/** YYYY-MM-DD for the mission calendar in {@link WPGG_MISSION_TIMEZONE}. */
export function missionCalendarDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WPGG_MISSION_TIMEZONE,
  }).format(date);
}

/** Stored mission day as noon UTC on that calendar date. */
export function calendarDateToMissionDay(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00.000Z`);
}

export function todayMissionCalendarDate(): Date {
  return calendarDateToMissionDay(missionCalendarDateString());
}

/** Calendar key for a mission day row (UTC). */
export function missionDayKey(calendarDate: Date): string {
  return calendarDate.toISOString().slice(0, 10);
}

export function matchEndedAtMs(match: {
  gameEndTimestamp?: number;
  gameCreation: number;
  gameDuration: number;
}): number {
  return (
    match.gameEndTimestamp ??
    match.gameCreation + match.gameDuration * 1000
  );
}

/** True when the match ended on the mission day's UTC calendar date. */
export function isMatchOnMissionDay(
  match: {
    gameEndTimestamp?: number;
    gameCreation: number;
    gameDuration: number;
  },
  missionCalendarDate: Date,
): boolean {
  const matchDay = missionCalendarDateString(new Date(matchEndedAtMs(match)));
  return matchDay === missionDayKey(missionCalendarDate);
}

/** True when the match ended inside the mission's rolling accept window. */
export function isMatchInMissionWindow(
  match: {
    gameEndTimestamp?: number;
    gameCreation: number;
    gameDuration: number;
  },
  acceptedAt: Date | null,
  expiresAt: Date | null,
  missionCalendarDate?: Date,
): boolean {
  const endedAt = matchEndedAtMs(match);
  if (acceptedAt && expiresAt) {
    return (
      endedAt >= acceptedAt.getTime() && endedAt < expiresAt.getTime()
    );
  }
  if (missionCalendarDate) {
    return isMatchOnMissionDay(match, missionCalendarDate);
  }
  return false;
}

/** Milliseconds until 00:00 UTC on the next mission calendar day. */
export function msUntilEndOfMissionDay(now: Date = new Date()): number {
  const today = missionCalendarDateString(now);
  const [year, month, day] = today.split('-').map((n) => Number.parseInt(n, 10));
  const endUtc = Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0);
  return Math.max(0, endUtc - now.getTime());
}
