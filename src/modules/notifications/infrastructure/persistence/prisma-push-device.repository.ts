import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaPushDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertDevice(userId: string, token: string, platform: string) {
    return this.prisma.pushDevice.upsert({
      where: { token },
      create: { userId, token, platform, enabled: true },
      update: { userId, platform, enabled: true },
    });
  }

  deleteByUserAndToken(userId: string, token: string) {
    return this.prisma.pushDevice.deleteMany({
      where: { userId, token },
    });
  }

  deleteByTokens(tokens: string[]) {
    return this.prisma.pushDevice.deleteMany({
      where: { token: { in: tokens } },
    });
  }

  findEnabledTokensForUser(userId: string): Promise<string[]> {
    return this.prisma.pushDevice
      .findMany({
        where: { userId, enabled: true },
        select: { token: true },
      })
      .then((rows) => rows.map((r) => r.token));
  }
}
