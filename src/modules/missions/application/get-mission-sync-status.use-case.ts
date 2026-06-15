import { Inject, Injectable } from '@nestjs/common';
import {
  IRiotService,
  RIOT_SERVICE,
} from '@modules/riot/domain/services/riot.service.interface';
import {
  MissionSyncStatus,
  MissionSyncStatusDto,
} from '../domain/mission-sync-status';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';

@Injectable()
export class GetMissionSyncStatusUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
    @Inject(RIOT_SERVICE) private readonly riotService: IRiotService,
  ) {}

  async execute(userId: string): Promise<MissionSyncStatusDto> {
    await this.context.requireRiotAccount(userId);
    const account = await this.repo.findRiotAccount(userId);
    if (!account) {
      return this.dto(MissionSyncStatus.NO_ACTIVE_MISSIONS, null, null, null);
    }

    const active = await this.repo.findActiveMissionsForUser(userId);
    if (active.length === 0) {
      return this.dto(
        MissionSyncStatus.NO_ACTIVE_MISSIONS,
        account.lastSyncedAt?.toISOString() ?? null,
        account.latestMatchId,
        null,
      );
    }

    const newestIds = await this.riotService.getMatchHistory(
      account.puuid,
      account.region,
      1,
    );
    const newestMatchId = newestIds[0] ?? null;

    if (!newestMatchId) {
      return this.dto(
        MissionSyncStatus.UP_TO_DATE,
        account.lastSyncedAt?.toISOString() ?? null,
        account.latestMatchId,
        null,
      );
    }

    if (!account.latestMatchId) {
      return this.dto(
        MissionSyncStatus.UPDATES_AVAILABLE,
        null,
        null,
        newestMatchId,
      );
    }

    const status =
      newestMatchId === account.latestMatchId
        ? MissionSyncStatus.UP_TO_DATE
        : MissionSyncStatus.UPDATES_AVAILABLE;

    return this.dto(
      status,
      account.lastSyncedAt?.toISOString() ?? null,
      account.latestMatchId,
      newestMatchId,
    );
  }

  private dto(
    status: MissionSyncStatusDto['status'],
    lastSyncedAt: string | null,
    latestMatchId: string | null,
    newestMatchId: string | null,
  ): MissionSyncStatusDto {
    return { status, lastSyncedAt, latestMatchId, newestMatchId };
  }
}
