import {
  EMPTY_LEADERBOARD_MISSION_STATS,
  LeaderboardEntry,
  LeaderboardMissionStats,
} from '../domain/leaderboard.types';
import {
  LEADERBOARD_SEED_USER_PREFIX,
  LEADERBOARD_SEED_USERS,
  LeaderboardSeedUser,
} from './data/leaderboard-seed-users.data';

export type { LeaderboardEntry } from '../domain/leaderboard.types';

export function isSeedLeaderboardUser(userId: string): boolean {
  return userId.startsWith(LEADERBOARD_SEED_USER_PREFIX);
}

export function findSeedLeaderboardUser(
  userId: string,
): LeaderboardSeedUser | undefined {
  return LEADERBOARD_SEED_USERS.find((user) => user.userId === userId);
}

function seedMissionStats(balanceWpgg: number, index: number): LeaderboardMissionStats {
  const completed = Math.min(52, Math.max(2, Math.floor(balanceWpgg / 95)));
  const hasActive = index < 18;
  if (!hasActive) {
    return { ...EMPTY_LEADERBOARD_MISSION_STATS, completedMissionsCount: completed };
  }
  const progress = Math.min(92, 28 + ((index * 11) % 55));
  return {
    completedMissionsCount: completed,
    activeMissionTitleEn: 'Win 3 games with strong vision score',
    activeMissionTitleEs: 'Ganá 3 partidas con buen score de visión',
    activeMissionProgressPercent: progress,
    activeMissionChampionId: [103, 64, 157, 222, 81][index % 5] ?? null,
  };
}

function toEntryFields(
  row: {
    userId: string;
    balanceWpgg: number;
    gameName: string;
    tagLine: string;
    region: string;
    profileIconId: number;
  },
  stats: LeaderboardMissionStats,
): Omit<LeaderboardEntry, 'rank'> {
  return {
    userId: row.userId,
    balanceWpgg: row.balanceWpgg,
    gameName: row.gameName,
    tagLine: row.tagLine,
    region: row.region,
    profileIconId: row.profileIconId,
    completedMissionsCount: stats.completedMissionsCount,
    activeMissionTitleEn: stats.activeMissionTitleEn,
    activeMissionTitleEs: stats.activeMissionTitleEs,
    activeMissionProgressPercent: stats.activeMissionProgressPercent,
    activeMissionChampionId: stats.activeMissionChampionId,
  };
}

export function mergeLeaderboardWithSeedUsers(
  realRows: Array<{
    id: string;
    balanceWpgg: number;
    gameName: string;
    tagLine: string;
    region: string;
    profileIconId: number;
    stats?: LeaderboardMissionStats;
  }>,
  limit: number,
): LeaderboardEntry[] {
  const combined = [
    ...realRows.map((row) => ({
      userId: row.id,
      balanceWpgg: row.balanceWpgg,
      gameName: row.gameName,
      tagLine: row.tagLine,
      region: row.region,
      profileIconId: row.profileIconId,
      stats: row.stats ?? EMPTY_LEADERBOARD_MISSION_STATS,
    })),
    ...LEADERBOARD_SEED_USERS.map((seed, index) => ({
      userId: seed.userId,
      balanceWpgg: seed.balanceWpgg,
      gameName: seed.gameName,
      tagLine: seed.tagLine,
      region: seed.region,
      profileIconId: seed.profileIconId,
      stats: seedMissionStats(seed.balanceWpgg, index),
    })),
  ];

  combined.sort((a, b) => b.balanceWpgg - a.balanceWpgg);

  return combined.slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    ...toEntryFields(entry, entry.stats),
  }));
}

export function resolveLeaderboardViewer(
  entries: LeaderboardEntry[],
  viewer: {
    userId: string;
    balanceWpgg: number;
    rank: number;
    inTop: boolean;
  },
  totalPublicPlayers: number,
): {
  rank: number;
  inTop: boolean;
  gapToAbove: number | null;
  gapToLeader: number | null;
} {
  const listed = entries.find((entry) => entry.userId === viewer.userId);
  const leaderBalance = entries[0]?.balanceWpgg ?? 0;

  if (listed) {
    const above = entries.find((entry) => entry.rank === listed.rank - 1);
    return {
      rank: listed.rank,
      inTop: true,
      gapToAbove:
        above != null
          ? Math.max(0, above.balanceWpgg - listed.balanceWpgg)
          : null,
      gapToLeader:
        listed.rank > 1
          ? Math.max(0, leaderBalance - listed.balanceWpgg)
          : null,
    };
  }

  const lastEntry = entries[entries.length - 1];
  const outsideTop =
    entries.length > 0 &&
    viewer.balanceWpgg < (lastEntry?.balanceWpgg ?? 0);

  return {
    rank: viewer.rank > 0 ? viewer.rank : totalPublicPlayers + 1,
    inTop: false,
    gapToAbove:
      outsideTop && lastEntry
        ? Math.max(0, lastEntry.balanceWpgg - viewer.balanceWpgg)
        : null,
    gapToLeader:
      leaderBalance > viewer.balanceWpgg
        ? Math.max(0, leaderBalance - viewer.balanceWpgg)
        : null,
  };
}
