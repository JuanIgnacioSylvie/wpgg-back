export const DEFAULT_EMAIL_LOCALE = 'en' as const;

/** Locales with transactional email copy. Add a file under `locales/` and register it. */
export type EmailLocaleCode = 'en';

export const SUPPORTED_EMAIL_LOCALES: readonly EmailLocaleCode[] = ['en'];

export type EmailLayoutStrings = {
  tagline: string;
  footerCopyright: string;
  footerTermsLabel: string;
  footerFaqsLabel: string;
  footerIgnore: string;
};

export type EmailVerificationStrings = {
  subject: string;
  preheader: string;
  greeting: string;
  title: string;
  body: string;
  cta: string;
  expiryNote: string;
};

export type PasswordResetStrings = {
  subject: string;
  preheader: string;
  greeting: string;
  title: string;
  body: string;
  cta: string;
  expiryNote: string;
};

export type StorePurchaseStrings = {
  subject: string;
  preheader: string;
  greeting: string;
  title: string;
  intro: string;
  productLabel: string;
  codeLabel: string;
  redeemBody: string;
  redeemCta: string;
  keepNote: string;
};

export type EmailLocaleStrings = {
  layout: EmailLayoutStrings;
  emailVerification: EmailVerificationStrings;
  passwordReset: PasswordResetStrings;
  storePurchase: StorePurchaseStrings;
};

export type TransactionalEmailRenderContext = {
  locale?: EmailLocaleCode;
  logoUrl: string;
  siteUrl: string;
  year: number;
};
