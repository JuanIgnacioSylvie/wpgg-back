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
import { isMatchInMissionWindow, matchEndedAtMs } from '../domain/mission-timezone.util';
import { MissionSyncStatus } from '../domain/mission-sync-status';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { PushNotificationService } from '@modules/notifications/application/push-notification.service';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { UserMissionContextService } from './user-mission-context.service';

const SYNC_MATCH_COUNT = 30;

type ActiveMission = Awaited<
  ReturnType<PrismaMissionsRepository['findActiveMissionsForUser']>
>[number];

export interface SyncUserMatchesResult {
  processed: number;
  status: typeof MissionSyncStatus.UP_TO_DATE;
  lastSyncedAt: string;
  latestMatchId: string | null;
}

@Injectable()
export class SyncUserMatchesUseCase {
  private readonly logger = new Logger(SyncUserMatchesUseCase.name);

  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly walletRepo: PrismaWalletRepository,
    private readonly prisma: PrismaService,
    private readonly context: UserMissionContextService,
    @Inject(RIOT_SERVICE) private readonly riotService: IRiotService,
    private readonly pushNotifications: PushNotificationService,
  ) {}

  async execute(userId: string): Promise<SyncUserMatchesResult> {
    await this.context.requireRiotAccount(userId);
    const account = await this.repo.findRiotAccount(userId);
    if (!account) {
      return this.emptyResult();
    }

    const active = await this.repo.findActiveMissionsForUser(userId);
    if (active.length === 0) {
      return this.emptyResult();
    }

    const matchIds = await this.riotService.getMatchHistory(
      account.puuid,
      account.region,
      SYNC_MATCH_COUNT,
    );

    const processedRows = await this.repo.findProcessedMatches(userId, matchIds);
    const processedById = new Map(
      processedRows.map((row) => [row.matchId, row]),
    );

    const eligibleMatches: Array<{
      match: MatchDto;
      me: MatchParticipantDto;
    }> = [];

    let processed = 0;
    for (const matchId of matchIds) {
      const cached = processedById.get(matchId);
      let match: MatchDto | null = null;

      if (cached?.matchPayloadJson) {
        match = cached.matchPayloadJson as unknown as MatchDto;
      } else {
        try {
          match = await this.riotService.getMatchDetail(matchId, account.region);
        } catch (e) {
          this.logger.warn(`Skip match ${matchId}: ${e}`);
          continue;
        }
      }

      if (!cached) {
        await this.repo.markMatchProcessed(userId, matchId, {
          gameCreation: match.gameCreation,
          matchPayloadJson: match as unknown as object,
        });
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

    const now = new Date();
    const hasExpired = active.some(
      (mission) =>
        mission.expiresAt && mission.expiresAt.getTime() <= now.getTime(),
    );
    if (hasExpired) {
      await this.repo.expireActiveMissionsPastDeadline(now);
    }

    for (const mission of active) {
      if (mission.expiresAt && mission.expiresAt.getTime() <= now.getTime()) {
        continue;
      }
      await this.recomputeMissionProgress(
        mission,
        eligibleMatches,
        userId,
      );
    }

    const latestMatchId = matchIds[0] ?? null;
    const lastSyncedAt = new Date();
    await this.repo.updateSyncCursor(userId, { latestMatchId, lastSyncedAt });

    return {
      processed,
      status: MissionSyncStatus.UP_TO_DATE,
      lastSyncedAt: lastSyncedAt.toISOString(),
      latestMatchId,
    };
  }

  private emptyResult(): SyncUserMatchesResult {
    return {
      processed: 0,
      status: MissionSyncStatus.UP_TO_DATE,
      lastSyncedAt: new Date().toISOString(),
      latestMatchId: null,
    };
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

    const chronological = [...eligibleMatches].sort(
      (a, b) => matchEndedAtMs(a.match) - matchEndedAtMs(b.match),
    );

    for (const { match, me } of chronological) {
      if (
        !isMatchInMissionWindow(
          match,
          mission.acceptedAt,
          mission.expiresAt,
          missionDay,
        )
      ) {
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

    if (completed) {
      await this.pushNotifications
        .sendMissionCompleted(userId, {
          titleEn: mission.template.titleEn,
          rewardWpgg: mission.template.rewardWpgg,
        })
        .catch((e) =>
          this.logger.warn(
            `Mission push/inbox failed for ${userId} (mission ${mission.id}): ${e}`,
          ),
        );
    }
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

    if (completed) {
      await this.pushNotifications
        .sendMissionCompleted(userId, {
          titleEn: mission.template.titleEn,
          rewardWpgg: mission.template.rewardWpgg,
        })
        .catch((e) =>
          this.logger.warn(
            `Mission push/inbox failed for ${userId} (mission ${mission.id}): ${e}`,
          ),
        );
    }
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
