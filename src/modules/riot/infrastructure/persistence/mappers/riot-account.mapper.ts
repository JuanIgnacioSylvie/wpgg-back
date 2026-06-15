import { RiotAccount as PrismaRiotAccount } from '@prisma/client';
import { RiotAccountEntity } from '../../../domain/entities/riot-account.entity';

export class RiotAccountMapper {
  static toDomain(row: PrismaRiotAccount): RiotAccountEntity {
    return new RiotAccountEntity(
      row.id,
      row.userId,
      row.puuid,
      row.gameName,
      row.tagLine,
      row.region,
      row.summonerId,
      row.accountId,
      row.linkedAt,
    );
  }

  static toPrisma(
    entity: RiotAccountEntity,
  ): Omit<PrismaRiotAccount, 'user'> {
    return {
      id: entity.id,
      userId: entity.userId,
      puuid: entity.puuid,
      gameName: entity.gameName,
      tagLine: entity.tagLine,
      region: entity.region,
      summonerId: entity.summonerId,
      accountId: entity.accountId,
      profileIconId: null,
      linkedAt: entity.linkedAt,
      lastSyncedAt: null,
      latestMatchId: null,
    };
  }
}
