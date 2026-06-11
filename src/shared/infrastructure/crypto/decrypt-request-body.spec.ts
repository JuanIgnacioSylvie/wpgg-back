import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { generateKeyPairSync } from 'crypto';
import {
  encryptPayloadForTests,
  PayloadCryptoService,
} from './payload-crypto.service';
import { decryptRequestBodyIfNeeded } from './decrypt-request-body';

describe('decryptRequestBodyIfNeeded', () => {
  function createService(): PayloadCryptoService {
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const config = {
      get: (key: string) =>
        key === 'PAYLOAD_CRYPTO_PRIVATE_KEY' ? pair.privateKey : undefined,
    };
    const service = new PayloadCryptoService(config as never);
    service.onModuleInit();
    return service;
  }

  it('decrypts login envelope on req.body before DTO validation', () => {
    const service = createService();
    const payload = {
      email: 'user@example.com',
      password: 'secret',
      rememberMe: true,
    };
    const envelope = encryptPayloadForTests(service.getPublicJwk(), payload);
    const req = {
      method: 'POST',
      path: '/auth/login',
      originalUrl: '/auth/login',
      body: envelope,
      headers: {},
    } as Request;

    decryptRequestBodyIfNeeded(req, service);

    expect(req.body).toEqual(payload);
    expect(req.headers['x-wpgg-encrypted']).toBe('1');
  });

  it('ignores non-sensitive routes', () => {
    const service = createService();
    const req = {
      method: 'POST',
      path: '/auth/logout',
      body: { v: 1, key: 'x', iv: 'y', data: 'z' },
      headers: {},
    } as Request;

    decryptRequestBodyIfNeeded(req, service);

    expect(req.body).toEqual({ v: 1, key: 'x', iv: 'y', data: 'z' });
  });

  it('rejects plain JSON on sensitive routes', () => {
    const service = createService();
    const req = {
      method: 'POST',
      path: '/auth/login',
      body: { email: 'a@b.com', password: 'x' },
      headers: {},
    } as Request;

    expect(() => decryptRequestBodyIfNeeded(req, service)).toThrow(
      BadRequestException,
    );
  });
});
