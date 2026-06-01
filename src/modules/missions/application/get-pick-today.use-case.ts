import { Injectable } from '@nestjs/common';
import { mapOffer } from './mission-response.mapper';
import { MissionOfferGeneratorService } from './mission-offer-generator.service';
import {
  MissionDayWithRelations,
  PrismaMissionsRepository,
} from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';
import {
  missionCalendarDateString,
  WPGG_MISSION_TIMEZONE,
} from '../domain/mission-timezone.util';

@Injectable()
export class GetPickTodayUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
    private readonly offerGen: MissionOfferGeneratorService,
  ) {}

  async execute(userId: string) {
    await this.context.requireRiotAccount(userId);
    const today = this.context.todayCalendarDate();

    const day = await this.repo.getOrCreateMissionDay(userId, today);
    await this.offerGen.ensureDailyOffers(day.id);

    const refreshed: MissionDayWithRelations | null =
      await this.repo.findMissionDay(userId, day.calendarDate);
    const acceptedOfferIds = new Set(
      (refreshed?.userMissions ?? [])
        .filter((m) => m.offerId)
        .map((m) => m.offerId as string),
    );

    const selectedCount = (refreshed?.userMissions ?? []).filter((m) =>
      ['ACTIVE', 'COMPLETED'].includes(m.status),
    ).length;

    const offers = (refreshed?.offers ?? []).map((o) =>
      mapOffer(o, acceptedOfferIds.has(o.id)),
    );

    return {
      missionDayTimezone: WPGG_MISSION_TIMEZONE,
      date: missionCalendarDateString(),
      offers,
      selectedCount,
      maxSelectable: 3,
      maxHard: 1,
    };
  }
}
