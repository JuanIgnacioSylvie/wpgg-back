import { RiotAccount as PrismaRiotAccount } from '@prisma/client';
import { RiotAccountEntity } from '../../../domain/entities/riot-account.entity';
export declare class RiotAccountMapper {
    static toDomain(row: PrismaRiotAccount): RiotAccountEntity;
    static toPrisma(entity: RiotAccountEntity): Omit<PrismaRiotAccount, 'user'>;
}
