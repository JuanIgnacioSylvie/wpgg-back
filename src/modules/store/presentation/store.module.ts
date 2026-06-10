import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { WalletModule } from '@modules/wallet/presentation/wallet.module';
import { SharedModule } from '@shared/shared.module';
import { GetStoreCatalogUseCase } from '../application/get-store-catalog.use-case';
import { ListStoreOrdersUseCase } from '../application/list-store-orders.use-case';
import { PurchaseStoreProductUseCase } from '../application/purchase-store-product.use-case';
import { PrismaStoreRepository } from '../infrastructure/persistence/prisma-store.repository';
import { StoreController } from './store.controller';

@Module({
  imports: [SharedModule, AuthModule, WalletModule],
  controllers: [StoreController],
  providers: [
    PrismaStoreRepository,
    GetStoreCatalogUseCase,
    ListStoreOrdersUseCase,
    PurchaseStoreProductUseCase,
  ],
})
export class StoreModule {}
