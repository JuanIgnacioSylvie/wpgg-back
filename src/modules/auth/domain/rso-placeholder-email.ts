export const RSO_PLACEHOLDER_EMAIL_SUFFIX = '@accounts.wpgg.local';

export function isRsoPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith(RSO_PLACEHOLDER_EMAIL_SUFFIX);
}
