import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { RedisLockService } from '@shared/infrastructure/redis/redis-lock.service';
import { MissionSyncProducer } from './mission-sync.producer';

const LOCK_KEY = 'lock:mission-sync-tick';
const LOCK_TTL_SEC = 240;

@Injectable()
export class MissionSyncScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MissionSyncScheduler.name);
  private interval?: ReturnType<typeof setInterval>;
  private readonly intervalMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly producer: MissionSyncProducer,
    private readonly lock: RedisLockService,
    config: ConfigService,
  ) {
    this.intervalMs = config.get<number>(
      'MISSION_SYNC_INTERVAL_MS',
      5 * 60 * 1000,
    );
  }

  onModuleInit() {
    this.interval = setInterval(() => void this.tick(), this.intervalMs);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async tick() {
    const acquired = await this.lock.tryAcquire(LOCK_KEY, LOCK_TTL_SEC);
    if (!acquired) {
      return;
    }

    const rows = await this.prisma.userMission.findMany({
      where: { status: 'ACTIVE' },
      select: { missionDay: { select: { userId: true } } },
    });
    const userIds = [...new Set(rows.map((r) => r.missionDay.userId))];

    for (const userId of userIds) {
      try {
        await this.producer.enqueueUserSync(userId);
      } catch (error) {
        this.logger.warn(`Failed to enqueue sync for ${userId}: ${error}`);
      }
    }

    if (userIds.length > 0) {
      this.logger.debug(`Enqueued mission sync for ${userIds.length} users`);
    }
  }
}
