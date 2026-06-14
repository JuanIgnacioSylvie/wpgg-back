import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  MISSION_SYNC_JOB,
  MISSION_SYNC_QUEUE,
} from '@shared/infrastructure/queue/queue.constants';
import { shouldLogSchedulerTicks } from '@config/nest-logger';
import { SyncUserMatchesUseCase } from './sync-user-matches.use-case';

type MissionSyncJobData = { userId: string };

const missionSyncConcurrency = Number(
  process.env['MISSION_SYNC_QUEUE_CONCURRENCY'] ?? 3,
);

@Processor(MISSION_SYNC_QUEUE, {
  concurrency: missionSyncConcurrency,
})
export class MissionSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(MissionSyncProcessor.name);

  constructor(private readonly sync: SyncUserMatchesUseCase) {
    super();
  }

  async process(job: Job<MissionSyncJobData>): Promise<{ processed: number }> {
    if (job.name !== MISSION_SYNC_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return { processed: 0 };
    }

    const { userId } = job.data;
    try {
      const result = await this.sync.execute(userId);
      if (result.processed > 0 && shouldLogSchedulerTicks()) {
        this.logger.log(
          `Synced user ${userId}: ${result.processed} new matches`,
        );
      }
      return result;
    } catch (error) {
      this.logger.warn(`Sync failed for ${userId}: ${error}`);
      throw error;
    }
  }
}
