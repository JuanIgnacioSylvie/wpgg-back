import * as fc from 'fast-check';
import { RefreshTokenEntity } from './refresh-token.entity';

/**
 * Helper to build a RefreshTokenEntity directly via the constructor,
 * bypassing `create()` so we can control the `revoked` field.
 */
function buildToken(
  expiresAt: Date,
  revoked: boolean,
): RefreshTokenEntity {
  return new RefreshTokenEntity(
    'test-id',
    'test-token-hash',
    'test-user-id',
    expiresAt,
    new Date(),
    revoked,
  );
}

describe('RefreshTokenEntity — Property-Based Tests', () => {
  /**
   * Property 9: RefreshTokenEntity.isExpired() correctness
   * Validates: Requirements 12.1, 12.2
   *
   * - A token whose expiresAt is strictly before now must return isExpired() = true
   * - A token whose expiresAt is equal to or after now must return isExpired() = false
   */
  describe('Property 9: isExpired() correctness', () => {
    it('should return true for any past expiresAt (expiresAt < now)', () => {
      fc.assert(
        fc.property(
          // Generate a date strictly in the past: between 1ms and 10 years ago
          fc.integer({ min: 1, max: 10 * 365 * 24 * 60 * 60 * 1000 }).map(
            (offsetMs) => new Date(Date.now() - offsetMs),
          ),
          (pastDate) => {
            const token = buildToken(pastDate, false);
            return token.isExpired() === true;
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should return false for any future expiresAt (expiresAt > now)', () => {
      fc.assert(
        fc.property(
          // Generate a date strictly in the future: between 1 second and 10 years from now
          fc.integer({ min: 1000, max: 10 * 365 * 24 * 60 * 60 * 1000 }).map(
            (offsetMs) => new Date(Date.now() + offsetMs),
          ),
          (futureDate) => {
            const token = buildToken(futureDate, false);
            return token.isExpired() === false;
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  /**
   * Property 10: RefreshTokenEntity.isValid() correctness
   * Validates: Requirements 12.3, 12.4
   *
   * - A revoked token must always return isValid() = false (regardless of expiry)
   * - A non-revoked, non-expired token must return isValid() = true
   * - A non-revoked but expired token must return isValid() = false
   */
  describe('Property 10: isValid() correctness', () => {
    it('should return false when revoked=true, regardless of expiresAt', () => {
      fc.assert(
        fc.property(
          // Mix of past and future dates
          fc.oneof(
            fc.integer({ min: 1, max: 10 * 365 * 24 * 60 * 60 * 1000 }).map(
              (offsetMs) => new Date(Date.now() - offsetMs),
            ),
            fc.integer({ min: 1000, max: 10 * 365 * 24 * 60 * 60 * 1000 }).map(
              (offsetMs) => new Date(Date.now() + offsetMs),
            ),
          ),
          (anyDate) => {
            const token = buildToken(anyDate, true);
            return token.isValid() === false;
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should return true when revoked=false and expiresAt is in the future', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10 * 365 * 24 * 60 * 60 * 1000 }).map(
            (offsetMs) => new Date(Date.now() + offsetMs),
          ),
          (futureDate) => {
            const token = buildToken(futureDate, false);
            return token.isValid() === true;
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should return false when revoked=false but expiresAt is in the past', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 365 * 24 * 60 * 60 * 1000 }).map(
            (offsetMs) => new Date(Date.now() - offsetMs),
          ),
          (pastDate) => {
            const token = buildToken(pastDate, false);
            return token.isValid() === false;
          },
        ),
        { numRuns: 200 },
      );
    });
  });
});
