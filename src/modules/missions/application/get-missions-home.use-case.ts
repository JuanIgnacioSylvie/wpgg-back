import { Injectable } from '@nestjs/common';
import {
  mapUserMission,
  pickPrimaryMission,
  pickSecondaryMissions,
} from './mission-response.mapper';
import { MissionOfferGeneratorService } from './mission-offer-generator.service';
import {
  MissionDayWithRelations,
  PrismaMissionsRepository,
} from '../infrastructure/persistence/prisma-missions.repository';
import { SyncUserMatchesUseCase } from './sync-user-matches.use-case';
import { UserMissionContextService } from './user-mission-context.service';
import { msUntilEndOfDay } from '../domain/mission-timezone.util';

@Injectable()
export class GetMissionsHomeUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
    private readonly offerGen: MissionOfferGeneratorService,
    private readonly sync: SyncUserMatchesUseCase,
  ) {}

  async execute(userId: string) {
    await this.context.requireRiotAccount(userId);
    const tz = await this.context.resolveTimezone(userId);
    const today = this.context.todayCalendarDate(tz);

    const day = await this.repo.getOrCreateMissionDay(userId, today);
    await this.offerGen.ensureDailyOffers(day.id);

    await this.sync.execute(userId);

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

    const primary = pickPrimaryMission(activeCards);
    const secondary = pickSecondaryMissions(activeCards, primary);

    const past = await this.repo.findPastMissions(userId, 30);
    const pastCards = past.map((m) => mapUserMission(m));

    const endsInMs = msUntilEndOfDay(new Date(), tz);

    return {
      primary: primary
        ? { ...primary, endsAt: new Date(Date.now() + endsInMs).toISOString() }
        : null,
      secondary,
      past: pastCards,
      endsInSeconds: Math.floor(endsInMs / 1000),
    };
  }
}
