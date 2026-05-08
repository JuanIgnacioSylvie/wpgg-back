import { IHashProvider } from '../../domain/providers/hash.provider.interface';
import { IJwtProvider } from '../../domain/providers/jwt.provider.interface';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
export type LoginUserInput = {
    email: string;
    password: string;
};
export type LoginUserOutput = {
    accessToken: string;
    refreshToken: string;
};
export declare class LoginUserUseCase {
    private readonly userRepository;
    private readonly refreshTokenRepository;
    private readonly hashProvider;
    private readonly jwtProvider;
    constructor(userRepository: IUserRepository, refreshTokenRepository: IRefreshTokenRepository, hashProvider: IHashProvider, jwtProvider: IJwtProvider);
    execute(input: LoginUserInput): Promise<LoginUserOutput>;
}
