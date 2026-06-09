import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InsufficientBalanceError } from '@modules/wallet/domain/errors/insufficient-balance.error';
import { WPGG_REROLL_COST } from '@modules/wallet/domain/wpgg-economy.constants';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { mapOffer } from './mission-response.mapper';
import { MissionOfferGeneratorService } from './mission-offer-generator.service';
import {
  MissionDayWithRelations,
  PrismaMissionsRepository,
} from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';

@Injectable()
export class RerollMissionOfferUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly walletRepo: PrismaWalletRepository,
    private readonly prisma: PrismaService,
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

    const championId =
      replacement.ruleType === 'CHAMPION_GAMES_WINS'
        ? this.offerGen.randomChampionId()
        : undefined;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await this.walletRepo.debit(
          userId,
          WPGG_REROLL_COST,
          'REROLL',
          `reroll:${offerId}:${randomUUID()}`,
          'Mission reroll',
          tx,
        );

        return tx.missionOffer.update({
          where: { id: offerId },
          data: {
            templateId: replacement.id,
            championId: championId ?? null,
            rerolledFromOfferId: offerId,
          },
          include: { template: true },
        });
      });

      return mapOffer(
        {
          ...offer,
          template: updated.template,
          templateId: updated.templateId,
          championId: updated.championId,
        },
        false,
      );
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        throw new BadRequestException('Insufficient WPGG balance for reroll');
      }
      throw error;
    }
  }
}
