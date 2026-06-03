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
import {
  attachSessionCookies,
  clearSessionCookies,
  REFRESH_TOKEN_COOKIE,
} from '../infrastructure/auth-session-cookies';
import { ExchangeRiotSessionCodeUseCase } from '../application/use-cases/exchange-riot-session-code.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { LogoutUserUseCase } from '../application/use-cases/logout-user.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { ApplyRiotPendingLinkUseCase } from '@modules/riot/application/use-cases/apply-riot-pending-link.use-case';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RiotSessionExchangeRequestDto } from './dto/riot-session-exchange-request.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly applyRiotPendingLink: ApplyRiotPendingLinkUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly logoutUser: LogoutUserUseCase,
    private readonly exchangeRiotSessionCode: ExchangeRiotSessionCodeUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { riotLinkPendingCode, ...registerBody } = body;
    const out = await this.registerUser.execute(registerBody);
    if (riotLinkPendingCode?.trim()) {
      await this.applyRiotPendingLink.execute({
        userId: out.userId,
        riotLinkPendingCode,
      });
    }
    attachSessionCookies(res, this.configService, {
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
      rememberMe: false,
    });
    return { accessToken: out.accessToken, refreshToken: out.refreshToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.loginUser.execute(body);
    attachSessionCookies(res, this.configService, {
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
      rememberMe: out.rememberMe,
    });
    return { accessToken: out.accessToken, refreshToken: out.refreshToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const fromBody =
      typeof body.refreshToken === 'string' ? body.refreshToken.trim() : '';
    const raw = (fromCookie && fromCookie.trim()) || fromBody || undefined;
    if (!raw) {
      throw new UnauthorizedException('Unauthorized');
    }
    const out = await this.refreshToken.execute({ refreshToken: raw });
    attachSessionCookies(res, this.configService, {
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
      rememberMe: out.rememberMe,
    });
    const usedBodyOnly = !fromCookie?.trim() && Boolean(fromBody);
    if (usedBodyOnly) {
      return {
        accessToken: out.accessToken,
        refreshToken: out.refreshToken,
      };
    }
    return { accessToken: out.accessToken };
  }

  /**
   * Redeem one-time `riot_session` code from Riot OAuth success redirect.
   * Returns wpgg tokens and sets session cookies when possible.
   */
  @Post('riot-session')
  @HttpCode(HttpStatus.OK)
  async riotSession(
    @Body() body: RiotSessionExchangeRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.exchangeRiotSessionCode.execute({
      code: body.code,
    });
    attachSessionCookies(res, this.configService, out);
    return {
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
    };
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
      refreshTokenFromCookie: req.cookies?.[REFRESH_TOKEN_COOKIE],
      logoutAll: false,
    });
    clearSessionCookies(res, this.configService);
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
    clearSessionCookies(res, this.configService);
    return {};
  }
}
