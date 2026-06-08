# Railway — API + Worker (Fase 1)

Arquitectura con dos servicios en el mismo repo y Redis compartido.

## Servicios

| Service | Start command | `APP_MODE` | Redis |
|---------|---------------|------------|-------|
| **wpgg-api** | `npm run start:api` (+ `prisma:deploy` en preDeploy vía `railway.toml`) | `api` | No |
| **wpgg-worker** | `npm run start:prod:worker` | `worker` | Sí |
| **Redis** | Railway plugin | — | — |
| **PostgreSQL** | Railway plugin | — | — |

## Pasos en Railway

### 1. Redis

1. En el proyecto Railway: **New → Database → Redis**.
2. Copia `REDIS_URL` (o la variable que exponga el plugin).

### 2. Service `wpgg-api` (existente)

Variables **nuevas / a actualizar**:

```bash
APP_MODE=api
```

Variables **sin cambio**: `DATABASE_URL`, `JWT_SECRET`, `RIOT_API_KEY`, `ALLOWED_ORIGINS`, blockchain, etc.

**No** hace falta `REDIS_URL` en el service API (Fase 1).

El repo incluye `railway.toml` para el service API:

- **Build:** `npm run build` (solo compila; no necesita `DATABASE_URL`)
- **Pre-deploy:** `npm run prisma:deploy` (migraciones con `DATABASE_URL`)
- **Start:** `npm run start:api`

Si en el dashboard de Railway tenías **Build Command** = `npm run start:with-migrate`, borralo o dejalo vacío para que use `railway.toml`. Ese script mezcla migrate + start y falla en build porque ahí no hay `DATABASE_URL`.

**No uses** `node dist/main` en Railway sin `REDIS_URL` y `APP_MODE=all`.

Health check path: `/health`

### 3. Service `wpgg-worker` (nuevo)

1. **New Service → GitHub Repo** → mismo repo `wpgg-back`.
2. Variables compartidas con la API (mismo proyecto Railway → **Shared Variables**):

```bash
APP_MODE=worker
REDIS_URL=${{Redis.REDIS_URL}}   # referencia al plugin Redis
DATABASE_URL=${{Postgres.DATABASE_URL}}
RIOT_API_KEY=...
NODE_ENV=production
```

Opcional (el worker no las usa en Fase 1; el código rellena defaults si faltan):

```bash
JWT_SECRET=${{wpgg-api.JWT_SECRET}}
```

3. Start command:

```bash
npm run build && npm run start:prod:worker
```

O si el build ya corre en deploy:

```bash
npm run start:prod:worker
```

4. Health check: `/health` (debe responder `{ status: "ok", mode: "worker" }`).
5. **Réplicas**: mantener **1** instancia del worker (los schedulers usan lock Redis, pero un solo worker es más simple).

### 4. Verificación

```bash
# API
curl https://tu-api.up.railway.app/health
# → { "status": "ok", "mode": "api" }

# Worker
curl https://tu-worker.up.railway.app/health
# → { "status": "ok", "mode": "worker" }
```

Con usuarios con misiones activas, en logs del worker deberías ver:

- `Enqueued mission sync for N users`
- `Synced user ...: X new matches`

## Desarrollo local

```bash
docker compose up -d          # postgres + redis
cp .env.example .env
npm run build
# Terminal 1 — API + worker juntos:
APP_MODE=all npm run start:all

# O separado:
APP_MODE=api npm run start:api
APP_MODE=worker npm run start:worker
```

## Qué hace cada proceso

| Tarea | API | Worker |
|-------|-----|--------|
| REST `/auth`, `/missions`, `/wallet`, … | ✅ | ❌ |
| `POST /missions/sync` (on-demand) | ✅ síncrono | ❌ |
| Scheduler sync cada 5 min | ❌ | ✅ → cola BullMQ |
| Scheduler expiración misiones | ❌ | ✅ → cola BullMQ |
| Bootstrap mission templates | ❌ | ✅ |
| Retiros on-chain | ✅ (sin cambio Fase 1) | ❌ |

## Próximas fases

- Fase 2: rate limiter Riot, retiros async, `PRIVATE_KEY` solo en worker.
- Fase 3: PgBouncer, throttler Redis en API, réplicas API.
