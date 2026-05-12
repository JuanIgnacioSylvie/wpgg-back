import { ConfigService } from '@nestjs/config';

/** Never enable in public production. */
export function isRelaxEnv(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

export function isRelaxFromConfig(config: ConfigService): boolean {
  return isRelaxEnv(config.get('RELAX_VALIDATIONS'));
}
