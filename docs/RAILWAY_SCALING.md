# Railway — API + Worker (Fase 1)

Arquitectura con dos servicios en el mismo repo y Redis compartido.

## Servicios

| Service | Start command | `APP_MODE` | Redis |
|---------|---------------|------------|-------|
| **wpgg-api** | `npm run start:railway` (vía `railway.toml`; usa `main-api` si `APP_MODE=api`) | `api` | No |
| **wpgg-worker** | `npm run start:railway` (mismo `railway.toml`; usa `main-worker` si `APP_MODE=worker`) | `worker` | Sí |
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
- **Pre-deploy:** `node scripts/pre-deploy.js` (migraciones solo en `APP_MODE=api`; el worker las omite)
- **Start:** `npm run start:railway` (con `APP_MODE=api`)

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

**Firebase (requerido para push + inbox al completar misiones en el worker):**

```bash
FIREBASE_SERVICE_ACCOUNT_JSON=${{wpgg-api.FIREBASE_SERVICE_ACCOUNT_JSON}}
# o las tres vars sueltas referenciando wpgg-api
FIREBASE_PROJECT_ID=${{wpgg-api.FIREBASE_PROJECT_ID}}
FIREBASE_CLIENT_EMAIL=${{wpgg-api.FIREBASE_CLIENT_EMAIL}}
FIREBASE_PRIVATE_KEY=${{wpgg-api.FIREBASE_PRIVATE_KEY}}
```

**Observabilidad (recomendado en ambos servicios):**

```bash
LOG_LEVEL=log
NPM_CONFIG_OMIT=dev
```

3. Start command: dejar vacío en el dashboard para usar `railway.toml` (`npm run start:railway`). Con `APP_MODE=worker` arranca `main-worker` automáticamente.

Si tenías un override manual (`npm run start:api` o `start:prod:worker`), bórralo para que use el toml del repo.

4. Health check: `/health` (debe responder `{ status: "ok", mode: "worker" }`).
5. **Réplicas**: mantener **1** instancia del worker (los schedulers usan lock Redis, pero un solo worker es más simple).

### Worker deploy colgado / healthcheck falla

El worker **no** usa `MissionsController`; un fallo de DI en la API no lo afecta. Si el deploy tarda mucho o falla el healthcheck:

| Revisar | Valor esperado en `wpgg-worker` |
|---------|----------------------------------|
| `APP_MODE` | `worker` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` (referencia al plugin Redis del mismo proyecto) |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `RIOT_API_KEY` | misma que la API |
| Start command (dashboard) | vacío → usa `railway.toml` (`npm run start:railway`) |

En **logs del worker** (no de la API), buscá:

- `Nest can't resolve dependencies` → falta un provider/export en un módulo compartido
- `REDIS_URL is required` → falta variable o `APP_MODE` incorrecto
- `ECONNREFUSED` / `Redis connection` → Redis mal linkeado o caído
- Si **no** aparece `[worker] HTTP ready` → el proceso crashea antes de escuchar en `/health`

**Mitigación rápida:** en Railway → servicio worker → Settings → desactivar **Healthcheck** temporalmente (el worker no es público; solo necesita el proceso vivo). Luego corregí `REDIS_URL` y volvé a activarlo.

**Pre-deploy:** el worker **omite** migraciones (`[pre-deploy] Skipping prisma migrate deploy on worker service`); las corre la API.

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

## Observabilidad en Railway

### Logs útiles (CLI)

```bash
railway logs --service wpgg-api --http --status ">=400" --lines 50
railway logs --service wpgg-api --http --filter "@totalDuration:>=3000"
railway logs --service wpgg-worker --lines 100
```

En producción (`LOG_LEVEL=log` o sin definir), el worker emite en nivel **LOG**:

- `Enqueued mission sync for N users` (cada 30 min por defecto; fallback si el usuario no sincroniza manualmente)
- `Enqueued mission expiry job` (cada hora)
- `Synced user ...: X new matches` (cuando procesa partidas nuevas)

Buscar `Mission push/inbox failed` si Firebase no está configurado en el worker.

### Alertas sugeridas (Railway dashboard → Observability)

| Alerta | Condición |
|--------|-----------|
| Deploy fallido | deployment status = failed |
| Restarts frecuentes | container restarts > N en 15 min |
| Errores HTTP | `@httpStatus:>=500` en logs HTTP del API |
| Latencia alta | `@totalDuration:>=5000` en rutas críticas (`/missions/home`) |

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
| REST `/auth`, `/missions`, `/wallet`, … | ✅ | ❌ (solo `/health`) |
| `GET /missions/home` | ✅ lectura rápida (sin sync Riot) | ❌ |
| `GET /missions/sync-status` | ✅ 1 llamada Riot (staleness) | ❌ |
| `POST /missions/sync` (manual) | ✅ síncrono | ❌ |
| Scheduler sync cada 30 min (fallback) | ❌ | ✅ → cola BullMQ |
| Scheduler expiración misiones | ❌ | ✅ → cola BullMQ |
| Bootstrap mission templates | ❌ | ✅ |
| Retiros on-chain | ✅ (sin cambio Fase 1) | ❌ |

## Próximas fases

- Fase 2: rate limiter Riot, retiros async, `PRIVATE_KEY` solo en worker.
- Fase 3: PgBouncer, throttler Redis en API, réplicas API.
