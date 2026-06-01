import { Injectable, Logger } from '@nestjs/common';
import {
  MissionDifficulty,
  MissionRuleType,
  MissionTemplate,
} from '@prisma/client';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

const RANDOM_CHAMPION_IDS = [
  103, 84, 12, 32, 34, 1, 22, 136, 245, 60, 28, 412, 8, 119, 101, 53, 62, 63,
  201, 233, 21, 122, 67, 68, 69, 13, 14, 15, 16, 17, 18, 19, 20,
];

const DAILY_OFFER_COUNT = 6;

@Injectable()
export class MissionOfferGeneratorService {
  private readonly logger = new Logger(MissionOfferGeneratorService.name);

  constructor(private readonly repo: PrismaMissionsRepository) {}

  async ensureDailyOffers(missionDayId: string) {
    const existing = await this.repo.countOffers(missionDayId);
    if (existing >= DAILY_OFFER_COUNT) {
      return;
    }

    const templateCount = await this.repo.countMissionTemplates();
    if (templateCount === 0) {
      this.logger.warn(
        'No mission templates in DB; daily offers cannot be generated',
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
      const picked = this.pickRandomDistinct(templates, 2);
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

    await this.repo.createOffers(missionDayId, offers);
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
