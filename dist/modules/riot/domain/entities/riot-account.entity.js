"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiotAccountEntity = void 0;
class RiotAccountEntity {
    constructor(id, userId, puuid, gameName, tagLine, region, summonerId, accountId, linkedAt) {
        this.id = id;
        this.userId = userId;
        this.puuid = puuid;
        this.gameName = gameName;
        this.tagLine = tagLine;
        this.region = region;
        this.summonerId = summonerId;
        this.accountId = accountId;
        this.linkedAt = linkedAt;
    }
    static create(props) {
        return new RiotAccountEntity(props.id, props.userId, props.puuid, props.gameName, props.tagLine, props.region, props.summonerId, props.accountId, new Date());
    }
    getRiotId() {
        return `${this.gameName}#${this.tagLine}`;
    }
}
exports.RiotAccountEntity = RiotAccountEntity;
//# sourceMappingURL=riot-account.entity.js.map