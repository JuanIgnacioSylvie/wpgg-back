import type { EmailLocaleStrings } from '../email-locale.types';

/**
 * English copy for transactional emails.
 * To add a locale: duplicate this file (e.g. `es.ts`), translate values, register in `email-locale.registry.ts`.
 */
const en: EmailLocaleStrings = {
  layout: {
    tagline: 'Well Played · Good Game',
    footerCopyright: '© {year} WPGG. All rights reserved.',
    footerTermsLabel: 'Terms of Service',
    footerFaqsLabel: 'FAQs',
    footerIgnore:
      'If you did not request this email, you can safely ignore it.',
  },
  emailVerification: {
    subject: 'Confirm your WPGG email',
    preheader: 'Verify your email to activate your WPGG account.',
    greeting: 'Hello,',
    title: 'Confirm your email',
    body: 'Thanks for signing up for WPGG. Confirm your email address to activate your account.',
    cta: 'Confirm email',
    expiryNote: 'This link expires soon for your security.',
  },
  passwordReset: {
    subject: 'Reset your WPGG password',
    preheader: 'Use this link to choose a new password for your WPGG account.',
    greeting: 'Hello,',
    title: 'Reset your password',
    body: 'We received a request to reset the password for your WPGG account.',
    cta: 'Reset password',
    expiryNote: 'This link expires soon for your security.',
  },
  storePurchase: {
    subject: 'Your League of Legends Gift Card ({rpAmount} RP)',
    preheader: 'Your RP code is inside. Redeem it in the LoL client or on redeem.riotpins.com.',
    greeting: 'Hello,',
    title: 'Your purchase is ready',
    intro: 'Thanks for your purchase on WPGG.',
    productLabel: 'Product',
    codeLabel: 'Your Riot code',
    redeemBody: 'Redeem this code in the League of Legends client or online.',
    redeemCta: 'Redeem code',
    keepNote: 'Save this email — the code is not resent automatically.',
  },
};

export default en;
