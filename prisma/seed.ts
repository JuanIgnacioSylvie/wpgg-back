import { PrismaClient } from '@prisma/client';
import {
  seedMarketPricesIfEmpty,
  upsertMissionTemplates,
} from '../src/modules/missions/infrastructure/mission-template.seed';
import {
  seedStoreKeysIfEmpty,
  upsertStoreProducts,
} from '../src/modules/store/infrastructure/store-product.seed';

const prisma = new PrismaClient();

async function main() {
  await upsertMissionTemplates(prisma);
  await seedMarketPricesIfEmpty(prisma);
  await upsertStoreProducts(prisma);
  await seedStoreKeysIfEmpty(prisma);
  console.log(
    'Seed completed: mission templates + market prices + store catalog',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
