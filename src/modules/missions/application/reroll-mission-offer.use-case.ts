import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mapOffer } from './mission-response.mapper';
import { MissionOfferGeneratorService } from './mission-offer-generator.service';
import {
  MissionDayWithRelations,
  PrismaMissionsRepository,
} from '../infrastructure/persistence/prisma-missions.repository';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { UserMissionContextService } from './user-mission-context.service';

const REROLL_COST = 5;

@Injectable()
export class RerollMissionOfferUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly walletRepo: PrismaWalletRepository,
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
      throw new BadRequestException('Cannot reroll an accepted mission');
    }

    const wallet = await this.walletRepo.ensureWallet(userId);
    if (wallet.balance < REROLL_COST) {
      throw new BadRequestException('Insufficient WPGG balance for reroll');
    }

    const dayOffers: MissionDayWithRelations | null =
      await this.repo.findMissionDay(
        userId,
        offer.missionDay.calendarDate,
      );
    const excludeIds = (dayOffers?.offers ?? []).map((o) => o.templateId);
    const templates = await this.repo.findTemplatesByDifficulty(
      offer.template.difficulty,
    );
    const replacement = this.offerGen.pickReplacementTemplate(
      offer.template.difficulty,
      excludeIds,
      templates,
    );

    await this.walletRepo.debit(
      userId,
      REROLL_COST,
      'REROLL',
      `reroll:${offerId}:${Date.now()}`,
      'Mission reroll',
    );

    const championId =
      replacement.ruleType === 'CHAMPION_GAMES_WINS'
        ? this.offerGen.randomChampionId()
        : undefined;

    const updated = await this.repo.updateOfferTemplate(
      offerId,
      replacement.id,
      championId,
    );

    return mapOffer(
      {
        ...offer,
        template: updated.template,
        templateId: updated.templateId,
        championId: updated.championId,
      },
      false,
    );
  }
}
