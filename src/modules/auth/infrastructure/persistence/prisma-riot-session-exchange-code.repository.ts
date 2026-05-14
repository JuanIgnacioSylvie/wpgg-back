import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  CreateRiotSessionExchangeCodeRow,
  IRiotSessionExchangeCodeRepository,
} from '../../domain/repositories/riot-session-exchange-code.repository.interface';

@Injectable()
export class PrismaRiotSessionExchangeCodeRepository
  implements IRiotSessionExchangeCodeRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(row: CreateRiotSessionExchangeCodeRow): Promise<void> {
    await this.prisma.riotSessionExchangeCode.create({
      data: {
        codeHash: row.codeHash,
        userId: row.userId,
        expiresAt: row.expiresAt,
      },
    });
  }

  async consumeActiveByCodeHash(
    codeHash: string,
  ): Promise<{ userId: string } | null> {
    const rows = await this.prisma.$queryRaw<{ userId: string }[]>(
      Prisma.sql`
        UPDATE "RiotSessionExchangeCode"
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
