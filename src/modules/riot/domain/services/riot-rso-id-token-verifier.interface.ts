export const RIOT_RSO_ID_TOKEN_VERIFIER = Symbol('RIOT_RSO_ID_TOKEN_VERIFIER');

export interface IRiotRsoIdTokenVerifier {
  verify(idToken: string): Promise<Record<string, unknown> | null>;
}
