export const TURNSTILE_PROVIDER = Symbol('ITurnstileProvider');

export interface ITurnstileProvider {
  /** Returns true when the token is valid. Skips when Turnstile is not configured. */
  verifyToken(token: string, remoteIp?: string): Promise<boolean>;
}
