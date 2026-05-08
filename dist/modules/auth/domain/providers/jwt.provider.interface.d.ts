export declare const JWT_PROVIDER: unique symbol;
export interface IJwtProvider {
    generateAccessToken(userId: string): string;
    generateRefreshToken(userId: string): {
        token: string;
        expiresAt: Date;
    };
    verifyAccessToken(token: string): {
        userId: string;
    } | null;
    verifyRefreshToken(token: string): {
        userId: string;
    } | null;
}
