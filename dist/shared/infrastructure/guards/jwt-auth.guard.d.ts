import { CanActivate, ExecutionContext } from '@nestjs/common';
import { IJwtProvider } from '@modules/auth/domain/providers/jwt.provider.interface';
export declare class JwtAuthGuard implements CanActivate {
    private readonly jwtProvider;
    constructor(jwtProvider: IJwtProvider);
    canActivate(context: ExecutionContext): boolean;
}
