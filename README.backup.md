# 🚀 Qubic Token Analyzer

Analizador de tokens tipo **Etherscan/DexTools** para el ecosistema Qubic. Muestra analytics en tiempo real de tokens QX (el exchange descentralizado de Qubic).

## 📊 ¿Qué hace?

- 📈 **Token Analyzer**: Métricas completas de tokens (holders, trades, volumen, risk score)
- 🔍 **Address Lookup**: Busca wallets y ve su actividad
- 🌐 **Dashboard**: Estado de la red Qubic en tiempo real
- 📉 **Charts**: Visualizaciones con Chart.js

## 🏗️ Arquitectura

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│  BLOCKCHAIN │─────>│   INDEXER   │─────>│  POSTGRESQL  │
│   (Qubic)   │      │ (sincroniza)│      │  (histórico) │
└─────────────┘      └─────────────┘      └──────────────┘
                                                   │
                                                   ▼
                     ┌─────────────┐      ┌──────────────┐
                     │  FRONTEND   │<─────│   BACKEND    │
                     │  (React)    │      │ (Express API)│
                     └─────────────┘      └──────────────┘
```

### Componentes:

1. **Frontend** (React + Vite + Tailwind) - Puerto 5173
   - Dashboard con estado de red
   - Token Analyzer con charts
   - Address Lookup

2. **Backend API** (Node.js + Express) - Puerto 3000
   - Endpoints REST para analytics
   - Calcula Risk/Growth scores
   - Consulta BD y RPC de Qubic

3. **PostgreSQL** (Docker) - Puerto 5432
   - `indexed_ticks`: Ticks procesados
   - `trades`: Todas las operaciones BUY/SELL
   - `holders`: Balances de tokens por wallet

4. **Indexer** (Script Node.js)
   - Lee ticks de la blockchain de Qubic
   - Decodifica transacciones QX
   - Guarda trades y holders en BD

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Chart.js
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16 (Docker)
- **Blockchain**: Qubic RPC (`https://rpc.qubic.org`)

## ⚡ Setup Rápido

### 1️⃣ **Instalar dependencias**

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 2️⃣ **Levantar la base de datos (Docker)**

```bash
docker-compose up -d
```

Esto levanta PostgreSQL en `localhost:5432`.

### 3️⃣ **Configurar variables de entorno**

El archivo `.env` ya está configurado, pero puedes ajustarlo:

```env
QUBIC_RPC_MAINNET=https://rpc.qubic.org
QUBIC_RPC_TESTNET=https://testnet-rpc.qubicdev.com

DB_HOST=localhost
DB_PORT=5432
DB_USER=qubic
DB_PASSWORD=qubic
DB_NAME=qubic_analytics

# Opcional si tu código usa DATABASE_URL directamente
DATABASE_URL=postgres://qubic:qubic@localhost:5432/qubic_analytics

API_PORT=3000
CORS_ORIGIN=*

# Indexer config - start from recent tick (current is ~38820000)
INDEXER_START_TICK=38850100
INDEXER_BATCH_SIZE=10
```

### 4️⃣ **Levantar el Backend API**

En una terminal:

```bash
npm run api
```

Esto arranca el servidor en `http://localhost:3000`.

### 5️⃣ **Levantar el Frontend**

En otra terminal:

```bash
cd frontend
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

### 6️⃣ **Arrancar el Smart Indexer (RECOMENDADO) 🚀**

El **Smart Indexer** es la versión optimizada que:
- ⚡ Salta ticks vacíos automáticamente
- 🎯 Solo indexa ticks con transacciones QX
- 🔄 Corre en loop infinito (se actualiza solo)
- 📊 Muestra estadísticas cada 100 ticks

En otra terminal:

```bash
npm run smart-index
```

**¡Se actualiza solo!** Déjalo corriendo y se sincronizará automáticamente. Verás logs como:
```
[SmartIndexer] 🎯 Tick 38850105: 3 QX transactions
[SmartIndexer] ✅ Tick 38850105: Stored 3 trades
[SmartIndexer] 📊 STATS
  Current Tick: 38850200 | Last Processed: 38850195
  Ticks Scanned: 500 (15.2/s)
  Ticks with QX: 23 (4.6% hit rate)
  Trades Found: 47
```

**Alternativa (indexer clásico):**
```bash
npm run indexer
```

## 🎯 Cómo usar

### Dashboard
1. Abre `http://localhost:5173`
2. Verás el estado de la red: tick actual, epoch, progreso del indexer

### Token Analyzer
1. Ve a "Token Analyzer"
2. Prueba con estos tokens REALES:
   - **Issuer**: `CFBMEMZOIDEXDYPVMHGCBQDTTMPRJHOXMZRFVWXYZJWYQVNLODVFAAFV`
   - **Token Name**: `QX`
3. Dale "Analyze Token"

Si el indexer ha corrido suficiente, verás:
- Total holders
- Volumen 24h/7d
- Risk Score (basado en liquidez, whales, sell pressure)
- Growth Score (nuevos holders, volumen trend)
- Charts de distribución y trading activity
- Recent trades
- Top holders

### Address Lookup
1. Ve a "Address Lookup"
2. Pega una address como: `CFBMEMZOIDEXDYPVMHGCBQDTTMPRJHOXMZRFVWXYZJWYQVNLODVFAAFV`
3. Ve sus trades e holdings

## ❓ FAQ

### ¿Por qué todo muestra 0?

Porque el **indexer no ha corrido** o corrió muy poco. La BD está vacía. Necesitas:
1. Arrancar el smart indexer: `npm run smart-index`
2. Dejarlo correr en background (se actualiza solo)
3. Refrescar el frontend después de unos minutos

### ¿Cómo verifico que el indexer está funcionando?

```bash
# Ver cuántos ticks ha procesado
docker exec qubic-db psql -U qubic -d qubic_analytics -c "SELECT COUNT(*) FROM indexed_ticks;"

# Ver cuántos trades tiene
docker exec qubic-db psql -U qubic -d qubic_analytics -c "SELECT COUNT(*) FROM trades;"

# Ver últimos 5 trades
docker exec qubic-db psql -U qubic -d qubic_analytics -c "SELECT * FROM trades ORDER BY tick DESC LIMIT 5;"
```

### ¿Los datos son reales o mockeados?

**100% REALES** sacados de la blockchain de Qubic. Nada está mockeado. Si ves ceros es porque la BD está vacía (el indexer no ha corrido).

### ¿Cuánto tarda en tener datos?

Con el **Smart Indexer**:
- Escanea ~15-50 ticks por segundo (salta vacíos)
- Solo procesa ticks con transacciones QX (~5% hit rate)
- Verás primeros trades en **1-3 minutos**
- Para analytics completos: **5-10 minutos**

### ¿Qué pasa si apago el indexer?

Nada malo. Cuando lo vuelvas a arrancar, **continúa desde donde quedó**. La BD guarda el progreso automáticamente.

### ¿Cómo detengo todo?

```bash
# Detener indexer: Ctrl+C en su terminal
# Detener backend: Ctrl+C en su terminal
# Detener frontend: Ctrl+C en su terminal
# Detener DB:
docker-compose down
```

## 📁 Estructura del Proyecto

```
prueba/
├── src/
│   ├── api/                  # Backend API
│   │   ├── main.ts          # Entry point
│   │   └── server.ts        # Express routes
│   ├── indexer/             # Blockchain indexer
│   │   ├── main.ts          # Entry point
│   │   └── engine.ts        # Indexing logic
│   ├── analytics/           # Analytics engine
│   │   └── engine.ts        # Risk/Growth scores
│   ├── services/            # Services layer
│   │   ├── rpc.service.ts   # Qubic RPC client
│   │   ├── decoder.service.ts # QX transaction decoder
│   │   └── database.service.ts # PostgreSQL client
│   ├── database/
│   │   └── schema.sql       # DB schema
│   ├── config/
│   │   └── index.ts         # Config management
│   └── types/
│       └── index.ts         # TypeScript types
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main app with routing
│   │   ├── pages/           # React pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TokenAnalyzer.tsx
│   │   │   └── AddressLookup.tsx
│   │   └── services/
│   │       └── api.ts       # Frontend API client
│   ├── index.html
│   └── package.json
├── docker-compose.yml       # PostgreSQL container
├── .env                     # Environment variables
├── package.json
└── README.md
```

## 🔧 Scripts Disponibles

```bash
# Backend
npm run api         # Arrancar API server
npm run smart-index # 🚀 Arrancar Smart Indexer (RECOMENDADO)
npm run indexer     # Arrancar indexer clásico
npm run build       # Compilar TypeScript

# Frontend
cd frontend
npm run dev         # Dev server con Vite
npm run build       # Build para producción
npm run preview     # Preview del build

# Database
docker-compose up -d    # Levantar PostgreSQL
docker-compose down     # Detener PostgreSQL
docker-compose logs -f  # Ver logs
```

## 🌐 Endpoints API

- `GET /health` - Health check
- `GET /api/v1/status` - Estado de red y indexer
- `GET /api/v1/tokens/example` - Tokens de ejemplo
- `GET /api/v1/tokens/:issuer/:name/analytics` - Analytics completo de token
- `GET /api/v1/tokens/:issuer/:name/holders` - Holders de token
- `GET /api/v1/tokens/:issuer/:name/trades` - Trades de token
- `GET /api/v1/addresses/:address/trades` - Trades de address
- `GET /api/v1/addresses/:address/holdings` - Holdings de address

## 📝 Notas

- El indexer puede tardar horas/días en sincronizar la blockchain completa
- Muchos ticks no tienen transacciones (404 es normal)
- El sistema está optimizado para ticks recientes
- Para producción, considera usar un servicio de BD en la nube

## 🤝 Contribuir

1. Fork el repo
2. Crea una branch: `git checkout -b feature/nueva-feature`
3. Commit: `git commit -m 'Add nueva feature'`
4. Push: `git push origin feature/nueva-feature`
5. Abre un Pull Request

## 📄 License

MIT
