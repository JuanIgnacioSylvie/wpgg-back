import { ConfigService } from '@nestjs/config';
import { IRiotService, MatchDto, RankedEntryDto, RiotAccountDto, SummonerDto } from '../../domain/services/riot.service.interface';
export declare class RiotServiceAxios implements IRiotService {
    private readonly http;
    constructor(configService: ConfigService);
    private safeGet;
    getAccountByRiotId(gameName: string, tagLine: string, region: string): Promise<RiotAccountDto>;
    getSummonerByPuuid(puuid: string, region: string): Promise<SummonerDto>;
    getMatchHistory(puuid: string, region: string, count: number): Promise<string[]>;
    getMatchDetail(matchId: string, region: string): Promise<MatchDto>;
    getRankedStats(summonerId: string, region: string): Promise<RankedEntryDto[]>;
}
