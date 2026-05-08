export declare class RefreshTokenEntity {
    readonly id: string;
    readonly tokenHash: string;
    readonly userId: string;
    readonly expiresAt: Date;
    readonly createdAt: Date;
    readonly revoked: boolean;
    constructor(id: string, tokenHash: string, userId: string, expiresAt: Date, createdAt: Date, revoked: boolean);
    static create(props: {
        id: string;
        tokenHash: string;
        userId: string;
        expiresAt: Date;
    }): RefreshTokenEntity;
    isExpired(): boolean;
    isValid(): boolean;
}
