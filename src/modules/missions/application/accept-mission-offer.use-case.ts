import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mapUserMission } from './mission-response.mapper';
import { MissionOfferGeneratorService } from './mission-offer-generator.service';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';

const MAX_ACTIVE_MISSIONS = 3;
const MAX_HARD_ACTIVE = 1;

@Injectable()
export class AcceptMissionOfferUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly context: UserMissionContextService,
    private readonly offerGen: MissionOfferGeneratorService,
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

    const batch = await this.offerGen.ensureOfferBatchForUser(userId);
    if (
      offer.batchId !== batch.batchId ||
      offer.missionDayId !== batch.missionDayId
    ) {
      throw new BadRequestException('Offer is no longer available');
    }

    const activeCount =
      await this.repo.countActiveStandardMissionsForUser(userId);
    if (activeCount >= MAX_ACTIVE_MISSIONS) {
      throw new BadRequestException('Maximum 3 active missions');
    }

    if (offer.template.difficulty === 'HARD') {
      const hardCount = await this.repo.countHardActiveMissionsForUser(userId);
      if (hardCount >= MAX_HARD_ACTIVE) {
        throw new BadRequestException('Maximum 1 active hard mission');
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
