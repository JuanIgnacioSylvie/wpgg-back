import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  ConsumedEmailVerificationToken,
  CreateEmailVerificationTokenRow,
  IEmailVerificationTokenRepository,
} from '../../domain/repositories/email-verification-token.repository.interface';

@Injectable()
export class PrismaEmailVerificationTokenRepository
  implements IEmailVerificationTokenRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(row: CreateEmailVerificationTokenRow): Promise<void> {
    await this.prisma.emailVerificationToken.create({
      data: {
        codeHash: row.codeHash,
        userId: row.userId,
        riotLinkPendingCode: row.riotLinkPendingCode,
        expiresAt: row.expiresAt,
      },
    });
  }

  async invalidateActiveForUser(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  async consumeActiveByCodeHash(
    codeHash: string,
  ): Promise<ConsumedEmailVerificationToken | null> {
    const rows = await this.prisma.$queryRaw<
      { userId: string; riotLinkPendingCode: string | null }[]
    >(
      Prisma.sql`
        UPDATE "EmailVerificationToken"
        SET "usedAt" = NOW()
        WHERE "codeHash" = ${codeHash}
          AND "usedAt" IS NULL
          AND "expiresAt" > NOW()
        RETURNING "userId", "riotLinkPendingCode"
      `,
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      userId: row.userId,
      riotLinkPendingCode: row.riotLinkPendingCode ?? undefined,
    };
  }
}
