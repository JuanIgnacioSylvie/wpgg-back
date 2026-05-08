import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository');

export interface IRefreshTokenRepository {
  save(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  findByHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  revoke(tokenId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  /** Recent refresh-token rows for bcrypt comparison during rotation and logout. */
  listByUserId(userId: string): Promise<RefreshTokenEntity[]>;
  /** Ensures fewer than `maxActive` non-revoked, non-expired tokens exist by revoking oldest first. */
  enforceMaxActiveTokensForUser(userId: string, maxActive: number): Promise<void>;
}
