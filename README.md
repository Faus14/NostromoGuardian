# Nostromo Guardian - Qubic Analytics & EasyConnect Automation

Nostromo Guardian indexes QX trades on Qubic, tracks holders/whales, exposes analytics, alerts, and EasyConnect-ready webhooks, and can enrich events with optional AI (OpenAI). Stack: Node/Express/PostgreSQL, TypeScript indexers/seeders, React/Vite/Tailwind frontend.

## Features
- Indexing & analytics: trades from RPC/Query API, holders/whales, snapshots, leaderboards, risk/growth scores.
- Alert engine: volume spike, whale buy, holder surge; webhook actions; optional AI enrichment.
- Webhooks (EasyConnect-ready): register/list/test/update/delete; events include `whale.buy`, `whale.sell`, `holder.new`, `volume.spike`, `price.change`, `leaderboard.update`, `alert.triggered`, `alert.failed`, `achievement.diamond_hand`.
- AI (optional): analyze trades and generate announcements (`/api/v1/ai/analyze-trade`, `/api/v1/ai/generate-announcement`).
- Frontend: dashboard, token analyzer, address lookup, leaderboard, webhooks manager, alerts manager, AI playground, integrations guide.

## Backend env vars
- `DATABASE_URL` (use `DB_SSL=true` in prod/Railway)
- `API_HOST=0.0.0.0`, `API_PORT=$PORT` (on Railway)
- `CORS_ORIGIN=https://<your-frontend>`
- RPC/QX: `QUBIC_RPC_MAINNET`, `QUBIC_RPC_TESTNET`, `QUBIC_RPC_ACTIVE`, `QX_CONTRACT_INDEX`, `QX_CONTRACT_ADDRESS`
- Indexer: `INDEXER_START_TICK`, `INDEXER_BATCH_SIZE`, `INDEXER_POLL_INTERVAL_MS`, `INDEXER_MAX_RETRIES`, `INDEXER_SKIP_EMPTY_TICKS`, `INDEXER_FAST_FORWARD`
- Seeds/Cron: `SEED_CRON_ENABLED`, `SEED_CRON_INTERVAL_MS`, `SEED_CRON_TARGET_TRADES`, `SEED_LOOP_INTERVAL_MS`
- AI (optional): `OPENAI_API_KEY`

## Frontend env vars
- `VITE_API_URL=https://qubictokenanalyzer-production.up.railway.app` (or your backend URL)

## Initialize data
1) Schema: `psql "$DATABASE_URL" -f src/database/schema.sql`
2) Seed trades (Query API): `railway run "npm run query-seed"`
3) Recalculate holders: `railway run "npm run calculate-holders"`
4) Continuous indexing (worker): `railway run "npm run smart-index"`

## Deploy on Railway
- Backend: Build `npm run build`; Start `npm start`; `API_PORT=$PORT`; `DB_SSL=true`; `CORS_ORIGIN=<frontend>`.
- Frontend (path `frontend`): Build `npm install && npm run build`; output `dist`; `VITE_API_URL=<backend>`.
- DB init: `railway run "psql $DATABASE_URL -f src/database/schema.sql"`.

## Key endpoints
- Webhooks: `POST /api/v1/webhooks/register`, `GET /api/v1/webhooks/list`, `POST /api/v1/webhooks/:id/test`
- Alerts: `POST/GET/PATCH/DELETE /api/v1/alerts`, `POST /api/v1/alerts/:id/test`
- Leaderboard: `GET /api/v1/leaderboard/traders`, `GET /api/v1/leaderboard/whale-hunters`
- AI (optional): `POST /api/v1/ai/analyze-trade`, `POST /api/v1/ai/generate-announcement`

## Frontend pages
Dashboard, Token Analyzer, Address Lookup, Leaderboard, Webhooks, Alerts, AI Analytics, Integrations.

## Credits
Built with love by [Roxium Labs](https://roxiumlabs.com/).
