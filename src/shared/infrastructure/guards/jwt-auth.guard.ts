import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  IJwtProvider,
  JWT_PROVIDER,
} from '@modules/auth/domain/providers/jwt.provider.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_PROVIDER)
    private readonly jwtProvider: IJwtProvider,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized');
    }
    const token = header.slice(7);
    const payload = this.jwtProvider.verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException('Unauthorized');
    }
    (req as Request & { user: { userId: string } }).user = {
      userId: payload.userId,
    };
    return true;
  }
}
