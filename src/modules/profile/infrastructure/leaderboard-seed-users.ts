import {
  LEADERBOARD_SEED_USER_PREFIX,
  LEADERBOARD_SEED_USERS,
  LeaderboardSeedUser,
} from './data/leaderboard-seed-users.data';

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  balanceWpgg: number;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId: number;
};

export function isSeedLeaderboardUser(userId: string): boolean {
  return userId.startsWith(LEADERBOARD_SEED_USER_PREFIX);
}

export function findSeedLeaderboardUser(
  userId: string,
): LeaderboardSeedUser | undefined {
  return LEADERBOARD_SEED_USERS.find((user) => user.userId === userId);
}

export function mergeLeaderboardWithSeedUsers(
  realRows: Array<{
    id: string;
    balanceWpgg: number;
    gameName: string;
    tagLine: string;
    region: string;
    profileIconId: number;
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
    })),
    ...LEADERBOARD_SEED_USERS.map((seed) => ({
      userId: seed.userId,
      balanceWpgg: seed.balanceWpgg,
      gameName: seed.gameName,
      tagLine: seed.tagLine,
      region: seed.region,
      profileIconId: seed.profileIconId,
    })),
  ];

  combined.sort((a, b) => b.balanceWpgg - a.balanceWpgg);

  return combined.slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}
