import { RefreshToken as PrismaRefreshToken } from '@prisma/client';
import { RefreshTokenEntity } from '../../../domain/entities/refresh-token.entity';

export class RefreshTokenMapper {
  static toDomain(row: PrismaRefreshToken): RefreshTokenEntity {
    return new RefreshTokenEntity(
      row.id,
      row.tokenHash,
      row.userId,
      row.expiresAt,
      row.createdAt,
      row.revoked,
    );
  }

  static toPrisma(
    entity: RefreshTokenEntity,
  ): Omit<PrismaRefreshToken, 'user'> {
    return {
      id: entity.id,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      revoked: entity.revoked,
    };
  }
}
