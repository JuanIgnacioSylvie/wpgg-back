# Railway — API + Worker (Fase 1)

Arquitectura con dos servicios en el mismo repo y Redis compartido.

## Servicios

| Service | Start command | `APP_MODE` | Redis |
|---------|---------------|------------|-------|
| **wpgg-api** | `npm run start:with-migrate` | `api` | No |
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

Start command:

```bash
npm run start:with-migrate
```

Health check path: `/health`

### 3. Service `wpgg-worker` (nuevo)

1. **New Service → GitHub Repo** → mismo repo `wpgg-back`.
2. Variables compartidas con la API (mismo proyecto Railway → **Shared Variables**):

```bash
APP_MODE=worker
REDIS_URL=${{Redis.REDIS_URL}}   # referencia al plugin Redis
DATABASE_URL=${{Postgres.DATABASE_URL}}
RIOT_API_KEY=...
JWT_SECRET=...                    # misma DB; no expone HTTP auth
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
