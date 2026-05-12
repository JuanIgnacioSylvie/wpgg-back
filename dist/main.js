"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const app_module_1 = require("./app.module");
const relax_env_1 = require("./config/relax-env");
const http_exception_filter_1 = require("./shared/presentation/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const relax = (0, relax_env_1.isRelaxFromConfig)(configService);
    if (!relax) {
        app.use((0, helmet_1.default)());
    }
    const allowedOriginsRaw = configService.get('ALLOWED_ORIGINS', '');
    const allowedOrigins = allowedOriginsRaw
        ? allowedOriginsRaw
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : [];
    const corsAllowAny = relax ||
        (allowedOrigins.length === 1 && allowedOrigins[0] === '*');
    app.enableCors({
        origin: corsAllowAny
            ? true
            : allowedOrigins.length > 0
                ? (origin, callback) => {
                    if (!origin) {
                        callback(null, true);
                        return;
                    }
                    if (allowedOrigins.includes(origin)) {
                        callback(null, true);
                    }
                    else {
                        callback(null, false);
                    }
                }
                : false,
        credentials: true,
    });
    app.use(cookieParser());
    app.useGlobalPipes(new common_1.ValidationPipe(relax
        ? {
            whitelist: false,
            forbidNonWhitelisted: false,
            transform: true,
        }
        : {
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const port = configService.get('PORT', 3000);
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map