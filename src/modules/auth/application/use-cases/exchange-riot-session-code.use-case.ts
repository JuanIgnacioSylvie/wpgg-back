import { createHash, randomUUID } from 'crypto';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import {
  HASH_PROVIDER,
  IHashProvider,
} from '../../domain/providers/hash.provider.interface';
import {
  IJwtProvider,
  JWT_PROVIDER,
} from '../../domain/providers/jwt.provider.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import {
  IRiotSessionExchangeCodeRepository,
  RIOT_SESSION_EXCHANGE_CODE_REPOSITORY,
} from '../../domain/repositories/riot-session-exchange-code.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

export type ExchangeRiotSessionCodeInput = { code: string };

export type ExchangeRiotSessionCodeOutput = {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

@Injectable()
export class ExchangeRiotSessionCodeUseCase {
  constructor(
    @Inject(RIOT_SESSION_EXCHANGE_CODE_REPOSITORY)
    private readonly codes: IRiotSessionExchangeCodeRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
    @Inject(JWT_PROVIDER)
    private readonly jwtProvider: IJwtProvider,
  ) {}

  async execute(
    input: ExchangeRiotSessionCodeInput,
  ): Promise<ExchangeRiotSessionCodeOutput> {
    const trimmed = input.code?.trim();
    if (!trimmed) {
      throw new UnauthorizedException('Invalid or expired session code');
    }
    const codeHash = createHash('sha256').update(trimmed, 'utf8').digest('hex');
    const consumed = await this.codes.consumeActiveByCodeHash(codeHash);
    if (!consumed) {
      throw new UnauthorizedException('Invalid or expired session code');
    }

    const user = await this.userRepository.findById(consumed.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session code');
    }

    try {
      await this.refreshTokenRepository.revokeAllForUser(user.id);
    } catch {
      throw new InternalServerErrorException();
    }

    try {
      await this.refreshTokenRepository.enforceMaxActiveTokensForUser(
        user.id,
        5,
      );
    } catch {
      throw new InternalServerErrorException();
    }

    const rememberMe = false;
    const accessToken = this.jwtProvider.generateAccessToken(user.id);
    const { token: rawRefreshToken, expiresAt } =
      this.jwtProvider.generateRefreshToken(user.id, { rememberMe });
    const tokenHash = await this.hashProvider.hash(rawRefreshToken);

    const refreshEntity = RefreshTokenEntity.create({
      id: randomUUID(),
      tokenHash,
      userId: user.id,
      expiresAt,
    });

    try {
      await this.refreshTokenRepository.save(refreshEntity);
    } catch {
      throw new InternalServerErrorException();
    }

    return { accessToken, refreshToken: rawRefreshToken, rememberMe };
  }
}
