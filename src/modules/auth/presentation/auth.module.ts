import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { SharedModule } from '@shared/shared.module';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { CreateRiotSessionExchangeCodeUseCase } from '../application/use-cases/create-riot-session-exchange-code.use-case';
import { EstablishRiotOauthSessionUseCase } from '../application/use-cases/establish-riot-oauth-session.use-case';
import { ExchangeRiotSessionCodeUseCase } from '../application/use-cases/exchange-riot-session-code.use-case';
import { LogoutUserUseCase } from '../application/use-cases/logout-user.use-case';
import { RIOT_SESSION_EXCHANGE_CODE_REPOSITORY } from '../domain/repositories/riot-session-exchange-code.repository.interface';
import { PrismaRiotSessionExchangeCodeRepository } from '../infrastructure/persistence/prisma-riot-session-exchange-code.repository';
import { USER_REPOSITORY } from '../domain/repositories/user.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../domain/repositories/refresh-token.repository.interface';
import { HASH_PROVIDER } from '../domain/providers/hash.provider.interface';
import { JWT_PROVIDER } from '../domain/providers/jwt.provider.interface';
import { PrismaUserRepository } from '../infrastructure/persistence/prisma-user.repository';
import { PrismaRefreshTokenRepository } from '../infrastructure/persistence/prisma-refresh-token.repository';
import { BcryptHashProvider } from '../infrastructure/providers/bcrypt-hash.provider';
import { JwtJwtProvider } from '../infrastructure/providers/jwt-jwt.provider';
import { RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY } from '../domain/repositories/riot-pending-link-exchange-code.repository.interface';
import { PrismaRiotPendingLinkExchangeCodeRepository } from '../infrastructure/persistence/prisma-riot-pending-link-exchange-code.repository';
import { CreateRiotPendingLinkCodeUseCase } from '../application/use-cases/create-riot-pending-link-code.use-case';
import { AuthController } from './auth.controller';
import { RiotModule } from '@modules/riot/presentation/riot.module';

@Module({
  imports: [
    forwardRef(() => RiotModule),
    SharedModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    { provide: HASH_PROVIDER, useClass: BcryptHashProvider },
    { provide: JWT_PROVIDER, useClass: JwtJwtProvider },
    {
      provide: RIOT_SESSION_EXCHANGE_CODE_REPOSITORY,
      useClass: PrismaRiotSessionExchangeCodeRepository,
    },
    {
      provide: RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY,
      useClass: PrismaRiotPendingLinkExchangeCodeRepository,
    },
    CreateRiotPendingLinkCodeUseCase,
    JwtAuthGuard,
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    LogoutUserUseCase,
    EstablishRiotOauthSessionUseCase,
    CreateRiotSessionExchangeCodeUseCase,
    ExchangeRiotSessionCodeUseCase,
  ],
  exports: [
    JWT_PROVIDER,
    JwtAuthGuard,
    USER_REPOSITORY,
    EstablishRiotOauthSessionUseCase,
    CreateRiotSessionExchangeCodeUseCase,
    RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY,
    CreateRiotPendingLinkCodeUseCase,
  ],
})
export class AuthModule {}
