import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  STORE_PRODUCT_SEED,
  upsertStoreProductKeys,
  upsertStoreProducts,
} from './store-product.seed';

@Injectable()
export class StoreProductBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(StoreProductBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await upsertStoreProducts(this.prisma);
    await upsertStoreProductKeys(this.prisma);
    this.logger.log(
      `Store catalog bootstrapped (${STORE_PRODUCT_SEED.length} products)`,
    );
  }
}
