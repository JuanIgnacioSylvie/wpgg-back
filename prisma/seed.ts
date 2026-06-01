import {
  MissionDifficulty,
  MissionRuleType,
  Prisma,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

const templates: Array<{
  difficulty: MissionDifficulty;
  ruleType: MissionRuleType;
  titleEs: string;
  titleEn: string;
  targetJson: Prisma.InputJsonValue;
  rewardWpgg: number;
  sortOrder: number;
}> = [
  {
    difficulty: 'EASY',
    ruleType: 'WIN_EACH_ROLE',
    titleEs:
      'Gana una partida en cada rol (Top, Jungla, Mid, ADC, Soporte)',
    titleEn:
      'Win one game in each role (Top, Jungle, Mid, ADC, Support)',
    targetJson: { rolesRequired: 5 },
    rewardWpgg: 5,
    sortOrder: 1,
  },
  {
    difficulty: 'EASY',
    ruleType: 'DAILY_CS',
    titleEs: 'Farmea 3.000 CS a lo largo del día',
    titleEn: 'Farm 3,000 CS throughout the day',
    targetJson: { csTotal: 3000 },
    rewardWpgg: 5,
    sortOrder: 2,
  },
  {
    difficulty: 'EASY',
    ruleType: 'GAMES_VISION_MIN',
    titleEs: 'Termina 5 partidas con más de 100 puntos de visión',
    titleEn: 'Finish 5 games with more than 100 vision score',
    targetJson: { gamesRequired: 5, visionMin: 100 },
    rewardWpgg: 5,
    sortOrder: 3,
  },
  {
    difficulty: 'EASY',
    ruleType: 'GAMES_KP_MIN',
    titleEs: 'Termina 5 partidas con kill participation mayor al 80%',
    titleEn: 'Finish 5 games with kill participation above 80%',
    targetJson: { gamesRequired: 5, kpMin: 0.8 },
    rewardWpgg: 5,
    sortOrder: 4,
  },
  {
    difficulty: 'EASY',
    ruleType: 'CHAMPION_GAMES_WINS',
    titleEs: 'Juega 10 partidas con un campeón aleatorio y gana al menos 6',
    titleEn:
      'Play 10 games with a random champion and win at least 6',
    targetJson: { gamesRequired: 10, winsRequired: 6 },
    rewardWpgg: 5,
    sortOrder: 5,
  },
  {
    difficulty: 'EASY',
    ruleType: 'DAILY_WARDS_DESTROYED',
    titleEs: 'Destruye 50 wards a lo largo del día',
    titleEn: 'Destroy 50 wards throughout the day',
    targetJson: { wardsTotal: 50 },
    rewardWpgg: 5,
    sortOrder: 6,
  },
  {
    difficulty: 'MEDIUM',
    ruleType: 'DAILY_CS',
    titleEs: 'Farmea 5.000 CS a lo largo del día',
    titleEn: 'Farm 5,000 CS throughout the day',
    targetJson: { csTotal: 5000 },
    rewardWpgg: 15,
    sortOrder: 7,
  },
  {
    difficulty: 'MEDIUM',
    ruleType: 'GAMES_KP_MIN',
    titleEs: 'Termina 5 partidas con kill participation del 100%',
    titleEn: 'Finish 5 games with 100% kill participation',
    targetJson: { gamesRequired: 5, kpMin: 1 },
    rewardWpgg: 15,
    sortOrder: 8,
  },
  {
    difficulty: 'MEDIUM',
    ruleType: 'GAMES_VISION_MIN',
    titleEs: 'Termina 5 partidas con más de 150 puntos de visión',
    titleEn: 'Finish 5 games with more than 150 vision score',
    targetJson: { gamesRequired: 5, visionMin: 150 },
    rewardWpgg: 15,
    sortOrder: 9,
  },
  {
    difficulty: 'MEDIUM',
    ruleType: 'GAMES_DAMAGE_TAKEN_WINS',
    titleEs: 'Recibe más de 100.000 de daño en 5 victorias',
    titleEn: 'Take more than 100,000 damage in 5 wins',
    targetJson: { winsRequired: 5, damageTakenMin: 100000 },
    rewardWpgg: 15,
    sortOrder: 10,
  },
  {
    difficulty: 'MEDIUM',
    ruleType: 'SINGLE_GAME_HEAL_DAMAGE',
    titleEs: 'Cura y realiza 35.000 de daño en una misma partida',
    titleEn: 'Heal and deal 35,000 damage in a single game',
    targetJson: { combinedMin: 35000 },
    rewardWpgg: 15,
    sortOrder: 11,
  },
  {
    difficulty: 'MEDIUM',
    ruleType: 'DAILY_WARDS_DESTROYED',
    titleEs: 'Destruye 150 wards a lo largo del día',
    titleEn: 'Destroy 150 wards throughout the day',
    targetJson: { wardsTotal: 150 },
    rewardWpgg: 15,
    sortOrder: 12,
  },
  {
    difficulty: 'HARD',
    ruleType: 'WIN_STREAK_NO_DEATH',
    titleEs:
      'Consigue una racha de 10 victorias seguidas sin morir en ninguna de ellas',
    titleEn: 'Get a 10-win streak without dying in any of them',
    targetJson: { streakWins: 10 },
    rewardWpgg: 100,
    sortOrder: 13,
  },
  {
    difficulty: 'HARD',
    ruleType: 'DAILY_CS',
    titleEs: 'Farmea 6.000 CS a lo largo del día',
    titleEn: 'Farm 6,000 CS throughout the day',
    targetJson: { csTotal: 6000 },
    rewardWpgg: 100,
    sortOrder: 14,
  },
  {
    difficulty: 'HARD',
    ruleType: 'GAMES_WIN_STREAK_PENTAKILL',
    titleEs:
      'Gana 5 partidas seguidas y consigue al menos un pentakill en 2 de ellas',
    titleEn:
      'Win 5 games in a row and get at least one pentakill in 2 of them',
    targetJson: { streakWins: 5, pentasInStreak: 2 },
    rewardWpgg: 100,
    sortOrder: 15,
  },
  {
    difficulty: 'HARD',
    ruleType: 'WIN_STREAK_EACH_ROLE_NO_DEATH',
    titleEs:
      'Gana 5 partidas seguidas en cada rol sin morir en ninguna',
    titleEn:
      'Win 5 games in a row in each role (Top, Jungle, Mid, ADC, Support) without dying in any',
    targetJson: { streakPerRole: 5, rolesRequired: 5 },
    rewardWpgg: 100,
    sortOrder: 16,
  },
  {
    difficulty: 'HARD',
    ruleType: 'DAILY_WARDS_DESTROYED',
    titleEs: 'Destruye 200 wards a lo largo del día',
    titleEn: 'Destroy 200 wards throughout the day',
    targetJson: { wardsTotal: 200 },
    rewardWpgg: 100,
    sortOrder: 17,
  },
];

async function seedMarketPrices() {
  const count = await prisma.wpggMarketPrice.count();
  if (count > 0) {
    return;
  }
  const base = 0.12;
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const jitter = (Math.sin(i) * 0.02 + i * 0.003) % 0.05;
    await prisma.wpggMarketPrice.create({
      data: {
        date: d,
        priceUsd: base + jitter,
      },
    });
  }
}

async function main() {
  for (const t of templates) {
    const existing = await prisma.missionTemplate.findFirst({
      where: { ruleType: t.ruleType, difficulty: t.difficulty },
    });
    if (existing) {
      await prisma.missionTemplate.update({
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
      await prisma.missionTemplate.create({ data: t });
    }
  }
  await seedMarketPrices();
  console.log('Seed completed: mission templates + market prices');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
