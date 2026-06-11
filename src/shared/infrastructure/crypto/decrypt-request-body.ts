import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { requiresEncryptedPayload } from './encrypted-routes';
import { PayloadCryptoService } from './payload-crypto.service';

export function getRequestPath(req: Request): string {
  const raw =
    (typeof req.path === 'string' && req.path.length > 0 ? req.path : null) ??
    req.originalUrl?.split('?')[0] ??
    req.url?.split('?')[0] ??
    '';
  return raw;
}

export function decryptRequestBodyIfNeeded(
  req: Request,
  payloadCrypto: PayloadCryptoService,
): void {
  const path = getRequestPath(req);
  if (!requiresEncryptedPayload(req.method, path)) {
    return;
  }

  if (!payloadCrypto.isEncryptedEnvelope(req.body)) {
    throw new BadRequestException(
      'Request body must be an encrypted payload envelope (v1)',
    );
  }

  req.body = payloadCrypto.decryptEnvelope(req.body);
  req.headers['x-wpgg-encrypted'] = '1';
}
