import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { MISSION_TEMPLATE_SEEDS } from './data/mission-templates.data';
import {
  countMissionTemplates,
  seedMarketPricesIfEmpty,
  upsertMissionTemplates,
} from './mission-template.seed';

@Injectable()
export class MissionTemplateBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(MissionTemplateBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await countMissionTemplates(this.prisma);
    if (count < MISSION_TEMPLATE_SEEDS.length) {
      await upsertMissionTemplates(this.prisma);
      this.logger.log(
        `Mission templates bootstrapped (${MISSION_TEMPLATE_SEEDS.length} definitions)`,
      );
    }
    await seedMarketPricesIfEmpty(this.prisma);
  }
}
