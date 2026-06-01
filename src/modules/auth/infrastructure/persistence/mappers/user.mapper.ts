import { User as PrismaUser } from '@prisma/client';
import { UserEntity } from '../../../domain/entities/user.entity';

export class UserMapper {
  static toDomain(row: PrismaUser): UserEntity {
    return new UserEntity(
      row.id,
      row.email,
      row.passwordHash,
      row.createdAt,
      row.updatedAt,
    );
  }

  static toPrisma(entity: UserEntity): Omit<PrismaUser, 'riotAccount' | 'refreshTokens'> {
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      timezone: null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
