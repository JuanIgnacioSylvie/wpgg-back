import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { SyncUserMatchesUseCase } from './sync-user-matches.use-case';

@Injectable()
export class MissionSyncScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MissionSyncScheduler.name);
  private interval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SyncUserMatchesUseCase,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => void this.tick(), 5 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async tick() {
    const rows = await this.prisma.userMission.findMany({
      where: { status: 'ACTIVE' },
      select: { missionDay: { select: { userId: true } } },
    });
    const userIds = [...new Set(rows.map((r) => r.missionDay.userId))];
    for (const userId of userIds) {
      try {
        await this.sync.execute(userId);
      } catch (e) {
        this.logger.warn(`Sync failed for ${userId}: ${e}`);
      }
    }
  }
}
