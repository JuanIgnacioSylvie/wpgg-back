import { GetChampionDetailUseCase } from '../application/use-cases/get-champion-detail.use-case';
import { GetChampionsUseCase } from '../application/use-cases/get-champions.use-case';
import { GetCurrentVersionUseCase } from '../application/use-cases/get-current-version.use-case';
export declare class DdragonController {
    private readonly currentVersion;
    private readonly champions;
    private readonly championDetail;
    constructor(currentVersion: GetCurrentVersionUseCase, champions: GetChampionsUseCase, championDetail: GetChampionDetailUseCase);
    version(): Promise<{
        version: string;
    }>;
    listChampions(): Promise<{
        id: string;
        key: string;
        name: string;
        title: string;
        blurb: string;
        tags: string[];
        stats: import("../domain/entities/champion.entity").ChampionStats;
        imageUrl: string;
    }[]>;
    getChampion(name: string): Promise<{
        id: string;
        key: string;
        name: string;
        title: string;
        blurb: string;
        tags: string[];
        stats: import("../domain/entities/champion.entity").ChampionStats;
        imageUrl: string;
    }>;
}
