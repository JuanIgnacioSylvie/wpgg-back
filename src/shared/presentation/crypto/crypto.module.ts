import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DecryptPayloadInterceptor } from '../../infrastructure/crypto/decrypt-payload.interceptor';
import { DecryptPayloadMiddleware } from '../../infrastructure/crypto/decrypt-payload.middleware';
import { PayloadCryptoService } from '../../infrastructure/crypto/payload-crypto.service';
import { CryptoController } from './crypto.controller';

@Module({
  controllers: [CryptoController],
  providers: [
    PayloadCryptoService,
    DecryptPayloadMiddleware,
    DecryptPayloadInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: DecryptPayloadInterceptor,
    },
  ],
  exports: [PayloadCryptoService],
})
export class CryptoModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(DecryptPayloadMiddleware).forRoutes('*');
  }
}
