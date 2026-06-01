import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { MISSION_TEMPLATE_SEEDS } from './data/mission-templates.data';

type PrismaLike = PrismaService | PrismaClient;

export async function upsertMissionTemplates(db: PrismaLike): Promise<void> {
  for (const t of MISSION_TEMPLATE_SEEDS) {
    const existing = await db.missionTemplate.findFirst({
      where: { ruleType: t.ruleType, difficulty: t.difficulty },
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
      await db.missionTemplate.create({ data: t });
    }
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
