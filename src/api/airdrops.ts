import { Request, Response } from 'express';
import { getDatabase } from '../services/database.service';

const db = getDatabase();

/**
 * GET /api/v1/airdrops/eligible
 * 
 * Get eligible addresses for airdrops based on criteria
 * Perfect for Make/Zapier automation via EasyConnect
 * 
 * Query params:
 *   - token: token name to check
 *   - min_balance: minimum token balance required
 *   - min_trades: minimum number of trades
 *   - holders_only: only include current holders (default true)
 *   - whales_only: only whales
 *   - exclude_whales: exclude whales
 */
export async function getAirdropEligible(req: Request, res: Response) {
  try {
    const {
      token,
      min_balance = '0',
      min_trades = '1',
      holders_only = 'true',
      whales_only = 'false',
      exclude_whales = 'false'
    } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token parameter is required',
        timestamp: new Date().toISOString()
      });
    }

    let whereConditions = [
      'h.token_name = $1',
      `h.balance >= $2`,
      `(h.buy_count + h.sell_count) >= $3`
    ];

    const params: any[] = [token, min_balance, parseInt(min_trades as string)];

    if (holders_only === 'true') {
      whereConditions.push('h.balance > 0');
    }

    if (whales_only === 'true') {
      whereConditions.push('h.is_whale = true');
    }

    if (exclude_whales === 'true') {
      whereConditions.push('h.is_whale = false');
    }

    const query = `
      SELECT 
        h.address,
        h.balance,
        h.percentage,
        h.buy_count,
        h.sell_count,
        h.total_bought,
        h.total_sold,
        h.is_whale,
        h.first_seen_tick,
        h.last_activity_tick,
        (SELECT COUNT(*) FROM trades t WHERE t.trader = h.address AND t.token_name = h.token_name) as trade_count
      FROM holders h
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY h.balance DESC
    `;

    const result = await db.query(query, params);

    const eligible = result.rows.map(row => ({
      address: row.address,
      balance: row.balance,
      percentage: row.percentage,
      activity: {
        buy_count: row.buy_count,
        sell_count: row.sell_count,
        trade_count: parseInt(row.trade_count),
        total_bought: row.total_bought,
        total_sold: row.total_sold
      },
      status: {
        is_whale: row.is_whale,
        holder_since_tick: row.first_seen_tick,
        last_active_tick: row.last_activity_tick
      },
      airdrop_eligible: true
    }));

    res.json({
      success: true,
      data: {
        eligible_addresses: eligible,
        count: eligible.length,
        criteria: {
          token,
          min_balance,
          min_trades,
          holders_only: holders_only === 'true',
          whales_only: whales_only === 'true',
          exclude_whales: exclude_whales === 'true'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Airdrop API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/v1/airdrops/diamond-hands
 * 
 * Find addresses that never sold (diamond hands 💎)
 */
export async function getDiamondHands(req: Request, res: Response) {
  try {
    const { token, min_balance = '1000000000' } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token parameter is required'
      });
    }

    const query = `
      SELECT 
        h.address,
        h.balance,
        h.percentage,
        h.buy_count,
        h.total_bought,
        h.first_seen_tick,
        EXTRACT(EPOCH FROM (NOW() - (
          SELECT timestamp FROM trades 
          WHERE trader = h.address 
          AND token_name = h.token_name 
          AND trade_type = 'BUY'
          ORDER BY timestamp ASC 
          LIMIT 1
        ))) / 86400 as days_holding
      FROM holders h
      WHERE h.token_name = $1
      AND h.balance >= $2
      AND h.sell_count = 0
      AND h.buy_count > 0
      ORDER BY h.balance DESC
    `;

    const result = await db.query(query, [token, min_balance]);

    const diamondHands = result.rows.map(row => ({
      address: row.address,
      balance: row.balance,
      percentage: row.percentage,
      buy_count: row.buy_count,
      total_bought: row.total_bought,
      first_seen_tick: row.first_seen_tick,
      days_holding: Math.floor(row.days_holding),
      badge: '💎',
      title: 'Diamond Hands'
    }));

    res.json({
      success: true,
      data: {
        diamond_hands: diamondHands,
        count: diamondHands.length,
        token
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Diamond Hands API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
