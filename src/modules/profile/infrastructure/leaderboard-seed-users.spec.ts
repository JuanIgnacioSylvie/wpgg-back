import { mergeLeaderboardWithSeedUsers } from './leaderboard-seed-users';

describe('mergeLeaderboardWithSeedUsers', () => {
  it('merges real users with seed users and sorts by balance', () => {
    const result = mergeLeaderboardWithSeedUsers(
      [
        {
          id: 'real-1',
          balanceWpgg: 50_000,
          gameName: 'RealWhale',
          tagLine: 'NA1',
          region: 'NA1',
          profileIconId: 1,
        },
        {
          id: 'real-2',
          balanceWpgg: 500,
          gameName: 'NewPlayer',
          tagLine: 'EUW',
          region: 'EUW',
          profileIconId: 2,
        },
      ],
      5,
    );

    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({
      rank: 1,
      userId: 'real-1',
      balanceWpgg: 50_000,
    });
    expect(result[0].gameName).toBe('RealWhale');
    expect(result.some((entry) => entry.userId.startsWith('seed:'))).toBe(true);
    expect(result.every((entry, index) => entry.rank === index + 1)).toBe(true);
  });

  it('respects the limit after merging', () => {
    const result = mergeLeaderboardWithSeedUsers([], 3);
    expect(result).toHaveLength(3);
    expect(result[0].balanceWpgg).toBeGreaterThan(result[1].balanceWpgg);
    expect(result[1].balanceWpgg).toBeGreaterThan(result[2].balanceWpgg);
  });
});
