import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TurnstileGuardService } from '@modules/auth/application/services/turnstile-guard.service';
import {
  EMAIL_PROVIDER,
  IEmailProvider,
} from '@modules/auth/domain/providers/email.provider.interface';

export type SubmitSupportRequestInput = {
  contactEmail: string;
  subject: string;
  message: string;
  turnstileToken?: string;
  clientPlatform?: string;
  remoteIp?: string;
};

@Injectable()
export class SubmitSupportRequestUseCase {
  private readonly logger = new Logger(SubmitSupportRequestUseCase.name);

  constructor(
    private readonly config: ConfigService,
    private readonly turnstileGuard: TurnstileGuardService,
    @Inject(EMAIL_PROVIDER)
    private readonly email: IEmailProvider,
  ) {}

  async execute(input: SubmitSupportRequestInput): Promise<void> {
    await this.turnstileGuard.assertForWebClient(
      input.turnstileToken,
      input.clientPlatform,
      input.remoteIp,
    );

    const inbox =
      this.config.get<string>('SUPPORT_INBOX_EMAIL')?.trim() ||
      this.config.get<string>('SPONSOR_INBOX_EMAIL')?.trim() ||
      'wpgg.support@gmail.com';

    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('EMAIL_FROM')?.trim();
    if (!apiKey || !from) {
      this.logger.error(
        'Support request rejected: RESEND_API_KEY or EMAIL_FROM not configured',
      );
      throw new BadRequestException(
        'El envío de consultas no está disponible en este momento',
      );
    }

    await this.email.sendSupportRequestEmail({
      to: inbox,
      contactEmail: input.contactEmail.trim().toLowerCase(),
      subject: input.subject.trim(),
      message: input.message.trim(),
    });
  }
}
