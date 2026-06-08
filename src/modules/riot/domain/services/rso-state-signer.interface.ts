import type { RsoIntent } from '../rso-intent';
import type { RsoPlatform } from '../rso-platform';

export const RSO_STATE_SIGNER = Symbol('RSO_STATE_SIGNER');

export type ParsedRsoState = {
  nonce: string;
  timestamp: number;
  intent: RsoIntent;
  wpggUserId?: string;
  platform?: RsoPlatform;
};

export interface IRsoStateSigner {
  create(
    intent?: RsoIntent,
    wpggUserId?: string,
    platform?: RsoPlatform,
  ): string;
  verify(state: string): boolean;
  parse(state: string): ParsedRsoState | null;
}
