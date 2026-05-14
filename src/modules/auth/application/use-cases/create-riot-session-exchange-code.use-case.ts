import { createHash, randomBytes } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IRiotSessionExchangeCodeRepository,
  RIOT_SESSION_EXCHANGE_CODE_REPOSITORY,
} from '../../domain/repositories/riot-session-exchange-code.repository.interface';

@Injectable()
export class CreateRiotSessionExchangeCodeUseCase {
  constructor(
    private readonly config: ConfigService,
    @Inject(RIOT_SESSION_EXCHANGE_CODE_REPOSITORY)
    private readonly codes: IRiotSessionExchangeCodeRepository,
  ) {}

  async execute(input: { userId: string }): Promise<{ code: string }> {
    const plain = randomBytes(24).toString('base64url');
    const codeHash = createHash('sha256').update(plain, 'utf8').digest('hex');
    const ttlConfigured = this.config.get<number>('RIOT_SESSION_CODE_TTL_SEC');
    const ttlSec = Math.min(
      86_400,
      Math.max(60, ttlConfigured ?? 600),
    );
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    await this.codes.create({
      codeHash,
      userId: input.userId,
      expiresAt,
    });
    return { code: plain };
  }
}
