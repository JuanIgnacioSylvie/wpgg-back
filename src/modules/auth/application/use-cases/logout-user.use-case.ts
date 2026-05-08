import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { findRefreshTokenByPlain } from '../refresh-token-lookup';
import {
  HASH_PROVIDER,
  IHashProvider,
} from '../../domain/providers/hash.provider.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';

export type LogoutUserInput = {
  userId: string;
  refreshTokenFromCookie: string | undefined;
  logoutAll: boolean;
};

@Injectable()
export class LogoutUserUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(input: LogoutUserInput): Promise<void> {
    if (input.logoutAll) {
      try {
        await this.refreshTokenRepository.revokeAllForUser(input.userId);
      } catch {
        throw new InternalServerErrorException();
      }
      return;
    }

    const cookie = input.refreshTokenFromCookie;
    if (!cookie) {
      return;
    }

    const candidates = await this.refreshTokenRepository.listByUserId(
      input.userId,
    );
    const matched = await findRefreshTokenByPlain(
      cookie,
      candidates,
      this.hashProvider,
    );

    if (!matched || matched.userId !== input.userId) {
      return;
    }

    try {
      await this.refreshTokenRepository.revoke(matched.id);
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
