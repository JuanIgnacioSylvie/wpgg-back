import { createHash, randomUUID } from 'crypto';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { RsoIntent } from '@modules/riot/domain/rso-intent';
import { RSO_INTENT_ERROR } from '@modules/riot/domain/rso-intent';
import {
  IRiotAccountRepository,
  RIOT_ACCOUNT_REPOSITORY,
} from '@modules/riot/domain/repositories/riot-account.repository.interface';
import {
  IRiotSignOnService,
  RIOT_SIGN_ON_SERVICE,
} from '@modules/riot/domain/services/riot-sign-on.service.interface';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { UserEntity } from '../../domain/entities/user.entity';
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
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

/** Deterministic placeholder email for Riot `sub` (no DB migration). */
export function placeholderEmailForRiotSub(riotSub: string): string {
  const h = createHash('sha256').update(riotSub, 'utf8').digest('hex');
  return `rso-${h}@accounts.wpgg.local`;
}

export type EstablishRiotOauthSessionInput = {
  riotSub: string;
  intent: RsoIntent;
  /** RSO access token — used to resolve linked [RiotAccount] by puuid on login/register. */
  rsoAccessToken?: string;
};

export type EstablishRiotOauthSessionSuccess = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

export type EstablishRiotOauthSessionError = {
  error: (typeof RSO_INTENT_ERROR)[keyof typeof RSO_INTENT_ERROR];
};

export type EstablishRiotOauthSessionResult =
  | EstablishRiotOauthSessionSuccess
  | EstablishRiotOauthSessionError;

export function isEstablishRiotOauthSessionError(
  result: EstablishRiotOauthSessionResult,
): result is EstablishRiotOauthSessionError {
  return 'error' in result;
}

@Injectable()
export class EstablishRiotOauthSessionUseCase {
  private readonly logger = new Logger(EstablishRiotOauthSessionUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(RIOT_ACCOUNT_REPOSITORY)
    private readonly riotAccountRepository: IRiotAccountRepository,
    @Inject(RIOT_SIGN_ON_SERVICE)
    private readonly riotSignOn: IRiotSignOnService,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
    @Inject(JWT_PROVIDER)
    private readonly jwtProvider: IJwtProvider,
  ) {}

  async issueSessionForExistingUser(
    userId: string,
  ): Promise<EstablishRiotOauthSessionSuccess> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new InternalServerErrorException();
    }
    return this.issueTokensForUser(user);
  }

  async execute(
    input: EstablishRiotOauthSessionInput,
  ): Promise<EstablishRiotOauthSessionResult> {
    const email = placeholderEmailForRiotSub(input.riotSub);
    const placeholderUser = await this.userRepository.findByEmail(email);
    const riotPuuid = await this.resolveRiotPuuid(input.rsoAccessToken);
    const linkedByPuuid = riotPuuid
      ? await this.riotAccountRepository.findByPuuid(riotPuuid)
      : null;

    if (input.intent === 'login') {
      let user = placeholderUser;
      if (!user && linkedByPuuid) {
        user = await this.userRepository.findById(linkedByPuuid.userId);
      }
      if (!user) {
        return { error: RSO_INTENT_ERROR.USER_NOT_FOUND };
      }
      return this.issueTokensForUser(user);
    }

    if (input.intent === 'register') {
      if (placeholderUser || linkedByPuuid) {
        return { error: RSO_INTENT_ERROR.USER_ALREADY_EXISTS };
      }
    }

    let user = placeholderUser;
    if (!user) {
      const passwordHash = await this.hashProvider.hash(randomUUID());
      const userId = randomUUID();
      const created = UserEntity.create({
        id: userId,
        email,
        passwordHash,
      });
      try {
        user = await this.userRepository.save(created);
      } catch {
        throw new InternalServerErrorException();
      }
    }

    return this.issueTokensForUser(user);
  }

  private async resolveRiotPuuid(
    rsoAccessToken?: string,
  ): Promise<string | undefined> {
    const token = rsoAccessToken?.trim();
    if (!token) {
      return undefined;
    }
    try {
      const accountMe = await this.riotSignOn.getAccountMe(token);
      return accountMe.puuid?.trim() || undefined;
    } catch (err) {
      this.logger.warn(
        `RSO accounts/me for session lookup failed: ${
          err instanceof Error ? err.message : err
        }`,
      );
      return undefined;
    }
  }

  private async issueTokensForUser(
    user: UserEntity,
  ): Promise<EstablishRiotOauthSessionSuccess> {
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

    return {
      userId: user.id,
      accessToken,
      refreshToken: rawRefreshToken,
      rememberMe,
    };
  }
}
