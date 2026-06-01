import { PrismaClient } from '@prisma/client';
import {
  seedMarketPricesIfEmpty,
  upsertMissionTemplates,
} from '../src/modules/missions/infrastructure/mission-template.seed';

const prisma = new PrismaClient();

async function main() {
  await upsertMissionTemplates(prisma);
  await seedMarketPricesIfEmpty(prisma);
  console.log('Seed completed: mission templates + market prices');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
