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

/**
 * POST /api/v1/events/badge-unlock
 * 
 * Trigger badge unlock event to EasyConnect webhooks
 * Body:
 *   - address: wallet address
 *   - badge_id: unique badge identifier
 *   - badge_name: display name
 *   - badge_emoji: emoji icon
 *   - rarity: common|rare|epic|legendary
 *   - description: badge description
 */
export async function triggerBadgeUnlock(req: Request, res: Response) {
  try {
    const { address, badge_id, badge_name, badge_emoji, rarity, description } = req.body;

    if (!address || !badge_id || !badge_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: address, badge_id, badge_name'
      });
    }

    // Get trader stats
    const statsQuery = `
      SELECT 
        COUNT(*) as trade_count,
        SUM(CASE WHEN input_amount > 0 THEN 1 ELSE 0 END) as buy_count,
        SUM(CASE WHEN output_amount > 0 THEN 1 ELSE 0 END) as sell_count,
        COALESCE(SUM(input_amount + output_amount), 0) as total_volume,
        COALESCE(AVG(input_amount + output_amount), 0) as avg_trade_size,
        COALESCE(MAX(input_amount + output_amount), 0) as biggest_trade
      FROM trades 
      WHERE source_public_id = $1 OR dest_public_id = $1
    `;
    
    const statsResult = await db.query(statsQuery, [address]);
    const stats = statsResult.rows[0] || {};

    // Get leaderboard rank
    const rankQuery = `
      SELECT 
        rank
      FROM (
        SELECT 
          COALESCE(source_public_id, dest_public_id) as trader,
          SUM(input_amount + output_amount) as total_volume,
          RANK() OVER (ORDER BY SUM(input_amount + output_amount) DESC) as rank
        FROM trades
        WHERE executed_tick_number > 0
        GROUP BY COALESCE(source_public_id, dest_public_id)
      ) t
      WHERE trader = $1
    `;
    
    const rankResult = await db.query(rankQuery, [address]);
    const rank = rankResult.rows[0]?.rank || 999;

    // Construct webhook payload
    const payload = {
      event_type: 'achievement.unlocked',
      timestamp: new Date().toISOString(),
      data: {
        user_address: address,
        badge_id,
        badge_name,
        badge_emoji,
        rarity: rarity || 'common',
        description: description || '',
        rank: parseInt(rank),
        total_volume: parseFloat(stats.total_volume || '0'),
        trade_count: parseInt(stats.trade_count || '0'),
        buy_count: parseInt(stats.buy_count || '0'),
        sell_count: parseInt(stats.sell_count || '0')
      }
    };

    // Dispatch to all active webhooks subscribed to achievement events
    const webhooksQuery = `
      SELECT id, url, secret, retry_count
      FROM webhooks
      WHERE active = true 
      AND 'achievement.unlocked' = ANY(events)
    `;
    const webhooks = await db.query(webhooksQuery);
    
    for (const webhook of webhooks.rows) {
      // Send webhook (fire and forget for now, alert engine handles retries)
      try {
        const crypto = await import('crypto');
        const signature = crypto.createHmac('sha256', webhook.secret || '')
          .update(JSON.stringify(payload))
          .digest('hex');
        
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': `sha256:${signature}`
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error(`Webhook ${webhook.id} delivery failed:`, err);
      }
    }

    res.json({
      success: true,
      message: 'Badge unlock event dispatched to webhooks',
      data: payload
    });

  } catch (error: any) {
    console.error('[Badge Unlock Event] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/v1/events/milestone-reached
 * 
 * Trigger holder milestone event to EasyConnect webhooks
 * Body:
 *   - token_id: token issuer ID
 *   - token_name: token display name
 *   - milestone: holder count milestone reached
 */
export async function triggerMilestone(req: Request, res: Response) {
  try {
    const { token_id, token_name, milestone } = req.body;

    if (!token_id || !milestone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token_id, milestone'
      });
    }

    // Get current holder count
    const holderQuery = `
      SELECT 
        COUNT(DISTINCT address) as holder_count
      FROM (
        SELECT source_public_id as address FROM trades WHERE issuer_id = $1
        UNION
        SELECT dest_public_id as address FROM trades WHERE issuer_id = $1
      ) t
      WHERE address IS NOT NULL
    `;
    
    const holderResult = await db.query(holderQuery, [token_id]);
    const holder_count = parseInt(holderResult.rows[0]?.holder_count || '0');

    // Get top holders
    const topHoldersQuery = `
      SELECT 
        address,
        balance,
        RANK() OVER (ORDER BY balance DESC) as rank
      FROM (
        SELECT 
          address,
          SUM(amount) as balance
        FROM (
          SELECT dest_public_id as address, SUM(input_amount) as amount 
          FROM trades WHERE issuer_id = $1 GROUP BY dest_public_id
          UNION ALL
          SELECT source_public_id as address, -SUM(output_amount) as amount 
          FROM trades WHERE issuer_id = $1 GROUP BY source_public_id
        ) t
        WHERE address IS NOT NULL
        GROUP BY address
      ) balances
      WHERE balance > 0
      ORDER BY balance DESC
      LIMIT 10
    `;
    
    const holdersResult = await db.query(topHoldersQuery, [token_id]);

    // Construct webhook payload
    const payload = {
      event_type: 'holder.surge',
      timestamp: new Date().toISOString(),
      data: {
        token_id,
        token_name: token_name || token_id,
        holder_count,
        milestone: parseInt(milestone),
        growth_percentage: ((holder_count / milestone) * 100).toFixed(2),
        holders: holdersResult.rows.map((h: any) => ({
          address: h.address,
          balance: parseFloat(h.balance || '0'),
          rank: parseInt(h.rank)
        }))
      }
    };

    // Dispatch to all active webhooks subscribed to holder surge events
    const webhooksQuery = `
      SELECT id, url, secret, retry_count
      FROM webhooks
      WHERE active = true 
      AND 'holder.surge' = ANY(events)
    `;
    const webhooks = await db.query(webhooksQuery);
    
    for (const webhook of webhooks.rows) {
      try {
        const crypto = await import('crypto');
        const signature = crypto.createHmac('sha256', webhook.secret || '')
          .update(JSON.stringify(payload))
          .digest('hex');
        
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': `sha256:${signature}`
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error(`Webhook ${webhook.id} delivery failed:`, err);
      }
    }

    res.json({
      success: true,
      message: 'Milestone event dispatched to webhooks',
      data: payload
    });

  } catch (error: any) {
    console.error('[Milestone Event] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
