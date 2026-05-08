export const JWT_PROVIDER = Symbol('IJwtProvider');

export interface IJwtProvider {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): { token: string; expiresAt: Date };
  verifyAccessToken(token: string): { userId: string } | null;
  /** Validates signature and expiry; returns null if invalid. Payload must be type `refresh`. */
  verifyRefreshToken(token: string): { userId: string } | null;
}