import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { decryptRequestBodyIfNeeded } from './decrypt-request-body';
import { PayloadCryptoService } from './payload-crypto.service';

/**
 * Decrypts sensitive POST bodies before ValidationPipe runs on @Body() DTOs.
 */
@Injectable()
export class DecryptPayloadInterceptor implements NestInterceptor {
  constructor(private readonly payloadCrypto: PayloadCryptoService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    decryptRequestBodyIfNeeded(req, this.payloadCrypto);
    return next.handle();
  }
}
