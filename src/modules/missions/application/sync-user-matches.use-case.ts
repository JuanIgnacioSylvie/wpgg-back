import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, UserMissionStatus } from '@prisma/client';
import {
  IRiotService,
  isMissionEligibleMatch,
  RIOT_SERVICE,
} from '@modules/riot/domain/services/riot.service.interface';
import {
  applyMatchToProgress,
  initialProgress,
  isMissionComplete,
  MissionTemplateTarget,
  progressPercentFromState,
} from '../domain/mission-rule.engine';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { UserMissionContextService } from './user-mission-context.service';

const SYNC_MATCH_COUNT = 30;

@Injectable()
export class SyncUserMatchesUseCase {
  private readonly logger = new Logger(SyncUserMatchesUseCase.name);

  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly walletRepo: PrismaWalletRepository,
    private readonly context: UserMissionContextService,
    @Inject(RIOT_SERVICE) private readonly riotService: IRiotService,
  ) {}

  async execute(userId: string): Promise<{ processed: number }> {
    await this.context.requireRiotAccount(userId);
    const account = await this.repo.findRiotAccount(userId);
    if (!account) {
      return { processed: 0 };
    }

    const active = await this.repo.findActiveMissionsForUser(userId);
    if (active.length === 0) {
      return { processed: 0 };
    }

    const matchIds = await this.riotService.getMatchHistory(
      account.puuid,
      account.region,
      SYNC_MATCH_COUNT,
    );

    let processed = 0;
    for (const matchId of matchIds) {
      const seen = await this.repo.isMatchProcessed(userId, matchId);
      if (seen) {
        continue;
      }

      let match;
      try {
        match = await this.riotService.getMatchDetail(matchId, account.region);
      } catch (e) {
        this.logger.warn(`Skip match ${matchId}: ${e}`);
        continue;
      }

      await this.repo.markMatchProcessed(userId, matchId);
      processed++;

      if (!isMissionEligibleMatch(match)) {
        continue;
      }

      const me = match.participants.find(
        (p) => p.puuid.toLowerCase() === account.puuid.toLowerCase(),
      );
      if (!me) {
        continue;
      }

      for (const mission of active) {
        if (mission.status !== UserMissionStatus.ACTIVE) {
          continue;
        }
        const target = mission.template
          .targetJson as MissionTemplateTarget;
        const progress =
          (mission.progressJson as Record<string, unknown>) ??
          initialProgress(mission.template.ruleType);

        const ctx = {
          ruleType: mission.template.ruleType,
          target,
          championId: mission.offer?.championId ?? null,
        };

        const updated = applyMatchToProgress(ctx, progress, me, match);
        const percent = progressPercentFromState(ctx, updated);
        let status: UserMissionStatus = UserMissionStatus.ACTIVE;
        if (isMissionComplete(ctx, updated)) {
          status = UserMissionStatus.COMPLETED;
          await this.walletRepo.creditMissionReward(
            userId,
            mission.template.rewardWpgg,
            `mission:${mission.id}`,
            `Mission completed: ${mission.template.titleEn}`,
          );
        }

        await this.repo.updateUserMissionProgress(
          mission.id,
          percent,
          updated as Prisma.InputJsonValue,
          status,
        );

        mission.progressPercent = percent;
        mission.status = status;
      }
    }

    return { processed };
  }
}
