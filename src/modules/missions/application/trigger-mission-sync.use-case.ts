import { Injectable, Optional } from '@nestjs/common';
import { MissionSyncProducer } from './mission-sync.producer';
import { SyncUserMatchesUseCase } from './sync-user-matches.use-case';

export interface TriggerMissionSyncResult {
  queued: boolean;
  processed: number;
  status: string;
  lastSyncedAt: string;
  latestMatchId: string | null;
}

@Injectable()
export class TriggerMissionSyncUseCase {
  constructor(
    private readonly sync: SyncUserMatchesUseCase,
    @Optional() private readonly syncProducer?: MissionSyncProducer,
  ) {}

  async execute(userId: string): Promise<TriggerMissionSyncResult> {
    if (this.syncProducer) {
      await this.syncProducer.enqueueUserSync(userId);
      return {
        queued: true,
        processed: 0,
        status: 'QUEUED',
        lastSyncedAt: new Date().toISOString(),
        latestMatchId: null,
      };
    }

    const result = await this.sync.execute(userId);
    return { ...result, queued: false };
  }
}
