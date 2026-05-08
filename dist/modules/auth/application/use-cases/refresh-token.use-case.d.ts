import { IHashProvider } from '../../domain/providers/hash.provider.interface';
import { IJwtProvider } from '../../domain/providers/jwt.provider.interface';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
export type RefreshTokenInput = {
    refreshToken: string;
};
export type RefreshTokenOutput = {
    accessToken: string;
    refreshToken: string;
};
export declare class RefreshTokenUseCase {
    private readonly refreshTokenRepository;
    private readonly hashProvider;
    private readonly jwtProvider;
    constructor(refreshTokenRepository: IRefreshTokenRepository, hashProvider: IHashProvider, jwtProvider: IJwtProvider);
    execute(input: RefreshTokenInput): Promise<RefreshTokenOutput>;
}
