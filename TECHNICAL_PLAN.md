# 🎯 Plan de Implementación Técnico Detallado

## Visión General

Este documento describe el plan técnico completo para implementar el **Qubic Token Analyzer**, incluyendo todos los detalles de implementación, decisiones de arquitectura, y pasos específicos para reconstruir el order flow de tokens en el ecosistema Qubic.

---

## 🏗️ Parte 1: Cómo Obtener TODOS los Trades del Token

### 1.1 Endpoints del RPC a Usar

#### Endpoint Principal: `GET /v1/tick-transactions/{tick}`

Este endpoint retorna todas las transacciones aprobadas en un tick específico.

**Request:**
```bash
curl https://rpc.qubic.org/v1/tick-transactions/15234567
```

**Response Structure:**
```json
{
  "transactions": [
    {
      "sourceId": "WTUBWAEQJHTFIEDXCJHVRXAXYBFCHAPQUPOQMGTJVGXYEBVRYTOVFHLFBCMB",
      "destId": "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID",
      "amount": "400",
      "tickNumber": 15234567,
      "inputType": 6,
      "inputSize": 56,
      "signatureHex": "...",
      "txId": "hash123..."
    }
  ]
}
```

#### Endpoint Secundario: `GET /v1/tick-info`

Para obtener el tick actual y saber hasta dónde indexar.

**Request:**
```bash
curl https://rpc.qubic.org/v1/tick-info
```

**Response:**
```json
{
  "tickInfo": {
    "tick": 15234567,
    "duration": 0,
    "epoch": 152,
    "initialTick": 15180000
  }
}
```

### 1.2 Cómo Diferenciar BUY vs SELL

La clave está en el campo `inputType` de cada transacción:

```typescript
const QX_OPERATIONS = {
  1: 'ISSUE_ASSET',
  2: 'TRANSFER_SHARES',
  5: 'ADD_TO_ASK_ORDER',  // SELL
  6: 'ADD_TO_BID_ORDER',  // BUY
  7: 'REMOVE_FROM_ASK_ORDER',
  8: 'REMOVE_FROM_BID_ORDER',
};
```

**Regla simple:**
- `inputType === 6` → **BUY** (AddToBidOrder)
- `inputType === 5` → **SELL** (AddToAskOrder)
- `inputType === 2` → **TRANSFER** (no es trade)

### 1.3 Cómo Mapear inputTypes del Contrato QX

Cada función/procedimiento en el smart contract QX tiene un `inputType` único asignado en el registro:

```cpp
// De la documentación del contrato QX
REGISTER_USER_FUNCTIONS_AND_PROCEDURES() {
    // Functions (queries)
    REGISTER_USER_FUNCTION(Fees, 1);
    REGISTER_USER_FUNCTION(AssetAskOrders, 2);
    REGISTER_USER_FUNCTION(AssetBidOrders, 3);
    
    // Procedures (transactions)
    REGISTER_USER_PROCEDURE(IssueAsset, 1);
    REGISTER_USER_PROCEDURE(TransferShares, 2);
    REGISTER_USER_PROCEDURE(AddToAskOrder, 5);
    REGISTER_USER_PROCEDURE(AddToBidOrder, 6);
    REGISTER_USER_PROCEDURE(RemoveFromAskOrder, 7);
    REGISTER_USER_PROCEDURE(RemoveFromBidOrder, 8);
}
```

### 1.4 Cómo Decodificar responseData Base64

Para **queries** (funciones read-only), el RPC devuelve `responseData` en Base64 que debe decodificarse:

```typescript
// Ejemplo: Query para obtener fees del QX contract
const response = await fetch('https://rpc.qubic.org/v1/querySmartContract', {
  method: 'POST',
  body: JSON.stringify({
    contractIndex: 1,
    inputType: 1, // Fees function
    inputSize: 0,
    requestData: ""
  })
});

const json = await response.json();
// json.responseData = "AMqaO0BCDwBAS0wA" (Base64)

// Decodificar
const buffer = Buffer.from(json.responseData, 'base64');

// Parsear según la estructura C++ de salida:
// struct Fees_output {
//     uint32 assetIssuanceFee;  // 4 bytes
//     uint32 transferFee;        // 4 bytes
//     uint32 tradeFee;           // 4 bytes
// };

const fees = {
  assetIssuanceFee: buffer.readUInt32LE(0),
  transferFee: buffer.readUInt32LE(4),
  tradeFee: buffer.readUInt32LE(8),
};
```

**Para transactions** (procedimientos), el payload de entrada también debe estar en Base64:

```typescript
// Ejemplo: AddToBidOrder payload
// struct AddToBidOrder_input {
//     id issuer;              // 32 bytes
//     uint64 assetName;       // 8 bytes
//     sint64 price;           // 8 bytes
//     sint64 numberOfShares;  // 8 bytes
// } = 56 bytes total

const builder = new QubicPackageBuilder(56);
builder.add(new PublicKey(issuer));        // 32 bytes
builder.add(new Long(assetNameNumber));    // 8 bytes
builder.add(new Long(price));              // 8 bytes
builder.add(new Long(numberOfShares));     // 8 bytes

const payload = builder.getData();
const base64Payload = payload.toString('base64');

// Usar en transaction
transaction.setPayload(new DynamicPayload(56, payload));
```

---

## 🔄 Parte 2: Cómo Reconstruir Balances por Address

### 2.1 Tracking Incremental por Tick

**Estrategia:**
1. Procesar ticks secuencialmente sin saltos
2. Por cada trade, actualizar balance del holder
3. Mantener estado acumulativo en DB

**Implementación:**

```typescript
class BalanceTracker {
  // Map: "address-tokenIssuer-tokenName" -> balance
  private balances = new Map<string, bigint>();

  async processTrade(trade: Trade): Promise<void> {
    const key = `${trade.trader}-${trade.tokenIssuer}-${trade.tokenName}`;
    
    // Get current balance
    let currentBalance = this.balances.get(key) || BigInt(0);
    
    // Update based on trade type
    if (trade.tradeType === 'BUY') {
      currentBalance += trade.amount;
    } else if (trade.tradeType === 'SELL') {
      currentBalance -= trade.amount;
    }
    
    // Store updated balance
    this.balances.set(key, currentBalance);
    
    // Persist to database
    await this.db.upsertHolder({
      address: trade.trader,
      tokenIssuer: trade.tokenIssuer,
      tokenName: trade.tokenName,
      balance: currentBalance,
      lastActivityTick: trade.tick,
      // ... other fields
    });
  }
}
```

### 2.2 Snapshots Diarios

**Objetivo:** Mantener histórico de balances para análisis temporal.

**Implementación:**

```typescript
class SnapshotService {
  async createDailySnapshot(tick: number): Promise<void> {
    const timestamp = this.tickToTimestamp(tick);
    
    // Get all current holders
    const holders = await this.db.query(
      'SELECT * FROM holders WHERE balance > 0'
    );
    
    // Create snapshot for each
    for (const holder of holders.rows) {
      await this.db.insertBalanceSnapshot({
        address: holder.address,
        tokenIssuer: holder.token_issuer,
        tokenName: holder.token_name,
        balance: BigInt(holder.balance),
        tick: tick,
        timestamp: timestamp,
      });
    }
    
    console.log(`Created ${holders.rows.length} balance snapshots at tick ${tick}`);
  }
  
  // Run this every 24 hours or every N ticks
  async scheduleSnapshots(): Promise<void> {
    setInterval(async () => {
      const currentTick = await this.rpc.getCurrentTick();
      await this.createDailySnapshot(currentTick.tick);
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }
}
```

### 2.3 Detección de Whales

**Criterio:** Holders con más del X% del supply total (default: 5%)

**Implementación:**

```typescript
async function detectWhales(
  tokenIssuer: string,
  tokenName: string,
  threshold: number = 5.0
): Promise<Holder[]> {
  // Get all holders
  const holders = await db.getHoldersByToken(tokenIssuer, tokenName);
  
  // Calculate total supply
  const totalSupply = holders.reduce(
    (sum, h) => sum + h.balance,
    BigInt(0)
  );
  
  // Identify whales
  const whales = holders.filter((holder) => {
    const percentage = (Number(holder.balance) / Number(totalSupply)) * 100;
    return percentage >= threshold;
  });
  
  // Update whale status in DB
  for (const whale of whales) {
    await db.upsertHolder({
      ...whale,
      isWhale: true,
      percentage: (Number(whale.balance) / Number(totalSupply)) * 100,
    });
  }
  
  return whales;
}
```

### 2.4 Algoritmo para Holder Concentration Index

**Usa Herfindahl-Hirschman Index (HHI):**

```typescript
function calculateHHI(holders: Holder[]): number {
  // Calculate total supply
  const totalSupply = holders.reduce(
    (sum, h) => sum + h.balance,
    BigInt(0)
  );
  
  if (totalSupply === BigInt(0)) return 0;
  
  // Sum of squared market shares
  let hhi = 0;
  
  for (const holder of holders) {
    const marketShare = Number(holder.balance) / Number(totalSupply);
    hhi += marketShare * marketShare;
  }
  
  // Normalize to 0-10000 scale
  return hhi * 10000;
}

// Interpretation:
// HHI < 1500: Low concentration (competitive market)
// HHI 1500-2500: Moderate concentration
// HHI > 2500: High concentration (potential risk)
```

---

## 📊 Parte 3: Cómo Calcular Liquidez y Volumen

### 3.1 Métodos para Detectar Órdenes Ejecutadas

**Problema:** Diferenciar entre orden colocada vs orden ejecutada.

**Solución:** Analizar eventos y cambios de balance:

```typescript
interface OrderExecution {
  isExecuted: boolean;
  executedAmount: bigint;
  remainingAmount: bigint;
}

async function detectOrderExecution(
  txId: string,
  tick: number
): Promise<OrderExecution> {
  // Method 1: Check if balance changed in next ticks
  const beforeBalance = await getBalanceAtTick(trader, tick - 1);
  const afterBalance = await getBalanceAtTick(trader, tick + 1);
  
  const balanceChange = afterBalance - beforeBalance;
  
  if (balanceChange !== BigInt(0)) {
    return {
      isExecuted: true,
      executedAmount: balanceChange,
      remainingAmount: BigInt(0), // Simplified
    };
  }
  
  // Method 2: Query order book state
  const orderBookState = await queryOrderBook(tokenIssuer, tokenName);
  const orderStillExists = orderBookState.orders.some(
    (o) => o.txId === txId
  );
  
  return {
    isExecuted: !orderStillExists,
    executedAmount: orderStillExists ? BigInt(0) : amount,
    remainingAmount: orderStillExists ? amount : BigInt(0),
  };
}
```

### 3.2 Cómo Inferir Pools o Liquidez Disponible

**Método 1: Analizar Order Book**

```typescript
async function calculateAvailableLiquidity(
  tokenIssuer: string,
  tokenName: string
): Promise<{ bidLiquidity: bigint; askLiquidity: bigint }> {
  // Query current order book
  const askOrders = await queryAssetAskOrders(tokenIssuer, tokenName);
  const bidOrders = await queryAssetBidOrders(tokenIssuer, tokenName);
  
  // Sum up available liquidity
  const askLiquidity = askOrders.reduce(
    (sum, order) => sum + BigInt(order.numberOfShares) * BigInt(order.price),
    BigInt(0)
  );
  
  const bidLiquidity = bidOrders.reduce(
    (sum, order) => sum + BigInt(order.numberOfShares) * BigInt(order.price),
    BigInt(0)
  );
  
  return { bidLiquidity, askLiquidity };
}

// Function to query order book
async function queryAssetAskOrders(
  issuer: string,
  assetName: string
): Promise<Order[]> {
  const response = await rpc.querySmartContract(
    1, // QX contract index
    2, // AssetAskOrders function
    40, // Input size (32 bytes issuer + 8 bytes asset name)
    buildOrderBookQueryPayload(issuer, assetName)
  );
  
  return parseOrderBookResponse(response);
}
```

**Método 2: Analizar Holders Activos**

```typescript
function calculateCirculatingSupply(holders: Holder[]): bigint {
  // Exclude locked/inactive holders
  const activeHolders = holders.filter((h) => {
    const daysSinceActivity = calculateDaysSince(h.lastActivityTick);
    return daysSinceActivity < 90; // Active in last 90 days
  });
  
  return activeHolders.reduce(
    (sum, h) => sum + h.balance,
    BigInt(0)
  );
}

function estimateLiquidityDepth(
  holders: Holder[],
  volume24h: bigint
): number {
  const circulatingSupply = calculateCirculatingSupply(holders);
  
  // Liquidity depth = volume as % of circulating supply
  const depth = (Number(volume24h) / Number(circulatingSupply)) * 100;
  
  return depth;
}
```

### 3.3 Cálculo de Volumen por Hora/Día

**Implementación con Agregación SQL:**

```sql
-- Insertar volumen horario
INSERT INTO volume_hourly (
  token_issuer,
  token_name,
  hour_timestamp,
  tick_start,
  tick_end,
  volume,
  trade_count,
  unique_buyers,
  unique_sellers,
  avg_price,
  high_price,
  low_price
)
SELECT 
  token_issuer,
  token_name,
  DATE_TRUNC('hour', timestamp) as hour_timestamp,
  MIN(tick) as tick_start,
  MAX(tick) as tick_end,
  SUM(total_value) as volume,
  COUNT(*) as trade_count,
  COUNT(DISTINCT CASE WHEN trade_type = 'BUY' THEN trader END) as unique_buyers,
  COUNT(DISTINCT CASE WHEN trade_type = 'SELL' THEN trader END) as unique_sellers,
  AVG(price_per_unit) as avg_price,
  MAX(price_per_unit) as high_price,
  MIN(price_per_unit) as low_price
FROM trades
WHERE token_issuer = $1 
  AND token_name = $2
  AND timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY token_issuer, token_name, DATE_TRUNC('hour', timestamp);
```

**TypeScript Implementation:**

```typescript
class VolumeAggregator {
  async aggregateHourlyVolume(
    tokenIssuer: string,
    tokenName: string
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO volume_hourly (...)
      SELECT ... FROM trades
      WHERE token_issuer = $1 AND token_name = $2
      GROUP BY ...
      ON CONFLICT (token_issuer, token_name, hour_timestamp)
      DO UPDATE SET
        volume = EXCLUDED.volume,
        trade_count = EXCLUDED.trade_count,
        ...
    `, [tokenIssuer, tokenName]);
  }
  
  // Run every hour
  async startAggregation(): Promise<void> {
    setInterval(async () => {
      const tokens = await this.getActiveTokens();
      for (const token of tokens) {
        await this.aggregateHourlyVolume(token.issuer, token.name);
      }
    }, 60 * 60 * 1000); // Every hour
  }
}
```

---

## 🎲 Parte 4: Cómo Calcular Risk Score

### 4.1 Whale Concentration (0-25 points)

```typescript
function calculateWhaleScore(
  holders: Holder[],
  totalSupply: bigint
): number {
  const top10Holders = holders.slice(0, 10);
  const top10Balance = top10Holders.reduce(
    (sum, h) => sum + h.balance,
    BigInt(0)
  );
  
  const top10Percentage = (Number(top10Balance) / Number(totalSupply)) * 100;
  
  // Lower concentration = higher score (less risk)
  // 0% concentration = 25 points
  // 100% concentration = 0 points
  const score = Math.floor((1 - top10Percentage / 100) * 25);
  
  return Math.max(0, Math.min(25, score));
}
```

### 4.2 Liquidity Depth (0-25 points)

```typescript
function calculateLiquidityScore(
  volume24h: bigint,
  totalSupply: bigint
): number {
  // Calculate volume as % of supply
  const volumeRatio = Number(volume24h) / Number(totalSupply);
  
  // Target: 10% daily volume = 25 points
  // 0% daily volume = 0 points
  const score = Math.min(25, Math.floor(volumeRatio * 10 * 25));
  
  return score;
}
```

### 4.3 Sell Pressure (0-25 points)

```typescript
function calculateSellPressureScore(
  buyCount: number,
  sellCount: number
): number {
  const totalTrades = buyCount + sellCount;
  if (totalTrades === 0) return 12; // Neutral
  
  const sellRatio = sellCount / totalTrades;
  
  // Ideal: 50/50 buy/sell = 25 points
  // 100% sell = 0 points
  // 0% sell = 0 points (also bad)
  const deviation = Math.abs(sellRatio - 0.5);
  const score = Math.floor((1 - deviation * 2) * 25);
  
  return Math.max(0, Math.min(25, score));
}
```

### 4.4 Trade Imbalance (0-25 points)

```typescript
function calculateTradeImbalanceScore(
  uniqueBuyers: number,
  uniqueSellers: number
): number {
  const totalTraders = uniqueBuyers + uniqueSellers;
  if (totalTraders === 0) return 12; // Neutral
  
  const buyerRatio = uniqueBuyers / totalTraders;
  
  // Ideal: 50/50 buyers/sellers = 25 points
  const deviation = Math.abs(buyerRatio - 0.5);
  const score = Math.floor((1 - deviation * 2) * 25);
  
  return Math.max(0, Math.min(25, score));
}
```

### 4.5 Risk Score Total

```typescript
interface RiskScoreFactors {
  liquidityDepth: number;
  whaleConcentration: number;
  sellPressure: number;
  tradeImbalance: number;
  total: number;
}

function calculateRiskScore(
  holders: Holder[],
  volume24h: bigint,
  trades24h: Trade[]
): RiskScoreFactors {
  const totalSupply = holders.reduce((s, h) => s + h.balance, BigInt(0));
  
  const buyTrades = trades24h.filter((t) => t.tradeType === 'BUY');
  const sellTrades = trades24h.filter((t) => t.tradeType === 'SELL');
  
  const uniqueBuyers = new Set(buyTrades.map((t) => t.trader)).size;
  const uniqueSellers = new Set(sellTrades.map((t) => t.trader)).size;
  
  const factors: RiskScoreFactors = {
    liquidityDepth: calculateLiquidityScore(volume24h, totalSupply),
    whaleConcentration: calculateWhaleScore(holders, totalSupply),
    sellPressure: calculateSellPressureScore(buyTrades.length, sellTrades.length),
    tradeImbalance: calculateTradeImbalanceScore(uniqueBuyers, uniqueSellers),
    total: 0,
  };
  
  factors.total = 
    factors.liquidityDepth +
    factors.whaleConcentration +
    factors.sellPressure +
    factors.tradeImbalance;
  
  return factors;
}
```

---

## 🚀 Parte 5: Cómo Calcular Growth Score

### 5.1 New Holders (0-25 points)

```typescript
async function calculateNewHoldersScore(
  tokenIssuer: string,
  tokenName: string
): Promise<number> {
  // Query holders who first appeared in last 24h
  const result = await db.query(`
    SELECT COUNT(*) as count
    FROM holders
    WHERE token_issuer = $1 
      AND token_name = $2
      AND first_seen_tick >= (
        SELECT MAX(tick) - 8640 FROM indexed_ticks
      )
  `, [tokenIssuer, tokenName]);
  
  const newHolders = parseInt(result.rows[0].count);
  
  // Target: 10 new holders/day = 25 points
  const score = Math.min(25, Math.floor((newHolders / 10) * 25));
  
  return score;
}
```

### 5.2 Returning Buyers (0-25 points)

```typescript
async function calculateReturningBuyersScore(
  tokenIssuer: string,
  tokenName: string
): Promise<number> {
  // Holders who:
  // 1. Bought, then sold
  // 2. Bought again (in last 24h)
  const result = await db.query(`
    SELECT COUNT(*) as count
    FROM holders
    WHERE token_issuer = $1 
      AND token_name = $2
      AND buy_count > 1
      AND sell_count > 0
      AND last_activity_tick >= (
        SELECT MAX(tick) - 8640 FROM indexed_ticks
      )
  `, [tokenIssuer, tokenName]);
  
  const returningBuyers = parseInt(result.rows[0].count);
  
  // Target: 5 returning buyers/day = 25 points
  const score = Math.min(25, Math.floor((returningBuyers / 5) * 25));
  
  return score;
}
```

### 5.3 Volume Trend (0-25 points)

```typescript
function calculateVolumeTrendScore(
  volume24h: bigint,
  volume7d: bigint
): number {
  if (volume7d === BigInt(0)) return 0;
  
  // Compare 24h volume to 7d average
  const avgDailyVolume7d = Number(volume7d) / 7;
  const volumeGrowth = Number(volume24h) / avgDailyVolume7d;
  
  // volumeGrowth > 2.5x = 25 points
  // volumeGrowth = 1.0x = 10 points
  // volumeGrowth < 0.5x = 0 points
  const score = Math.min(25, Math.floor(volumeGrowth * 10));
  
  return score;
}
```

### 5.4 Activity Streak (0-25 points)

```typescript
function calculateActivityStreakScore(
  tradesPerHour: number
): number {
  // Target: 2+ trades/hour = 25 points
  const score = Math.min(25, Math.floor((tradesPerHour / 2) * 25));
  
  return score;
}
```

### 5.5 Growth Score Total

```typescript
interface GrowthScoreFactors {
  newHolders: number;
  returningBuyers: number;
  volumeTrend: number;
  activityStreak: number;
  total: number;
}

async function calculateGrowthScore(
  tokenIssuer: string,
  tokenName: string,
  volume24h: bigint,
  volume7d: bigint,
  tradesPerHour: number
): Promise<GrowthScoreFactors> {
  const factors: GrowthScoreFactors = {
    newHolders: await calculateNewHoldersScore(tokenIssuer, tokenName),
    returningBuyers: await calculateReturningBuyersScore(tokenIssuer, tokenName),
    volumeTrend: calculateVolumeTrendScore(volume24h, volume7d),
    activityStreak: calculateActivityStreakScore(tradesPerHour),
    total: 0,
  };
  
  factors.total =
    factors.newHolders +
    factors.returningBuyers +
    factors.volumeTrend +
    factors.activityStreak;
  
  return factors;
}
```

---

## 🏛️ Parte 6: Arquitectura Backend + Indexer

### 6.1 Diagrama Lógico

```
┌──────────────────────────────────────────┐
│         QUBIC RPC ENDPOINT               │
│    https://rpc.qubic.org/v1/...         │
└───────────────┬──────────────────────────┘
                │
                │ HTTP Requests
                ▼
┌──────────────────────────────────────────┐
│        RPC SERVICE LAYER                 │
│  ┌────────────────────────────────────┐  │
│  │ - getCurrentTick()                 │  │
│  │ - getTransactionsByTick(tick)      │  │
│  │ - querySmartContract(...)          │  │
│  │ - getBalance(identity)             │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │
                │ Raw Transactions
                ▼
┌──────────────────────────────────────────┐
│      TRANSACTION DECODER                 │
│  ┌────────────────────────────────────┐  │
│  │ - Filter QX transactions           │  │
│  │ - Map inputType to operation       │  │
│  │ - Decode Base64 payloads           │  │
│  │ - Extract asset & order details    │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │
                │ Decoded Trades
                ▼
┌──────────────────────────────────────────┐
│         INDEXER ENGINE                   │
│  ┌────────────────────────────────────┐  │
│  │ Main Loop:                         │  │
│  │ 1. Get current tick                │  │
│  │ 2. Process batch of ticks          │  │
│  │ 3. Store trades in DB              │  │
│  │ 4. Update holder balances          │  │
│  │ 5. Mark ticks as processed         │  │
│  │ 6. Sleep and repeat                │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │
                │ Persists data
                ▼
┌──────────────────────────────────────────┐
│       POSTGRESQL DATABASE                │
│  ┌────────────────────────────────────┐  │
│  │ Tables:                            │  │
│  │ - indexed_ticks                    │  │
│  │ - trades                           │  │
│  │ - holders                          │  │
│  │ - balance_snapshots                │  │
│  │ - token_metrics                    │  │
│  │ - volume_hourly/daily              │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │
                │ Reads data
                ▼
┌──────────────────────────────────────────┐
│       ANALYTICS ENGINE                   │
│  ┌────────────────────────────────────┐  │
│  │ - Calculate Risk Score             │  │
│  │ - Calculate Growth Score           │  │
│  │ - Compute HHI                      │  │
│  │ - Detect whales                    │  │
│  │ - Aggregate metrics                │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │
                │ Exposes API
                ▼
┌──────────────────────────────────────────┐
│         EXPRESS API SERVER               │
│  ┌────────────────────────────────────┐  │
│  │ REST Endpoints:                    │  │
│  │ - /tokens/:issuer/:name/analytics  │  │
│  │ - /tokens/:issuer/:name/holders    │  │
│  │ - /tokens/:issuer/:name/trades     │  │
│  │ - /tokens/:issuer/:name/risk-score │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │
                │ HTTP/JSON
                ▼
┌──────────────────────────────────────────┐
│          FRONTEND / CLIENTS              │
└──────────────────────────────────────────┘
```

### 6.2 Base de Datos Recomendada

**PostgreSQL 16** es ideal por:
- ✅ Excelente soporte para JSON (métricas complejas)
- ✅ Índices eficientes para queries rápidas
- ✅ ACID compliance para integridad de datos
- ✅ Triggers para auto-updates
- ✅ Views para queries complejas

**Alternativa para Big Data:** ClickHouse
- Mejor para volumenes masivos (millones de trades/día)
- Columnar storage = queries analíticas ultra-rápidas
- Pero más complejo de configurar

### 6.3 Tablas Necesarias

Ver `src/database/schema.sql` para el schema completo. Principales tablas:

1. **indexed_ticks**: Tracking de ticks procesados
2. **trades**: Todos los trades (BUY/SELL)
3. **holders**: Balances actuales por holder
4. **balance_snapshots**: Histórico de balances
5. **token_metrics**: Métricas agregadas
6. **volume_hourly/daily**: Volumen por tiempo

### 6.4 Script para Indexador (Node/TS)

Ver `src/indexer/engine.ts` para implementación completa.

**Flujo principal:**

```typescript
// Pseudocódigo del indexer
while (isRunning) {
  // 1. Get current tick
  currentTick = await rpc.getCurrentTick();
  
  // 2. Calculate ticks to process
  ticksToProcess = currentTick - lastProcessedTick;
  batchSize = min(ticksToProcess, 100);
  
  // 3. Process each tick in batch
  for (tick of ticksToProcess) {
    // 3a. Fetch transactions
    transactions = await rpc.getTransactionsByTick(tick);
    
    // 3b. Filter QX transactions
    qxTransactions = filterQXTransactions(transactions);
    
    // 3c. Decode and convert to trades
    trades = decodeTransactions(qxTransactions);
    
    // 3d. Store in database
    await db.insertTrades(trades);
    
    // 3e. Update holder balances
    await updateHolderBalances(trades);
    
    // 3f. Mark tick as processed
    await db.markTickAsProcessed(tick);
  }
  
  // 4. Wait before next poll
  await sleep(5000); // 5 seconds
}
```

### 6.5 WebSocket para Updates en Vivo

**Implementación con ws:**

```typescript
import WebSocket from 'ws';

class LiveUpdateService {
  private wss: WebSocket.Server;
  
  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    
    this.wss.on('connection', (ws) => {
      console.log('New client connected');
      
      ws.on('message', (message) => {
        const { action, token } = JSON.parse(message.toString());
        
        if (action === 'subscribe') {
          // Subscribe to token updates
          this.subscribeToToken(ws, token);
        }
      });
    });
  }
  
  // Broadcast new trade to all subscribers
  broadcastTrade(trade: Trade): void {
    const message = JSON.stringify({
      type: 'NEW_TRADE',
      data: trade,
    });
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  // Broadcast updated metrics
  broadcastMetrics(metrics: TokenMetrics): void {
    const message = JSON.stringify({
      type: 'METRICS_UPDATE',
      data: metrics,
    });
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Usage in indexer
const wsService = new LiveUpdateService(3001);

// After storing trade
await db.insertTrade(trade);
wsService.broadcastTrade(trade);

// After calculating metrics
const metrics = await analytics.calculateTokenMetrics(issuer, name);
wsService.broadcastMetrics(metrics);
```

---

## 📊 Parte 7: Dashboard Interactivo

### 7.1 Qué Gráficos Usar

**1. Token Overview Panel**
- Metric cards: Volume 24h, Holders, Price, Change%
- Risk Score gauge (0-100)
- Growth Score gauge (0-100)

**2. Price Chart**
- Candlestick chart (TradingView style)
- Volume bars overlay
- Moving averages (7d, 30d)

**3. Volume Chart**
- Bar chart por hora/día
- Line overlay para trades count
- Área chart para acumulado

**4. Holder Distribution**
- Pie chart: Top 10, Top 50, Others
- Whale indicator badges
- Gini coefficient visualization

**5. Trade Activity**
- Timeline de trades recientes
- Buy/Sell ratio donut chart
- Activity heatmap por hora del día

**6. Risk & Growth Breakdown**
- Radar chart con 4 componentes
- Bar chart comparando factores
- Trend line de scores históricos

### 7.2 Cómo Mostrar Top Holders

**Table Component:**

```tsx
interface HolderRowProps {
  rank: number;
  address: string;
  balance: bigint;
  percentage: number;
  isWhale: boolean;
  buyCount: number;
  sellCount: number;
}

function TopHoldersTable({ holders }: { holders: Holder[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Address</th>
          <th>Balance</th>
          <th>% of Supply</th>
          <th>Whale</th>
          <th>Activity</th>
        </tr>
      </thead>
      <tbody>
        {holders.map((holder, index) => (
          <tr key={holder.address}>
            <td>#{index + 1}</td>
            <td>
              <code>{formatAddress(holder.address)}</code>
              {holder.isWhale && <WhaleIcon />}
            </td>
            <td>{formatNumber(holder.balance)}</td>
            <td>
              <PercentageBar value={holder.percentage} />
              {holder.percentage.toFixed(2)}%
            </td>
            <td>
              {holder.isWhale ? '🐋' : '-'}
            </td>
            <td>
              <span className="buy">▲{holder.buyCount}</span>
              <span className="sell">▼{holder.sellCount}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 7.3 Cómo Mostrar Concentraciones

**Visualization Options:**

**Option 1: Treemap**
```tsx
import { Treemap } from 'recharts';

function HolderConcentrationTreemap({ holders }) {
  const data = holders.map((h) => ({
    name: formatAddress(h.address),
    size: Number(h.balance),
    fill: h.isWhale ? '#ff6b6b' : '#4dabf7',
  }));
  
  return (
    <Treemap
      data={data}
      dataKey="size"
      aspectRatio={4/3}
      stroke="#fff"
      fill="#8884d8"
    />
  );
}
```

**Option 2: Sunburst Chart**
```tsx
function ConcentrationSunburst({ holders }) {
  const layers = [
    { name: 'Top 10', holders: holders.slice(0, 10) },
    { name: 'Top 50', holders: holders.slice(10, 50) },
    { name: 'Others', holders: holders.slice(50) },
  ];
  
  return <SunburstChart data={layers} />;
}
```

### 7.4 Cómo Mostrar Riesgo y Crecimiento

**Risk Score Component:**

```tsx
function RiskScoreCard({ riskFactors }: { riskFactors: RiskScoreFactors }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'yellow';
    if (score >= 20) return 'orange';
    return 'red';
  };
  
  return (
    <Card>
      <h3>Risk Score</h3>
      
      {/* Main gauge */}
      <GaugeChart
        value={riskFactors.total}
        max={100}
        color={getColor(riskFactors.total)}
      />
      
      <div className="score-value">
        {riskFactors.total}/100
      </div>
      
      <div className="interpretation">
        {getRiskInterpretation(riskFactors.total)}
      </div>
      
      {/* Factor breakdown */}
      <div className="factors">
        <FactorBar
          label="Liquidity Depth"
          value={riskFactors.liquidityDepth}
          max={25}
        />
        <FactorBar
          label="Whale Concentration"
          value={riskFactors.whaleConcentration}
          max={25}
        />
        <FactorBar
          label="Sell Pressure"
          value={riskFactors.sellPressure}
          max={25}
        />
        <FactorBar
          label="Trade Imbalance"
          value={riskFactors.tradeImbalance}
          max={25}
        />
      </div>
      
      {/* Radar chart */}
      <RadarChart data={[
        { factor: 'Liquidity', value: riskFactors.liquidityDepth },
        { factor: 'Whales', value: riskFactors.whaleConcentration },
        { factor: 'Sell Pressure', value: riskFactors.sellPressure },
        { factor: 'Imbalance', value: riskFactors.tradeImbalance },
      ]} />
    </Card>
  );
}
```

### 7.5 Cómo Mostrar Liquidez y Volumen

**Volume Chart Component:**

```tsx
import { BarChart, Bar, Line, ComposedChart } from 'recharts';

function VolumeChart({ hourlyData }) {
  return (
    <Card>
      <h3>Volume & Activity</h3>
      
      <ComposedChart data={hourlyData} width={800} height={400}>
        {/* Volume bars */}
        <Bar
          dataKey="volume"
          fill="#4dabf7"
          name="Volume"
        />
        
        {/* Trade count line */}
        <Line
          dataKey="tradeCount"
          stroke="#ff6b6b"
          name="Trades"
          yAxisId="right"
        />
        
        <XAxis dataKey="hour" />
        <YAxis />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
      </ComposedChart>
      
      {/* Stats below */}
      <div className="stats">
        <Stat label="24h Volume" value={formatVolume(total24h)} />
        <Stat label="24h Trades" value={tradeCount} />
        <Stat label="Avg Trade Size" value={formatAvg(avgSize)} />
      </div>
    </Card>
  );
}
```

---

## 🚀 Siguiente Steps

1. **Instalar dependencias**: `npm install`
2. **Configurar PostgreSQL**: Crear DB y ejecutar schema.sql
3. **Configurar .env**: Setear RPC endpoint y credenciales DB
4. **Iniciar indexer**: `npm run indexer`
5. **Iniciar API**: `npm run api`
6. **Desarrollar frontend**: Usar React/Next.js consumiendo la API

---

## 💡 Ideas de Extensión

- Real-time WebSocket para trades live
- Alertas de whales movements
- Portfolio tracking multi-token
- Social features (rankings, copytrade)
- ML predictions de precio
- Order book reconstruction en tiempo real

---

**¡A construir! 🚀**
