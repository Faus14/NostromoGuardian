// ============================================================================
// QUBIC CORE TYPES
// ============================================================================

export interface QubicIdentity {
  publicKey: string;
  balance?: bigint;
}

export interface QubicTick {
  tick: number;
  epoch: number;
  timestamp?: number;
  duration?: number;
}

// ============================================================================
// QX SMART CONTRACT TYPES
// ============================================================================

export enum QXInputType {
  ISSUE_ASSET = 1,
  TRANSFER_SHARES = 2,
  ADD_TO_ASK_ORDER = 5,
  ADD_TO_BID_ORDER = 6,
  REMOVE_FROM_ASK_ORDER = 7,
  REMOVE_FROM_BID_ORDER = 8,
}

export enum QXFunctionType {
  FEES = 1,
  ASSET_ASK_ORDERS = 2,
  ASSET_BID_ORDERS = 3,
  ENTITY_ASK_ORDERS = 4,
  ENTITY_BID_ORDERS = 5,
}

export interface QXAsset {
  issuer: string;
  assetName: string;
  assetNameNumber?: bigint;
  numberOfUnits?: bigint;
}

export interface QXOrder {
  issuer: string;
  assetName: string;
  price: bigint;
  numberOfShares: bigint;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface RawTransaction {
  sourceId: string;
  destId: string;
  amount: bigint;
  tick: number;
  inputType: number;
  inputSize: number;
  signatureHex?: string;
  txId: string;
}

export interface DecodedQXTransaction extends RawTransaction {
  contractIndex: number;
  operation: 'BUY' | 'SELL' | 'TRANSFER' | 'ISSUE' | 'REMOVE_ORDER';
  asset: {
    issuer: string;
    name: string;
  };
  orderDetails?: {
    price: bigint;
    shares: bigint;
    totalValue: bigint;
  };
}

// ============================================================================
// TRADE & ORDER FLOW TYPES
// ============================================================================

export interface Trade {
  id?: number;
  txId: string;
  tick: number;
  timestamp: Date;
  tokenIssuer: string;
  tokenName: string;
  tradeType: 'BUY' | 'SELL';
  trader: string;
  price: bigint;
  amount: bigint;
  totalValue: bigint;
  pricePerUnit: number;
}

export interface OrderBookEntry {
  issuer: string;
  assetName: string;
  side: 'ASK' | 'BID';
  price: bigint;
  shares: bigint;
  trader: string;
  tick: number;
}

// ============================================================================
// HOLDER & BALANCE TYPES
// ============================================================================

export interface Holder {
  id?: number;
  address: string;
  tokenIssuer: string;
  tokenName: string;
  balance: bigint;
  percentage: number;
  firstSeenTick: number;
  lastActivityTick: number;
  totalBought: bigint;
  totalSold: bigint;
  isWhale: boolean;
  buyCount: number;
  sellCount: number;
}

export interface BalanceSnapshot {
  id?: number;
  address: string;
  tokenIssuer: string;
  tokenName: string;
  balance: bigint;
  tick: number;
  timestamp: Date;
}

// ============================================================================
// ANALYTICS & METRICS TYPES
// ============================================================================

export interface TokenMetrics {
  tokenIssuer: string;
  tokenName: string;
  
  // Liquidity & Volume
  liquidity: {
    poolLiquidity: bigint;
    availableForSale: bigint;
    availableForBuy: bigint;
  };
  
  volume: {
    last24h: bigint;
    last7d: bigint;
    last30d: bigint;
    hourlyVolume: VolumeDataPoint[];
    dailyVolume: VolumeDataPoint[];
  };
  
  // Holder Distribution
  holders: {
    total: number;
    whales: number;
    topHolders: Holder[];
    holderConcentration: number; // Gini coefficient or HHI
    top10Percentage: number;
    top50Percentage: number;
  };
  
  // Activity & Momentum
  activity: {
    totalTrades: number;
    buyCount: number;
    sellCount: number;
    netBuyers: number;
    netSellers: number;
    tradeFrequency: number; // trades per hour
    newBuyers24h: number;
    returningBuyers24h: number;
  };
  
  // Price & Supply
  price: {
    current: number;
    high24h: number;
    low24h: number;
    change24h: number;
    change7d: number;
  };
  
  supply: {
    total: bigint;
    circulating: bigint;
    locked: bigint;
  };
  
  // Risk & Growth Scores
  scores: {
    riskScore: number; // 0-100
    growthScore: number; // 0-100
  };
  
  lastUpdated: Date;
}

export interface VolumeDataPoint {
  timestamp: Date;
  tick: number;
  volume: bigint;
  trades: number;
  buyers: number;
  sellers: number;
}

export interface RiskScoreFactors {
  liquidityDepth: number; // 0-25 points
  whaleConcentration: number; // 0-25 points
  sellPressure: number; // 0-25 points
  tradeImbalance: number; // 0-25 points
  total: number; // 0-100
}

export interface GrowthScoreFactors {
  newHolders: number; // 0-25 points
  returningBuyers: number; // 0-25 points
  volumeTrend: number; // 0-25 points
  activityStreak: number; // 0-25 points
  total: number; // 0-100
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface DBTrade {
  id: number;
  tx_id: string;
  tick: number;
  timestamp: Date;
  token_issuer: string;
  token_name: string;
  trade_type: 'BUY' | 'SELL';
  trader: string;
  price: string; // bigint stored as string in DB
  amount: string;
  total_value: string;
  price_per_unit: number;
  created_at: Date;
}

export interface DBHolder {
  id: number;
  address: string;
  token_issuer: string;
  token_name: string;
  balance: string;
  percentage: number;
  first_seen_tick: number;
  last_activity_tick: number;
  total_bought: string;
  total_sold: string;
  is_whale: boolean;
  buy_count: number;
  sell_count: number;
  updated_at: Date;
}

export interface DBTokenMetrics {
  id: number;
  token_issuer: string;
  token_name: string;
  total_volume_24h: string;
  total_trades_24h: number;
  unique_traders_24h: number;
  holder_count: number;
  whale_count: number;
  risk_score: number;
  growth_score: number;
  liquidity_depth: string;
  top_10_concentration: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// RPC REQUEST/RESPONSE TYPES
// ============================================================================

export interface RPCTickInfoResponse {
  tickInfo: {
    tick: number;
    duration: number;
    epoch: number;
    initialTick: number;
  };
}

export interface RPCTransactionResponse {
  transaction: {
    sourceId: string;
    destId: string;
    amount: string;
    tickNumber: number;
    inputType: number;
    inputSize: number;
    signatureHex: string;
    txId: string;
  };
}

export interface RPCQuerySmartContractRequest {
  contractIndex: number;
  inputType: number;
  inputSize: number;
  requestData: string; // base64
}

export interface RPCQuerySmartContractResponse {
  responseData: string; // base64
}

export interface RPCBroadcastTransactionRequest {
  encodedTransaction: string; // base64
}

export interface RPCBroadcastTransactionResponse {
  peersBroadcasted: number;
  encodedTransaction: string;
  transactionId: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface TokenAnalytics {
  token: {
    issuer: string;
    name: string;
  };
  metrics: TokenMetrics;
  riskFactors: RiskScoreFactors;
  growthFactors: GrowthScoreFactors;
  recentTrades: Trade[];
  topHolders: Holder[];
}
