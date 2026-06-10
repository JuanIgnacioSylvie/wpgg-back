import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserMapper } from './mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const row = await this.prisma.user.upsert({
      where: { id: user.id },
      create: UserMapper.toPrisma(user),
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
        emailVerifiedAt: user.emailVerifiedAt,
        updatedAt: user.updatedAt,
      },
    });
    return UserMapper.toDomain(row);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const n = await this.prisma.user.count({ where: { email } });
    return n > 0;
  }
}
