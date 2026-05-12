"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRelaxEnv = isRelaxEnv;
exports.isRelaxFromConfig = isRelaxFromConfig;
function isRelaxEnv(value) {
    return value === true || value === 'true' || value === '1';
}
function isRelaxFromConfig(config) {
    return isRelaxEnv(config.get('RELAX_VALIDATIONS'));
}
//# sourceMappingURL=relax-env.js.map