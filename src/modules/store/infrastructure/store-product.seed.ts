import { Prisma, PrismaClient } from '@prisma/client';

export const STORE_PRODUCT_SEED = [
  {
    id: 'lol-gift-card-100rp',
    slug: 'lol-gift-card-100rp',
    nameEn: 'League of Legends Gift Card - 100 RP - Riot Key GLOBAL',
    nameEs: 'League of Legends Gift Card - 100 RP - Riot Key GLOBAL',
    rpAmount: 100,
    priceWpgg: 3500,
  },
  {
    id: 'lol-gift-card-575rp',
    slug: 'lol-gift-card-575rp',
    nameEn: 'League of Legends Gift Card - 575 RP - Riot Key GLOBAL',
    nameEs: 'League of Legends Gift Card - 575 RP - Riot Key GLOBAL',
    rpAmount: 575,
    priceWpgg: 6000,
  },
] as const;

const DEV_KEYS_PER_PRODUCT = 5;

export async function upsertStoreProducts(prisma: PrismaClient | Prisma.TransactionClient) {
  for (const product of STORE_PRODUCT_SEED) {
    await prisma.storeProduct.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        nameEs: product.nameEs,
        rpAmount: product.rpAmount,
        priceWpgg: product.priceWpgg,
        active: true,
      },
      update: {
        nameEn: product.nameEn,
        nameEs: product.nameEs,
        rpAmount: product.rpAmount,
        priceWpgg: product.priceWpgg,
        active: true,
      },
    });
  }
}

export async function seedStoreKeysIfEmpty(prisma: PrismaClient) {
  for (const product of STORE_PRODUCT_SEED) {
    const availableCount = await prisma.storeProductKey.count({
      where: { productId: product.id, status: 'AVAILABLE' },
    });
    if (availableCount > 0) {
      continue;
    }

    const keys = Array.from({ length: DEV_KEYS_PER_PRODUCT }, (_, index) => ({
      productId: product.id,
      keyValue: `RIOT-DEV-${product.rpAmount}-${String(index + 1).padStart(3, '0')}`,
      status: 'AVAILABLE' as const,
    }));

    await prisma.storeProductKey.createMany({ data: keys });
  }
}
