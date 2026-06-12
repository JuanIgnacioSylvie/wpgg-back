import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { MISSION_TEMPLATE_SEEDS } from './data/mission-templates.data';
import {
  ensureMarketPrices,
  upsertMissionTemplates,
  upsertWelcomeMissionTemplate,
} from './mission-template.seed';

@Injectable()
export class MissionTemplateBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(MissionTemplateBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await upsertMissionTemplates(this.prisma);
    await upsertWelcomeMissionTemplate(this.prisma);
    await ensureMarketPrices(this.prisma);
    this.logger.log(
      `Mission templates synced (${MISSION_TEMPLATE_SEEDS.length} standard + welcome)`,
    );
  }
}
