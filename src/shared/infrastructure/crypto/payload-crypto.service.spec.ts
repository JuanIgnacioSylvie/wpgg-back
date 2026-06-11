import { ConfigService } from '@nestjs/config';
import {
  encryptPayloadForTests,
  PayloadCryptoService,
} from './payload-crypto.service';

describe('PayloadCryptoService', () => {
  function createService(privateKeyPem: string): PayloadCryptoService {
    const config = {
      get: (key: string) =>
        key === 'PAYLOAD_CRYPTO_PRIVATE_KEY' ? privateKeyPem : undefined,
    } as ConfigService;
    const service = new PayloadCryptoService(config);
    service.onModuleInit();
    return service;
  }

  it('round-trips login payload', () => {
    const { generateKeyPairSync } = require('crypto') as typeof import('crypto');
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const service = createService(pair.privateKey);
    const jwk = service.getPublicJwk();
    const payload = {
      email: 'user@example.com',
      password: 'secret-pass',
      rememberMe: true,
    };
    const envelope = encryptPayloadForTests(jwk, payload);
    expect(service.isEncryptedEnvelope(envelope)).toBe(true);
    expect(service.decryptEnvelope(envelope)).toEqual(payload);
  });

  it('round-trips empty object for bodyless purchases', () => {
    const { generateKeyPairSync } = require('crypto') as typeof import('crypto');
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const service = createService(pair.privateKey);
    const envelope = encryptPayloadForTests(service.getPublicJwk(), {});
    expect(service.decryptEnvelope(envelope)).toEqual({});
  });
});
