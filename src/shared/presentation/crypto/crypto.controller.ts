import { Controller, Get } from '@nestjs/common';
import { PayloadCryptoService } from '../../infrastructure/crypto/payload-crypto.service';

@Controller('crypto')
export class CryptoController {
  constructor(private readonly payloadCrypto: PayloadCryptoService) {}

  /** RSA public key (JWK) for client-side request encryption. */
  @Get('public-key')
  publicKey() {
    return {
      v: 1,
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM',
      jwk: this.payloadCrypto.getPublicJwk(),
    };
  }
}
