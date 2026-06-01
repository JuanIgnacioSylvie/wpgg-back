import { Injectable } from '@nestjs/common';
import { mapOffer } from './mission-response.mapper';
import { MissionOfferGeneratorService } from './mission-offer-generator.service';
import {
  MissionDayWithRelations,
  PrismaMissionsRepository,
} from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';
import { calendarDateInTimezone } from '../domain/mission-timezone.util';

@Injectable()
export class GetPickTodayUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
    private readonly offerGen: MissionOfferGeneratorService,
  ) {}

  async execute(userId: string) {
    await this.context.requireRiotAccount(userId);
    const tz = await this.context.resolveTimezone(userId);
    const today = this.context.todayCalendarDate(tz);

    const day = await this.repo.getOrCreateMissionDay(userId, today);
    await this.offerGen.ensureDailyOffers(day.id);

    const refreshed: MissionDayWithRelations | null =
      await this.repo.findMissionDay(userId, today);
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
      date: calendarDateInTimezone(new Date(), tz),
      offers,
      selectedCount,
      maxSelectable: 3,
      maxHard: 1,
    };
  }
}
