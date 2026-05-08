import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { LogoutUserUseCase } from '../application/use-cases/logout-user.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
export declare class AuthController {
    private readonly registerUser;
    private readonly loginUser;
    private readonly refreshToken;
    private readonly logoutUser;
    private readonly configService;
    constructor(registerUser: RegisterUserUseCase, loginUser: LoginUserUseCase, refreshToken: RefreshTokenUseCase, logoutUser: LogoutUserUseCase, configService: ConfigService);
    private refreshCookieOptions;
    private setRefreshCookie;
    register(body: RegisterRequestDto, res: Response): Promise<{
        accessToken: string;
    }>;
    login(body: LoginRequestDto, res: Response): Promise<{
        accessToken: string;
    }>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, req: Request, res: Response): Promise<{}>;
    logoutAll(userId: string, res: Response): Promise<{}>;
}
