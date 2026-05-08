import { MatchEntity } from '../../domain/entities/match.entity';
import { IRiotAccountRepository } from '../../domain/repositories/riot-account.repository.interface';
import { IRiotService } from '../../domain/services/riot.service.interface';
export declare class GetMatchHistoryUseCase {
    private readonly riotAccountRepository;
    private readonly riotService;
    constructor(riotAccountRepository: IRiotAccountRepository, riotService: IRiotService);
    execute(userId: string): Promise<MatchEntity[]>;
    executeMatchDetail(userId: string, matchId: string): Promise<MatchEntity>;
}
