import { Request, Response } from 'express';
import { getDatabase } from '../services/database.service';

const db = getDatabase();

/**
 * GET /api/v1/events/recent
 * 
 * Returns recent blockchain events for EasyConnect integration
 * Query params:
 *   - since: timestamp (ISO 8601) to get events after
 *   - token: filter by token name (optional)
 *   - address: filter by wallet address (optional)
 *   - min_amount: minimum trade amount to include (optional)
 *   - whales_only: only show whale trades (optional, boolean)
 *   - limit: max results (default 100, max 1000)
 */
export async function getRecentEvents(req: Request, res: Response) {
  try {
    const {
      since,
      token,
      address,
      min_amount,
      whales_only,
      limit = '100'
    } = req.query;

    const maxLimit = Math.min(parseInt(limit as string, 10) || 100, 1000);
    
    // Build dynamic query
    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Filter by timestamp
    if (since) {
      whereConditions.push(`t.timestamp > $${paramIndex}`);
      params.push(since);
      paramIndex++;
    } else {
      // Default: last 24 hours
      whereConditions.push(`t.timestamp > NOW() - INTERVAL '24 hours'`);
    }

    // Filter by token
    if (token) {
      whereConditions.push(`t.token_name = $${paramIndex}`);
      params.push(token);
      paramIndex++;
    }

    // Filter by address
    if (address) {
      whereConditions.push(`t.trader = $${paramIndex}`);
      params.push(address);
      paramIndex++;
    }

    // Filter by minimum amount
    if (min_amount) {
      whereConditions.push(`t.amount >= $${paramIndex}`);
      params.push(min_amount);
      paramIndex++;
    }

    // Filter whales only (top holders)
    if (whales_only === 'true') {
      whereConditions.push(`h.is_whale = true`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Query recent trades with holder info
    const query = `
      SELECT 
        t.tx_id,
        t.tick,
        t.timestamp,
        t.token_issuer,
        t.token_name,
        t.trade_type,
        t.trader,
        t.amount,
        t.price,
        t.total_value,
        t.price_per_unit,
        h.is_whale,
        h.balance as trader_balance,
        h.percentage as trader_percentage
      FROM trades t
      LEFT JOIN holders h ON (
        h.address = t.trader 
        AND h.token_issuer = t.token_issuer 
        AND h.token_name = t.token_name
      )
      ${whereClause}
      ORDER BY t.timestamp DESC
      LIMIT $${paramIndex}
    `;

    params.push(maxLimit);

    const result = await db.query(query, params);

    // Transform to EasyConnect-friendly format
    const events = result.rows.map(row => ({
      event_id: row.tx_id,
      event_type: row.trade_type === 'BUY' ? 'token_purchase' : 'token_sale',
      timestamp: row.timestamp,
      tick: row.tick,
      token: {
        name: row.token_name,
        issuer: row.token_issuer
      },
      trade: {
        trader_address: row.trader,
        amount: row.amount,
        price: row.price,
        total_value: row.total_value,
        price_per_unit: row.price_per_unit
      },
      metadata: {
        is_whale: row.is_whale || false,
        trader_balance: row.trader_balance || '0',
        trader_percentage: row.trader_percentage || '0.00'
      }
    }));

    res.json({
      success: true,
      data: {
        events,
        count: events.length,
        filters: {
          since: since || 'last_24h',
          token: token || 'all',
          address: address || 'all',
          min_amount: min_amount || '0',
          whales_only: whales_only === 'true'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Events API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/v1/events/whale-alerts
 * 
 * Specialized endpoint for whale activity (large trades by top holders)
 */
export async function getWhaleAlerts(req: Request, res: Response) {
  try {
    const { limit = '50', token } = req.query;
    const maxLimit = Math.min(parseInt(limit as string, 10) || 50, 500);

    let tokenFilter = '';
    const params: any[] = [];
    
    if (token) {
      tokenFilter = 'AND t.token_name = $2';
      params.push(maxLimit, token);
    } else {
      params.push(maxLimit);
    }

    const query = `
      SELECT 
        t.tx_id,
        t.timestamp,
        t.token_name,
        t.token_issuer,
        t.trade_type,
        t.trader,
        t.amount,
        t.total_value,
        h.percentage as holder_percentage
      FROM trades t
      INNER JOIN holders h ON (
        h.address = t.trader 
        AND h.token_issuer = t.token_issuer 
        AND h.token_name = t.token_name
        AND h.is_whale = true
      )
      WHERE t.timestamp > NOW() - INTERVAL '24 hours'
      ${tokenFilter}
      ORDER BY t.timestamp DESC
      LIMIT $1
    `;

    const result = await db.query(query, params);

    const alerts = result.rows.map(row => ({
      alert_type: 'whale_activity',
      severity: Number(row.holder_percentage) > 5 ? 'critical' : 'warning',
      timestamp: row.timestamp,
      token: row.token_name,
      trader: row.trader,
      action: row.trade_type,
      amount: row.amount,
      total_value: row.total_value,
      holder_percentage: row.holder_percentage
    }));

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Whale Alerts API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
