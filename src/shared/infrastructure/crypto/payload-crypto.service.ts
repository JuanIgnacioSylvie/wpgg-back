import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
  type JsonWebKey,
  type KeyObject,
} from 'crypto';
import { isRelaxFromConfig } from '../../../config/relax-env';

export const PAYLOAD_CRYPTO_VERSION = 1;
const AES_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

export type EncryptedPayloadEnvelope = {
  v: number;
  key: string;
  iv: string;
  data: string;
};

@Injectable()
export class PayloadCryptoService implements OnModuleInit {
  private readonly logger = new Logger(PayloadCryptoService.name);
  private privateKey!: KeyObject;
  private publicJwk!: JsonWebKey;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const pem = this.config.get<string>('PAYLOAD_CRYPTO_PRIVATE_KEY')?.trim();
    if (pem) {
      this.privateKey = createPrivateKey(pem);
    } else if (isRelaxFromConfig(this.config)) {
      const { privateKey, publicKey } = this.generateDevKeyPair();
      this.privateKey = privateKey;
      this.logger.warn(
        'PAYLOAD_CRYPTO_PRIVATE_KEY not set — generated ephemeral RSA key pair for RELAX_VALIDATIONS dev mode. Clients must fetch GET /crypto/public-key.',
      );
      this.publicJwk = publicKey.export({ format: 'jwk' }) as JsonWebKey;
      return;
    } else {
      throw new Error(
        'PAYLOAD_CRYPTO_PRIVATE_KEY is required when RELAX_VALIDATIONS is not enabled',
      );
    }

    const publicKey = createPublicKey(this.privateKey);
    this.publicJwk = publicKey.export({ format: 'jwk' }) as JsonWebKey;
  }

  getPublicJwk(): JsonWebKey {
    return this.publicJwk;
  }

  isEncryptedEnvelope(body: unknown): body is EncryptedPayloadEnvelope {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return false;
    }
    const record = body as Record<string, unknown>;
    return (
      record.v === PAYLOAD_CRYPTO_VERSION &&
      typeof record.key === 'string' &&
      typeof record.iv === 'string' &&
      typeof record.data === 'string' &&
      record.key.length > 0 &&
      record.iv.length > 0 &&
      record.data.length > 0
    );
  }

  decryptEnvelope<T = unknown>(envelope: EncryptedPayloadEnvelope): T {
    if (envelope.v !== PAYLOAD_CRYPTO_VERSION) {
      throw new BadRequestException('Unsupported encrypted payload version');
    }

    let aesKey: Buffer;
    try {
      aesKey = privateDecrypt(
        {
          key: this.privateKey,
          padding: 4, // RSA_PKCS1_OAEP_PADDING
          oaepHash: 'sha256',
        },
        Buffer.from(envelope.key, 'base64'),
      );
    } catch {
      throw new BadRequestException('Invalid encrypted payload key');
    }

    if (aesKey.length !== AES_KEY_BYTES) {
      throw new BadRequestException('Invalid encrypted payload key length');
    }

    const iv = Buffer.from(envelope.iv, 'base64');
    if (iv.length !== GCM_IV_BYTES) {
      throw new BadRequestException('Invalid encrypted payload iv');
    }

    const combined = Buffer.from(envelope.data, 'base64');
    if (combined.length <= GCM_TAG_BYTES) {
      throw new BadRequestException('Invalid encrypted payload data');
    }

    const ciphertext = combined.subarray(0, combined.length - GCM_TAG_BYTES);
    const tag = combined.subarray(combined.length - GCM_TAG_BYTES);

    let plaintext: Buffer;
    try {
      const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
      decipher.setAuthTag(tag);
      plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
    } catch {
      throw new BadRequestException('Invalid encrypted payload data');
    }

    try {
      const text = plaintext.toString('utf8');
      if (!text) {
        return {} as T;
      }
      return JSON.parse(text) as T;
    } catch {
      throw new BadRequestException('Encrypted payload is not valid JSON');
    }
  }

  private generateDevKeyPair(): { privateKey: KeyObject; publicKey: KeyObject } {
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return {
      privateKey: createPrivateKey(pair.privateKey),
      publicKey: createPublicKey(pair.publicKey),
    };
  }
}

/** Test helper: encrypt a JSON body with the service public JWK (Node crypto only). */
export function encryptPayloadForTests(
  publicJwk: JsonWebKey,
  payload: unknown,
): EncryptedPayloadEnvelope {
  const aesKey = randomBytes(AES_KEY_BYTES);
  const iv = randomBytes(GCM_IV_BYTES);
  const plaintext = Buffer.from(JSON.stringify(payload ?? {}), 'utf8');
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const wrappedKey = publicEncrypt(
    {
      key: createPublicKey({ key: publicJwk, format: 'jwk' }),
      padding: 4,
      oaepHash: 'sha256',
    },
    aesKey,
  );
  return {
    v: PAYLOAD_CRYPTO_VERSION,
    key: wrappedKey.toString('base64'),
    iv: iv.toString('base64'),
    data: Buffer.concat([encrypted, tag]).toString('base64'),
  };
}
