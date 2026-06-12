import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaProfileRepository } from '../infrastructure/persistence/prisma-profile.repository';

@Injectable()
export class GetProfileSettingsUseCase {
  constructor(private readonly repo: PrismaProfileRepository) {}

  async execute(userId: string) {
    const user = await this.repo.getProfileSettings(userId);
    if (!user) {
      throw new NotFoundException();
    }
    return { profilePublic: user.profilePublic };
  }
}
