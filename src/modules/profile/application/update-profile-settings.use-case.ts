import { Injectable } from '@nestjs/common';
import { PrismaProfileRepository } from '../infrastructure/persistence/prisma-profile.repository';

@Injectable()
export class UpdateProfileSettingsUseCase {
  constructor(private readonly repo: PrismaProfileRepository) {}

  execute(userId: string, profilePublic: boolean) {
    return this.repo.updateProfileSettings(userId, profilePublic);
  }
}
