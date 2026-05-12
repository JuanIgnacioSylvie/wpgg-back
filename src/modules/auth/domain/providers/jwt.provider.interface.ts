export const JWT_PROVIDER = Symbol('IJwtProvider');

export type GenerateRefreshTokenOptions = { rememberMe: boolean };

export interface IJwtProvider {
  generateAccessToken(userId: string): string;
  generateRefreshToken(
    userId: string,
    options: GenerateRefreshTokenOptions,
  ): { token: string; expiresAt: Date };
  verifyAccessToken(token: string): { userId: string } | null;
  /** Validates signature and expiry; returns null if invalid. Payload must be type `refresh`. */
  verifyRefreshToken(
    token: string,
  ): { userId: string; rememberMe: boolean } | null;
}