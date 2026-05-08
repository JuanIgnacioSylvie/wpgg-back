"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankedEntryEntity = void 0;
class RankedEntryEntity {
    constructor(queueType, tier, rank, leaguePoints, wins, losses, hotStreak) {
        this.queueType = queueType;
        this.tier = tier;
        this.rank = rank;
        this.leaguePoints = leaguePoints;
        this.wins = wins;
        this.losses = losses;
        this.hotStreak = hotStreak;
    }
    getWinRate() {
        const total = this.wins + this.losses;
        return total === 0 ? 0 : Math.round((this.wins / total) * 100);
    }
}
exports.RankedEntryEntity = RankedEntryEntity;
//# sourceMappingURL=ranked-entry.entity.js.map