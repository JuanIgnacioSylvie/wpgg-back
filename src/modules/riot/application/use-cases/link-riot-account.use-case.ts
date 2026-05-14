import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
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
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(RIOT_ACCOUNT_REPOSITORY)
    private readonly riotAccountRepository: IRiotAccountRepository,
    @Inject(RIOT_SERVICE)
    private readonly riotService: IRiotService,
  ) {}

  async execute(input: LinkRiotAccountInput): Promise<RiotAccountEntity> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException(
        'User not found. Sign in again or create a new account.',
      );
    }

    const existingByUser = await this.riotAccountRepository.findByUserId(
      input.userId,
    );
    if (existingByUser) {
      throw new ConflictException('User already has a linked Riot account');
    }

    const summoner = await this.riotService.getSummonerByRiotId(
      input.gameName,
      input.tagLine,
      input.region,
    );

    const existingByPuuid = await this.riotAccountRepository.findByPuuid(
      summoner.puuid,
    );
    if (existingByPuuid) {
      throw new ConflictException(
        'Riot account already linked to another user',
      );
    }

    const platformSummoner = await this.riotService.getSummonerByPuuid(
      summoner.puuid,
      input.region,
    );

    const entity = RiotAccountEntity.create({
      id: randomUUID(),
      userId: input.userId,
      puuid: summoner.puuid,
      gameName: summoner.gameName,
      tagLine: summoner.tagLine,
      region: input.region,
      summonerId: platformSummoner.summonerId,
      accountId: platformSummoner.accountId,
    });

    return this.riotAccountRepository.save(entity);
  }
}
