import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisLockService } from '@shared/infrastructure/redis/redis-lock.service';
import { shouldLogSchedulerTicks } from '@config/nest-logger';
import { MissionExpiryProducer } from './mission-expiry.producer';

const LOCK_KEY = 'lock:mission-expiry-tick';
const LOCK_TTL_SEC = 3000;

@Injectable()
export class MissionExpiryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MissionExpiryScheduler.name);
  private interval?: ReturnType<typeof setInterval>;
  private readonly intervalMs: number;

  constructor(
    private readonly producer: MissionExpiryProducer,
    private readonly lock: RedisLockService,
    config: ConfigService,
  ) {
    this.intervalMs = config.get<number>(
      'MISSION_EXPIRY_INTERVAL_MS',
      60 * 60 * 1000,
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

    try {
      await this.producer.enqueueExpiry();
      if (shouldLogSchedulerTicks()) {
        this.logger.log('Enqueued mission expiry job');
      }
    } catch (error) {
      this.logger.warn(`Failed to enqueue mission expiry: ${error}`);
    }
  }
}
