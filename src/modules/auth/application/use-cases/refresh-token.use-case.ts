import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { findRefreshTokenByPlain } from '../refresh-token-lookup';
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

export type RefreshTokenInput = { refreshToken: string };

export type RefreshTokenOutput = { accessToken: string; refreshToken: string };

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
    @Inject(JWT_PROVIDER)
    private readonly jwtProvider: IJwtProvider,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const claims = this.jwtProvider.verifyRefreshToken(input.refreshToken);
    if (!claims) {
      throw new UnauthorizedException('Unauthorized');
    }

    const candidates = await this.refreshTokenRepository.listByUserId(
      claims.userId,
    );

    const matched = await findRefreshTokenByPlain(
      input.refreshToken,
      candidates,
      this.hashProvider,
    );

    if (!matched) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (matched.revoked) {
      await this.refreshTokenRepository.revokeAllForUser(matched.userId);
      throw new UnauthorizedException('Unauthorized');
    }

    if (!matched.isValid()) {
      throw new UnauthorizedException('Unauthorized');
    }

    const accessToken = this.jwtProvider.generateAccessToken(matched.userId);
    const { token: newRawRefresh, expiresAt } =
      this.jwtProvider.generateRefreshToken(matched.userId);
    const tokenHash = await this.hashProvider.hash(newRawRefresh);

    const newEntity = RefreshTokenEntity.create({
      id: randomUUID(),
      tokenHash,
      userId: matched.userId,
      expiresAt,
    });

    try {
      await this.refreshTokenRepository.save(newEntity);
    } catch {
      throw new InternalServerErrorException();
    }

    try {
      await this.refreshTokenRepository.revoke(matched.id);
    } catch {
      throw new InternalServerErrorException();
    }

    return { accessToken, refreshToken: newRawRefresh };
  }
}
