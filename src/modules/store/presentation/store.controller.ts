import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { GetStoreCatalogUseCase } from '../application/get-store-catalog.use-case';
import { ListStoreOrdersUseCase } from '../application/list-store-orders.use-case';
import { PurchaseStoreProductUseCase } from '../application/purchase-store-product.use-case';

@Controller('store')
export class StoreController {
  constructor(
    private readonly getCatalog: GetStoreCatalogUseCase,
    private readonly listOrders: ListStoreOrdersUseCase,
    private readonly purchaseProduct: PurchaseStoreProductUseCase,
  ) {}

  @Get('products')
  catalog() {
    return this.getCatalog.execute();
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  orders(@CurrentUser() userId: string) {
    return this.listOrders.execute(userId);
  }

  @Post('products/:productSlug/purchase')
  @UseGuards(JwtAuthGuard)
  purchase(
    @CurrentUser() userId: string,
    @Param('productSlug') productSlug: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.purchaseProduct.execute(userId, productSlug, idempotencyKey);
  }
}
