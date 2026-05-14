import { createHash, randomUUID } from 'crypto';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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

export type EstablishRiotOauthSessionInput = { riotSub: string };

export type EstablishRiotOauthSessionOutput = {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

@Injectable()
export class EstablishRiotOauthSessionUseCase {
  constructor(
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
    input: EstablishRiotOauthSessionInput,
  ): Promise<EstablishRiotOauthSessionOutput> {
    const email = placeholderEmailForRiotSub(input.riotSub);
    let user = await this.userRepository.findByEmail(email);
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
