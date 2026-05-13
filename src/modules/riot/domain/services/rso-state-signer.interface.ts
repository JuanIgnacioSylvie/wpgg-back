export const RSO_STATE_SIGNER = Symbol('RSO_STATE_SIGNER');

export interface IRsoStateSigner {
  create(): string;
  verify(state: string): boolean;
}
