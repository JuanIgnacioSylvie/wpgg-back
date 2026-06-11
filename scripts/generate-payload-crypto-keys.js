#!/usr/bin/env node
/**
 * Generates an RSA-2048 key pair for PAYLOAD_CRYPTO_PRIVATE_KEY.
 * Usage: node scripts/generate-payload-crypto-keys.js
 */
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

const pair = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const outDir = path.join(__dirname, '..', '.payload-crypto');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'private.pem'), pair.privateKey, 'utf8');
fs.writeFileSync(path.join(outDir, 'public.pem'), pair.publicKey, 'utf8');

console.log('Wrote .payload-crypto/private.pem and public.pem');
console.log('');
console.log('Set in production (single line, or use your secret manager):');
console.log('PAYLOAD_CRYPTO_PRIVATE_KEY="' + pair.privateKey.replace(/\n/g, '\\n') + '"');
