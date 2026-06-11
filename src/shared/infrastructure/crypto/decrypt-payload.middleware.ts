import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { requiresEncryptedPayload } from './encrypted-routes';
import { PayloadCryptoService } from './payload-crypto.service';

@Injectable()
export class DecryptPayloadMiddleware implements NestMiddleware {
  constructor(private readonly payloadCrypto: PayloadCryptoService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (!requiresEncryptedPayload(req.method, req.path)) {
      next();
      return;
    }

    if (!this.payloadCrypto.isEncryptedEnvelope(req.body)) {
      next(
        new BadRequestException(
          'Request body must be an encrypted payload envelope (v1)',
        ),
      );
      return;
    }

    try {
      req.body = this.payloadCrypto.decryptEnvelope(req.body);
      req.headers['x-wpgg-encrypted'] = '1';
      next();
    } catch (error) {
      next(error);
    }
  }
}
