import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
export declare class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
    findByHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
    revoke(tokenId: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
    listByUserId(userId: string): Promise<RefreshTokenEntity[]>;
    enforceMaxActiveTokensForUser(userId: string, maxActive: number): Promise<void>;
}
