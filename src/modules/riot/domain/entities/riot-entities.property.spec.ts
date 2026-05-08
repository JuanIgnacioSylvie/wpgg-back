import * as fc from 'fast-check';
import { RiotAccountEntity } from './riot-account.entity';
import { RankedEntryEntity } from './ranked-entry.entity';

/**
 * Property 13: RiotAccountEntity.getRiotId() format
 * Validates: Requirements 12.9
 */
describe('RiotAccountEntity - Property Tests', () => {
  describe('Property 13: getRiotId() format', () => {
    it('should return "{gameName}#{tagLine}" for any non-empty gameName and tagLine', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (gameName, tagLine) => {
            const entity = new RiotAccountEntity(
              'id',
              'userId',
              'puuid',
              gameName,
              tagLine,
              'EUW1',
              'summonerId',
              'accountId',
              new Date(),
            );

            const riotId = entity.getRiotId();

            return riotId === `${gameName}#${tagLine}`;
          },
        ),
      );
    });
  });
});

/**
 * Property 11: Win rate always in valid range
 * Validates: Requirements 8.2
 */
describe('RankedEntryEntity - Property Tests', () => {
  describe('Property 11: getWinRate() always in valid range [0, 100]', () => {
    it('should return an integer in [0, 100] for any non-negative wins and losses', () => {
      fc.assert(
        fc.property(
          fc.nat(), // non-negative integer for wins
          fc.nat(), // non-negative integer for losses
          (wins, losses) => {
            const entity = new RankedEntryEntity(
              'RANKED_SOLO_5x5',
              'GOLD',
              'I',
              50,
              wins,
              losses,
              false,
            );

            const winRate = entity.getWinRate();

            // Must be an integer
            const isInteger = Number.isInteger(winRate);
            // Must be in [0, 100]
            const isInRange = winRate >= 0 && winRate <= 100;

            return isInteger && isInRange;
          },
        ),
      );
    });

    it('should return 0 when both wins and losses are 0', () => {
      const entity = new RankedEntryEntity(
        'RANKED_SOLO_5x5',
        'UNRANKED',
        '',
        0,
        0,
        0,
        false,
      );

      expect(entity.getWinRate()).toBe(0);
    });
  });
});
