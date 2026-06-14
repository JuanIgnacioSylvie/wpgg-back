export type LeaderboardMissionStats = {
  completedMissionsCount: number;
  activeMissionTitleEn: string | null;
  activeMissionTitleEs: string | null;
  activeMissionProgressPercent: number | null;
  activeMissionChampionId: number | null;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  balanceWpgg: number;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId: number;
  completedMissionsCount: number;
  activeMissionTitleEn: string | null;
  activeMissionTitleEs: string | null;
  activeMissionProgressPercent: number | null;
  activeMissionChampionId: number | null;
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

export const EMPTY_LEADERBOARD_MISSION_STATS: LeaderboardMissionStats = {
  completedMissionsCount: 0,
  activeMissionTitleEn: null,
  activeMissionTitleEs: null,
  activeMissionProgressPercent: null,
  activeMissionChampionId: null,
};
