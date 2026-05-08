import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { RiotAccountEntity } from '../../domain/entities/riot-account.entity';
import { IRiotAccountRepository } from '../../domain/repositories/riot-account.repository.interface';
import { RiotAccountMapper } from './mappers/riot-account.mapper';

@Injectable()
export class PrismaRiotAccountRepository implements IRiotAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<RiotAccountEntity | null> {
    const row = await this.prisma.riotAccount.findUnique({
      where: { userId },
    });
    return row ? RiotAccountMapper.toDomain(row) : null;
  }

  async findByPuuid(puuid: string): Promise<RiotAccountEntity | null> {
    const row = await this.prisma.riotAccount.findUnique({
      where: { puuid },
    });
    return row ? RiotAccountMapper.toDomain(row) : null;
  }

  async save(account: RiotAccountEntity): Promise<RiotAccountEntity> {
    const row = await this.prisma.riotAccount.create({
      data: RiotAccountMapper.toPrisma(account),
    });
    return RiotAccountMapper.toDomain(row);
  }
}
