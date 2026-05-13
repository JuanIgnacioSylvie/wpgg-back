import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { IRsoStateSigner } from '../domain/services/rso-state-signer.interface';

const MAX_AGE_MS = 15 * 60 * 1000;

@Injectable()
export class RsoStateSigner implements IRsoStateSigner {
  constructor(private readonly config: ConfigService) {}

  create(): string {
    const secret = this.config.get<string>('JWT_SECRET')!;
    const payload = {
      n: randomBytes(16).toString('hex'),
      t: Date.now(),
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  verify(state: string): boolean {
    const secret = this.config.get<string>('JWT_SECRET')!;
    const lastDot = state.lastIndexOf('.');
    if (lastDot <= 0 || lastDot === state.length - 1) {
      return false;
    }
    const body = state.slice(0, lastDot);
    const sig = state.slice(lastDot + 1);
    const expected = createHmac('sha256', secret).update(body).digest('base64url');
    try {
      if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return false;
      }
    } catch {
      return false;
    }
    let parsed: { n?: string; t?: number };
    try {
      parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      return false;
    }
    if (typeof parsed.t !== 'number' || typeof parsed.n !== 'string') {
      return false;
    }
    if (Date.now() - parsed.t > MAX_AGE_MS) {
      return false;
    }
    return true;
  }
}
