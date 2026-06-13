import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  IEmailProvider,
  SendEmailVerificationInput,
  SendPasswordResetEmailInput,
  SendSponsorProposalEmailInput,
  SendStorePurchaseEmailInput,
  SendSupportRequestEmailInput,
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

  async sendEmailVerification(input: SendEmailVerificationInput): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('EMAIL_FROM')?.trim();
    if (!apiKey || !from) {
      this.logger.warn(
        'Verification email skipped: RESEND_API_KEY or EMAIL_FROM not configured',
      );
      return;
    }

    const subject = 'Confirmá tu email en WPGG';
    const html = `
      <p>Hola,</p>
      <p>Gracias por registrarte en WPGG. Confirmá tu correo para activar tu cuenta.</p>
      <p><a href="${input.verifyUrl}">Confirmar email</a></p>
      <p>Si no creaste esta cuenta, podés ignorar este correo.</p>
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

  async sendStorePurchaseEmail(
    input: SendStorePurchaseEmailInput,
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('EMAIL_FROM')?.trim();
    if (!apiKey || !from) {
      this.logger.warn(
        'Store purchase email skipped: RESEND_API_KEY or EMAIL_FROM not configured',
      );
      return;
    }

    const subject = `Tu Gift Card de League of Legends (${input.rpAmount} RP)`;
    const html = `
      <p>Hola,</p>
      <p>Gracias por tu compra en WPGG.</p>
      <p><strong>${input.productName}</strong></p>
      <p>Tu código Riot:</p>
      <p style="font-family: monospace; font-size: 16px; letter-spacing: 0.5px;"><strong>${input.riotKey}</strong></p>
      <p>Canjealo en el cliente de League of Legends o en <a href="https://redeem.riotpins.com/">redeem.riotpins.com</a>.</p>
      <p>Guardá este correo: el código no se reenvía automáticamente.</p>
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

  async sendSponsorProposalEmail(
    input: SendSponsorProposalEmailInput,
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('EMAIL_FROM')?.trim();
    if (!apiKey || !from) {
      this.logger.warn(
        'Sponsor proposal email skipped: RESEND_API_KEY or EMAIL_FROM not configured',
      );
      return;
    }

    const escapedCompany = this.escapeHtml(input.companyName);
    const escapedEmail = this.escapeHtml(input.contactEmail);
    const escapedMessage = this.escapeHtml(input.message).replace(
      /\n/g,
      '<br>',
    );

    const subject = `Propuesta de sponsor WPGG — ${input.companyName}`;
    const html = `
      <p>Nueva propuesta de sponsor desde la landing de WPGG.</p>
      <p><strong>Empresa / marca:</strong> ${escapedCompany}</p>
      <p><strong>Email de contacto:</strong> <a href="mailto:${escapedEmail}">${escapedEmail}</a></p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapedMessage}</p>
    `.trim();

    await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to: [input.to],
        reply_to: input.contactEmail,
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

  async sendSupportRequestEmail(
    input: SendSupportRequestEmailInput,
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('EMAIL_FROM')?.trim();
    if (!apiKey || !from) {
      this.logger.warn(
        'Support request email skipped: RESEND_API_KEY or EMAIL_FROM not configured',
      );
      return;
    }

    const escapedEmail = this.escapeHtml(input.contactEmail);
    const escapedSubject = this.escapeHtml(input.subject);
    const escapedMessage = this.escapeHtml(input.message).replace(
      /\n/g,
      '<br>',
    );

    const subject = `Soporte WPGG — ${input.subject}`;
    const html = `
      <p>Nueva consulta de soporte desde la app WPGG.</p>
      <p><strong>Email de contacto:</strong> <a href="mailto:${escapedEmail}">${escapedEmail}</a></p>
      <p><strong>Asunto:</strong> ${escapedSubject}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapedMessage}</p>
    `.trim();

    await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to: [input.to],
        reply_to: input.contactEmail,
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
