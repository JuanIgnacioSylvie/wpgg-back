import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  getProfileSettings(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePublic: true },
    });
  }

  updateProfileSettings(userId: string, profilePublic: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePublic },
      select: { profilePublic: true },
    });
  }

  findUserForProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profilePublic: true,
        riotAccount: {
          select: {
            gameName: true,
            tagLine: true,
            region: true,
            profileIconId: true,
          },
        },
        wpggWallet: { select: { balance: true } },
      },
    });
  }

  findLeaderboard(limit: number) {
    return this.prisma.user.findMany({
      where: {
        profilePublic: true,
        riotAccount: { isNot: null },
        wpggWallet: { isNot: null },
      },
      orderBy: { wpggWallet: { balance: 'desc' } },
      take: limit,
      select: {
        id: true,
        wpggWallet: { select: { balance: true } },
        riotAccount: {
          select: {
            gameName: true,
            tagLine: true,
            region: true,
            profileIconId: true,
          },
        },
      },
    });
  }
}
