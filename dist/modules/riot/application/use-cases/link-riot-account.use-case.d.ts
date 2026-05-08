import { RiotAccountEntity } from '../../domain/entities/riot-account.entity';
import { IRiotAccountRepository } from '../../domain/repositories/riot-account.repository.interface';
import { IRiotService } from '../../domain/services/riot.service.interface';
export type LinkRiotAccountInput = {
    userId: string;
    gameName: string;
    tagLine: string;
    region: string;
};
export declare class LinkRiotAccountUseCase {
    private readonly riotAccountRepository;
    private readonly riotService;
    constructor(riotAccountRepository: IRiotAccountRepository, riotService: IRiotService);
    execute(input: LinkRiotAccountInput): Promise<RiotAccountEntity>;
}
