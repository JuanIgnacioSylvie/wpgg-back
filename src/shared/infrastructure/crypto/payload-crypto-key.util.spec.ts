import { generateKeyPairSync } from 'crypto';
import {
  loadPrivateKeyFromEnv,
  normalizePrivateKeyPem,
} from './payload-crypto-key.util';

describe('payload-crypto-key.util', () => {
  it('converts literal \\n to newlines', () => {
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const singleLine = pair.privateKey.replace(/\n/g, '\\n');
    const loaded = loadPrivateKeyFromEnv(singleLine);
    expect(loaded.type).toBe('private');
  });

  it('strips surrounding quotes', () => {
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const quoted = `"${pair.privateKey.replace(/\n/g, '\\n')}"`;
    const loaded = loadPrivateKeyFromEnv(quoted);
    expect(loaded.type).toBe('private');
  });

  it('rejects non-PEM values', () => {
    expect(() => normalizePrivateKeyPem('not-a-key')).toThrow(
      /must be a PEM private key/,
    );
  });
});
