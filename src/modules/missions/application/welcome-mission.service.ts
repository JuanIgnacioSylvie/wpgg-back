import { Injectable } from '@nestjs/common';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

@Injectable()
export class WelcomeMissionService {
  constructor(private readonly repo: PrismaMissionsRepository) {}

  async ensureForUser(userId: string, missionDayId: string) {
    const existing = await this.repo.findWelcomeMissionForUser(userId);
    if (existing) {
      return existing;
    }

    const template = await this.repo.findWelcomeTemplate();
    if (!template) {
      return null;
    }

    return this.repo.createUserMission({
      missionDayId,
      templateId: template.id,
      status: 'ACTIVE',
      withExpiry: false,
    });
  }
}
