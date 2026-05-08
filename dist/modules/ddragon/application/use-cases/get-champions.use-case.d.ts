import { ChampionEntity } from '../../domain/entities/champion.entity';
import { IDdragonService } from '../../domain/services/ddragon.service.interface';
export declare class GetChampionsUseCase {
    private readonly ddragonService;
    constructor(ddragonService: IDdragonService);
    execute(): Promise<ChampionEntity[]>;
}
