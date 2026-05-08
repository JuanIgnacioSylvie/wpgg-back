import { ChampionEntity } from '../entities/champion.entity';
export declare const DDRAGON_SERVICE: unique symbol;
export interface IDdragonService {
    getCurrentVersion(): Promise<string>;
    getChampions(version: string): Promise<ChampionEntity[]>;
    getChampionDetail(version: string, championName: string): Promise<ChampionEntity>;
}
