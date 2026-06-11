import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { seedMarketPricesIfEmpty } from '@modules/missions/infrastructure/mission-template.seed';

@Injectable()
export class MarketPriceBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(MarketPriceBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const before = await this.prisma.wpggMarketPrice.count();
    await seedMarketPricesIfEmpty(this.prisma);
    const after = await this.prisma.wpggMarketPrice.count();
    if (after > before) {
      this.logger.log(`Market prices bootstrapped (${after - before} rows)`);
    }
  }
}
