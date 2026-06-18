import { Injectable } from '@nestjs/common';
import { mapOffer } from './mission-response.mapper';
import {
  OFFERS_PER_DIFFICULTY,
  MissionOfferGeneratorService,
} from './mission-offer-generator.service';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';
import { secondsUntil } from '../domain/mission-duration.util';
import { WPGG_MISSION_TIMEZONE } from '../domain/mission-timezone.util';

const MAX_ACTIVE_MISSIONS = 3;
const MAX_HARD_ACTIVE = 1;

@Injectable()
export class GetPickTodayUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
    private readonly offerGen: MissionOfferGeneratorService,
  ) {}

  async execute(userId: string) {
    await this.context.requireRiotAccount(userId);

    const batch = await this.offerGen.ensureOfferBatchForUser(userId);
    const day = await this.repo.findMissionDayWithBatchOffers(
      userId,
      batch.missionDayId,
    );
    const batchOffers =
      day?.offers.filter((o) => o.batchId === batch.batchId) ?? [];

    const acceptedOfferIds = new Set(
      batchOffers
        .filter((o) => o.userMission)
        .map((o) => o.id),
    );

    const activeCount =
      await this.repo.countActiveStandardMissionsForUser(userId);
    const hardActiveCount =
      await this.repo.countHardActiveMissionsForUser(userId);

    const offers = batchOffers.map((o) =>
      mapOffer(o, acceptedOfferIds.has(o.id)),
    );

    return {
      missionDayTimezone: WPGG_MISSION_TIMEZONE,
      offers,
      activeCount,
      hardActiveCount,
      maxActive: MAX_ACTIVE_MISSIONS,
      maxHard: MAX_HARD_ACTIVE,
      offersPerDifficulty: OFFERS_PER_DIFFICULTY,
      offersGeneratedAt: batch.offersGeneratedAt.toISOString(),
      offersRefreshAt: batch.offersRefreshAt.toISOString(),
      offersRefreshInSeconds: secondsUntil(batch.offersRefreshAt),
    };
  }
}
