export type RsoPlatform = 'mobile';

export function parseRsoPlatform(value: unknown): RsoPlatform | undefined {
  return value === 'mobile' ? 'mobile' : undefined;
}
