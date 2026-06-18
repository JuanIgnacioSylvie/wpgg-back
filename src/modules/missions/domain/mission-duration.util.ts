/** Active mission window length after accept. */
export const MISSION_ACTIVE_DURATION_MS = 24 * 60 * 60 * 1000;

/** Offer pool refresh interval (2 per difficulty). */
export const MISSION_OFFER_REFRESH_MS = MISSION_ACTIVE_DURATION_MS;

export function missionExpiresAt(acceptedAt: Date): Date {
  return new Date(acceptedAt.getTime() + MISSION_ACTIVE_DURATION_MS);
}

export function missionOffersRefreshAt(generatedAt: Date): Date {
  return new Date(generatedAt.getTime() + MISSION_OFFER_REFRESH_MS);
}

export function secondsUntil(date: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((date.getTime() - now.getTime()) / 1000));
}

export function soonestEndsInSeconds(
  missions: Array<{ endsAt?: string }>,
): number {
  let minMs = Number.POSITIVE_INFINITY;
  for (const mission of missions) {
    if (!mission.endsAt) {
      continue;
    }
    const ms = new Date(mission.endsAt).getTime() - Date.now();
    if (ms > 0) {
      minMs = Math.min(minMs, ms);
    }
  }
  return minMs === Number.POSITIVE_INFINITY
    ? 0
    : Math.floor(minMs / 1000);
}
