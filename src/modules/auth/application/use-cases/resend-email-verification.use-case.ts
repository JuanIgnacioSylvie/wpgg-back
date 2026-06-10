import { createHash, randomBytes } from 'crypto';
import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMAIL_PROVIDER,
  IEmailProvider,
} from '../../domain/providers/email.provider.interface';
import { isRsoPlaceholderEmail } from '../../domain/rso-placeholder-email';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  IEmailVerificationTokenRepository,
} from '../../domain/repositories/email-verification-token.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { TurnstileGuardService } from '../services/turnstile-guard.service';

export type ResendEmailVerificationInput = {
  email: string;
  turnstileToken?: string;
  clientPlatform?: string;
  remoteIp?: string;
};

@Injectable()
export class ResendEmailVerificationUseCase {
  private readonly logger = new Logger(ResendEmailVerificationUseCase.name);

  constructor(
    private readonly config: ConfigService,
    private readonly turnstileGuard: TurnstileGuardService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly verificationTokens: IEmailVerificationTokenRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(input: ResendEmailVerificationInput): Promise<void> {
    await this.turnstileGuard.assertForWebClient(
      input.turnstileToken,
      input.clientPlatform,
      input.remoteIp,
    );

    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);
    if (
      !user ||
      isRsoPlaceholderEmail(user.email) ||
      user.isEmailVerified()
    ) {
      return;
    }

    const verifyBaseUrl = this.config
      .get<string>('EMAIL_VERIFICATION_URL')
      ?.trim()
      ?.replace(/\/+$/, '');
    if (!verifyBaseUrl) {
      this.logger.warn(
        'Resend verification requested but EMAIL_VERIFICATION_URL is not configured',
      );
      return;
    }

    const plain = randomBytes(24).toString('base64url');
    const codeHash = createHash('sha256').update(plain, 'utf8').digest('hex');
    const ttlConfigured = this.config.get<number>(
      'EMAIL_VERIFICATION_TOKEN_TTL_SEC',
    );
    const ttlSec = Math.min(
      86_400,
      Math.max(300, ttlConfigured ?? 86_400),
    );
    const expiresAt = new Date(Date.now() + ttlSec * 1000);

    await this.verificationTokens.invalidateActiveForUser(user.id);
    await this.verificationTokens.create({
      codeHash,
      userId: user.id,
      expiresAt,
    });

    const verifyUrl = `${verifyBaseUrl}?token=${encodeURIComponent(plain)}`;
    try {
      await this.emailProvider.sendEmailVerification({
        to: user.email,
        verifyUrl,
      });
    } catch (err) {
      this.logger.error(
        `Failed to resend verification email to ${user.email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
