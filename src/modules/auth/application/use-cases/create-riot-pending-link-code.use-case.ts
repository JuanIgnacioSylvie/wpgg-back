import { createHash, randomBytes } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IRiotPendingLinkExchangeCodeRepository,
  RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY,
} from '../../domain/repositories/riot-pending-link-exchange-code.repository.interface';

export type CreateRiotPendingLinkCodeInput = {
  riotSub: string;
  accessToken: string;
  cpid?: string;
};

@Injectable()
export class CreateRiotPendingLinkCodeUseCase {
  constructor(
    private readonly config: ConfigService,
    @Inject(RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY)
    private readonly codes: IRiotPendingLinkExchangeCodeRepository,
  ) {}

  async execute(input: CreateRiotPendingLinkCodeInput): Promise<{ code: string }> {
    const plain = randomBytes(24).toString('base64url');
    const codeHash = createHash('sha256').update(plain, 'utf8').digest('hex');
    const ttlConfigured = this.config.get<number>('RIOT_PENDING_LINK_CODE_TTL_SEC');
    const ttlSec = Math.min(
      86_400,
      Math.max(60, ttlConfigured ?? 1800),
    );
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    await this.codes.create({
      codeHash,
      riotSub: input.riotSub,
      accessToken: input.accessToken,
      cpid: input.cpid,
      expiresAt,
    });
    return { code: plain };
  }
}
