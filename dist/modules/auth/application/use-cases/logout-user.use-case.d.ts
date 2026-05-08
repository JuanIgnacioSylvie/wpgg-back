import { IHashProvider } from '../../domain/providers/hash.provider.interface';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
export type LogoutUserInput = {
    userId: string;
    refreshTokenFromCookie: string | undefined;
    logoutAll: boolean;
};
export declare class LogoutUserUseCase {
    private readonly refreshTokenRepository;
    private readonly hashProvider;
    constructor(refreshTokenRepository: IRefreshTokenRepository, hashProvider: IHashProvider);
    execute(input: LogoutUserInput): Promise<void>;
}
