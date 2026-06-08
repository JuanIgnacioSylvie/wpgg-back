import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  MISSION_EXPIRY_JOB,
  MISSION_EXPIRY_QUEUE,
} from '@shared/infrastructure/queue/queue.constants';

@Injectable()
export class MissionExpiryProducer {
  constructor(
    @InjectQueue(MISSION_EXPIRY_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueExpiry(): Promise<void> {
    await this.queue.add(
      MISSION_EXPIRY_JOB,
      {},
      {
        removeOnComplete: true,
        removeOnFail: 50,
        attempts: 2,
        backoff: { type: 'fixed', delay: 10_000 },
      },
    );
  }
}
