import { createPrivateKey, type KeyObject } from 'crypto';

/**
 * Normalizes PEM private keys from env vars (Railway, Docker, .env).
 * Handles literal `\n`, surrounding quotes, and CRLF.
 */
export function normalizePrivateKeyPem(raw: string): string {
  let pem = raw.trim();
  if (
    (pem.startsWith('"') && pem.endsWith('"')) ||
    (pem.startsWith("'") && pem.endsWith("'"))
  ) {
    pem = pem.slice(1, -1);
  }
  pem = pem.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
  if (!pem.includes('-----BEGIN')) {
    throw new Error(
      'PAYLOAD_CRYPTO_PRIVATE_KEY must be a PEM private key starting with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----',
    );
  }
  return pem.endsWith('\n') ? pem : `${pem}\n`;
}

export function loadPrivateKeyFromEnv(raw: string): KeyObject {
  const pem = normalizePrivateKeyPem(raw);
  try {
    return createPrivateKey(pem);
  } catch {
    throw new Error(
      'PAYLOAD_CRYPTO_PRIVATE_KEY is not a valid RSA private key PEM. ' +
        'Regenerate with: node scripts/generate-payload-crypto-keys.js ' +
        'and paste private.pem (use real newlines in Railway, or \\n in a single line).',
    );
  }
}
