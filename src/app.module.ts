import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validate } from './config/env.config';
import { isRelaxFromConfig } from './config/relax-env';
import { AuthModule } from './modules/auth/presentation/auth.module';
import { BlockchainModule } from './modules/blockchain/presentation/blockchain.module';
import { DdragonModule } from './modules/ddragon/presentation/ddragon.module';
import { MissionsModule } from './modules/missions/presentation/missions.module';
import { MissionsWorkerModule } from './modules/missions/presentation/missions-worker.module';
import { RiotModule } from './modules/riot/presentation/riot.module';
import { WalletModule } from './modules/wallet/presentation/wallet.module';
import { WithdrawalModule } from './modules/withdrawals/presentation/withdrawal.module';
import { ContactModule } from './modules/contact/presentation/contact.module';
import { HealthModule } from './shared/presentation/health/health.module';
import { SharedModule } from './shared/shared.module';

/** Local dev: HTTP API + background workers in one process (APP_MODE=all). */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    SharedModule,
    HealthModule,
    AuthModule,
    ContactModule,
    RiotModule,
    DdragonModule,
    WalletModule,
    MissionsModule,
    MissionsWorkerModule,
    BlockchainModule,
    WithdrawalModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60_000,
          limit: isRelaxFromConfig(config) ? 1_000_000 : 60,
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
