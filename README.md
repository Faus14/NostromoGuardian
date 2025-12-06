# 🚀 Qubic Token Analyzer

**Advanced on-chain analytics platform for Qubic ecosystem** - Track trades, analyze holder distribution, calculate risk metrics, and monitor token growth in real-time.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Analytics Algorithms](#analytics-algorithms)
- [Development](#development)
- [Hackathon Ideas](#hackathon-ideas)
- [Contributing](#contributing)

---

## 🎯 Overview

**Qubic Token Analyzer** es una herramienta completa de análisis on-chain para el ecosistema Qubic, diseñada específicamente para analizar tokens del smart contract QX (el DEX de Qubic).

A diferencia de las blockchains EVM que tienen logs de eventos, Qubic requiere un enfoque diferente: **reconstrucción de estado** mediante análisis exhaustivo de transacciones. Este proyecto implementa un indexer que:

1. **Lee todas las transacciones** del contrato QX tick por tick
2. **Decodifica operaciones** (BUY, SELL, TRANSFER)
3. **Reconstruye balances** de holders por token
4. **Calcula métricas avanzadas** (Risk Score, Growth Score, concentración)
5. **Expone una API REST** para consumo en dashboards

### Por qué este proyecto es único

- ✅ **First-of-its-kind** para análisis avanzado en Qubic
- ✅ **Reconstrucción completa** del order flow sin logs EVM-style
- ✅ **Métricas cuantitativas** (Risk/Growth Scores)
- ✅ **Real-time tracking** de whales y concentración
- ✅ **Dashboard-ready** API para visualizaciones

---

## ⚡ Features

### 🔍 Core Analytics

- **Trade Tracking**: Indexa TODAS las transacciones QX (compras, ventas, transfers)
- **Holder Reconstruction**: Calcula balances exactos por address y token
- **Whale Detection**: Identifica automáticamente whales (>5% supply por defecto)
- **Volume Analytics**: Volumen por hora/día, tendencias, traders únicos
- **Price Metrics**: High/low/current price, cambios 24h/7d

### 📊 Advanced Metrics

#### Risk Score (0-100)
Evalúa el riesgo de un token basado en:
- **Liquidity Depth** (25 pts): Profundidad de liquidez disponible
- **Whale Concentration** (25 pts): Concentración en top holders
- **Sell Pressure** (25 pts): Ratio compra/venta reciente
- **Trade Imbalance** (25 pts): Balance entre buyers/sellers

#### Growth Score (0-100)
Evalúa el potencial de crecimiento basado en:
- **New Holders** (25 pts): Holders nuevos en 24h
- **Returning Buyers** (25 pts): Compradores que regresan
- **Volume Trend** (25 pts): Tendencia de volumen creciente
- **Activity Streak** (25 pts): Frecuencia de trades

### 🎛️ API Endpoints

```
GET  /api/v1/tokens/:issuer/:name/analytics    # Complete analytics
GET  /api/v1/tokens/:issuer/:name/holders      # Top holders list
GET  /api/v1/tokens/:issuer/:name/trades       # Recent trades
GET  /api/v1/tokens/:issuer/:name/volume       # Volume stats
GET  /api/v1/tokens/:issuer/:name/risk-score   # Risk breakdown
GET  /api/v1/tokens/:issuer/:name/growth-score # Growth breakdown
GET  /api/v1/addresses/:address/trades         # Address activity
GET  /api/v1/addresses/:address/holdings       # Address portfolio
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     QUBIC BLOCKCHAIN                        │
│                         (Mainnet)                           │
│    RPC: https://rpc.qubic.org                              │
│    QX Contract: BAAAA...RMID (Index: 1)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ RPC Calls (tick-transactions,
                        │            querySmartContract)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    INDEXER ENGINE                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. Poll current tick                              │    │
│  │  2. Fetch transactions by tick                     │    │
│  │  3. Filter QX contract transactions                │    │
│  │  4. Decode BUY/SELL operations                     │    │
│  │  5. Update holder balances                         │    │
│  │  6. Store in PostgreSQL                            │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Writes indexed data
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Tables:                                           │    │
│  │  - indexed_ticks      (processed ticks)           │    │
│  │  - trades             (all QX trades)             │    │
│  │  - holders            (current balances)          │    │
│  │  - balance_snapshots  (historical data)           │    │
│  │  - token_metrics      (aggregated stats)          │    │
│  │  - volume_hourly      (volume by hour)            │    │
│  │  - volume_daily       (volume by day)             │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Reads data
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   ANALYTICS ENGINE                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  - Calculate Risk Score                            │    │
│  │  - Calculate Growth Score                          │    │
│  │  - Holder Concentration Index (HHI)                │    │
│  │  - Whale classification                            │    │
│  │  - Volume trends & patterns                        │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Exposes metrics
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     REST API (Express)                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  GET /api/v1/tokens/:issuer/:name/analytics        │    │
│  │  GET /api/v1/tokens/:issuer/:name/holders          │    │
│  │  GET /api/v1/tokens/:issuer/:name/trades           │    │
│  │  GET /api/v1/tokens/:issuer/:name/risk-score       │    │
│  │  GET /api/v1/tokens/:issuer/:name/growth-score     │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP Requests
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND DASHBOARD                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  - Token Overview (volume, holders, price)         │    │
│  │  - Risk Score visualization                        │    │
│  │  - Growth Score visualization                      │    │
│  │  - Top Holders table with whale indicators         │    │
│  │  - Trade history timeline                          │    │
│  │  - Volume charts (hourly/daily)                    │    │
│  │  - Holder distribution pie chart                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Indexer** polls Qubic RPC every 5 seconds for new ticks
2. For each new tick, fetches all transactions
3. Filters transactions targeting QX contract (destId = QX address)
4. **Decodes** transaction payload based on `inputType`:
   - `inputType 6` = AddToBidOrder = **BUY**
   - `inputType 5` = AddToAskOrder = **SELL**
   - `inputType 2` = TransferShares = **TRANSFER**
5. **Updates** holder balances incrementally
6. **Stores** in PostgreSQL with proper indexing
7. **Analytics Engine** calculates metrics on-demand or periodically
8. **API** serves data to frontend or external consumers

---

## 🛠️ Tech Stack

### Backend
- **Node.js** 20+ with TypeScript
- **Express** - REST API server
- **PostgreSQL** 16 - Relational database
- **Axios** - HTTP client for RPC calls

### Qubic Integration
- **Qubic RPC API** - Direct blockchain access
- **@qubic-lib/qubic-ts-library** - Official TypeScript SDK
- **QX Smart Contract** - DEX contract (index 1)

### Infrastructure
- **Docker** (optional) - Containerization
- **PM2** (optional) - Process management
- **Redis** (optional) - Caching layer

---

## 📦 Installation

### Prerequisites

```bash
# Node.js 20+
node --version  # v20.x.x or higher

# PostgreSQL 16
psql --version  # 16.x or higher

# npm or yarn
npm --version   # 10.x.x or higher
```

### Clone Repository

```bash
git clone https://github.com/your-username/qubic-token-analyzer.git
cd qubic-token-analyzer
```

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Database Setup

```bash
# Create database
createdb qubic_analytics

# Run schema
psql -d qubic_analytics -f src/database/schema.sql
```

### Environment Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

---

## ⚙️ Configuration

Edit `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/qubic_analytics

# Qubic RPC (use mainnet or testnet)
QUBIC_RPC_ACTIVE=mainnet
QUBIC_RPC_MAINNET=https://rpc.qubic.org
QUBIC_RPC_TESTNET=https://testnet-rpc.qubicdev.com

# Indexer
INDEXER_START_TICK=0           # Start from tick 0 or specific tick
INDEXER_BATCH_SIZE=100         # Process 100 ticks per batch
INDEXER_POLL_INTERVAL_MS=5000  # Poll every 5 seconds

# API
API_PORT=3000
CORS_ORIGIN=http://localhost:5173

# Analytics
WHALE_THRESHOLD_PERCENTAGE=5.0  # Holders with >5% are whales
TOP_HOLDERS_LIMIT=100           # Track top 100 holders
```

---

## 🚀 Usage

### 1. Start Indexer

Indexes QX trades from Qubic blockchain:

```bash
npm run indexer
```

Output:
```
======================================================================
QUBIC TOKEN ANALYZER - INDEXER
======================================================================
RPC Endpoint: mainnet
QX Contract: BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID
Database: localhost:5432/qubic_analytics
======================================================================
[Indexer] Starting...
[Indexer] Resuming from tick 15234567
[Indexer] Processing 100 ticks (15234568 to 15234667)
[Indexer] Tick 15234568: 156 transactions
[Indexer] Tick 15234568: 12 QX transactions
[Indexer] Tick 15234568: Stored 12 trades
...
```

### 2. Start API Server

Serves analytics via REST API:

```bash
npm run api
```

Output:
```
======================================================================
QUBIC TOKEN ANALYZER - API SERVER
======================================================================
Host: 0.0.0.0
Port: 3000
CORS Origin: http://localhost:5173
======================================================================
[API] Server running on http://0.0.0.0:3000
[API] Endpoints:
  - GET  /health
  - GET  /api/v1/status
  - GET  /api/v1/tokens/:issuer/:name/analytics
  - GET  /api/v1/tokens/:issuer/:name/holders
  ...
```

### 3. Query Token Analytics

```bash
# Get complete analytics for a token
curl http://localhost:3000/api/v1/tokens/QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB/CFB/analytics

# Get top holders
curl http://localhost:3000/api/v1/tokens/QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB/CFB/holders?limit=50

# Get risk score
curl http://localhost:3000/api/v1/tokens/QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB/CFB/risk-score
```

---

## 📡 API Documentation

### Token Analytics

#### GET `/api/v1/tokens/:issuer/:name/analytics`

Returns complete analytics for a token including metrics, risk/growth scores, recent trades, and top holders.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "token": {
      "issuer": "QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB",
      "name": "CFB"
    },
    "metrics": {
      "volume": {
        "last24h": "1250000",
        "last7d": "8750000",
        "last30d": "35000000"
      },
      "holders": {
        "total": 1247,
        "whales": 8,
        "holderConcentration": 3524.5,
        "top10Percentage": 42.3,
        "top50Percentage": 78.9
      },
      "activity": {
        "totalTrades": 342,
        "buyCount": 198,
        "sellCount": 144,
        "tradeFrequency": 14.25,
        "newBuyers24h": 23,
        "returningBuyers24h": 8
      },
      "scores": {
        "riskScore": 67,
        "growthScore": 82
      }
    },
    "riskFactors": {
      "liquidityDepth": 18,
      "whaleConcentration": 14,
      "sellPressure": 19,
      "tradeImbalance": 16,
      "total": 67
    },
    "growthFactors": {
      "newHolders": 23,
      "returningBuyers": 16,
      "volumeTrend": 22,
      "activityStreak": 21,
      "total": 82
    }
  },
  "timestamp": "2024-12-06T15:30:00.000Z"
}
```

### Risk Score Breakdown

#### GET `/api/v1/tokens/:issuer/:name/risk-score`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 67,
    "factors": {
      "liquidityDepth": 18,
      "whaleConcentration": 14,
      "sellPressure": 19,
      "tradeImbalance": 16
    },
    "interpretation": "Low Risk"
  }
}
```

**Interpretation Scale:**
- 80-100: Very Low Risk
- 60-79: Low Risk
- 40-59: Moderate Risk
- 20-39: High Risk
- 0-19: Very High Risk

### Growth Score Breakdown

#### GET `/api/v1/tokens/:issuer/:name/growth-score`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 82,
    "factors": {
      "newHolders": 23,
      "returningBuyers": 16,
      "volumeTrend": 22,
      "activityStreak": 21
    },
    "interpretation": "Excellent Growth Potential"
  }
}
```

---

## 🧮 Analytics Algorithms

### Risk Score Calculation

```typescript
RiskScore = LiquidityDepth + WhaleConcentration + SellPressure + TradeImbalance

// Each component: 0-25 points, total: 0-100

LiquidityDepth = min(25, (volume24h / 100000) * 25)
WhaleConcentration = (1 - top10Percentage/100) * 25
SellPressure = (1 - |sellRatio - 0.5| * 2) * 25
TradeImbalance = (1 - |buyerRatio - 0.5| * 2) * 25
```

### Growth Score Calculation

```typescript
GrowthScore = NewHolders + ReturningBuyers + VolumeTrend + ActivityStreak

// Each component: 0-25 points, total: 0-100

NewHolders = min(25, (newBuyers24h / 10) * 25)
ReturningBuyers = min(25, (returningBuyers24h / 5) * 25)
VolumeTrend = min(25, (volume24h / (volume7d/7)) * 10)
ActivityStreak = min(25, (tradesPerHour / 2) * 25)
```

### Holder Concentration Index

Uses **Herfindahl-Hirschman Index (HHI)**:

```typescript
HHI = Σ(marketShare_i²) * 10000

// Where marketShare_i = holderBalance_i / totalSupply
// Range: 0-10000
// <1500: Low concentration
// 1500-2500: Moderate concentration
// >2500: High concentration
```

---

## 💡 Hackathon Ideas

### Extensiones del Proyecto

1. **Real-time WebSocket Updates**
   - Enviar actualizaciones live de trades y métricas
   - Alertas de whale movements
   - Notificaciones de cambios en risk score

2. **ML-powered Predictions**
   - Predecir movimientos de precio basados en holder patterns
   - Detectar accumulation/distribution patterns
   - Alert system para anomalías

3. **Portfolio Tracker**
   - Multi-token portfolio management
   - P&L tracking por holder
   - Tax reporting automation

4. **Social Integration**
   - Rankings de traders más exitosos
   - Copytrade functionality
   - Community sentiment analysis

5. **Advanced Visualizations**
   - Interactive network graphs de holder connections
   - Heatmaps de trading activity
   - Sankey diagrams de token flows

### Características Adicionales

- **Order Book Reconstruction**: Visualizar order book en tiempo real
- **MEV Detection**: Identificar front-running y sandwich attacks
- **Flash Loan Analysis**: Detectar operaciones complejas
- **Cross-token Correlations**: Analizar correlaciones entre tokens
- **Arbitrage Opportunities**: Detectar oportunidades entre exchanges

---

## 🔧 Development

### Project Structure

```
qubic-token-analyzer/
├── src/
│   ├── config/           # Configuration management
│   ├── types/            # TypeScript type definitions
│   ├── services/         # Core services
│   │   ├── rpc.service.ts       # Qubic RPC client
│   │   ├── decoder.service.ts   # Transaction decoder
│   │   └── database.service.ts  # Database operations
│   ├── indexer/          # Indexer engine
│   │   ├── engine.ts     # Main indexing logic
│   │   └── main.ts       # Indexer entry point
│   ├── analytics/        # Analytics engine
│   │   └── engine.ts     # Risk/Growth calculations
│   ├── api/              # REST API
│   │   ├── server.ts     # Express server
│   │   └── main.ts       # API entry point
│   └── database/         # Database schemas
│       └── schema.sql    # PostgreSQL schema
├── .env.example          # Environment template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

### Running in Development

```bash
# Terminal 1: Indexer
npm run indexer

# Terminal 2: API
npm run api

# Terminal 3: Watch mode (auto-reload)
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Qubic Team** - Por la documentación y soporte del hackathon
- **QX Contract** - El DEX que hace posible este análisis
- **Community** - Feedback y testing

---

## 📞 Contact

- GitHub Issues: [Report bugs](https://github.com/your-username/qubic-token-analyzer/issues)
- Discord: Join #dev channel for support
- Email: your-email@example.com

---

**Built with ❤️ for the Qubic Hackathon**
