import { RefreshTokenEntity } from '../entities/refresh-token.entity';
export declare const REFRESH_TOKEN_REPOSITORY: unique symbol;
export interface IRefreshTokenRepository {
    save(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
    findByHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
    revoke(tokenId: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
    listByUserId(userId: string): Promise<RefreshTokenEntity[]>;
    enforceMaxActiveTokensForUser(userId: string, maxActive: number): Promise<void>;
}
