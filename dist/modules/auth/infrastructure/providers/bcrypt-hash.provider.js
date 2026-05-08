"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BcryptHashProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BcryptHashProvider = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
let BcryptHashProvider = BcryptHashProvider_1 = class BcryptHashProvider {
    async hash(plain) {
        return bcrypt.hash(plain, BcryptHashProvider_1.ROUNDS);
    }
    async compare(plain, hashed) {
        return bcrypt.compare(plain, hashed);
    }
};
exports.BcryptHashProvider = BcryptHashProvider;
BcryptHashProvider.ROUNDS = 12;
exports.BcryptHashProvider = BcryptHashProvider = BcryptHashProvider_1 = __decorate([
    (0, common_1.Injectable)()
], BcryptHashProvider);
//# sourceMappingURL=bcrypt-hash.provider.js.map