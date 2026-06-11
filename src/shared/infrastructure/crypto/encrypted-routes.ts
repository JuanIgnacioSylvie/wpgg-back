/**
 * POST routes whose JSON body must arrive encrypted (envelope v1).
 * Paths are normalized: no trailing slash, lowercase.
 */
const EXACT_ROUTES = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/riot-session',
  '/auth/refresh',
  '/withdrawals',
  '/contact/sponsor',
]);

const PATTERN_ROUTES: RegExp[] = [
  /^\/store\/products\/[^/]+\/purchase$/,
  /^\/riot\/rso\/(refresh|userinfo)$/,
];

export function normalizeRequestPath(path: string): string {
  const withoutQuery = path.split('?')[0] ?? path;
  const trimmed = withoutQuery.replace(/\/+$/, '') || '/';
  return trimmed.toLowerCase();
}

export function requiresEncryptedPayload(method: string, path: string): boolean {
  if (method.toUpperCase() !== 'POST') {
    return false;
  }
  const normalized = normalizeRequestPath(path);
  if (EXACT_ROUTES.has(normalized)) {
    return true;
  }
  return PATTERN_ROUTES.some((re) => re.test(normalized));
}
