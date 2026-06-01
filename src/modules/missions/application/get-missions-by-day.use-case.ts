import { Injectable } from '@nestjs/common';
import { mapUserMission } from './mission-response.mapper';
import { MissionOfferGeneratorService } from './mission-offer-generator.service';
import {
  MissionDayWithRelations,
  PrismaMissionsRepository,
} from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';
import { calendarDateInTimezone } from '../domain/mission-timezone.util';

@Injectable()
export class GetMissionsByDayUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
    private readonly offerGen: MissionOfferGeneratorService,
  ) {}

  async execute(userId: string, dateParam?: string) {
    await this.context.requireRiotAccount(userId);
    const tz = await this.context.resolveTimezone(userId);
    const calendarDate = dateParam
      ? this.context.parseCalendarDateParam(dateParam)
      : this.context.todayCalendarDate(tz);

    const day = await this.repo.getOrCreateMissionDay(userId, calendarDate);
    await this.offerGen.ensureDailyOffers(day.id);

    const refreshed: MissionDayWithRelations | null =
      await this.repo.findMissionDay(userId, day.calendarDate);
    if (!refreshed) {
      return { date: dateParam ?? '', missions: [], isToday: false };
    }

    const missions = refreshed.userMissions
      .filter((m) => m.status !== 'OFFER')
      .map((m) => {
        const offer = refreshed.offers.find((o) => o.id === m.offerId);
        return mapUserMission(m, offer);
      });

    const todayStr = calendarDateInTimezone(new Date(), tz);
    const dateStr = dateParam ?? todayStr;

    return {
      date: dateStr,
      missions,
      isToday: dateStr === todayStr,
    };
  }
}
