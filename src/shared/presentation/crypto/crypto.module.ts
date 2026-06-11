import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DecryptPayloadMiddleware } from '../../infrastructure/crypto/decrypt-payload.middleware';
import { PayloadCryptoService } from '../../infrastructure/crypto/payload-crypto.service';
import { CryptoController } from './crypto.controller';

@Module({
  controllers: [CryptoController],
  providers: [PayloadCryptoService, DecryptPayloadMiddleware],
  exports: [PayloadCryptoService],
})
export class CryptoModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(DecryptPayloadMiddleware).forRoutes('*');
  }
}
