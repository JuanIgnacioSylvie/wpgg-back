import { RefreshToken as PrismaRefreshToken } from '@prisma/client';
import { RefreshTokenEntity } from '../../../domain/entities/refresh-token.entity';
export declare class RefreshTokenMapper {
    static toDomain(row: PrismaRefreshToken): RefreshTokenEntity;
    static toPrisma(entity: RefreshTokenEntity): Omit<PrismaRefreshToken, 'user'>;
}
