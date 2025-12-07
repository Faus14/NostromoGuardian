import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface NetworkStatus {
  lastProcessedTick: { tickNumber: number; epoch: number };
  skippedTicks: Array<{ startTick: number; endTick: number }>;
}

export interface IndexerStatus {
  currentTick: number;
  lastProcessedTick: number;
  ticksBehind: number;
}

export interface StatusResponse {
  network: NetworkStatus;
  indexer: IndexerStatus;
}

export interface TokenMetrics {
  liquidity: {
    totalLocked: string;
    availableForSale: string;
    liquidityRatio: number;
  };
  volume: {
    last24h: string;
    last7d: string;
    last30d: string;
  };
  holders: {
    total: number;
    whales: number;
    holderConcentration: number;
    top10Percentage: number;
    top50Percentage: number;
  };
  activity: {
    totalTrades: number;
    buyCount: number;
    sellCount: number;
    netBuyers: number;
    netSellers: number;
    tradeFrequency: number;
    newBuyers24h: number;
    returningBuyers24h: number;
  };
  price: {
    current: number;
    change24h: number;
    high24h: number;
    low24h: number;
  };
  supply: {
    total: string;
    circulating: string;
  };
  scores: {
    riskScore: number;
    growthScore: number;
  };
}

export interface Trade {
  id: number;
  txId: string;
  tick: number;
  timestamp: string;
  tokenIssuer: string;
  tokenName: string;
  tradeType: 'BUY' | 'SELL';
  trader: string;
  price: string;
  amount: string;
  totalValue: string;
  pricePerUnit: string;
}

export interface Holder {
  address: string;
  tokenIssuer: string;
  tokenName: string;
  balance: string;
  percentage: number;
  firstSeenTick: number;
  lastActivityTick: number;
  totalBought: string;
  totalSold: string;
  buyCount: number;
  sellCount: number;
  isWhale: boolean;
}

export interface RiskScoreFactors {
  liquidityDepth: number;
  whaleConcentration: number;
  sellPressure: number;
  tradeImbalance: number;
  total: number;
}

export interface GrowthScoreFactors {
  newHolders: number;
  returningBuyers: number;
  volumeTrend: number;
  activityStreak: number;
  total: number;
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

// Alert Engine types
export type AlertEventType = 'volume.spike' | 'whale.buy' | 'holder.surge';

export interface AlertConditions {
  token?: string;
  period_minutes?: number;
  threshold_percent?: number;
  min_volume?: string;
  lookback_minutes?: number;
  min_value?: string;
  whales_only?: boolean;
  limit?: number;
  min_new_holders?: number;
  sample_size?: number;
}

export interface AlertAction {
  type: 'webhook';
  event?: string;
}

export interface Alert {
  id: number;
  name: string;
  description?: string;
  event_type: AlertEventType;
  conditions: AlertConditions;
  actions: AlertAction[];
  active: boolean;
  created_at: string;
  last_triggered: string | null;
  trigger_count: number;
}

export interface CreateAlertRequest {
  name: string;
  description?: string;
  event_type: AlertEventType;
  conditions: AlertConditions;
  actions?: AlertAction[];
  active?: boolean;
}

export interface UpdateAlertRequest {
  name?: string;
  description?: string;
  event_type?: AlertEventType;
  conditions?: AlertConditions;
  actions?: AlertAction[];
  active?: boolean;
}

export interface AlertTestResult {
  success: boolean;
  alert_id: number;
  triggered: boolean;
  payload?: Record<string, any>;
  reason?: string;
  evaluated_at: string;
}

export interface TokenListItem {
  name: string;
  issuer: string;
  tradeCount: number;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getStatus(): Promise<StatusResponse> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/status`);
    return data.data;
  }

  async getTokenList(): Promise<TokenListItem[]> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/tokens/list`);
    return data.data;
  }

  async getTokenAnalytics(issuer: string, name: string): Promise<TokenAnalytics> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/tokens/${issuer}/${name}/analytics`);
    return data.data;
  }

  async getTokenHolders(issuer: string, name: string, whalesOnly = false): Promise<Holder[]> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/tokens/${issuer}/${name}/holders`, {
      params: { whales: whalesOnly },
    });
    return data.data;
  }

  async getTokenTrades(issuer: string, name: string, limit = 100, type?: 'BUY' | 'SELL'): Promise<Trade[]> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/tokens/${issuer}/${name}/trades`, {
      params: { limit, type },
    });
    return data.data;
  }

  async getTokenVolume(issuer: string, name: string) {
    const { data } = await axios.get(`${this.baseURL}/api/v1/tokens/${issuer}/${name}/volume`);
    return data.data;
  }

  async getRiskScore(issuer: string, name: string) {
    const { data } = await axios.get(`${this.baseURL}/api/v1/tokens/${issuer}/${name}/risk-score`);
    return data.data;
  }

  async getGrowthScore(issuer: string, name: string) {
    const { data } = await axios.get(`${this.baseURL}/api/v1/tokens/${issuer}/${name}/growth-score`);
    return data.data;
  }

  async getAddressTrades(address: string, limit = 100): Promise<Trade[]> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/addresses/${address}/trades`, {
      params: { limit },
    });
    return data.data;
  }

  async getAddressHoldings(address: string) {
    const { data } = await axios.get(`${this.baseURL}/api/v1/addresses/${address}/holdings`);
    return data.data;
  }

  // Alert Engine endpoints
  async createAlert(request: CreateAlertRequest): Promise<Alert> {
    const { data } = await axios.post(`${this.baseURL}/api/v1/alerts`, request);
    return data.alert;
  }

  async listAlerts(active?: boolean): Promise<Alert[]> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/alerts`, {
      params: active !== undefined ? { active } : {},
    });
    return data.alerts;
  }

  async getAlert(id: number): Promise<Alert> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/alerts/${id}`);
    return data.alert;
  }

  async updateAlert(id: number, request: UpdateAlertRequest): Promise<Alert> {
    const { data } = await axios.patch(`${this.baseURL}/api/v1/alerts/${id}`, request);
    return data.alert;
  }

  async deleteAlert(id: number): Promise<void> {
    await axios.delete(`${this.baseURL}/api/v1/alerts/${id}`);
  }

  async testAlert(id: number): Promise<AlertTestResult> {
    const { data } = await axios.post(`${this.baseURL}/api/v1/alerts/${id}/test`);
    return data;
  }
}

export const api = new ApiClient();
