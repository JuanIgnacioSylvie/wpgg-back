import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { RiotAccountEntity } from '../../domain/entities/riot-account.entity';
import { IRiotAccountRepository } from '../../domain/repositories/riot-account.repository.interface';
export declare class PrismaRiotAccountRepository implements IRiotAccountRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByUserId(userId: string): Promise<RiotAccountEntity | null>;
    findByPuuid(puuid: string): Promise<RiotAccountEntity | null>;
    save(account: RiotAccountEntity): Promise<RiotAccountEntity>;
}
