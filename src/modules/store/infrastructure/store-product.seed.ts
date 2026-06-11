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

export const STORE_PRODUCT_KEYS: Record<string, readonly string[]> = {
  'lol-gift-card-100rp': [
    'RA-F2G4SATX22US65VS',
    'RA-BXHE9U6XXN9ZYHFF',
    'RA-2J9DUTCYMU74NSPQ',
    'RA-WPEQ6ARNQEJ89CRC',
    'RA-S3Q6D6D455VU9HGL',
  ],
  'lol-gift-card-575rp': [
    'RA-KU9E4ZFX6MEW3B5D',
    'RA-7L6RYCLM4C5EB4BY',
    'RA-Z8SX7S65VSX4GR53',
    'RA-DUTAN7QRDAZXG9JM',
    'RA-RLF54TGNNYP7PKHH',
  ],
};

export async function upsertStoreProducts(
  prisma: PrismaClient | Prisma.TransactionClient,
) {
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

export async function upsertStoreProductKeys(prisma: PrismaClient) {
  for (const product of STORE_PRODUCT_SEED) {
    const keys = STORE_PRODUCT_KEYS[product.id] ?? [];
    for (const keyValue of keys) {
      const existing = await prisma.storeProductKey.findFirst({
        where: { productId: product.id, keyValue },
      });
      if (!existing) {
        await prisma.storeProductKey.create({
          data: {
            productId: product.id,
            keyValue,
            status: 'AVAILABLE',
          },
        });
      }
    }
  }

  await prisma.storeProductKey.deleteMany({
    where: {
      keyValue: { startsWith: 'RIOT-DEV-' },
      status: 'AVAILABLE',
    },
  });
}

/** @deprecated Use upsertStoreProductKeys */
export async function seedStoreKeysIfEmpty(prisma: PrismaClient) {
  await upsertStoreProductKeys(prisma);
}
