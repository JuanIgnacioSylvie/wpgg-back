import { SummonerEntity } from '../../domain/entities/summoner.entity';
import { IRiotAccountRepository } from '../../domain/repositories/riot-account.repository.interface';
import { IRiotService } from '../../domain/services/riot.service.interface';
export declare class GetSummonerProfileUseCase {
    private readonly riotAccountRepository;
    private readonly riotService;
    constructor(riotAccountRepository: IRiotAccountRepository, riotService: IRiotService);
    execute(userId: string): Promise<SummonerEntity>;
}
