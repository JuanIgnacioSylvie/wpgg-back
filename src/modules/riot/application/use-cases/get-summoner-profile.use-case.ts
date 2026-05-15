import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SummonerEntity } from '../../domain/entities/summoner.entity';

export type SummonerProfileResult = {
  summoner: SummonerEntity;
  gameName: string;
  tagLine: string;
  region: string;
};
import {
  IRiotAccountRepository,
  RIOT_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/riot-account.repository.interface';
import {
  IRiotService,
  RIOT_SERVICE,
} from '../../domain/services/riot.service.interface';

@Injectable()
export class GetSummonerProfileUseCase {
  constructor(
    @Inject(RIOT_ACCOUNT_REPOSITORY)
    private readonly riotAccountRepository: IRiotAccountRepository,
    @Inject(RIOT_SERVICE)
    private readonly riotService: IRiotService,
  ) {}

  async execute(userId: string): Promise<SummonerProfileResult> {
    const account = await this.riotAccountRepository.findByUserId(userId);
    if (!account) {
      throw new NotFoundException();
    }

    const dto = await this.riotService.getSummonerByPuuid(
      account.puuid,
      account.region,
    );
    return {
      summoner: new SummonerEntity(
        dto.puuid,
        dto.summonerId,
        dto.accountId,
        dto.profileIconId,
        dto.summonerLevel,
        dto.revisionDate,
      ),
      gameName: account.gameName,
      tagLine: account.tagLine,
      region: account.region,
    };
  }
}
