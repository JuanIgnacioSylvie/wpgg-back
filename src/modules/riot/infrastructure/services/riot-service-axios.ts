import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  IRiotService,
  MatchDto,
  RankedEntryDto,
  RiotAccountDto,
  SummonerDto,
} from '../../domain/services/riot.service.interface';

type RiotErrorBody = { status?: { message?: string } };

function getRiotApiErrorMessage(data: unknown, maxLen = 400): string | undefined {
  if (data == null) {
    return undefined;
  }
  if (typeof data === 'string') {
    const t = data.trim();
    if (!t || t.startsWith('<')) {
      return undefined;
    }
    return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
  }
  if (typeof data === 'object') {
    const msg = (data as RiotErrorBody).status?.message;
    if (typeof msg === 'string' && msg.trim()) {
      const t = msg.trim();
      return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
    }
  }
  return undefined;
}

/** Maps a non-2xx Riot HTTP response to a Nest HTTP exception with Riot's message when present. */
function throwFromRiotResponse(
  res: Pick<AxiosResponse, 'status' | 'data'>,
  options: { notFoundFallback?: string } = {},
): never {
  const riotMsg = getRiotApiErrorMessage(res.data);
  const fallback = `Riot API error (HTTP ${res.status})`;
  const message = riotMsg ?? fallback;

  if (res.status === 404) {
    throw new NotFoundException(
      riotMsg ?? options.notFoundFallback ?? fallback,
    );
  }
  if (res.status === 429) {
    throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }
  if (res.status >= 500 || res.status === 0) {
    throw new HttpException(message, HttpStatus.BAD_GATEWAY);
  }
  throw new HttpException(message, HttpStatus.BAD_GATEWAY);
}

const AMERICAS = new Set(['NA1', 'BR1', 'LA1', 'LA2', 'OC1']);
const EUROPE = new Set(['EUW1', 'EUN1', 'TR1', 'RU']);
const ASIA = new Set(['KR', 'JP1']);
const SEA = new Set(['PH2', 'SG2', 'TH2', 'TW2', 'VN2']);

function routingCluster(region: string): string {
  const r = region.toUpperCase();
  if (AMERICAS.has(r)) {
    return 'americas';
  }
  if (EUROPE.has(r)) {
    return 'europe';
  }
  if (ASIA.has(r)) {
    return 'asia';
  }
  if (SEA.has(r)) {
    return 'sea';
  }
  return 'europe';
}

function platformHost(region: string): string {
  return `${region.toLowerCase()}.api.riotgames.com`;
}

/** Match-v5 `gameDuration` is seconds; older payloads may still use ms. */
function normalizeGameDuration(raw: number): number {
  if (raw > 10_000) {
    return Math.round(raw / 1000);
  }
  return raw;
}

@Injectable()
export class RiotServiceAxios implements IRiotService {
  private readonly http: AxiosInstance;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('RIOT_API_KEY')!;
    this.http = axios.create({
      timeout: 5000,
      headers: { 'X-Riot-Token': apiKey },
      validateStatus: () => true,
    });
  }

  private async safeGet(url: string) {
    try {
      return await this.http.get(url);
    } catch {
      throw new HttpException(
        'Riot API unavailable, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getSummonerByRiotId(
    gameName: string,
    tagLine: string,
    region: string,
  ): Promise<RiotAccountDto> {
    const cluster = routingCluster(region);
    const url = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const res = await this.safeGet(url);
    if (res.status !== 200) {
      throwFromRiotResponse(res, {
        notFoundFallback: 'Riot account not found',
      });
    }
    const d = res.data as {
      puuid: string;
      gameName: string;
      tagLine: string;
    };
    if (d.puuid == null || d.gameName == null || d.tagLine == null) {
      throw new HttpException(
        'Invalid account response from Riot API',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return { puuid: d.puuid, gameName: d.gameName, tagLine: d.tagLine };
  }

  async getSummonerByPuuid(
    puuid: string,
    region: string,
  ): Promise<SummonerDto> {
    const host = platformHost(region);
    const url = `https://${host}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const res = await this.safeGet(url);
    if (res.status !== 200) {
      throwFromRiotResponse(res, {
        notFoundFallback: 'Summoner not found',
      });
    }
    const d = res.data as {
      puuid?: string;
      id?: string;
      accountId?: string;
      profileIconId?: number;
      summonerLevel?: number;
      revisionDate?: number;
    };
    if (d.puuid == null) {
      throw new HttpException(
        'Invalid summoner response from Riot API',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return {
      puuid: d.puuid,
      summonerId: d.id != null ? String(d.id) : '',
      accountId: d.accountId != null ? String(d.accountId) : '',
      profileIconId: d.profileIconId ?? 0,
      summonerLevel: d.summonerLevel ?? 0,
      revisionDate: d.revisionDate ?? 0,
    };
  }

  async getMatchHistory(
    puuid: string,
    region: string,
    count: number,
  ): Promise<string[]> {
    const cluster = routingCluster(region);
    const url = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
    const res = await this.safeGet(url);
    if (res.status !== 200) {
      throwFromRiotResponse(res, {
        notFoundFallback: 'Match history not found',
      });
    }
    return res.data as string[];
  }

  async getMatchDetail(matchId: string, region: string): Promise<MatchDto> {
    const cluster = routingCluster(region);
    const url = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const res = await this.safeGet(url);
    if (res.status !== 200) {
      throwFromRiotResponse(res, { notFoundFallback: 'Match not found' });
    }
    const body = res.data as {
      metadata?: { matchId?: string };
      info?: {
        gameMode: string;
        queueId: number;
        gameDuration: number;
        gameCreation: number;
        gameEndTimestamp?: number;
        participants: Array<{
          puuid: string;
          championId: number;
          championName: string;
          kills: number;
          deaths: number;
          assists: number;
          win: boolean;
          teamPosition?: string;
          totalMinionsKilled?: number;
          neutralMinionsKilled?: number;
          visionScore?: number;
          wardsKilled?: number;
          totalDamageDealtToChampions?: number;
          totalDamageDealt?: number;
          totalHeal?: number;
          totalHealsOnTeammates?: number;
          totalDamageTaken?: number;
          pentaKills?: number;
          challenges?: { killParticipation?: number };
        }>;
      };
    };
    const info = body.info!;
    const gameDuration = normalizeGameDuration(info.gameDuration);
    const gameEndTimestamp =
      info.gameEndTimestamp ?? info.gameCreation + gameDuration * 1000;
    return {
      matchId: body.metadata?.matchId ?? matchId,
      gameMode: info.gameMode,
      queueId: info.queueId ?? 0,
      gameDuration,
      gameCreation: info.gameCreation,
      gameEndTimestamp,
      participants: info.participants.map((p) => ({
        puuid: p.puuid,
        championId: p.championId ?? 0,
        championName: p.championName,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        win: p.win,
        teamPosition: p.teamPosition ?? 'NONE',
        totalMinionsKilled: p.totalMinionsKilled ?? 0,
        neutralMinionsKilled: p.neutralMinionsKilled ?? 0,
        visionScore: p.visionScore ?? 0,
        wardsKilled: p.wardsKilled ?? 0,
        killParticipation: p.challenges?.killParticipation ?? 0,
        totalDamageDealtToChampions:
          p.totalDamageDealtToChampions ?? p.totalDamageDealt ?? 0,
        totalDamageDealt:
          p.totalDamageDealtToChampions ?? p.totalDamageDealt ?? 0,
        totalHeal: p.totalHeal ?? 0,
        totalHealsOnTeammates: p.totalHealsOnTeammates ?? 0,
        totalDamageTaken: p.totalDamageTaken ?? 0,
        pentaKills: p.pentaKills ?? 0,
      })),
    };
  }

  async getRankedStats(puuid: string, region: string): Promise<RankedEntryDto[]> {
    const host = platformHost(region);
    const url = `https://${host}/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
    const res = await this.safeGet(url);
    if (res.status === 404) {
      return [];
    }
    if (res.status !== 200) {
      throwFromRiotResponse(res);
    }
    const rows = res.data as Array<{
      queueType: string;
      tier: string;
      rank: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      hotStreak: boolean;
    }>;
    return rows.map((r) => ({
      queueType: r.queueType,
      tier: r.tier,
      rank: r.rank,
      leaguePoints: r.leaguePoints,
      wins: r.wins,
      losses: r.losses,
      hotStreak: r.hotStreak,
    }));
  }
}
