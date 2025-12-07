import axios from "axios";

// Prefer explicit env; fall back to current origin (helps avoid localhost in prod)
const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000");

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
  tradeType: "BUY" | "SELL";
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
export type AlertEventType = "volume.spike" | "whale.buy" | "holder.surge";

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
  type: "webhook";
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
  payload?: Record<string, unknown>;
  reason?: string;
  evaluated_at: string;
}

export interface TokenListItem {
  name: string;
  issuer: string;
  tradeCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  badge: string;
  title: string;
  address: string;
  stats: {
    trade_count: number;
    buy_count: number;
    sell_count: number;
    total_volume: string;
    avg_trade_size: string;
    biggest_trade: string;
  };
  portfolio: {
    is_whale: boolean;
    current_balance: string;
    portfolio_share: string;
  };
}

export interface WhaleHunter {
  rank: number;
  badge: string;
  title: string;
  address: string;
  stats: {
    tokens_hunted: number;
    early_positions: number;
    total_early_amount: string;
    first_alpha_move: string;
    last_alpha_move: string;
  };
}

export interface AIAnalyzeTradeRequest {
  trade: {
    amount: number;
    token_name: string;
    source_address: string;
    dest_address: string;
    price_estimate?: number;
  };
  context: {
    token_volume_24h: number;
    token_holders: number;
    trader_rank?: number;
    trader_trade_count?: number;
  };
}

export interface AIAnalyzeTradeResponse {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  risk_level: 'low' | 'medium' | 'high';
  insights: string[];
  recommendation: string;
  confidence: number;
}

export interface AIGenerateAnnouncementRequest {
  event_type: 'whale.buy' | 'whale.sell' | 'volume.spike' | 'holder.surge' | 'achievement.unlocked';
  data: any;
}

export interface GeneratedAnnouncement {
  discord_message: string;
  telegram_message: string;
  twitter_post?: string;
}

export interface WebhookSubscription {
  id: number;
  url: string;
  events: string[];
  description?: string;
  active: boolean;
  created_at: string;
  last_triggered?: string | null;
  secret?: string; // only returned on creation
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

  async getTokenAnalytics(
    issuer: string,
    name: string
  ): Promise<TokenAnalytics> {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/tokens/${issuer}/${name}/analytics`
    );
    return data.data;
  }

  async getTokenHolders(
    issuer: string,
    name: string,
    whalesOnly = false
  ): Promise<Holder[]> {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/tokens/${issuer}/${name}/holders`,
      {
        params: { whales: whalesOnly },
      }
    );
    return data.data;
  }

  async getTokenTrades(
    issuer: string,
    name: string,
    limit = 100,
    type?: "BUY" | "SELL"
  ): Promise<Trade[]> {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/tokens/${issuer}/${name}/trades`,
      {
        params: { limit, type },
      }
    );
    return data.data;
  }

  async getTokenVolume(issuer: string, name: string) {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/tokens/${issuer}/${name}/volume`
    );
    return data.data;
  }

  async getRiskScore(issuer: string, name: string) {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/tokens/${issuer}/${name}/risk-score`
    );
    return data.data;
  }

  async getGrowthScore(issuer: string, name: string) {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/tokens/${issuer}/${name}/growth-score`
    );
    return data.data;
  }

  async getAddressTrades(address: string, limit = 100): Promise<Trade[]> {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/addresses/${address}/trades`,
      {
        params: { limit },
      }
    );
    return data.data;
  }

  async getAddressHoldings(address: string) {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/addresses/${address}/holdings`
    );
    return data.data;
  }

  // Leaderboard
  async getLeaderboardTraders(
    period: "24h" | "7d" | "30d" | "all",
    limit = 50
  ): Promise<LeaderboardEntry[]> {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/leaderboard/traders`,
      {
        params: { period, limit },
      }
    );
    return data.data?.leaderboard || [];
  }

  async getLeaderboardWhaleHunters(limit = 20): Promise<WhaleHunter[]> {
    const { data } = await axios.get(
      `${this.baseURL}/api/v1/leaderboard/whale-hunters`,
      {
        params: { limit },
      }
    );
    return data.data?.whale_hunters || [];
  }

  // Webhooks
  async listWebhooks(active?: boolean): Promise<WebhookSubscription[]> {
    const { data } = await axios.get(`${this.baseURL}/api/v1/webhooks/list`, {
      params: active !== undefined ? { active } : {},
    });
    return data.webhooks || [];
  }

  async registerWebhook(payload: {
    url: string;
    events: string[];
    description?: string;
    secret?: string;
  }): Promise<{ webhook: WebhookSubscription; secret: string }> {
    const { data } = await axios.post(
      `${this.baseURL}/api/v1/webhooks/register`,
      payload
    );
    return {
      webhook: data.webhook,
      secret: data.webhook?.secret || payload.secret || "",
    };
  }

  async updateWebhook(
    id: number,
    payload: { active?: boolean; events?: string[]; description?: string }
  ): Promise<WebhookSubscription> {
    const { data } = await axios.patch(
      `${this.baseURL}/api/v1/webhooks/${id}`,
      payload
    );
    return data.webhook;
  }

  async deleteWebhook(id: number): Promise<void> {
    await axios.delete(`${this.baseURL}/api/v1/webhooks/${id}`);
  }

  async testWebhook(id: number): Promise<unknown> {
    const { data } = await axios.post(
      `${this.baseURL}/api/v1/webhooks/${id}/test`
    );
    return data;
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
    const { data } = await axios.patch(
      `${this.baseURL}/api/v1/alerts/${id}`,
      request
    );
    return data.alert;
  }

  async deleteAlert(id: number): Promise<void> {
    await axios.delete(`${this.baseURL}/api/v1/alerts/${id}`);
  }

  async testAlert(id: number): Promise<AlertTestResult> {
    const { data } = await axios.post(
      `${this.baseURL}/api/v1/alerts/${id}/test`
    );
    return data;
  }

  // AI endpoints
  async analyzeTradeWithAI(request: AIAnalyzeTradeRequest): Promise<AIAnalyzeTradeResponse> {
    const { data } = await axios.post(`${this.baseURL}/api/v1/ai/analyze-trade`, request);
    return data.data;
  }

  async generateAnnouncement(request: AIGenerateAnnouncementRequest): Promise<GeneratedAnnouncement> {
    const { data } = await axios.post(`${this.baseURL}/api/v1/ai/generate-announcement`, request);
    return data.data;
  }
}

export const api = new ApiClient();
