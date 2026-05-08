import { RankedEntryEntity } from '../../domain/entities/ranked-entry.entity';
import { IRiotAccountRepository } from '../../domain/repositories/riot-account.repository.interface';
import { IRiotService } from '../../domain/services/riot.service.interface';
export declare class GetRankedStatsUseCase {
    private readonly riotAccountRepository;
    private readonly riotService;
    constructor(riotAccountRepository: IRiotAccountRepository, riotService: IRiotService);
    execute(userId: string): Promise<RankedEntryEntity[]>;
}
