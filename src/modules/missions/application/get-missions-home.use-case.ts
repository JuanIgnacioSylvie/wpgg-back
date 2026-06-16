import { Injectable } from '@nestjs/common';
import {
  isStandardMission,
  mapUserMission,
  pickPrimaryMission,
  pickSecondaryMissions,
} from './mission-response.mapper';
import { soonestEndsInSeconds } from '../domain/mission-duration.util';
import { WelcomeMissionService } from './welcome-mission.service';
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
export class GetMissionsHomeUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
    private readonly offerGen: MissionOfferGeneratorService,
    private readonly welcomeMission: WelcomeMissionService,
  ) {}

  async execute(userId: string) {
    await this.context.requireRiotAccount(userId);
    const today = this.context.todayCalendarDate();

    const day = await this.repo.getOrCreateMissionDay(userId, today);
    await this.offerGen.ensureDailyOffers(day.id);
    await this.welcomeMission.ensureForUser(userId, day.id);

    const refreshed: MissionDayWithRelations | null =
      await this.repo.findMissionDay(userId, day.calendarDate);
    const activeMissions =
      refreshed?.userMissions.filter((m) => m.status === 'ACTIVE') ?? [];
    const activeCards = activeMissions.map((m) => {
      const offer = refreshed?.offers.find(
        (o: MissionDayWithRelations['offers'][number]) => o.id === m.offerId,
      );
      return mapUserMission(m, offer);
    });

    const welcomeMission = await this.repo.findWelcomeMissionForUser(userId);
    const welcome =
      welcomeMission?.status === 'ACTIVE'
        ? mapUserMission(welcomeMission, welcomeMission.offer)
        : null;

    const standardActive = activeCards.filter(isStandardMission);
    const primary = pickPrimaryMission(standardActive);
    const secondary = pickSecondaryMissions(standardActive, primary);

    const past = await this.repo.findPastMissions(userId, 30);
    const pastCards = past.map((m) => mapUserMission(m));

    const timedActive = [
      ...(primary ? [primary] : []),
      ...secondary,
    ];
    const endsInSeconds = soonestEndsInSeconds(timedActive);

    return {
      missionDayTimezone: WPGG_MISSION_TIMEZONE,
      missionDate: missionCalendarDateString(),
      welcome,
      primary,
      secondary,
      past: pastCards,
      endsInSeconds,
    };
  }
}
