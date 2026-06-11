import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validate } from './config/env.config';
import { isRelaxFromConfig } from './config/relax-env';
import { AuthModule } from './modules/auth/presentation/auth.module';
import { ContactModule } from './modules/contact/presentation/contact.module';
import { BlockchainModule } from './modules/blockchain/presentation/blockchain.module';
import { DdragonModule } from './modules/ddragon/presentation/ddragon.module';
import { MissionsModule } from './modules/missions/presentation/missions.module';
import { RiotModule } from './modules/riot/presentation/riot.module';
import { StoreModule } from './modules/store/presentation/store.module';
import { WalletModule } from './modules/wallet/presentation/wallet.module';
import { WithdrawalModule } from './modules/withdrawals/presentation/withdrawal.module';
import { CryptoModule } from './shared/presentation/crypto/crypto.module';
import { HealthModule } from './shared/presentation/health/health.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    SharedModule,
    CryptoModule,
    HealthModule,
    AuthModule,
    ContactModule,
    RiotModule,
    DdragonModule,
    WalletModule,
    StoreModule,
    MissionsModule,
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
export class AppApiModule {}
