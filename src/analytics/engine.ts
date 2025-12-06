import { DatabaseService, getDatabase } from '../services/database.service';
import {
  TokenMetrics,
  RiskScoreFactors,
  GrowthScoreFactors,
  Holder,
} from '../types';
import { config } from '../config';

/**
 * AnalyticsEngine - Calculates advanced metrics for tokens
 * 
 * This engine computes:
 * - Risk Score (0-100): Evaluates token risk based on liquidity, whales, sell pressure
 * - Growth Score (0-100): Evaluates growth potential based on new holders, volume trends
 * - Holder Concentration Index (Gini coefficient / HHI)
 * - Whale detection and classification
 */
export class AnalyticsEngine {
  private db: DatabaseService;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Calculate complete token metrics
   */
  async calculateTokenMetrics(
    tokenIssuer: string,
    tokenName: string
  ): Promise<TokenMetrics> {
    console.log(`[Analytics] Calculating metrics for ${tokenName}`);

    // Fetch base data
    const holders = await this.db.getHoldersByToken(tokenIssuer, tokenName);
    const trades24h = await this.getRecentTrades(tokenIssuer, tokenName, 24);
    const trades7d = await this.getRecentTrades(tokenIssuer, tokenName, 168);
    const trades30d = await this.getRecentTrades(tokenIssuer, tokenName, 720);

    // Calculate supply metrics
    const totalSupply = this.calculateTotalSupply(holders);
    const circulatingSupply = this.calculateCirculatingSupply(holders);

    // Calculate holder metrics
    const holderMetrics = this.calculateHolderMetrics(holders, totalSupply);

    // Calculate volume metrics
    const volumeMetrics = this.calculateVolumeMetrics(trades24h, trades7d, trades30d);

    // Calculate activity metrics
    const activityMetrics = this.calculateActivityMetrics(trades24h, holders);

    // Calculate price metrics
    const priceMetrics = this.calculatePriceMetrics(trades24h, trades7d);

    // Calculate risk and growth scores
    const riskScore = this.calculateRiskScore(
      holderMetrics,
      volumeMetrics,
      activityMetrics
    );
    
    const growthScore = this.calculateGrowthScore(
      activityMetrics,
      volumeMetrics,
      holders
    );

    return {
      tokenIssuer,
      tokenName,
      liquidity: {
        poolLiquidity: BigInt(0), // Would need QX pool data
        availableForSale: this.calculateAvailableForSale(holders),
        availableForBuy: BigInt(0), // Would need order book data
      },
      volume: {
        last24h: volumeMetrics.volume24h,
        last7d: volumeMetrics.volume7d,
        last30d: volumeMetrics.volume30d,
        hourlyVolume: [],
        dailyVolume: [],
      },
      holders: {
        total: holders.length,
        whales: holderMetrics.whaleCount,
        topHolders: holders.slice(0, config.analytics.topHoldersLimit),
        holderConcentration: holderMetrics.concentrationIndex,
        top10Percentage: holderMetrics.top10Percentage,
        top50Percentage: holderMetrics.top50Percentage,
      },
      activity: activityMetrics,
      price: priceMetrics,
      supply: {
        total: totalSupply,
        circulating: circulatingSupply,
        locked: totalSupply - circulatingSupply,
      },
      scores: {
        riskScore: riskScore.total,
        growthScore: growthScore.total,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate Risk Score (0-100)
   * Lower score = higher risk
   * 
   * Components:
   * - Liquidity Depth (25 points)
   * - Whale Concentration (25 points)
   * - Sell Pressure (25 points)
   * - Trade Imbalance (25 points)
   */
  calculateRiskScore(
    holderMetrics: any,
    volumeMetrics: any,
    activityMetrics: any
  ): RiskScoreFactors {
    // 1. Liquidity Depth (25 points)
    // Higher volume = better liquidity = lower risk
    const liquidityScore = Math.min(
      25,
      Math.floor((Number(volumeMetrics.volume24h) / 100000) * 25)
    );

    // 2. Whale Concentration (25 points)
    // Lower concentration = lower risk
    const whaleScore = Math.floor(
      (1 - holderMetrics.top10Percentage / 100) * 25
    );

    // 3. Sell Pressure (25 points)
    // More balanced buy/sell = lower risk
    const sellRatio = activityMetrics.sellCount / Math.max(activityMetrics.totalTrades, 1);
    const sellScore = Math.floor((1 - Math.abs(sellRatio - 0.5) * 2) * 25);

    // 4. Trade Imbalance (25 points)
    // Balanced net buyers/sellers = lower risk
    const buyerSellRatio = activityMetrics.netBuyers / Math.max(
      activityMetrics.netBuyers + activityMetrics.netSellers,
      1
    );
    const imbalanceScore = Math.floor((1 - Math.abs(buyerSellRatio - 0.5) * 2) * 25);

    const total = liquidityScore + whaleScore + sellScore + imbalanceScore;

    return {
      liquidityDepth: liquidityScore,
      whaleConcentration: whaleScore,
      sellPressure: sellScore,
      tradeImbalance: imbalanceScore,
      total: Math.min(100, total),
    };
  }

  /**
   * Calculate Growth Score (0-100)
   * Higher score = better growth potential
   * 
   * Components:
   * - New Holders (25 points)
   * - Returning Buyers (25 points)
   * - Volume Trend (25 points)
   * - Activity Streak (25 points)
   */
  calculateGrowthScore(
    activityMetrics: any,
    volumeMetrics: any,
    holders: Holder[]
  ): GrowthScoreFactors {
    // 1. New Holders (25 points)
    // More new holders in last 24h = better growth
    const newHoldersScore = Math.min(
      25,
      Math.floor((activityMetrics.newBuyers24h / 10) * 25)
    );

    // 2. Returning Buyers (25 points)
    // More returning buyers = sustainable growth
    const returningScore = Math.min(
      25,
      Math.floor((activityMetrics.returningBuyers24h / 5) * 25)
    );

    // 3. Volume Trend (25 points)
    // Growing volume = positive momentum
    const volumeGrowth = Number(volumeMetrics.volume24h) / Math.max(
      Number(volumeMetrics.volume7d) / 7,
      1
    );
    const volumeScore = Math.min(25, Math.floor(volumeGrowth * 10));

    // 4. Activity Streak (25 points)
    // Consistent trading = healthy market
    const streakScore = Math.min(
      25,
      Math.floor((activityMetrics.tradeFrequency / 2) * 25)
    );

    const total = newHoldersScore + returningScore + volumeScore + streakScore;

    return {
      newHolders: newHoldersScore,
      returningBuyers: returningScore,
      volumeTrend: volumeScore,
      activityStreak: streakScore,
      total: Math.min(100, total),
    };
  }

  /**
   * Calculate holder metrics including whale detection
   */
  private calculateHolderMetrics(
    holders: Holder[],
    totalSupply: bigint
  ): {
    whaleCount: number;
    concentrationIndex: number;
    top10Percentage: number;
    top50Percentage: number;
  } {
    if (holders.length === 0 || totalSupply === BigInt(0)) {
      return {
        whaleCount: 0,
        concentrationIndex: 0,
        top10Percentage: 0,
        top50Percentage: 0,
      };
    }

    // Sort by balance descending
    const sortedHolders = [...holders].sort((a, b) =>
      Number(b.balance - a.balance)
    );

    // Calculate top N percentages
    const top10 = sortedHolders.slice(0, Math.min(10, holders.length));
    const top50 = sortedHolders.slice(0, Math.min(50, holders.length));

    const top10Balance = top10.reduce((sum, h) => sum + h.balance, BigInt(0));
    const top50Balance = top50.reduce((sum, h) => sum + h.balance, BigInt(0));

    const top10Percentage = (Number(top10Balance) / Number(totalSupply)) * 100;
    const top50Percentage = (Number(top50Balance) / Number(totalSupply)) * 100;

    // Detect whales (holders with > threshold% of supply)
    const whaleThreshold = config.analytics.whaleThresholdPercentage;
    const whaleCount = sortedHolders.filter((h) => {
      const percentage = (Number(h.balance) / Number(totalSupply)) * 100;
      return percentage >= whaleThreshold;
    }).length;

    // Calculate Herfindahl-Hirschman Index (HHI) for concentration
    // HHI = sum of squared market shares (0-10000)
    let hhi = 0;
    for (const holder of sortedHolders) {
      const marketShare = Number(holder.balance) / Number(totalSupply);
      hhi += marketShare * marketShare;
    }
    const concentrationIndex = hhi * 10000; // Normalize to 0-10000 scale

    return {
      whaleCount,
      concentrationIndex,
      top10Percentage,
      top50Percentage,
    };
  }

  /**
   * Calculate volume metrics
   */
  private calculateVolumeMetrics(
    trades24h: any[],
    trades7d: any[],
    trades30d: any[]
  ): {
    volume24h: bigint;
    volume7d: bigint;
    volume30d: bigint;
  } {
    const volume24h = trades24h.reduce(
      (sum, t) => sum + BigInt(t.total_value),
      BigInt(0)
    );
    const volume7d = trades7d.reduce(
      (sum, t) => sum + BigInt(t.total_value),
      BigInt(0)
    );
    const volume30d = trades30d.reduce(
      (sum, t) => sum + BigInt(t.total_value),
      BigInt(0)
    );

    return { volume24h, volume7d, volume30d };
  }

  /**
   * Calculate activity metrics
   */
  private calculateActivityMetrics(trades24h: any[], holders: Holder[]) {
    const totalTrades = trades24h.length;
    const buyCount = trades24h.filter((t) => t.trade_type === 'BUY').length;
    const sellCount = trades24h.filter((t) => t.trade_type === 'SELL').length;

    const uniqueBuyers = new Set(
      trades24h.filter((t) => t.trade_type === 'BUY').map((t) => t.trader)
    ).size;
    
    const uniqueSellers = new Set(
      trades24h.filter((t) => t.trade_type === 'SELL').map((t) => t.trader)
    ).size;

    // Calculate new buyers (holders with first trade in last 24h)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const newBuyers24h = holders.filter((h) => {
      // Would need to check if first_seen_tick corresponds to last 24h
      return h.buyCount > 0;
    }).length;

    // Returning buyers (simplified - holders who bought, sold, then bought again)
    const returningBuyers24h = holders.filter(
      (h) => h.buyCount > 1 && h.sellCount > 0
    ).length;

    const tradeFrequency = totalTrades / 24; // trades per hour

    return {
      totalTrades,
      buyCount,
      sellCount,
      netBuyers: uniqueBuyers,
      netSellers: uniqueSellers,
      tradeFrequency,
      newBuyers24h,
      returningBuyers24h,
    };
  }

  /**
   * Calculate price metrics
   */
  private calculatePriceMetrics(trades24h: any[], trades7d: any[]) {
    if (trades24h.length === 0) {
      return {
        current: 0,
        high24h: 0,
        low24h: 0,
        change24h: 0,
        change7d: 0,
      };
    }

    const prices24h = trades24h.map((t) => t.price_per_unit);
    const current = prices24h[prices24h.length - 1] || 0;
    const high24h = Math.max(...prices24h);
    const low24h = Math.min(...prices24h);

    const firstPrice24h = prices24h[0] || 1;
    const change24h = ((current - firstPrice24h) / firstPrice24h) * 100;

    let change7d = 0;
    if (trades7d.length > 0) {
      const firstPrice7d = trades7d[0].price_per_unit || 1;
      change7d = ((current - firstPrice7d) / firstPrice7d) * 100;
    }

    return {
      current,
      high24h,
      low24h,
      change24h,
      change7d,
    };
  }

  /**
   * Helper methods
   */

  private calculateTotalSupply(holders: Holder[]): bigint {
    return holders.reduce((sum, h) => sum + h.balance, BigInt(0));
  }

  private calculateCirculatingSupply(holders: Holder[]): bigint {
    // Simplified: exclude holders with 0 activity or very old last activity
    return holders
      .filter((h) => h.lastActivityTick > 0)
      .reduce((sum, h) => sum + h.balance, BigInt(0));
  }

  private calculateAvailableForSale(holders: Holder[]): bigint {
    // Simplified: sum of balances of holders who have sold before
    return holders
      .filter((h) => h.sellCount > 0)
      .reduce((sum, h) => sum + h.balance, BigInt(0));
  }

  private async getRecentTrades(
    tokenIssuer: string,
    tokenName: string,
    hoursAgo: number
  ): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM trades 
       WHERE token_issuer = $1 AND token_name = $2
         AND timestamp >= NOW() - INTERVAL '${hoursAgo} hours'
       ORDER BY timestamp DESC`,
      [tokenIssuer, tokenName]
    );

    return result.rows;
  }

  /**
   * Update whale classification for all holders of a token
   */
  async updateWhaleClassification(
    tokenIssuer: string,
    tokenName: string
  ): Promise<void> {
    const holders = await this.db.getHoldersByToken(tokenIssuer, tokenName);
    const totalSupply = this.calculateTotalSupply(holders);
    const whaleThreshold = config.analytics.whaleThresholdPercentage;

    for (const holder of holders) {
      const percentage = (Number(holder.balance) / Number(totalSupply)) * 100;
      const isWhale = percentage >= whaleThreshold;

      if (holder.isWhale !== isWhale) {
        await this.db.upsertHolder({
          ...holder,
          percentage,
          isWhale,
        });
      }
    }
  }
}

// Singleton instance
let analyticsInstance: AnalyticsEngine | null = null;

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsEngine();
  }
  return analyticsInstance;
}
