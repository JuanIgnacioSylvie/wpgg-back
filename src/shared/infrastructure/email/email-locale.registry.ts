import {
  DEFAULT_EMAIL_LOCALE,
  type EmailLocaleCode,
  type EmailLocaleStrings,
} from './email-locale.types';
import en from './locales/en';

const LOCALES: Record<EmailLocaleCode, EmailLocaleStrings> = {
  en,
};

export function resolveEmailLocale(
  locale?: EmailLocaleCode,
): EmailLocaleStrings {
  if (locale && locale in LOCALES) {
    return LOCALES[locale];
  }
  return LOCALES[DEFAULT_EMAIL_LOCALE];
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}
