import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { RsoIntent } from '../domain/rso-intent';
import type { RsoPlatform } from '../domain/rso-platform';
import { parseRsoPlatform } from '../domain/rso-platform';
import {
  IRsoStateSigner,
  ParsedRsoState,
} from '../domain/services/rso-state-signer.interface';

const MAX_AGE_MS = 15 * 60 * 1000;

type StatePayload = {
  n: string;
  t: number;
  intent?: RsoIntent;
  wpggUserId?: string;
  platform?: RsoPlatform;
};

@Injectable()
export class RsoStateSigner implements IRsoStateSigner {
  constructor(private readonly config: ConfigService) {}

  create(
    intent: RsoIntent = 'login',
    wpggUserId?: string,
    platform?: RsoPlatform,
  ): string {
    const secret = this.config.get<string>('JWT_SECRET')!;
    const payload: StatePayload = {
      n: randomBytes(16).toString('hex'),
      t: Date.now(),
      intent,
      ...(wpggUserId?.trim() ? { wpggUserId: wpggUserId.trim() } : {}),
      ...(platform ? { platform } : {}),
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  verify(state: string): boolean {
    return this.parsePayload(state) !== null;
  }

  parse(state: string): ParsedRsoState | null {
    const parsed = this.parsePayload(state);
    if (!parsed) {
      return null;
    }
    return {
      nonce: parsed.n,
      timestamp: parsed.t,
      intent: parsed.intent ?? 'login',
      wpggUserId:
        typeof parsed.wpggUserId === 'string' && parsed.wpggUserId.length > 0
          ? parsed.wpggUserId
          : undefined,
      platform: parseRsoPlatform(parsed.platform),
    };
  }

  private parsePayload(state: string): StatePayload | null {
    const secret = this.config.get<string>('JWT_SECRET')!;
    const lastDot = state.lastIndexOf('.');
    if (lastDot <= 0 || lastDot === state.length - 1) {
      return null;
    }
    const body = state.slice(0, lastDot);
    const sig = state.slice(lastDot + 1);
    const expected = createHmac('sha256', secret).update(body).digest('base64url');
    try {
      if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return null;
      }
    } catch {
      return null;
    }
    let parsed: StatePayload;
    try {
      parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      return null;
    }
    if (typeof parsed.t !== 'number' || typeof parsed.n !== 'string') {
      return null;
    }
    if (Date.now() - parsed.t > MAX_AGE_MS) {
      return null;
    }
    if (
      parsed.intent !== undefined &&
      parsed.intent !== 'login' &&
      parsed.intent !== 'register' &&
      parsed.intent !== 'link'
    ) {
      return null;
    }
    if (parsed.intent === 'link') {
      if (
        typeof parsed.wpggUserId !== 'string' ||
        parsed.wpggUserId.trim().length === 0
      ) {
        return null;
      }
    }
    if (parsed.platform !== undefined && parsed.platform !== 'mobile') {
      return null;
    }
    return parsed;
  }
}
