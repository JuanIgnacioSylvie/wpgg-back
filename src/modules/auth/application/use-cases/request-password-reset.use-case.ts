import { createHash, randomBytes } from 'crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMAIL_PROVIDER,
  IEmailProvider,
} from '../../domain/providers/email.provider.interface';
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../../domain/repositories/password-reset-token.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { isRsoPlaceholderEmail } from '../../domain/rso-placeholder-email';

export type RequestPasswordResetInput = { email: string };

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: IPasswordResetTokenRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);
    if (!user || isRsoPlaceholderEmail(user.email)) {
      return;
    }

    const resetBaseUrl = this.config
      .get<string>('PASSWORD_RESET_URL')
      ?.trim()
      ?.replace(/\/+$/, '');
    if (!resetBaseUrl) {
      this.logger.warn(
        'Password reset requested but PASSWORD_RESET_URL is not configured',
      );
      return;
    }

    const plain = randomBytes(24).toString('base64url');
    const codeHash = createHash('sha256').update(plain, 'utf8').digest('hex');
    const ttlConfigured = this.config.get<number>(
      'PASSWORD_RESET_TOKEN_TTL_SEC',
    );
    const ttlSec = Math.min(
      86_400,
      Math.max(300, ttlConfigured ?? 3600),
    );
    const expiresAt = new Date(Date.now() + ttlSec * 1000);

    await this.resetTokens.invalidateActiveForUser(user.id);
    await this.resetTokens.create({
      codeHash,
      userId: user.id,
      expiresAt,
    });

    const resetUrl = `${resetBaseUrl}?token=${encodeURIComponent(plain)}`;
    try {
      await this.emailProvider.sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
