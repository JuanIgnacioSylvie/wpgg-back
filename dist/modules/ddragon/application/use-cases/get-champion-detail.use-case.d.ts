import { ChampionEntity } from '../../domain/entities/champion.entity';
import { IDdragonService } from '../../domain/services/ddragon.service.interface';
export declare class GetChampionDetailUseCase {
    private readonly ddragonService;
    constructor(ddragonService: IDdragonService);
    execute(championName: string): Promise<ChampionEntity>;
}
