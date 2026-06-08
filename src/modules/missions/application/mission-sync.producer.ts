import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  MISSION_SYNC_JOB,
  MISSION_SYNC_QUEUE,
} from '@shared/infrastructure/queue/queue.constants';

@Injectable()
export class MissionSyncProducer {
  constructor(
    @InjectQueue(MISSION_SYNC_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueUserSync(userId: string): Promise<void> {
    try {
      await this.queue.add(
        MISSION_SYNC_JOB,
        { userId },
        {
          jobId: `sync-user:${userId}`,
          removeOnComplete: true,
          removeOnFail: 100,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    } catch {
      // Job already queued or running for this user — skip duplicate.
    }
  }
}
