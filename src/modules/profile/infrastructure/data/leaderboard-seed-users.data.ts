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
    balanceWpgg: 4_670,
    gameName: 'HexTechHero',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 23,
  },
  {
    userId: 'seed:baron-slayer',
    balanceWpgg: 4_190,
    gameName: 'BaronSlayer',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 7,
  },
  {
    userId: 'seed:jungle-diff',
    balanceWpgg: 3_825,
    gameName: 'JungleDiff',
    tagLine: 'BR1',
    region: 'BR1',
    profileIconId: 402,
  },
  {
    userId: 'seed:rift-queen',
    balanceWpgg: 3_460,
    gameName: 'RiftQueen',
    tagLine: 'LAN',
    region: 'LAN',
    profileIconId: 29,
  },
  {
    userId: 'seed:cs-farmer',
    balanceWpgg: 3_155,
    gameName: 'CSFarmer',
    tagLine: 'LAS',
    region: 'LAS',
    profileIconId: 4560,
  },
  {
    userId: 'seed:dragon-soul',
    balanceWpgg: 2_865,
    gameName: 'DragonSoul',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 4883,
  },
  {
    userId: 'seed:top-gap',
    balanceWpgg: 2_605,
    gameName: 'TopGap',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 1151,
  },
  {
    userId: 'seed:mid-lane-king',
    balanceWpgg: 2_338,
    gameName: 'MidLaneKing',
    tagLine: 'KR',
    region: 'KR',
    profileIconId: 3181,
  },
  {
    userId: 'seed:adc-carry',
    balanceWpgg: 2_150,
    gameName: 'ADCCarry',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 907,
  },
  {
    userId: 'seed:support-diff',
    balanceWpgg: 1_920,
    gameName: 'SupportDiff',
    tagLine: 'BR1',
    region: 'BR1',
    profileIconId: 3505,
  },
  {
    userId: 'seed:ward-master',
    balanceWpgg: 1_725,
    gameName: 'WardMaster',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 5,
  },
  {
    userId: 'seed:flash-fail',
    balanceWpgg: 1_550,
    gameName: 'FlashFail',
    tagLine: 'LAN',
    region: 'LAN',
    profileIconId: 10,
  },
  {
    userId: 'seed:blue-buff',
    balanceWpgg: 1_380,
    gameName: 'BlueBuff',
    tagLine: 'LAS',
    region: 'LAS',
    profileIconId: 2074,
  },
  {
    userId: 'seed:red-side',
    balanceWpgg: 1_210,
    gameName: 'RedSide',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 3838,
  },
  {
    userId: 'seed:minion-hunter',
    balanceWpgg: 1_060,
    gameName: 'MinionHunter',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 18,
  },
  {
    userId: 'seed:tp-play',
    balanceWpgg: 918,
    gameName: 'TPPlay',
    tagLine: 'BR1',
    region: 'BR1',
    profileIconId: 4361,
  },
  {
    userId: 'seed:aram-only',
    balanceWpgg: 780,
    gameName: 'ARAMOnly',
    tagLine: 'NA1',
    region: 'NA1',
    profileIconId: 28,
  },
  {
    userId: 'seed:clash-captain',
    balanceWpgg: 650,
    gameName: 'ClashCaptain',
    tagLine: 'EUW',
    region: 'EUW',
    profileIconId: 3796,
  },
  {
    userId: 'seed:iron-climber',
    balanceWpgg: 500,
    gameName: 'IronClimber',
    tagLine: 'LAN',
    region: 'LAN',
    profileIconId: 3,
  },
  {
    userId: 'seed:rift-rookie',
    balanceWpgg: 360,
    gameName: 'RiftRookie',
    tagLine: 'LAS',
    region: 'LAS',
    profileIconId: 1,
  },
];
