import { requiresEncryptedPayload } from './encrypted-routes';

describe('requiresEncryptedPayload', () => {
  it('matches auth and wallet routes', () => {
    expect(requiresEncryptedPayload('POST', '/auth/login')).toBe(true);
    expect(requiresEncryptedPayload('POST', '/auth/register')).toBe(true);
    expect(requiresEncryptedPayload('POST', '/auth/reset-password')).toBe(true);
    expect(requiresEncryptedPayload('POST', '/auth/riot-session')).toBe(true);
    expect(requiresEncryptedPayload('POST', '/auth/refresh')).toBe(true);
    expect(requiresEncryptedPayload('POST', '/withdrawals')).toBe(true);
    expect(requiresEncryptedPayload('POST', '/contact/sponsor')).toBe(true);
    expect(requiresEncryptedPayload('POST', '/contact/support')).toBe(true);
  });

  it('matches parameterized store and riot routes', () => {
    expect(
      requiresEncryptedPayload('POST', '/store/products/rp-650/purchase'),
    ).toBe(true);
    expect(requiresEncryptedPayload('POST', '/riot/rso/refresh')).toBe(true);
    expect(requiresEncryptedPayload('POST', '/riot/rso/userinfo')).toBe(true);
  });

  it('ignores GET and unlisted POST routes', () => {
    expect(requiresEncryptedPayload('GET', '/auth/login')).toBe(false);
    expect(requiresEncryptedPayload('POST', '/auth/logout')).toBe(false);
    expect(requiresEncryptedPayload('POST', '/missions/sync')).toBe(false);
  });
});
