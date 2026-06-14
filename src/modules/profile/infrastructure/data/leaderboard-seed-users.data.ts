export type LeaderboardSeedUser = {
  userId: string;
  balanceWpgg: number;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId: number;
};

export const LEADERBOARD_SEED_USER_PREFIX = 'seed:';

/** Static leaderboard entries to populate the ranking before real user volume grows. */
export const LEADERBOARD_SEED_USERS: LeaderboardSeedUser[] = [
  {
    userId: 'seed:hextech-hero',
    balanceWpgg: 42_850,
    gameName: 'HexTechHero',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 23,
  },
  {
    userId: 'seed:baron-slayer',
    balanceWpgg: 38_420,
    gameName: 'BaronSlayer',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 7,
  },
  {
    userId: 'seed:jungle-diff',
    balanceWpgg: 35_100,
    gameName: 'JungleDiff',
    tagLine: 'BR1',
    region: 'BR1',
    profileIconId: 402,
  },
  {
    userId: 'seed:rift-queen',
    balanceWpgg: 31_760,
    gameName: 'RiftQueen',
    tagLine: 'LAN',
    region: 'LAN',
    profileIconId: 29,
  },
  {
    userId: 'seed:cs-farmer',
    balanceWpgg: 28_940,
    gameName: 'CSFarmer',
    tagLine: 'LAS',
    region: 'LAS',
    profileIconId: 4560,
  },
  {
    userId: 'seed:dragon-soul',
    balanceWpgg: 26_300,
    gameName: 'DragonSoul',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 4883,
  },
  {
    userId: 'seed:top-gap',
    balanceWpgg: 23_880,
    gameName: 'TopGap',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 1151,
  },
  {
    userId: 'seed:mid-lane-king',
    balanceWpgg: 21_450,
    gameName: 'MidLaneKing',
    tagLine: 'KR',
    region: 'KR',
    profileIconId: 3181,
  },
  {
    userId: 'seed:adc-carry',
    balanceWpgg: 19_720,
    gameName: 'ADCCarry',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 907,
  },
  {
    userId: 'seed:support-diff',
    balanceWpgg: 17_600,
    gameName: 'SupportDiff',
    tagLine: 'BR1',
    region: 'BR1',
    profileIconId: 3505,
  },
  {
    userId: 'seed:ward-master',
    balanceWpgg: 15_840,
    gameName: 'WardMaster',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 5,
  },
  {
    userId: 'seed:flash-fail',
    balanceWpgg: 14_200,
    gameName: 'FlashFail',
    tagLine: 'LAN',
    region: 'LAN',
    profileIconId: 10,
  },
  {
    userId: 'seed:blue-buff',
    balanceWpgg: 12_650,
    gameName: 'BlueBuff',
    tagLine: 'LAS',
    region: 'LAS',
    profileIconId: 2074,
  },
  {
    userId: 'seed:red-side',
    balanceWpgg: 11_080,
    gameName: 'RedSide',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 3838,
  },
  {
    userId: 'seed:minion-hunter',
    balanceWpgg: 9_740,
    gameName: 'MinionHunter',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 18,
  },
  {
    userId: 'seed:tp-play',
    balanceWpgg: 8_420,
    gameName: 'TPPlay',
    tagLine: 'BR1',
    region: 'BR1',
    profileIconId: 4361,
  },
  {
    userId: 'seed:aram-only',
    balanceWpgg: 7_150,
    gameName: 'ARAMOnly',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 28,
  },
  {
    userId: 'seed:clash-captain',
    balanceWpgg: 5_980,
    gameName: 'ClashCaptain',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 3796,
  },
  {
    userId: 'seed:iron-climber',
    balanceWpgg: 4_620,
    gameName: 'IronClimber',
    tagLine: 'LAN',
    region: 'LAN',
    profileIconId: 3,
  },
  {
    userId: 'seed:rift-rookie',
    balanceWpgg: 3_280,
    gameName: 'RiftRookie',
    tagLine: 'LAS',
    region: 'LAS',
    profileIconId: 1,
  },
];
