import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IJwtProvider } from '@modules/auth/domain/providers/jwt.provider.interface';
export declare class JwtAuthGuard implements CanActivate {
    private readonly jwtProvider;
    private readonly configService;
    constructor(jwtProvider: IJwtProvider, configService: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
