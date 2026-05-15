export interface MatchParticipant {
  puuid: string;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealt: number;
}

/** One row per match for the linked account; shape matches Flutter `MatchModel.fromJson`. */
export interface MatchSummaryForViewer {
  matchId: string;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  gameDuration: number;
  durationSeconds: number;
  gameEndTimestamp: number;
  gameMode: string;
  gameCreation: number;
}
