# Nostromo Guardian – Qubic Analytics & EasyConnect Automation

Nostromo Guardian indexa trades de QX en la red Qubic, calcula holders/whales, expone analíticas, alertas y webhooks listos para Make/Zapier/n8n, y puede enriquecer eventos con IA (opcional). Incluye backend (Node/Express/PostgreSQL), indexers/seeders, y frontend (React/Vite/Tailwind).

## Features
- **Indexing & Analytics**: trades desde RPC/Query API, holders/whales, snapshots, leaderboards, riesgo/crecimiento.
- **Alert Engine**: volumen spike, whale buy, holder surge; acciones vía webhooks, AI enrichment si hay `OPENAI_API_KEY`.
- **Webhooks EasyConnect**: registros, toggle, test, firma opcional; eventos como `whale.buy`, `whale.sell`, `holder.new`, `volume.spike`, `price.change`, `leaderboard.update`, `alert.triggered`, `alert.failed`, `achievement.diamond_hand`.
- **AI opcional**: analizar trades y generar anuncios (`/api/v1/ai/analyze-trade`, `/api/v1/ai/generate-announcement`).
- **Frontend**: dashboard, token analyzer, address lookup, leaderboard, webhooks manager, alerts manager, AI playground, guía de integraciones.

## Env vars (backend)
- `DATABASE_URL` (usa `DB_SSL=true` en Railway/prod).
- `API_HOST=0.0.0.0`, `API_PORT=$PORT` (en Railway).
- `CORS_ORIGIN=https://<tu-frontend>`.
- RPC/QX: `QUBIC_RPC_MAINNET`, `QUBIC_RPC_TESTNET`, `QUBIC_RPC_ACTIVE`, `QX_CONTRACT_INDEX`, `QX_CONTRACT_ADDRESS`.
- Indexer: `INDEXER_START_TICK`, `INDEXER_BATCH_SIZE`, `INDEXER_POLL_INTERVAL_MS`, `INDEXER_MAX_RETRIES`, `INDEXER_SKIP_EMPTY_TICKS`, `INDEXER_FAST_FORWARD`.
- Seeds/Cron: `SEED_CRON_ENABLED`, `SEED_CRON_INTERVAL_MS`, `SEED_CRON_TARGET_TRADES`, `SEED_LOOP_INTERVAL_MS`.
- AI opcional: `OPENAI_API_KEY`.

## Env vars (frontend)
- `VITE_API_URL=https://qubictokenanalyzer-production.up.railway.app` (o tu backend).

## Inicializar datos
1) Cargar esquema:
   ```bash
   psql "$DATABASE_URL" -f src/database/schema.sql
   ```
2) Sembrar trades (Query API):
   ```bash
   railway run "npm run query-seed"
   ```
3) Recalcular holders:
   ```bash
   railway run "npm run calculate-holders"
   ```
4) Indexado continuo (worker recomendado):
   ```bash
   railway run "npm run smart-index"
   ```

## Despliegue en Railway
- Backend: Build `npm run build`; Start `npm start`; `API_PORT=$PORT`; `DB_SSL=true`; `CORS_ORIGIN=<frontend>`.
- Frontend (path `frontend`): Build `npm install && npm run build`; output `dist`; `VITE_API_URL=<backend>`.
- DB init: `railway run "psql $DATABASE_URL -f src/database/schema.sql"`.

## Integración EasyConnect
- Registra webhooks: `POST /api/v1/webhooks/register`.
- Test: `POST /api/v1/webhooks/:id/test`.
- Alertas: `POST/GET/PATCH/DELETE /api/v1/alerts`, `POST /api/v1/alerts/:id/test`.
- Leaderboard/gamificación: `GET /api/v1/leaderboard/traders`, `GET /api/v1/leaderboard/whale-hunters`.
- AI (opcional): `POST /api/v1/ai/analyze-trade`, `POST /api/v1/ai/generate-announcement`.

## Frontend pages
Dashboard, Token Analyzer, Address Lookup, Leaderboard, Webhooks, Alerts, AI Analytics, Integrations. Configura `VITE_API_URL` y `CORS_ORIGIN` para producción.
