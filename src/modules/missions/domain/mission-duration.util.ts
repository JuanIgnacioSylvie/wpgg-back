/** Active mission window length after accept. */
export const MISSION_ACTIVE_DURATION_MS = 24 * 60 * 60 * 1000;

export function missionExpiresAt(acceptedAt: Date): Date {
  return new Date(acceptedAt.getTime() + MISSION_ACTIVE_DURATION_MS);
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
