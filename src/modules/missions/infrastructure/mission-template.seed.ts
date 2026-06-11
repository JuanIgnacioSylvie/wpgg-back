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

function utcDateDaysAgo(daysAgo: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo),
  );
}

/** Upserts the last 14 UTC days so chart queries always have recent points. */
export async function ensureMarketPrices(db: PrismaLike): Promise<void> {
  const base = 0.12;
  for (let i = 13; i >= 0; i--) {
    const date = utcDateDaysAgo(i);
    const jitter = (Math.sin(i) * 0.02 + i * 0.003) % 0.05;
    const priceUsd = base + jitter;
    await db.wpggMarketPrice.upsert({
      where: { date },
      create: { date, priceUsd },
      update: { priceUsd },
    });
  }
}

/** @deprecated Use ensureMarketPrices */
export async function seedMarketPricesIfEmpty(db: PrismaLike): Promise<void> {
  await ensureMarketPrices(db);
}

export function countMissionTemplates(db: PrismaLike) {
  return db.missionTemplate.count();
}
