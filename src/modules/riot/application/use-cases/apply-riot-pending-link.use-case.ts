import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  IRiotPendingLinkExchangeCodeRepository,
  RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY,
} from '@modules/auth/domain/repositories/riot-pending-link-exchange-code.repository.interface';
import { LinkRiotAccountFromRsoUseCase } from './link-riot-account-from-rso.use-case';

export type ApplyRiotPendingLinkInput = {
  userId: string;
  riotLinkPendingCode: string;
};

@Injectable()
export class ApplyRiotPendingLinkUseCase {
  constructor(
    @Inject(RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY)
    private readonly pendingLinkCodes: IRiotPendingLinkExchangeCodeRepository,
    private readonly linkRiotFromRso: LinkRiotAccountFromRsoUseCase,
  ) {}

  async execute(input: ApplyRiotPendingLinkInput): Promise<void> {
    const trimmed = input.riotLinkPendingCode?.trim();
    if (!trimmed) {
      throw new BadRequestException('Missing Riot link code');
    }
    const codeHash = createHash('sha256').update(trimmed, 'utf8').digest('hex');
    const pending = await this.pendingLinkCodes.consumeActiveByCodeHash(
      codeHash,
    );
    if (!pending) {
      throw new BadRequestException(
        'Riot link expired or invalid. Sign in with Riot again.',
      );
    }
    await this.linkRiotFromRso.execute({
      userId: input.userId,
      accessToken: pending.accessToken,
      cpid: pending.cpid,
    });
  }
}
