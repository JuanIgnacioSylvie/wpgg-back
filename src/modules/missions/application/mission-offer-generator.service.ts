import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import {
  MissionDifficulty,
  MissionRuleType,
  MissionTemplate,
} from '@prisma/client';
import {
  MISSION_OFFER_REFRESH_MS,
  missionOffersRefreshAt,
} from '../domain/mission-duration.util';
import { todayMissionCalendarDate } from '../domain/mission-timezone.util';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

const RANDOM_CHAMPION_IDS = [
  103, 84, 12, 32, 34, 1, 22, 136, 245, 60, 28, 412, 8, 119, 101, 53, 62, 63,
  201, 233, 21, 122, 67, 68, 69, 13, 14, 15, 16, 17, 18, 19, 20,
];

export const OFFERS_PER_DIFFICULTY = 2;
export const OFFER_BATCH_COUNT =
  OFFERS_PER_DIFFICULTY * 3; /* EASY + MEDIUM + HARD */

export type OfferBatchInfo = {
  missionDayId: string;
  batchId: string;
  offersGeneratedAt: Date;
  offersRefreshAt: Date;
};

@Injectable()
export class MissionOfferGeneratorService {
  private readonly logger = new Logger(MissionOfferGeneratorService.name);

  constructor(private readonly repo: PrismaMissionsRepository) {}

  /** Ensures the user has a fresh offer pool (6 = 2× each difficulty), refreshed every 24h. */
  async ensureOfferBatchForUser(userId: string): Promise<OfferBatchInfo> {
    const now = new Date();
    const active = await this.repo.findActiveOfferBatch(userId);
    if (
      active?.offersGeneratedAt &&
      active.offersBatchId &&
      now.getTime() <
        active.offersGeneratedAt.getTime() + MISSION_OFFER_REFRESH_MS
    ) {
      const batchOffers = active.offers.filter(
        (o) => o.batchId === active.offersBatchId,
      );
      if (batchOffers.length >= OFFER_BATCH_COUNT) {
        return {
          missionDayId: active.id,
          batchId: active.offersBatchId,
          offersGeneratedAt: active.offersGeneratedAt,
          offersRefreshAt: missionOffersRefreshAt(active.offersGeneratedAt),
        };
      }
    }

    const day = await this.repo.getOrCreateMissionDay(
      userId,
      todayMissionCalendarDate(),
    );
    const batchId = randomUUID();
    await this.repo.startOfferBatch(day.id, batchId, now);
    await this.createBatchOffers(day.id, batchId);

    return {
      missionDayId: day.id,
      batchId,
      offersGeneratedAt: now,
      offersRefreshAt: missionOffersRefreshAt(now),
    };
  }

  private async createBatchOffers(missionDayId: string, batchId: string) {
    const templateCount = await this.repo.countMissionTemplates();
    if (templateCount === 0) {
      this.logger.warn(
        'No mission templates in DB; offer batch cannot be generated',
      );
      return;
    }

    const difficulties: MissionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    const offers: Array<{
      templateId: string;
      slot: number;
      championId?: number;
    }> = [];
    let slot = 0;

    for (const difficulty of difficulties) {
      const templates = await this.repo.findTemplatesByDifficulty(difficulty);
      const picked = this.pickRandomDistinct(templates, OFFERS_PER_DIFFICULTY);
      for (const t of picked) {
        offers.push({
          templateId: t.id,
          slot: slot++,
          championId:
            t.ruleType === MissionRuleType.CHAMPION_GAMES_WINS
              ? this.randomChampionId()
              : undefined,
        });
      }
    }

    await this.repo.createOffers(missionDayId, batchId, offers);
  }

  pickReplacementTemplate(
    difficulty: MissionDifficulty,
    excludeIds: string[],
    templates: Awaited<
      ReturnType<PrismaMissionsRepository['findTemplatesByDifficulty']>
    >,
  ) {
    const pool = templates.filter((t) => !excludeIds.includes(t.id));
    if (pool.length === 0) {
      return templates[Math.floor(Math.random() * templates.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  randomChampionId(): number {
    return RANDOM_CHAMPION_IDS[
      Math.floor(Math.random() * RANDOM_CHAMPION_IDS.length)
    ];
  }

  private pickRandomDistinct(
    items: MissionTemplate[],
    count: number,
  ): MissionTemplate[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}
