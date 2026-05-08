"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var NodeEnvironment;
(function (NodeEnvironment) {
    NodeEnvironment["Development"] = "development";
    NodeEnvironment["Production"] = "production";
    NodeEnvironment["Test"] = "test";
})(NodeEnvironment || (NodeEnvironment = {}));
class EnvironmentVariables {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'DATABASE_URL is required' }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "DATABASE_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'JWT_SECRET is required' }),
    (0, class_validator_1.MinLength)(32, {
        message: 'JWT_SECRET must be at least 32 characters long',
    }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'JWT_ACCESS_EXPIRY is required' }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_ACCESS_EXPIRY", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'JWT_REFRESH_EXPIRY is required' }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_REFRESH_EXPIRY", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'RIOT_API_KEY is required' }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "RIOT_API_KEY", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'PORT must be an integer' }),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "PORT", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(NodeEnvironment, {
        message: `NODE_ENV must be one of: ${Object.values(NodeEnvironment).join(', ')}`,
    }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "NODE_ENV", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'ALLOWED_ORIGINS is required' }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "ALLOWED_ORIGINS", void 0);
function validate(config) {
    const rawConfig = {
        ...config,
        PORT: config['PORT'] !== undefined ? Number(config['PORT']) : undefined,
    };
    const validatedConfig = (0, class_transformer_1.plainToInstance)(EnvironmentVariables, rawConfig, {
        enableImplicitConversion: true,
    });
    const errors = (0, class_validator_1.validateSync)(validatedConfig, {
        skipMissingProperties: false,
    });
    if (errors.length > 0) {
        const messages = errors
            .map((error) => Object.values(error.constraints ?? {}).join(', '))
            .join('; ');
        throw new Error(`Environment validation failed: ${messages}`);
    }
    return validatedConfig;
}
//# sourceMappingURL=env.config.js.map