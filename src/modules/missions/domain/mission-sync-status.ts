export const MissionSyncStatus = {
  NO_ACTIVE_MISSIONS: 'NO_ACTIVE_MISSIONS',
  UP_TO_DATE: 'UP_TO_DATE',
  UPDATES_AVAILABLE: 'UPDATES_AVAILABLE',
} as const;

export type MissionSyncStatusValue =
  (typeof MissionSyncStatus)[keyof typeof MissionSyncStatus];

export interface MissionSyncStatusDto {
  status: MissionSyncStatusValue;
  lastSyncedAt: string | null;
  latestMatchId: string | null;
  newestMatchId: string | null;
}
