import { StoreOrder, StoreProduct, StoreProductKey } from '@prisma/client';

type OrderWithRelations = StoreOrder & {
  product: StoreProduct;
  key: StoreProductKey;
};

export function mapStoreOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    productId: order.productId,
    productSlug: order.product.slug,
    productName: order.product.nameEn,
    rpAmount: order.product.rpAmount,
    priceWpgg: order.priceWpgg,
    riotKey: order.key.keyValue,
    createdAt: order.createdAt.toISOString(),
  };
}

export function mapStoreProduct(product: StoreProduct) {
  return {
    id: product.id,
    slug: product.slug,
    nameEn: product.nameEn,
    nameEs: product.nameEs,
    rpAmount: product.rpAmount,
    priceWpgg: product.priceWpgg,
  };
}
