import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { LogoutUserUseCase } from '../application/use-cases/logout-user.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';

const REFRESH_COOKIE = 'refreshToken';

const REFRESH_COOKIE_MAX_AGE_MS_SHORT = 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS_LONG = 30 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly logoutUser: LogoutUserUseCase,
    private readonly configService: ConfigService,
  ) {}

  private refreshCookieOptions(rememberMe: boolean) {
    const secure = this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure,
      sameSite: 'strict' as const,
      maxAge: rememberMe
        ? REFRESH_COOKIE_MAX_AGE_MS_LONG
        : REFRESH_COOKIE_MAX_AGE_MS_SHORT,
      path: '/',
    };
  }

  private setRefreshCookie(
    res: Response,
    token: string,
    rememberMe: boolean,
  ): void {
    res.cookie(REFRESH_COOKIE, token, this.refreshCookieOptions(rememberMe));
  }

  @Post('register')
  async register(
    @Body() body: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.registerUser.execute(body);
    this.setRefreshCookie(res, out.refreshToken, false);
    return { accessToken: out.accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.loginUser.execute(body);
    this.setRefreshCookie(res, out.refreshToken, out.rememberMe);
    return { accessToken: out.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) {
      throw new UnauthorizedException('Unauthorized');
    }
    const out = await this.refreshToken.execute({ refreshToken: raw });
    this.setRefreshCookie(res, out.refreshToken, out.rememberMe);
    return { accessToken: out.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUser.execute({
      userId,
      refreshTokenFromCookie: req.cookies?.[REFRESH_COOKIE],
      logoutAll: false,
    });
    res.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions(false));
    return {};
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUser.execute({
      userId,
      refreshTokenFromCookie: undefined,
      logoutAll: true,
    });
    res.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions(false));
    return {};
  }
}
