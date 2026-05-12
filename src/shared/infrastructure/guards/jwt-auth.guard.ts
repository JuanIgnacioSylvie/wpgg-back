import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  IJwtProvider,
  JWT_PROVIDER,
} from '@modules/auth/domain/providers/jwt.provider.interface';
import { isRelaxFromConfig } from '../../../config/relax-env';

const DEFAULT_BYPASS_USER_ID = '00000000-0000-4000-8000-000000000000';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_PROVIDER)
    private readonly jwtProvider: IJwtProvider,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (isRelaxFromConfig(this.configService)) {
      const header = req.headers.authorization;
      if (header?.startsWith('Bearer ')) {
        const token = header.slice(7);
        const payload = this.jwtProvider.verifyAccessToken(token);
        if (payload) {
          (req as Request & { user: { userId: string } }).user = {
            userId: payload.userId,
          };
          return true;
        }
      }
      const bypassId =
        this.configService.get<string>('DEV_BYPASS_USER_ID') ??
        DEFAULT_BYPASS_USER_ID;
      (req as Request & { user: { userId: string } }).user = {
        userId: bypassId,
      };
      return true;
    }

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
