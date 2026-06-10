import { Injectable } from '@nestjs/common';
import { PrismaStoreRepository } from '../infrastructure/persistence/prisma-store.repository';
import { mapStoreProduct } from './store-order.mapper';

@Injectable()
export class GetStoreCatalogUseCase {
  constructor(private readonly repo: PrismaStoreRepository) {}

  async execute() {
    const products = await this.repo.listActiveProducts();
    return { products: products.map(mapStoreProduct) };
  }
}
