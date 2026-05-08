"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRefreshTokenByPlain = findRefreshTokenByPlain;
async function findRefreshTokenByPlain(plain, tokens, hashProvider) {
    for (const t of tokens) {
        if (await hashProvider.compare(plain, t.tokenHash)) {
            return t;
        }
    }
    return null;
}
//# sourceMappingURL=refresh-token-lookup.js.map