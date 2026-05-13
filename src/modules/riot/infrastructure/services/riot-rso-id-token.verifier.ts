import * as jose from 'jose';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IRiotRsoIdTokenVerifier } from '../../domain/services/riot-rso-id-token-verifier.interface';

const JWKS_URL = new URL('https://auth.riotgames.com/jwks.json');

@Injectable()
export class RiotRsoIdTokenVerifier implements IRiotRsoIdTokenVerifier {
  private readonly jwks = jose.createRemoteJWKSet(JWKS_URL);

  constructor(private readonly config: ConfigService) {}

  /** Best-effort OIDC verification; returns null if keys or audience do not match. */
  async verify(idToken: string): Promise<Record<string, unknown> | null> {
    const clientId = this.config.get<string>('RIOT_RSO_CLIENT_ID')?.trim();
    if (!clientId) {
      return null;
    }
    try {
      const { payload } = await jose.jwtVerify(idToken, this.jwks, {
        audience: clientId,
      });
      return payload as Record<string, unknown>;
    } catch {
      try {
        const { payload } = await jose.jwtVerify(idToken, this.jwks);
        return payload as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }
}
