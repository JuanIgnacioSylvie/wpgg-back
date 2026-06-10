import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { MISSION_TEMPLATE_SEEDS } from './data/mission-templates.data';
import { WELCOME_MISSION_TEMPLATE } from './data/welcome-mission-template.data';

type PrismaLike = PrismaService | PrismaClient;

export async function upsertMissionTemplates(db: PrismaLike): Promise<void> {
  for (const t of MISSION_TEMPLATE_SEEDS) {
    const existing = await db.missionTemplate.findFirst({
      where: {
        ruleType: t.ruleType,
        difficulty: t.difficulty,
        kind: t.kind ?? 'STANDARD',
      },
    });
    if (existing) {
      await db.missionTemplate.update({
        where: { id: existing.id },
        data: {
          titleEs: t.titleEs,
          titleEn: t.titleEn,
          targetJson: t.targetJson,
          rewardWpgg: t.rewardWpgg,
          sortOrder: t.sortOrder,
        },
      });
    } else {
      await db.missionTemplate.create({
        data: { ...t, kind: t.kind ?? 'STANDARD' },
      });
    }
  }
}

export async function upsertWelcomeMissionTemplate(
  db: PrismaLike,
): Promise<void> {
  const t = WELCOME_MISSION_TEMPLATE;
  const existing = await db.missionTemplate.findFirst({
    where: { kind: 'WELCOME' },
  });
  if (existing) {
    await db.missionTemplate.update({
      where: { id: existing.id },
      data: {
        titleEs: t.titleEs,
        titleEn: t.titleEn,
        subtitleEs: t.subtitleEs,
        subtitleEn: t.subtitleEn,
        targetJson: t.targetJson,
        rewardWpgg: t.rewardWpgg,
        sortOrder: t.sortOrder,
        ruleType: t.ruleType,
      },
    });
  } else {
    await db.missionTemplate.create({
      data: { ...t, kind: 'WELCOME' },
    });
  }
}

export async function seedMarketPricesIfEmpty(db: PrismaLike): Promise<void> {
  const count = await db.wpggMarketPrice.count();
  if (count > 0) {
    return;
  }
  const base = 0.12;
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const jitter = (Math.sin(i) * 0.02 + i * 0.003) % 0.05;
    await db.wpggMarketPrice.create({
      data: {
        date: d,
        priceUsd: base + jitter,
      },
    });
  }
}

export function countMissionTemplates(db: PrismaLike) {
  return db.missionTemplate.count();
}
