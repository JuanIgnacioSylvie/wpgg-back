export type LeaderboardEntry = {
  rank: number;
  userId: string;
  balanceWpgg: number;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId: number;
};

export type LeaderboardViewerPayload = {
  rank: number;
  inTop: boolean;
  balanceWpgg: number;
  gapToAbove: number | null;
  gapToLeader: number | null;
  totalPlayers: number;
};

export type LeaderboardResponsePayload = {
  entries: LeaderboardEntry[];
  viewer: LeaderboardViewerPayload;
  latestPriceUsd: number;
};
