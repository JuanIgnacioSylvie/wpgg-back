import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  MISSION_TEMPLATE_SEEDS,
  MISSION_TEMPLATE_SLUGS,
} from './data/mission-templates.data';
import { WELCOME_MISSION_TEMPLATE } from './data/welcome-mission-template.data';

type PrismaLike = PrismaService | PrismaClient;

async function upsertOne(db: PrismaLike, t: typeof MISSION_TEMPLATE_SEEDS[number]) {
  await db.missionTemplate.upsert({
    where: { slug: t.slug },
    create: { ...t, kind: t.kind ?? 'STANDARD', active: true },
    update: {
      category: t.category,
      kind: t.kind ?? 'STANDARD',
      difficulty: t.difficulty,
      ruleType: t.ruleType,
      titleEs: t.titleEs,
      titleEn: t.titleEn,
      subtitleEs: t.subtitleEs,
      subtitleEn: t.subtitleEn,
      targetJson: t.targetJson,
      rewardWpgg: t.rewardWpgg,
      sortOrder: t.sortOrder,
      active: true,
    },
  });
}

export async function upsertMissionTemplates(db: PrismaLike): Promise<void> {
  for (const t of MISSION_TEMPLATE_SEEDS) {
    await upsertOne(db, t);
  }

  await db.missionTemplate.updateMany({
    where: {
      kind: 'STANDARD',
      slug: { notIn: MISSION_TEMPLATE_SLUGS },
    },
    data: { active: false },
  });
}

export async function upsertWelcomeMissionTemplate(
  db: PrismaLike,
): Promise<void> {
  await upsertOne(db, WELCOME_MISSION_TEMPLATE);
}

export function countMissionTemplates(db: PrismaLike) {
  return db.missionTemplate.count({ where: { active: true, kind: 'STANDARD' } });
}
