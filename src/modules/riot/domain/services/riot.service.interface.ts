export const RIOT_SERVICE = Symbol('IRiotService');

export interface RiotAccountDto {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerDto {
  puuid: string;
  /** Legacy encrypted summoner id; empty when Riot omits it from Summoner v4. */
  summonerId: string;
  /** Legacy account id; empty when Riot omits it from Summoner v4. */
  accountId: string;
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
}

export interface MatchParticipantDto {
  puuid: string;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealt: number;
  teamPosition: string;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  wardsKilled: number;
  killParticipation: number;
  totalDamageDealtToChampions: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalDamageTaken: number;
  pentaKills: number;
}

export interface MatchDto {
  matchId: string;
  gameMode: string;
  queueId: number;
  gameDuration: number;
  gameCreation: number;
  /** Milliseconds since epoch; may be omitted by Riot for some queues. */
  gameEndTimestamp?: number;
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
  /** @param puuid Encrypted PUUID (same as account-v1 / match-v5). */
  getRankedStats(puuid: string, region: string): Promise<RankedEntryDto[]>;
}

/** Summoner's Rift ranked / draft queues eligible for daily missions. */
export const MISSION_ELIGIBLE_QUEUE_IDS = new Set([400, 420, 440]);

export function isMissionEligibleMatch(m: MatchDto): boolean {
  return (
    m.gameMode === 'CLASSIC' && MISSION_ELIGIBLE_QUEUE_IDS.has(m.queueId)
  );
}
