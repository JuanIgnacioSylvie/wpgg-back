import { Injectable } from '@nestjs/common';
import {
  MissionDifficulty,
  MissionOffer,
  MissionTemplate,
  Prisma,
  UserMission,
  UserMissionStatus,
} from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export type MissionDayWithRelations = Prisma.MissionDayGetPayload<{
  include: {
    offers: { include: { template: true; userMission: true } };
    userMissions: { include: { template: true } };
  };
}>;

/** Normalizes calendar dates so Prisma @db.Date lookups stay consistent. */
export function normalizeCalendarDate(calendarDate: Date): Date {
  const iso = calendarDate.toISOString().slice(0, 10);
  return new Date(`${iso}T12:00:00.000Z`);
}

@Injectable()
export class PrismaMissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTemplatesByDifficulty(difficulty: MissionDifficulty) {
    return this.prisma.missionTemplate.findMany({
      where: { difficulty, kind: 'STANDARD', active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findTemplateById(id: string) {
    return this.prisma.missionTemplate.findUnique({ where: { id } });
  }

  countMissionTemplates() {
    return this.prisma.missionTemplate.count();
  }

  async getOrCreateMissionDay(userId: string, calendarDate: Date) {
    const day = normalizeCalendarDate(calendarDate);
    const existing = await this.prisma.missionDay.findUnique({
      where: {
        userId_calendarDate: { userId, calendarDate: day },
      },
      include: {
        offers: { include: { template: true, userMission: true } },
        userMissions: { include: { template: true } },
      },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.missionDay.create({
      data: { userId, calendarDate: day },
      include: {
        offers: { include: { template: true, userMission: true } },
        userMissions: { include: { template: true } },
      },
    });
  }

  findMissionDay(userId: string, calendarDate: Date) {
    const day = normalizeCalendarDate(calendarDate);
    return this.prisma.missionDay.findUnique({
      where: { userId_calendarDate: { userId, calendarDate: day } },
      include: {
        offers: { include: { template: true, userMission: true } },
        userMissions: { include: { template: true } },
      },
    });
  }

  findMissionDaysInRange(userId: string, from: Date, to: Date) {
    return this.prisma.missionDay.findMany({
      where: {
        userId,
        calendarDate: { gte: from, lte: to },
      },
      include: {
        offers: { include: { template: true, userMission: true } },
        userMissions: { include: { template: true } },
      },
      orderBy: { calendarDate: 'desc' },
    });
  }

  countOffers(missionDayId: string) {
    return this.prisma.missionOffer.count({ where: { missionDayId } });
  }

  createOffers(
    missionDayId: string,
    offers: Array<{
      templateId: string;
      slot: number;
      championId?: number;
      rerolledFromOfferId?: string;
    }>,
  ) {
    return this.prisma.missionOffer.createMany({
      data: offers.map((o) => ({
        missionDayId,
        templateId: o.templateId,
        slot: o.slot,
        championId: o.championId,
        rerolledFromOfferId: o.rerolledFromOfferId,
      })),
    });
  }

  findOfferById(offerId: string) {
    return this.prisma.missionOffer.findUnique({
      where: { id: offerId },
      include: {
        template: true,
        missionDay: true,
        userMission: true,
      },
    });
  }

  updateOfferTemplate(offerId: string, templateId: string, championId?: number) {
    return this.prisma.missionOffer.update({
      where: { id: offerId },
      data: { templateId, championId: championId ?? null },
      include: { template: true },
    });
  }

  countActiveMissionsForDay(missionDayId: string) {
    return this.prisma.userMission.count({
      where: {
        missionDayId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        template: { kind: 'STANDARD' },
      },
    });
  }

  countHardActiveForDay(missionDayId: string) {
    return this.prisma.userMission.count({
      where: {
        missionDayId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        template: { difficulty: 'HARD', kind: 'STANDARD' },
      },
    });
  }

  findWelcomeTemplate() {
    return this.prisma.missionTemplate.findFirst({
      where: { kind: 'WELCOME', slug: 'welcome', active: true },
    });
  }

  findWelcomeMissionForUser(userId: string) {
    return this.prisma.userMission.findFirst({
      where: {
        missionDay: { userId },
        template: { kind: 'WELCOME' },
      },
      include: { template: true, missionDay: true, offer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  countRegisteredPuuids(puuids: string[]) {
    if (puuids.length === 0) {
      return Promise.resolve(0);
    }
    const normalized = [...new Set(puuids.map((p) => p.toLowerCase()))];
    return this.prisma.riotAccount.count({
      where: {
        OR: normalized.map((puuid) => ({
          puuid: { equals: puuid, mode: 'insensitive' as const },
        })),
      },
    });
  }

  createUserMission(data: {
    missionDayId: string;
    templateId: string;
    offerId?: string | null;
    status: UserMissionStatus;
    championId?: number;
  }) {
    return this.prisma.userMission.create({
      data: {
        missionDayId: data.missionDayId,
        templateId: data.templateId,
        offerId: data.offerId ?? null,
        status: data.status,
        progressJson: {},
        acceptedAt: data.status === 'ACTIVE' ? new Date() : undefined,
      },
      include: { template: true },
    });
  }

  findUserMissionById(id: string) {
    return this.prisma.userMission.findUnique({
      where: { id },
      include: { template: true, missionDay: true, offer: true },
    });
  }

  deleteUserMission(id: string) {
    return this.prisma.userMission.delete({ where: { id } });
  }

  findActiveMissionsForUser(userId: string) {
    return this.prisma.userMission.findMany({
      where: {
        status: UserMissionStatus.ACTIVE,
        missionDay: { userId },
      },
      include: { template: true, missionDay: true, offer: true },
      orderBy: { acceptedAt: 'asc' },
    });
  }

  findPastMissions(userId: string, limit = 50) {
    return this.prisma.userMission.findMany({
      where: {
        status: { in: ['COMPLETED', 'EXPIRED'] },
        missionDay: { userId },
      },
      include: { template: true, missionDay: true },
      orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
  }

  updateUserMissionProgress(
    id: string,
    progressPercent: number,
    progressJson: Prisma.InputJsonValue,
    status?: UserMissionStatus,
  ) {
    return this.prisma.userMission.update({
      where: { id },
      data: {
        progressPercent,
        progressJson,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
      include: { template: true },
    });
  }

  expireActiveMissionsBeforeDate(beforeDate: Date) {
    return this.prisma.userMission.updateMany({
      where: {
        status: 'ACTIVE',
        missionDay: { calendarDate: { lt: beforeDate } },
        template: { kind: 'STANDARD' },
      },
      data: { status: 'EXPIRED' },
    });
  }

  isMatchProcessed(userId: string, matchId: string) {
    return this.prisma.processedMatch.findUnique({
      where: { userId_matchId: { userId, matchId } },
    });
  }

  markMatchProcessed(userId: string, matchId: string) {
    return this.prisma.processedMatch.create({
      data: { userId, matchId },
    });
  }

  findRiotAccount(userId: string) {
    return this.prisma.riotAccount.findUnique({ where: { userId } });
  }

  listUsersWithActiveMissions() {
    return this.prisma.userMission.findMany({
      where: { status: 'ACTIVE' },
      select: { missionDay: { select: { userId: true } } },
      distinct: ['missionDayId'],
    });
  }
}
