import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IRiotService,
  MatchDto,
  RankedEntryDto,
  RiotAccountDto,
  SummonerDto,
} from '../../domain/services/riot.service.interface';

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
    if (res.status === 404) {
      throw new NotFoundException('Riot account not found');
    }
    if (res.status === 429) {
      throw new HttpException(
        'Rate limit exceeded, try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (res.status >= 500 || res.status === 0) {
      throw new HttpException(
        'Riot API unavailable, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (res.status !== 200) {
      throw new HttpException(
        'Riot API unavailable, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const d = res.data as {
      puuid: string;
      gameName: string;
      tagLine: string;
    };
    return { puuid: d.puuid, gameName: d.gameName, tagLine: d.tagLine };
  }

  async getSummonerByPuuid(
    puuid: string,
    region: string,
  ): Promise<SummonerDto> {
    const host = platformHost(region);
    const url = `https://${host}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const res = await this.safeGet(url);
    if (res.status === 404) {
      throw new NotFoundException();
    }
    if (res.status >= 500 || res.status === 0) {
      throw new HttpException(
        'Riot API unavailable, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (res.status !== 200) {
      throw new HttpException(
        'Riot API unavailable, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const d = res.data as {
      puuid: string;
      id: string;
      accountId: string;
      profileIconId: number;
      summonerLevel: number;
      revisionDate: number;
    };
    return {
      puuid: d.puuid,
      summonerId: d.id,
      accountId: d.accountId,
      profileIconId: d.profileIconId,
      summonerLevel: d.summonerLevel,
      revisionDate: d.revisionDate,
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
    if (res.status >= 400) {
      throw new HttpException(
        res.data?.status?.message ?? 'Riot API error',
        res.status,
      );
    }
    return res.data as string[];
  }

  async getMatchDetail(matchId: string, region: string): Promise<MatchDto> {
    const cluster = routingCluster(region);
    const url = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const res = await this.safeGet(url);
    if (res.status === 404) {
      throw new NotFoundException();
    }
    if (res.status >= 400) {
      throw new HttpException(
        res.data?.status?.message ?? 'Riot API error',
        res.status,
      );
    }
    const body = res.data as {
      metadata?: { matchId?: string };
      info?: {
        gameMode: string;
        gameDuration: number;
        gameCreation: number;
        participants: Array<{
          puuid: string;
          championName: string;
          kills: number;
          deaths: number;
          assists: number;
          win: boolean;
          totalDamageDealtToChampions?: number;
          totalDamageDealt?: number;
        }>;
      };
    };
    const info = body.info!;
    return {
      matchId: body.metadata?.matchId ?? matchId,
      gameMode: info.gameMode,
      gameDuration: info.gameDuration,
      gameCreation: info.gameCreation,
      participants: info.participants.map((p) => ({
        puuid: p.puuid,
        championName: p.championName,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        win: p.win,
        totalDamageDealt:
          p.totalDamageDealtToChampions ?? p.totalDamageDealt ?? 0,
      })),
    };
  }

  async getRankedStats(
    summonerId: string,
    region: string,
  ): Promise<RankedEntryDto[]> {
    const host = platformHost(region);
    const url = `https://${host}/lol/league/v4/entries/by-summoner/${summonerId}`;
    const res = await this.safeGet(url);
    if (res.status >= 500 || res.status === 0) {
      throw new HttpException(
        'Riot API unavailable, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (res.status === 404) {
      return [];
    }
    if (res.status !== 200) {
      throw new HttpException(
        'Riot API unavailable, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
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
