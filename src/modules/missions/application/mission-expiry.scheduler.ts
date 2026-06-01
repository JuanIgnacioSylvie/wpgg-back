import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

@Injectable()
export class MissionExpiryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MissionExpiryScheduler.name);
  private interval?: ReturnType<typeof setInterval>;

  constructor(private readonly repo: PrismaMissionsRepository) {}

  onModuleInit() {
    this.interval = setInterval(() => void this.tick(), 60 * 60 * 1000);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async tick() {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const result = await this.repo.expireActiveMissionsBeforeDate(yesterday);
    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} active missions`);
    }
  }
}
