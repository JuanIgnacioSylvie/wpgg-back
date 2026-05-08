import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validate } from './config/env.config';
import { AuthModule } from './modules/auth/presentation/auth.module';
import { RiotModule } from './modules/riot/presentation/riot.module';
import { DdragonModule } from './modules/ddragon/presentation/ddragon.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    SharedModule,
    AuthModule,
    RiotModule,
    DdragonModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
