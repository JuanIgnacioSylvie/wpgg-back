import { createHash, randomUUID } from 'crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ApplyRiotPendingLinkUseCase } from '@modules/riot/application/use-cases/apply-riot-pending-link.use-case';
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
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  IEmailVerificationTokenRepository,
} from '../../domain/repositories/email-verification-token.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

export type VerifyEmailInput = {
  token: string;
};

export type VerifyEmailOutput = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly verificationTokens: IEmailVerificationTokenRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
    @Inject(JWT_PROVIDER)
    private readonly jwtProvider: IJwtProvider,
    private readonly applyRiotPendingLink: ApplyRiotPendingLinkUseCase,
  ) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const trimmed = input.token?.trim();
    if (!trimmed) {
      throw new BadRequestException('Missing verification token');
    }

    const codeHash = createHash('sha256').update(trimmed, 'utf8').digest('hex');
    const consumed =
      await this.verificationTokens.consumeActiveByCodeHash(codeHash);
    if (!consumed) {
      throw new BadRequestException(
        'Verification link expired or invalid',
      );
    }

    const user = await this.userRepository.findById(consumed.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isEmailVerified()) {
      const verified = user.withEmailVerifiedAt(new Date());
      try {
        await this.userRepository.save(verified);
      } catch {
        throw new InternalServerErrorException();
      }
    }

    if (consumed.riotLinkPendingCode?.trim()) {
      await this.applyRiotPendingLink.execute({
        userId: user.id,
        riotLinkPendingCode: consumed.riotLinkPendingCode,
      });
    }

    return this.issueTokensForUser(user.id);
  }

  private async issueTokensForUser(userId: string): Promise<VerifyEmailOutput> {
    try {
      await this.refreshTokenRepository.enforceMaxActiveTokensForUser(
        userId,
        5,
      );
    } catch {
      throw new InternalServerErrorException();
    }

    const rememberMe = false;
    const accessToken = this.jwtProvider.generateAccessToken(userId);
    const { token: rawRefreshToken, expiresAt } =
      this.jwtProvider.generateRefreshToken(userId, { rememberMe });
    const tokenHash = await this.hashProvider.hash(rawRefreshToken);

    const refreshEntity = RefreshTokenEntity.create({
      id: randomUUID(),
      tokenHash,
      userId,
      expiresAt,
    });

    try {
      await this.refreshTokenRepository.save(refreshEntity);
    } catch {
      throw new InternalServerErrorException();
    }

    return {
      userId,
      accessToken,
      refreshToken: rawRefreshToken,
      rememberMe,
    };
  }
}
