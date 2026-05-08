import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RiotAccountEntity } from '../../domain/entities/riot-account.entity';
import {
  IRiotAccountRepository,
  RIOT_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/riot-account.repository.interface';
import {
  IRiotService,
  RIOT_SERVICE,
} from '../../domain/services/riot.service.interface';

export type LinkRiotAccountInput = {
  userId: string;
  gameName: string;
  tagLine: string;
  region: string;
};

@Injectable()
export class LinkRiotAccountUseCase {
  constructor(
    @Inject(RIOT_ACCOUNT_REPOSITORY)
    private readonly riotAccountRepository: IRiotAccountRepository,
    @Inject(RIOT_SERVICE)
    private readonly riotService: IRiotService,
  ) {}

  async execute(input: LinkRiotAccountInput): Promise<RiotAccountEntity> {
    const existingByUser = await this.riotAccountRepository.findByUserId(
      input.userId,
    );
    if (existingByUser) {
      throw new ConflictException('User already has a linked Riot account');
    }

    const account = await this.riotService.getAccountByRiotId(
      input.gameName,
      input.tagLine,
      input.region,
    );

    const existingByPuuid = await this.riotAccountRepository.findByPuuid(
      account.puuid,
    );
    if (existingByPuuid) {
      throw new ConflictException(
        'Riot account already linked to another user',
      );
    }

    const summoner = await this.riotService.getSummonerByPuuid(
      account.puuid,
      input.region,
    );

    const entity = RiotAccountEntity.create({
      id: randomUUID(),
      userId: input.userId,
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      region: input.region,
      summonerId: summoner.summonerId,
      accountId: summoner.accountId,
    });

    return this.riotAccountRepository.save(entity);
  }
}
