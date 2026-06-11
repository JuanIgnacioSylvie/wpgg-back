import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { decryptRequestBodyIfNeeded } from './decrypt-request-body';
import { PayloadCryptoService } from './payload-crypto.service';

@Injectable()
export class DecryptPayloadMiddleware implements NestMiddleware {
  constructor(private readonly payloadCrypto: PayloadCryptoService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      decryptRequestBodyIfNeeded(req, this.payloadCrypto);
      next();
    } catch (error) {
      next(error);
    }
  }
}
