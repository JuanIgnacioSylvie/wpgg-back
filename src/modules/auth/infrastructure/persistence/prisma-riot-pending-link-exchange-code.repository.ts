import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  ConsumedRiotPendingLink,
  CreateRiotPendingLinkExchangeCodeRow,
  IRiotPendingLinkExchangeCodeRepository,
} from '../../domain/repositories/riot-pending-link-exchange-code.repository.interface';

@Injectable()
export class PrismaRiotPendingLinkExchangeCodeRepository
  implements IRiotPendingLinkExchangeCodeRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(row: CreateRiotPendingLinkExchangeCodeRow): Promise<void> {
    await this.prisma.riotPendingLinkExchangeCode.create({
      data: {
        codeHash: row.codeHash,
        riotSub: row.riotSub,
        accessToken: row.accessToken,
        cpid: row.cpid,
        expiresAt: row.expiresAt,
      },
    });
  }

  async consumeActiveByCodeHash(
    codeHash: string,
  ): Promise<ConsumedRiotPendingLink | null> {
    const rows = await this.prisma.$queryRaw<
      { riotSub: string; accessToken: string; cpid: string | null }[]
    >(
      Prisma.sql`
        UPDATE "RiotPendingLinkExchangeCode"
        SET "usedAt" = NOW()
        WHERE "codeHash" = ${codeHash}
          AND "usedAt" IS NULL
          AND "expiresAt" > NOW()
        RETURNING "riotSub", "accessToken", "cpid"
      `,
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      riotSub: row.riotSub,
      accessToken: row.accessToken,
      cpid: row.cpid ?? undefined,
    };
  }
}
