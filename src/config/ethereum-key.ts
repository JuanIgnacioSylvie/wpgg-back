const PRIVATE_KEY_PATTERN = /^(0x)?[0-9a-fA-F]{64}$/;

export function isValidEthereumPrivateKey(value: string): boolean {
  return PRIVATE_KEY_PATTERN.test(value.trim());
}

export function normalizeEthereumPrivateKey(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
}
