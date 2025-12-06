import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from '../config';
import { getDatabase } from '../services/database.service';
import { getAnalyticsEngine } from '../analytics/engine';
import { getRPCService } from '../services/rpc.service';
import { APIResponse, PaginatedResponse, TokenAnalytics } from '../types';

const app = express();
const db = getDatabase();
const analytics = getAnalyticsEngine();
const rpc = getRPCService();

// Middleware
app.use(cors({ origin: config.api.corsOrigin }));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'qubic-token-analyzer',
  });
});

app.get('/api/v1/status', async (req: Request, res: Response) => {
  try {
    const networkStatus = await rpc.getNetworkStatus();
    const currentTick = await rpc.getCurrentTick();
    const lastProcessedTick = await db.getLastProcessedTick();

    res.json({
      success: true,
      data: {
        network: networkStatus,
        indexer: {
          currentTick: currentTick.tick,
          lastProcessedTick,
          ticksBehind: currentTick.tick - lastProcessedTick,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// TOKEN ANALYTICS ENDPOINTS (Live Tree - Real Data)
// ============================================================================

/**
 * GET /api/v1/tokens/example
 * Get example token data - Use this to test with real issuer/name
 * Example: CFBMEMZOIDEXDYPVMHGCBQDTTMPRJHOXMZRFVWXYZJWYQVNLODVFAAFV / QX
 */
app.get('/api/v1/tokens/example', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Use these example tokens to test analytics',
        examples: [
          {
            issuer: 'CFBMEMZOIDEXDYPVMHGCBQDTTMPRJHOXMZRFVWXYZJWYQVNLODVFAAFV',
            name: 'QX',
            description: 'QX Exchange Token - Main DEX token on Qubic'
          },
          {
            issuer: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB',
            name: 'QUTIL',
            description: 'Qubic Utility Token'
          },
          {
            issuer: 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID',
            name: 'TEST',
            description: 'Test token for QX'
          }
        ],
        note: 'The indexer is syncing blockchain data. Once complete, analytics will show real trade history, holders, and metrics from the database.'
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/tokens/:issuer/:name/analytics
 * Get complete analytics for a token
 */
app.get('/api/v1/tokens/:issuer/:name/analytics', async (req: Request, res: Response) => {
  try {
    const { issuer, name } = req.params;

    // Calculate metrics
    const metrics = await analytics.calculateTokenMetrics(issuer, name);
    
    // Get recent trades
    const recentTrades = await db.getTradesByToken(issuer, name, 50);
    
    // Get top holders
    const topHolders = await db.getTopHolders(issuer, name, 100);

    // Calculate risk and growth factors
    const holders = await db.getHoldersByToken(issuer, name);
    const totalSupply = holders.reduce((sum, h) => sum + h.balance, BigInt(0));
    const holderMetrics = {
      whaleCount: metrics.holders.whales,
      concentrationIndex: metrics.holders.holderConcentration,
      top10Percentage: metrics.holders.top10Percentage,
      top50Percentage: metrics.holders.top50Percentage,
    };

    const riskFactors = analytics.calculateRiskScore(
      holderMetrics,
      { volume24h: metrics.volume.last24h },
      metrics.activity
    );

    const growthFactors = analytics.calculateGrowthScore(
      metrics.activity,
      { volume24h: metrics.volume.last24h, volume7d: metrics.volume.last7d },
      holders
    );

    // Convert BigInt to string for JSON serialization
    const serializeData = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return obj.toString();
      if (Array.isArray(obj)) return obj.map(serializeData);
      if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          result[key] = serializeData(obj[key]);
        }
        return result;
      }
      return obj;
    };

    const response: APIResponse<TokenAnalytics> = {
      success: true,
      data: serializeData({
        token: {
          issuer,
          name,
        },
        metrics,
        riskFactors,
        growthFactors,
        recentTrades,
        topHolders,
      }),
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/tokens/:issuer/:name/holders
 * Get all holders for a token
 */
app.get('/api/v1/tokens/:issuer/:name/holders', async (req: Request, res: Response) => {
  try {
    const { issuer, name } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const whalesOnly = req.query.whales === 'true';

    let holders;
    if (whalesOnly) {
      holders = await db.getWhalesByToken(issuer, name);
    } else {
      holders = await db.getTopHolders(issuer, name, limit);
    }

    res.json({
      success: true,
      data: holders,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/tokens/:issuer/:name/trades
 * Get recent trades for a token
 */
app.get('/api/v1/tokens/:issuer/:name/trades', async (req: Request, res: Response) => {
  try {
    const { issuer, name } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const type = req.query.type as 'BUY' | 'SELL' | undefined;

    let trades = await db.getTradesByToken(issuer, name, limit);

    if (type) {
      trades = trades.filter((t) => t.tradeType === type);
    }

    res.json({
      success: true,
      data: trades,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/tokens/:issuer/:name/volume
 * Get volume statistics for a token
 */
app.get('/api/v1/tokens/:issuer/:name/volume', async (req: Request, res: Response) => {
  try {
    const { issuer, name } = req.params;

    const volume24h = await db.getVolume24h(issuer, name);
    const tradeCount24h = await db.getTradeCount24h(issuer, name);
    const uniqueTraders24h = await db.getUniqueTraders24h(issuer, name);

    res.json({
      success: true,
      data: {
        volume24h: volume24h.toString(),
        tradeCount24h,
        uniqueTraders24h,
        avgTradeSize: tradeCount24h > 0 
          ? (Number(volume24h) / tradeCount24h).toFixed(2)
          : '0',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/tokens/:issuer/:name/risk-score
 * Get risk score breakdown
 */
app.get('/api/v1/tokens/:issuer/:name/risk-score', async (req: Request, res: Response) => {
  try {
    const { issuer, name } = req.params;
    const metrics = await analytics.calculateTokenMetrics(issuer, name);
    
    const holders = await db.getHoldersByToken(issuer, name);
    const holderMetrics = {
      whaleCount: metrics.holders.whales,
      concentrationIndex: metrics.holders.holderConcentration,
      top10Percentage: metrics.holders.top10Percentage,
      top50Percentage: metrics.holders.top50Percentage,
    };

    const riskFactors = analytics.calculateRiskScore(
      holderMetrics,
      { volume24h: metrics.volume.last24h },
      metrics.activity
    );

    res.json({
      success: true,
      data: {
        total: riskFactors.total,
        factors: riskFactors,
        interpretation: getRiskInterpretation(riskFactors.total),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/tokens/:issuer/:name/growth-score
 * Get growth score breakdown
 */
app.get('/api/v1/tokens/:issuer/:name/growth-score', async (req: Request, res: Response) => {
  try {
    const { issuer, name } = req.params;
    const metrics = await analytics.calculateTokenMetrics(issuer, name);
    const holders = await db.getHoldersByToken(issuer, name);

    const growthFactors = analytics.calculateGrowthScore(
      metrics.activity,
      { volume24h: metrics.volume.last24h, volume7d: metrics.volume.last7d },
      holders
    );

    res.json({
      success: true,
      data: {
        total: growthFactors.total,
        factors: growthFactors,
        interpretation: getGrowthInterpretation(growthFactors.total),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// ADDRESS ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/addresses/:address/trades
 * Get all trades for a specific address
 */
app.get('/api/v1/addresses/:address/trades', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const trades = await db.getTradesByAddress(address, limit);

    res.json({
      success: true,
      data: trades,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/addresses/:address/holdings
 * Get all token holdings for an address
 */
app.get('/api/v1/addresses/:address/holdings', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Query all tokens where this address has balance > 0
    const result = await db.query(
      `SELECT * FROM holders WHERE address = $1 AND balance > 0 ORDER BY balance DESC`,
      [address]
    );

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getRiskInterpretation(score: number): string {
  if (score >= 80) return 'Very Low Risk';
  if (score >= 60) return 'Low Risk';
  if (score >= 40) return 'Moderate Risk';
  if (score >= 20) return 'High Risk';
  return 'Very High Risk';
}

function getGrowthInterpretation(score: number): string {
  if (score >= 80) return 'Excellent Growth Potential';
  if (score >= 60) return 'Good Growth Potential';
  if (score >= 40) return 'Moderate Growth Potential';
  if (score >= 20) return 'Limited Growth Potential';
  return 'Poor Growth Potential';
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// START SERVER
// ============================================================================

export function startAPIServer(): void {
  app.listen(config.api.port, config.api.host, () => {
    console.log(`[API] Server running on http://${config.api.host}:${config.api.port}`);
    console.log(`[API] Endpoints:`);
    console.log(`  - GET  /health`);
    console.log(`  - GET  /api/v1/status`);
    console.log(`  - GET  /api/v1/tokens/:issuer/:name/analytics`);
    console.log(`  - GET  /api/v1/tokens/:issuer/:name/holders`);
    console.log(`  - GET  /api/v1/tokens/:issuer/:name/trades`);
    console.log(`  - GET  /api/v1/tokens/:issuer/:name/volume`);
    console.log(`  - GET  /api/v1/tokens/:issuer/:name/risk-score`);
    console.log(`  - GET  /api/v1/tokens/:issuer/:name/growth-score`);
    console.log(`  - GET  /api/v1/addresses/:address/trades`);
    console.log(`  - GET  /api/v1/addresses/:address/holdings`);
  });
}

export default app;
