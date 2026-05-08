import { Cache } from 'cache-manager';
import { ChampionEntity } from '../../domain/entities/champion.entity';
import { IDdragonService } from '../../domain/services/ddragon.service.interface';
export declare class DdragonServiceAxios implements IDdragonService {
    private readonly cache;
    constructor(cache: Cache);
    getCurrentVersion(): Promise<string>;
    getChampions(version: string): Promise<ChampionEntity[]>;
    getChampionDetail(version: string, championName: string): Promise<ChampionEntity>;
}
