import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, UserMissionStatus } from '@prisma/client';
import {
  IRiotService,
  isMissionEligibleMatch,
  MatchDto,
  MatchParticipantDto,
  RIOT_SERVICE,
} from '@modules/riot/domain/services/riot.service.interface';
import {
  applyMatchToProgress,
  initialProgress,
  isMissionComplete,
  MissionTemplateTarget,
  progressPercentFromState,
} from '../domain/mission-rule.engine';
import { isMatchOnMissionDay } from '../domain/mission-timezone.util';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { UserMissionContextService } from './user-mission-context.service';

const SYNC_MATCH_COUNT = 30;

type ActiveMission = Awaited<
  ReturnType<PrismaMissionsRepository['findActiveMissionsForUser']>
>[number];

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

    const eligibleMatches: Array<{
      match: MatchDto;
      me: MatchParticipantDto;
    }> = [];

    let processed = 0;
    for (const matchId of matchIds) {
      let match: MatchDto;
      try {
        match = await this.riotService.getMatchDetail(matchId, account.region);
      } catch (e) {
        this.logger.warn(`Skip match ${matchId}: ${e}`);
        continue;
      }

      const seen = await this.repo.isMatchProcessed(userId, matchId);
      if (!seen) {
        await this.repo.markMatchProcessed(userId, matchId);
        processed++;
      }

      if (!isMissionEligibleMatch(match)) {
        continue;
      }

      const me = match.participants.find(
        (p) => p.puuid.toLowerCase() === account.puuid.toLowerCase(),
      );
      if (!me) {
        continue;
      }

      eligibleMatches.push({ match, me });
    }

    for (const mission of active) {
      await this.recomputeMissionProgress(
        mission,
        eligibleMatches,
        userId,
      );
    }

    return { processed };
  }

  /** Rebuild progress from recent history, counting only matches on the mission day. */
  private async recomputeMissionProgress(
    mission: ActiveMission,
    eligibleMatches: Array<{ match: MatchDto; me: MatchParticipantDto }>,
    userId: string,
  ): Promise<void> {
    if (mission.status !== UserMissionStatus.ACTIVE) {
      return;
    }

    const target = mission.template.targetJson as MissionTemplateTarget;
    const ctx = {
      ruleType: mission.template.ruleType,
      target,
      championId: mission.offer?.championId ?? null,
    };

    let progress = initialProgress(mission.template.ruleType);
    const missionDay = mission.missionDay.calendarDate;

    for (const { match, me } of eligibleMatches) {
      if (!isMatchOnMissionDay(match, missionDay)) {
        continue;
      }
      progress = applyMatchToProgress(ctx, progress, me, match);
    }

    const percent = progressPercentFromState(ctx, progress);
    let status: UserMissionStatus = UserMissionStatus.ACTIVE;
    if (isMissionComplete(ctx, progress)) {
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
      progress as Prisma.InputJsonValue,
      status,
    );
  }
}
