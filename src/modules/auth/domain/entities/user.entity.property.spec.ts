/**
 * Property-Based Tests for UserEntity.isValidEmail()
 *
 * Property 12: UserEntity.isValidEmail() correctness
 * Validates: Requirements 12.6, 12.7, 12.8
 *
 * The method must return `true` iff the email matches /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 * and must return `false` for null/empty strings.
 */

import * as fc from 'fast-check';
import { UserEntity } from './user.entity';

/** Reference regex — mirrors the implementation in UserEntity */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Helper: build a UserEntity with the given string as its email field */
function entityWithEmail(email: string): UserEntity {
  return new UserEntity('test-id', email, 'hash', new Date(), new Date());
}

describe('UserEntity.isValidEmail() — Property 12', () => {
  /**
   * Property 12a (Req 12.6):
   * For any string that matches the reference regex,
   * isValidEmail() must return true.
   */
  it('returns true for every string that matches the email regex (Req 12.6)', () => {
    // Build a valid-email generator: localPart + "@" + domain + "." + tld
    // Each segment is constrained to exclude whitespace and "@"
    const validEmailArb = fc
      .tuple(
        fc.stringMatching(/^[^\s@]+$/),   // local part
        fc.stringMatching(/^[^\s@]+$/),   // domain
        fc.stringMatching(/^[^\s@]+$/),   // tld
      )
      .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)
      .filter((s) => EMAIL_REGEX.test(s)); // keep only those that truly match

    fc.assert(
      fc.property(validEmailArb, (email) => {
        const entity = entityWithEmail(email);
        return entity.isValidEmail() === true;
      }),
    );
  });

  /**
   * Property 12b (Req 12.7):
   * For any arbitrary string that does NOT match the reference regex,
   * isValidEmail() must return false.
   */
  it('returns false for every string that does not match the email regex (Req 12.7)', () => {
    const invalidEmailArb = fc.string().filter((s) => !EMAIL_REGEX.test(s));

    fc.assert(
      fc.property(invalidEmailArb, (email) => {
        const entity = entityWithEmail(email);
        return entity.isValidEmail() === false;
      }),
    );
  });

  /**
   * Property 12c (Req 12.8):
   * isValidEmail() must return false for an empty string.
   */
  it('returns false for an empty string (Req 12.8)', () => {
    const entity = entityWithEmail('');
    expect(entity.isValidEmail()).toBe(false);
  });

  /**
   * Property 12d (Req 12.8):
   * isValidEmail() must return false when the entity is constructed
   * with a null-coerced empty value (simulating a null/blank input).
   *
   * Note: TypeScript types prevent passing actual null, so we test
   * the empty-string boundary which is the runtime equivalent.
   */
  it('returns false for whitespace-only strings (Req 12.8)', () => {
    const whitespaceArb = fc
      .string({ minLength: 1 })
      .filter((s) => s.trim() === '');

    fc.assert(
      fc.property(whitespaceArb, (email) => {
        const entity = entityWithEmail(email);
        return entity.isValidEmail() === false;
      }),
    );
  });

  /**
   * Consistency check: isValidEmail() agrees with the reference regex
   * for ALL arbitrary strings (combines 12a + 12b into one property).
   */
  it('agrees with the reference regex for all arbitrary strings', () => {
    fc.assert(
      fc.property(fc.string(), (email) => {
        const entity = entityWithEmail(email);
        const expected = EMAIL_REGEX.test(email);
        return entity.isValidEmail() === expected;
      }),
    );
  });
});
