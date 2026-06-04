import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  CreatePasswordResetTokenRow,
  IPasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository.interface';

@Injectable()
export class PrismaPasswordResetTokenRepository
  implements IPasswordResetTokenRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(row: CreatePasswordResetTokenRow): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: {
        codeHash: row.codeHash,
        userId: row.userId,
        expiresAt: row.expiresAt,
      },
    });
  }

  async invalidateActiveForUser(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  async consumeActiveByCodeHash(
    codeHash: string,
  ): Promise<{ userId: string } | null> {
    const rows = await this.prisma.$queryRaw<{ userId: string }[]>(
      Prisma.sql`
        UPDATE "PasswordResetToken"
        SET "usedAt" = NOW()
        WHERE "codeHash" = ${codeHash}
          AND "usedAt" IS NULL
          AND "expiresAt" > NOW()
        RETURNING "userId"
      `,
    );
    return rows[0] ?? null;
  }
}
