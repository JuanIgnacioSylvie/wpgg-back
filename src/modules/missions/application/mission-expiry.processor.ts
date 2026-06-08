import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  MISSION_EXPIRY_JOB,
  MISSION_EXPIRY_QUEUE,
} from '@shared/infrastructure/queue/queue.constants';
import { todayMissionCalendarDate } from '../domain/mission-timezone.util';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

@Processor(MISSION_EXPIRY_QUEUE)
export class MissionExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(MissionExpiryProcessor.name);

  constructor(private readonly repo: PrismaMissionsRepository) {
    super();
  }

  async process(job: Job): Promise<{ expired: number }> {
    if (job.name !== MISSION_EXPIRY_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return { expired: 0 };
    }

    const today = todayMissionCalendarDate();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const result = await this.repo.expireActiveMissionsBeforeDate(yesterday);
    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} active missions`);
    }
    return { expired: result.count };
  }
}
