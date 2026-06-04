import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  IEmailProvider,
  SendPasswordResetEmailInput,
} from '../../domain/providers/email.provider.interface';

@Injectable()
export class ResendEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput,
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('EMAIL_FROM')?.trim();
    if (!apiKey || !from) {
      this.logger.warn(
        'Password reset email skipped: RESEND_API_KEY or EMAIL_FROM not configured',
      );
      return;
    }

    const subject = 'Restablecé tu contraseña de WPGG';
    const html = `
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta WPGG.</p>
      <p><a href="${input.resetUrl}">Restablecer contraseña</a></p>
      <p>Si no pediste este cambio, podés ignorar este correo.</p>
      <p>El enlace expira en breve por seguridad.</p>
    `.trim();

    await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to: [input.to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15_000,
      },
    );
  }
}
