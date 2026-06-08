# WPGG — Backend API

API REST en **NestJS** con **Clean Architecture** para la plataforma WPGG: autenticación, misiones diarias de League of Legends, sincronización de partidas vía Riot API, wallet de tokens WPGG y retiros on-chain en Polygon.

El repositorio soporta dos modos de ejecución (`APP_MODE`): **API HTTP** y **worker** de jobs en background (BullMQ + Redis), desplegables por separado en Railway.

## Requisitos

- **Node.js** 20+
- **PostgreSQL** 16
- **Redis** 7 (obligatorio si `APP_MODE=worker` o `all`)
- Clave de [Riot Developer Portal](https://developer.riotgames.com/)
- (Opcional) Credenciales Riot Sign On para OAuth
- (Opcional) Wallet Polygon con `PRIVATE_KEY` para retiros

## Inicio rápido (local)

```bash
git clone <repo-url> wpgg-back
cd wpgg-back
npm install

# Infraestructura local
docker compose up -d          # PostgreSQL :5432 + Redis :6379

cp .env.example .env          # editar JWT_SECRET, RIOT_API_KEY, etc.

npm run build
npm run prisma:migrate        # aplica migraciones
npm run prisma:seed           # datos iniciales (opcional)

# API + worker en un solo proceso (desarrollo)
APP_MODE=all npm run start:all

# O por separado en dos terminales:
APP_MODE=api npm run start:api
APP_MODE=worker npm run start:worker
```

Health check: `GET http://localhost:3000/health` → `{ "status": "ok", "mode": "api" | "worker" | "all" }`

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run build` | Genera Prisma Client y compila TypeScript |
| `npm run start:api` | Solo HTTP (`main-api`) |
| `npm run start:worker` | Solo jobs (`main-worker`) |
| `npm run start:all` | API + worker juntos |
| `npm run start:dev` | Nest en modo watch |
| `npm run prisma:migrate` | Migraciones en desarrollo |
| `npm run prisma:deploy` | Migraciones en producción |
| `npm run prisma:studio` | UI de base de datos |
| `npm run test` | Tests unitarios (Jest) |
| `npm run lint:check` | ESLint |

## Variables de entorno

Copiá `.env.example` y completá los valores. Resumen:

### Proceso

| Variable | Descripción |
|----------|-------------|
| `APP_MODE` | `api` \| `worker` \| `all` (default local: `all`) |
| `PORT` | Puerto HTTP (default `3000`) |
| `NODE_ENV` | `development` \| `production` \| `test` |

### Base de datos y colas

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Requerido si `APP_MODE` es `worker` o `all` |
| `BULL_PREFIX` | Prefijo de keys BullMQ (default `wpgg`) |
| `MISSION_SYNC_INTERVAL_MS` | Intervalo sync misiones (default 5 min) |
| `MISSION_EXPIRY_INTERVAL_MS` | Intervalo expiración (default 1 h) |
| `MISSION_SYNC_QUEUE_CONCURRENCY` | Jobs concurrentes (default 3) |

### Autenticación

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Mínimo 32 caracteres |
| `JWT_ACCESS_EXPIRY` | Ej. `15m` |
| `ALLOWED_ORIGINS` | Orígenes CORS separados por coma, o `*` |
| `SESSION_COOKIE_SAME_SITE` | `none` \| `lax` \| `strict` |
| `SESSION_COOKIE_SECURE` | `true` \| `false` |

### Riot

| Variable | Descripción |
|----------|-------------|
| `RIOT_API_KEY` | Clave de producción/dev de Riot |
| `RIOT_RSO_CLIENT_ID` | OAuth Riot Sign On |
| `RIOT_RSO_CLIENT_SECRET` | O bien `RIOT_RSO_CLIENT_ASSERTION` |
| `RIOT_RSO_REDIRECT_URI` | Callback registrado en portal Riot |
| `RIOT_RSO_SUCCESS_REDIRECT_URL` | URL web post-OAuth (SPA) |
| `RIOT_RSO_MOBILE_SUCCESS_REDIRECT_URL` | Deep link móvil (default `wpgg://auth/riot-callback`) |
| `RIOT_DEFAULT_LINK_REGION` | Región por defecto al vincular (ej. `LA2`) |

### Blockchain y email

| Variable | Descripción |
|----------|-------------|
| `POLYGON_RPC_URL` | RPC de Polygon Mainnet |
| `PRIVATE_KEY` | Clave del wallet que firma retiros |
| `CONTRACT_ADDRESS` | Contrato WPGG en Polygon |
| `RESEND_API_KEY` | Email transaccional (reset password) |
| `EMAIL_FROM` | Remitente |
| `PASSWORD_RESET_URL` | Ruta SPA del reset |

### Desarrollo

| Variable | Descripción |
|----------|-------------|
| `RELAX_VALIDATIONS` | `true` — relaja validación de env y CORS |

## Módulos y endpoints

| Módulo | Prefijo | Responsabilidad |
|--------|---------|-----------------|
| **auth** | `/auth` | Registro, login, refresh, logout, reset password, `riot-session` |
| **riot** | `/riot` | Vincular cuenta, summoner, partidas, ranked |
| **riot/rso** | `/riot/rso` | OAuth Riot Sign On (sign-in, link, callback) |
| **missions** | `/missions` | Home, picker, accept/reroll, sync on-demand |
| **wallet** | `/wallet` | Balance, transacciones, gráfico |
| **withdrawals** | `/withdrawals` | Retiros on-chain |
| **ddragon** | `/ddragon` | Proxy/cache Data Dragon |
| **health** | `/health` | Liveness para Railway |

## Arquitectura

```
src/
├── main-api.ts          # Entrypoint HTTP
├── main-worker.ts       # Entrypoint worker
├── main.ts              # API + worker (local)
├── app-api.module.ts
├── app-worker.module.ts
├── bootstrap.ts         # CORS, helmet, pipes, cookies
├── config/              # Validación de env
├── modules/
│   ├── auth/
│   ├── riot/
│   ├── missions/
│   ├── wallet/
│   ├── withdrawals/
│   ├── blockchain/
│   └── ddragon/
└── shared/
    ├── infrastructure/  # Prisma, Redis, BullMQ
    └── presentation/    # Filtros, health
```

Cada módulo de dominio sigue capas **domain → application → infrastructure → presentation** (use cases, repositorios, controladores).

### API vs Worker

| Tarea | API | Worker |
|-------|-----|--------|
| REST `/auth`, `/missions`, `/wallet`, … | ✅ | ❌ |
| `POST /missions/sync` (on-demand) | ✅ síncrono | ❌ |
| Scheduler sync cada 5 min | ❌ | ✅ → BullMQ |
| Scheduler expiración misiones | ❌ | ✅ → BullMQ |
| Bootstrap mission templates | ❌ | ✅ |
| Retiros on-chain | ✅ | ❌ |

## Base de datos

ORM: **Prisma** (`prisma/schema.prisma`). Modelos principales:

- `User`, `RiotAccount`, `RefreshToken`
- `MissionTemplate`, `MissionDay`, `UserMission`
- `WpggWallet`, `WpggTransaction`, `Withdrawal`
- `ProcessedMatch`

```bash
npm run prisma:migrate    # crear/aplicar migración en dev
npm run prisma:deploy     # producción (Railway pre-deploy)
npm run prisma:studio     # explorar datos
```

## Despliegue (Railway)

El repo incluye `railway.toml` para el servicio API:

- **Build:** `npm run build`
- **Pre-deploy:** `npm run prisma:deploy`
- **Start:** `npm run start:api`
- **Health:** `/health`

Para la arquitectura API + Worker + Redis en producción, ver la guía detallada:

**[docs/RAILWAY_SCALING.md](docs/RAILWAY_SCALING.md)**

## Tests

```bash
npm run test          # unitarios (src/**/*.spec.ts)
npm run test:e2e      # end-to-end
npm run test:cov      # cobertura
```

## Relación con el frontend

El cliente Flutter [`wpgg-front`](../wpgg-front) consume este API. Configuraciones críticas cross-repo:

1. `ALLOWED_ORIGINS` debe incluir el origen del front (ej. `https://wpgg-front-dev.vercel.app`).
2. `RIOT_RSO_SUCCESS_REDIRECT_URL` = origen del front + `/auth/riot-callback`.
3. Cookies de sesión con `SameSite=None; Secure` cuando front y API están en dominios distintos.
4. El front usa `--dart-define=WPGG_BASE_URL=<url-de-este-api>`.

## Licencia

UNLICENSED — proyecto privado.
