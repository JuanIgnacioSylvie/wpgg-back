import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ensureMarketPrices } from '@modules/missions/infrastructure/mission-template.seed';

@Injectable()
export class MarketPriceBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(MarketPriceBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await ensureMarketPrices(this.prisma);
    this.logger.log('Market prices refreshed (last 14 UTC days)');
  }
}
