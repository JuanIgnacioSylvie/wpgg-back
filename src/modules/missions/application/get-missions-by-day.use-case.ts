import { Injectable } from '@nestjs/common';
import { mapUserMission } from './mission-response.mapper';
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
export class GetMissionsByDayUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
  ) {}

  async execute(userId: string, dateParam?: string) {
    await this.context.requireRiotAccount(userId);
    const calendarDate = dateParam
      ? this.context.parseCalendarDateParam(dateParam)
      : this.context.todayCalendarDate();

    const refreshed: MissionDayWithRelations | null =
      await this.repo.findMissionDay(userId, calendarDate);
    if (!refreshed) {
      return { date: dateParam ?? '', missions: [], isToday: false };
    }

    const missions = refreshed.userMissions
      .filter((m) => m.status !== 'OFFER')
      .map((m) => {
        const offer = refreshed.offers.find((o) => o.id === m.offerId);
        return mapUserMission(m, offer);
      });

    const todayStr = missionCalendarDateString();
    const dateStr = dateParam ?? todayStr;

    return {
      missionDayTimezone: WPGG_MISSION_TIMEZONE,
      date: dateStr,
      missions,
      isToday: dateStr === todayStr,
    };
  }
}
