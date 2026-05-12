export const RIOT_SERVICE = Symbol('IRiotService');

export interface RiotAccountDto {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerDto {
  puuid: string;
  summonerId: string;
  accountId: string;
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
}

export interface MatchParticipantDto {
  puuid: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealt: number;
}

export interface MatchDto {
  matchId: string;
  gameMode: string;
  gameDuration: number;
  gameCreation: number;
  participants: MatchParticipantDto[];
}

export interface RankedEntryDto {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
}

export interface IRiotService {
  getSummonerByRiotId(
    gameName: string,
    tagLine: string,
    region: string,
  ): Promise<RiotAccountDto>;
  getSummonerByPuuid(puuid: string, region: string): Promise<SummonerDto>;
  getMatchHistory(puuid: string, region: string, count: number): Promise<string[]>;
  getMatchDetail(matchId: string, region: string): Promise<MatchDto>;
  getRankedStats(summonerId: string, region: string): Promise<RankedEntryDto[]>;
}
