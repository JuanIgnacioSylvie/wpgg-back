import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, UserMissionStatus } from '@prisma/client';
import {
  IRiotService,
  isMissionEligibleMatch,
  MatchDto,
  MatchParticipantDto,
  RANKED_FLEX_QUEUE_ID,
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
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
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
    private readonly prisma: PrismaService,
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

    if (mission.template.ruleType === 'FLEX_SQUAD_WPGG_WIN') {
      await this.recomputeFlexSquadWelcomeProgress(
        mission,
        eligibleMatches,
        userId,
      );
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
    const completed = isMissionComplete(ctx, progress);
    const status = completed
      ? UserMissionStatus.COMPLETED
      : UserMissionStatus.ACTIVE;

    await this.prisma.$transaction(async (tx) => {
      if (completed) {
        await this.walletRepo.creditMissionReward(
          userId,
          mission.template.rewardWpgg,
          `mission:${mission.id}`,
          `Mission completed: ${mission.template.titleEn}`,
          tx,
        );
      }

      await tx.userMission.update({
        where: { id: mission.id },
        data: {
          progressPercent: percent,
          progressJson: progress as Prisma.InputJsonValue,
          status,
          completedAt: completed ? new Date() : undefined,
        },
      });
    });
  }

  private async recomputeFlexSquadWelcomeProgress(
    mission: ActiveMission,
    eligibleMatches: Array<{ match: MatchDto; me: MatchParticipantDto }>,
    userId: string,
  ): Promise<void> {
    const target = mission.template.targetJson as MissionTemplateTarget;
    const teammatesRequired = target.teammatesRequired ?? 4;
    let bestWpggTeammates = 0;

    for (const { match, me } of eligibleMatches) {
      if (match.queueId !== RANKED_FLEX_QUEUE_ID || !me.win) {
        continue;
      }

      const wpggTeammates = await this.countWpggTeammates(match, me);
      bestWpggTeammates = Math.max(bestWpggTeammates, wpggTeammates);
      if (bestWpggTeammates >= teammatesRequired) {
        break;
      }
    }

    const progress = { wpggTeammates: bestWpggTeammates };
    const ctx = {
      ruleType: mission.template.ruleType,
      target,
      championId: null,
    };
    const percent = progressPercentFromState(ctx, progress);
    const completed = bestWpggTeammates >= teammatesRequired;
    const status = completed
      ? UserMissionStatus.COMPLETED
      : UserMissionStatus.ACTIVE;

    await this.prisma.$transaction(async (tx) => {
      if (completed) {
        await this.walletRepo.creditMissionReward(
          userId,
          mission.template.rewardWpgg,
          `mission:${mission.id}`,
          `Mission completed: ${mission.template.titleEn}`,
          tx,
        );
      }

      await tx.userMission.update({
        where: { id: mission.id },
        data: {
          progressPercent: percent,
          progressJson: progress as Prisma.InputJsonValue,
          status,
          completedAt: completed ? new Date() : undefined,
        },
      });
    });
  }

  private async countWpggTeammates(
    match: MatchDto,
    me: MatchParticipantDto,
  ): Promise<number> {
    const teammatePuuids = match.participants
      .filter(
        (p) =>
          p.teamId === me.teamId &&
          p.puuid.toLowerCase() !== me.puuid.toLowerCase(),
      )
      .map((p) => p.puuid);

    return this.repo.countRegisteredPuuids(teammatePuuids);
  }
}
