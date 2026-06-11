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

export type SubmitSponsorProposalInput = {
  companyName: string;
  contactEmail: string;
  message: string;
  turnstileToken?: string;
  clientPlatform?: string;
  remoteIp?: string;
};

@Injectable()
export class SubmitSponsorProposalUseCase {
  private readonly logger = new Logger(SubmitSponsorProposalUseCase.name);

  constructor(
    private readonly config: ConfigService,
    private readonly turnstileGuard: TurnstileGuardService,
    @Inject(EMAIL_PROVIDER)
    private readonly email: IEmailProvider,
  ) {}

  async execute(input: SubmitSponsorProposalInput): Promise<void> {
    await this.turnstileGuard.assertForWebClient(
      input.turnstileToken,
      input.clientPlatform,
      input.remoteIp,
    );

    const inbox =
      this.config.get<string>('SPONSOR_INBOX_EMAIL')?.trim() ||
      'juansylvie@gmail.com';

    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('EMAIL_FROM')?.trim();
    if (!apiKey || !from) {
      this.logger.error(
        'Sponsor proposal rejected: RESEND_API_KEY or EMAIL_FROM not configured',
      );
      throw new BadRequestException(
        'El envío de propuestas no está disponible en este momento',
      );
    }

    await this.email.sendSponsorProposalEmail({
      to: inbox,
      companyName: input.companyName.trim(),
      contactEmail: input.contactEmail.trim().toLowerCase(),
      message: input.message.trim(),
    });
  }
}
