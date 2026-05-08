import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshTokenMapper } from './mappers/refresh-token.mapper';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const row = await this.prisma.refreshToken.create({
      data: RefreshTokenMapper.toPrisma(token),
    });
    return RefreshTokenMapper.toDomain(row);
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return row ? RefreshTokenMapper.toDomain(row) : null;
  }

  async revoke(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  async listByUserId(userId: string): Promise<RefreshTokenEntity[]> {
    const rows = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => RefreshTokenMapper.toDomain(r));
  }

  async enforceMaxActiveTokensForUser(
    userId: string,
    maxActive: number,
  ): Promise<void> {
    const now = new Date();
    for (;;) {
      const active = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          revoked: false,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'asc' },
      });
      if (active.length < maxActive) {
        break;
      }
      await this.prisma.refreshToken.update({
        where: { id: active[0].id },
        data: { revoked: true },
      });
    }
  }
}
