import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_BRAND } from './email-brand';
import {
  interpolate,
  resolveEmailLocale,
} from './email-locale.registry';
import {
  DEFAULT_EMAIL_LOCALE,
  type EmailLocaleCode,
  type TransactionalEmailRenderContext,
} from './email-locale.types';
import { escapeHtml, replaceTokens } from './email-html.util';

export type RenderedTransactionalEmail = {
  subject: string;
  html: string;
  text: string;
};

type LayoutContent = {
  preheader: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  footerNote?: string;
};

@Injectable()
export class TransactionalEmailRenderer {
  constructor(private readonly config: ConfigService) {}

  renderEmailVerification(input: {
    verifyUrl: string;
    locale?: EmailLocaleCode;
  }): RenderedTransactionalEmail {
    const ctx = this.buildContext(input.locale);
    const strings = resolveEmailLocale(input.locale).emailVerification;

    return this.renderFromLayout(ctx, strings.subject, {
      preheader: strings.preheader,
      title: strings.title,
      bodyHtml: this.paragraphs([
        strings.greeting,
        strings.body,
        strings.expiryNote,
      ]),
      cta: { label: strings.cta, url: input.verifyUrl },
      footerNote: resolveEmailLocale(input.locale).layout.footerIgnore,
    });
  }

  renderPasswordReset(input: {
    resetUrl: string;
    locale?: EmailLocaleCode;
  }): RenderedTransactionalEmail {
    const ctx = this.buildContext(input.locale);
    const strings = resolveEmailLocale(input.locale).passwordReset;

    return this.renderFromLayout(ctx, strings.subject, {
      preheader: strings.preheader,
      title: strings.title,
      bodyHtml: this.paragraphs([
        strings.greeting,
        strings.body,
        strings.expiryNote,
      ]),
      cta: { label: strings.cta, url: input.resetUrl },
      footerNote: resolveEmailLocale(input.locale).layout.footerIgnore,
    });
  }

  renderStorePurchase(input: {
    productName: string;
    rpAmount: number;
    riotKey: string;
    locale?: EmailLocaleCode;
  }): RenderedTransactionalEmail {
    const ctx = this.buildContext(input.locale);
    const strings = resolveEmailLocale(input.locale).storePurchase;
    const redeemUrl = 'https://redeem.riotpins.com/';
    const subject = interpolate(strings.subject, { rpAmount: input.rpAmount });
    const productName = escapeHtml(input.productName);
    const riotKey = escapeHtml(input.riotKey);

    const bodyHtml = [
      this.paragraph(strings.greeting),
      this.paragraph(strings.intro),
      `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${EMAIL_BRAND.text};"><strong>${escapeHtml(strings.productLabel)}:</strong> ${productName}</p>`,
      `<p style="margin:0 0 8px;font-size:14px;line-height:22px;color:${EMAIL_BRAND.textMuted};font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(strings.codeLabel)}</p>`,
      `<p style="margin:0 0 20px;padding:16px 18px;background:${EMAIL_BRAND.codeBg};border:1px solid ${EMAIL_BRAND.border};border-radius:10px;font-family:Consolas,'Courier New',monospace;font-size:18px;line-height:28px;letter-spacing:0.06em;color:${EMAIL_BRAND.text};word-break:break-all;"><strong>${riotKey}</strong></p>`,
      this.paragraph(strings.redeemBody),
      this.paragraph(strings.keepNote),
    ].join('');

    return this.renderFromLayout(ctx, subject, {
      preheader: interpolate(strings.preheader, {
        rpAmount: input.rpAmount,
      }),
      title: strings.title,
      bodyHtml,
      cta: { label: strings.redeemCta, url: redeemUrl },
    });
  }

  private buildContext(locale?: EmailLocaleCode): TransactionalEmailRenderContext {
    const siteUrl = this.getSiteUrl();
    return {
      locale: locale ?? DEFAULT_EMAIL_LOCALE,
      logoUrl: this.getLogoUrl(siteUrl),
      siteUrl,
      year: new Date().getFullYear(),
    };
  }

  private getSiteUrl(): string {
    return (
      this.config.get<string>('EMAIL_PUBLIC_SITE_URL')?.trim() ||
      'https://wpgg.lol'
    ).replace(/\/+$/, '');
  }

  private getLogoUrl(siteUrl: string): string {
    const configured = this.config.get<string>('EMAIL_LOGO_URL')?.trim();
    if (configured) {
      return configured;
    }
    return `${siteUrl}/icons/Icon-192.png`;
  }

  private renderFromLayout(
    ctx: TransactionalEmailRenderContext,
    subject: string,
    content: LayoutContent,
  ): RenderedTransactionalEmail {
    const strings = resolveEmailLocale(ctx.locale).layout;
    const footerCopyright = replaceTokens(strings.footerCopyright, {
      year: String(ctx.year),
    });
    const termsUrl = `${ctx.siteUrl}/profile/terms`;
    const faqsUrl = `${ctx.siteUrl}/profile/faqs`;
    const preheader = escapeHtml(content.preheader);
    const title = escapeHtml(content.title);
    const ctaBlock = content.cta
      ? `<tr>
            <td style="padding:8px 32px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius:999px;background:${EMAIL_BRAND.primary};">
                    <a href="${escapeHtml(content.cta.url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;line-height:20px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;background:${EMAIL_BRAND.primary};">${escapeHtml(content.cta.label)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
      : '';
    const footerNoteBlock = content.footerNote
      ? `<p style="margin:0 0 12px;font-size:13px;line-height:20px;color:${EMAIL_BRAND.textMuted};">${escapeHtml(content.footerNote)}</p>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="${ctx.locale ?? DEFAULT_EMAIL_LOCALE}">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${EMAIL_BRAND.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${EMAIL_BRAND.pageBg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:${EMAIL_BRAND.cardBg};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 12px;text-align:center;background:linear-gradient(180deg,#FFFFFF 0%,#FCFAFD 100%);">
                <img src="${escapeHtml(ctx.logoUrl)}" width="56" height="56" alt="WPGG" style="display:block;margin:0 auto 12px;border:0;border-radius:12px;" />
                <p style="margin:0;font-size:22px;line-height:28px;font-weight:800;color:${EMAIL_BRAND.text};">WPGG</p>
                <p style="margin:6px 0 0;font-size:12px;line-height:18px;color:${EMAIL_BRAND.textMuted};letter-spacing:0.02em;">${escapeHtml(strings.tagline)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;font-weight:800;color:${EMAIL_BRAND.text};">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                ${content.bodyHtml}
              </td>
            </tr>
            ${ctaBlock}
            <tr>
              <td style="padding:8px 32px 28px;border-top:1px solid ${EMAIL_BRAND.border};">
                ${footerNoteBlock}
                <p style="margin:0 0 12px;font-size:13px;line-height:20px;color:${EMAIL_BRAND.textMuted};">${escapeHtml(footerCopyright)}</p>
                <p style="margin:0;font-size:13px;line-height:20px;">
                  <a href="${escapeHtml(termsUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;font-weight:600;">${escapeHtml(strings.footerTermsLabel)}</a>
                  <span style="color:${EMAIL_BRAND.textMuted};"> · </span>
                  <a href="${escapeHtml(faqsUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;font-weight:600;">${escapeHtml(strings.footerFaqsLabel)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = this.buildPlainText(content, {
      footerCopyright,
      termsUrl,
      faqsUrl,
      termsLabel: strings.footerTermsLabel,
      faqsLabel: strings.footerFaqsLabel,
    });

    return { subject, html, text };
  }

  private buildPlainText(
    content: LayoutContent,
    footer: {
      footerCopyright: string;
      termsUrl: string;
      faqsUrl: string;
      termsLabel: string;
      faqsLabel: string;
    },
  ): string {
    const lines = [
      content.preheader,
      '',
      content.title,
      '',
      this.stripHtml(content.bodyHtml),
    ];
    if (content.cta) {
      lines.push('', `${content.cta.label}: ${content.cta.url}`);
    }
    if (content.footerNote) {
      lines.push('', content.footerNote);
    }
    lines.push(
      '',
      footer.footerCopyright,
      `${footer.termsLabel}: ${footer.termsUrl}`,
      `${footer.faqsLabel}: ${footer.faqsUrl}`,
    );
    return lines.join('\n').trim();
  }

  private paragraphs(lines: string[]): string {
    return lines.map((line) => this.paragraph(line)).join('');
  }

  private paragraph(text: string): string {
    return `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${EMAIL_BRAND.text};">${escapeHtml(text)}</p>`;
  }

  private stripHtml(value: string): string {
    return value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
