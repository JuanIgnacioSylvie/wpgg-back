import { ConfigService } from '@nestjs/config';
import { TransactionalEmailRenderer } from './transactional-email.renderer';

describe('TransactionalEmailRenderer', () => {
  const renderer = new TransactionalEmailRenderer({
    get: (key: string) => {
      if (key === 'EMAIL_PUBLIC_SITE_URL') {
        return 'https://wpgg.lol';
      }
      return undefined;
    },
  } as ConfigService);

  it('renders email verification in English with CTA and footer', () => {
    const out = renderer.renderEmailVerification({
      verifyUrl: 'https://wpgg.lol/verify-email?token=abc',
    });

    expect(out.subject).toBe('Confirm your WPGG email');
    expect(out.html).toContain('Confirm your email');
    expect(out.html).toContain('https://wpgg.lol/verify-email?token=abc');
    expect(out.html).toContain('https://wpgg.lol/profile/terms');
    expect(out.text).toContain('Confirm email:');
  });

  it('renders password reset in English', () => {
    const out = renderer.renderPasswordReset({
      resetUrl: 'https://wpgg.lol/reset-password?token=xyz',
    });

    expect(out.subject).toBe('Reset your WPGG password');
    expect(out.html).toContain('Reset password');
    expect(out.html).toContain('https://wpgg.lol/reset-password?token=xyz');
  });

  it('renders store purchase with escaped product name and riot key', () => {
    const out = renderer.renderStorePurchase({
      productName: '650 RP <test>',
      rpAmount: 650,
      riotKey: 'RIOT-CODE-123',
    });

    expect(out.subject).toBe('Your League of Legends Gift Card (650 RP)');
    expect(out.html).toContain('650 RP &lt;test&gt;');
    expect(out.html).toContain('RIOT-CODE-123');
    expect(out.html).toContain('https://redeem.riotpins.com/');
    expect(out.text).toContain('RIOT-CODE-123');
  });
});
