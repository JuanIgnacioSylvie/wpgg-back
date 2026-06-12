import { PrismaClient } from '@prisma/client';
import {
  upsertMissionTemplates,
  upsertWelcomeMissionTemplate,
} from '../src/modules/missions/infrastructure/mission-template.seed';

const prisma = new PrismaClient();

async function main() {
  const before = {
    userMissions: await prisma.userMission.count(),
    offers: await prisma.missionOffer.count(),
    days: await prisma.missionDay.count(),
    processedMatches: await prisma.processedMatch.count(),
  };

  await prisma.userMission.deleteMany({});
  await prisma.missionOffer.deleteMany({});
  await prisma.missionDay.deleteMany({});
  await prisma.processedMatch.deleteMany({});

  await upsertMissionTemplates(prisma);
  await upsertWelcomeMissionTemplate(prisma);

  await prisma.missionTemplate.updateMany({
    where: {
      OR: [
        { slug: { startsWith: 'legacy-' } },
        { kind: 'WELCOME', slug: { not: 'welcome' } },
      ],
    },
    data: { active: false },
  });

  const after = {
    activeTemplates: await prisma.missionTemplate.count({
      where: { active: true, kind: 'STANDARD' },
    }),
    welcomeTemplate: await prisma.missionTemplate.findUnique({
      where: { slug: 'welcome' },
      select: { id: true, rewardWpgg: true, active: true, titleEs: true },
    }),
    userMissions: await prisma.userMission.count(),
  };

  console.log(JSON.stringify({ before, after }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
