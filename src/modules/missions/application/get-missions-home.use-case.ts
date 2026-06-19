import { Injectable } from '@nestjs/common';
import {
  isStandardMission,
  mapUserMission,
  pickPrimaryMission,
  pickSecondaryMissions,
} from './mission-response.mapper';
import { soonestEndsInSeconds } from '../domain/mission-duration.util';
import { WelcomeMissionService } from './welcome-mission.service';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
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
    private readonly welcomeMission: WelcomeMissionService,
  ) {}

  async execute(userId: string) {
    await this.context.requireRiotAccount(userId);
    const today = this.context.todayCalendarDate();

    const day = await this.repo.getOrCreateMissionDay(userId, today);
    await this.welcomeMission.ensureForUser(userId, day.id);

    // Rolling 24h missions can stay ACTIVE across calendar days — list all of them.
    const activeMissions = await this.repo.findActiveMissionsForUser(userId);
    const activeCards = activeMissions.map((m) => mapUserMission(m, m.offer));

    const welcomeMission = await this.repo.findWelcomeMissionForUser(userId);
    const welcome =
      welcomeMission?.status === 'ACTIVE'
        ? mapUserMission(welcomeMission, welcomeMission.offer)
        : null;

    const standardActive = activeCards.filter(isStandardMission);
    const primary = pickPrimaryMission(standardActive);
    const secondary = pickSecondaryMissions(standardActive, primary);

    const completed = await this.repo.findCompletedUnclaimedMissions(userId, 30);
    const completedCards = completed.map((m) => mapUserMission(m, m.offer));

    const past = await this.repo.findPastMissions(userId, 30);
    const pastCards = past.map((m) => mapUserMission(m, m.offer));

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
      completed: completedCards,
      past: pastCards,
      endsInSeconds,
    };
  }
}
