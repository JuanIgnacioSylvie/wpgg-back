import type { RsoIntent } from '../rso-intent';

export const RSO_STATE_SIGNER = Symbol('RSO_STATE_SIGNER');

export type ParsedRsoState = {
  nonce: string;
  timestamp: number;
  intent: RsoIntent;
};

export interface IRsoStateSigner {
  create(intent?: RsoIntent): string;
  verify(state: string): boolean;
  parse(state: string): ParsedRsoState | null;
}
