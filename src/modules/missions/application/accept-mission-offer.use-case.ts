import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mapUserMission } from './mission-response.mapper';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';

@Injectable()
export class AcceptMissionOfferUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
  ) {}

  async execute(userId: string, offerId: string) {
    await this.context.requireRiotAccount(userId);
    const offer = await this.repo.findOfferById(offerId);
    if (!offer || offer.missionDay.userId !== userId) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.userMission) {
      throw new ConflictException('Offer already accepted');
    }

    const selected = await this.repo.countActiveMissionsForDay(
      offer.missionDayId,
    );
    if (selected >= 3) {
      throw new BadRequestException('Maximum 3 missions per day');
    }

    if (offer.template.difficulty === 'HARD') {
      const hardCount = await this.repo.countHardActiveForDay(
        offer.missionDayId,
      );
      if (hardCount >= 1) {
        throw new BadRequestException('Maximum 1 hard mission per day');
      }
    }

    const mission = await this.repo.createUserMission({
      missionDayId: offer.missionDayId,
      templateId: offer.templateId,
      offerId: offer.id,
      status: 'ACTIVE',
    });

    return mapUserMission(
      { ...mission, template: offer.template },
      offer,
    );
  }
}
