import { Request, Response } from 'express';
import { getDatabase } from '../services/database.service';

const db = getDatabase();

/**
 * GET /api/v1/leaderboard/traders
 * 
 * Gamification: Top traders by volume, profit, whale kills
 * Perfect for Discord/Telegram bot integration via EasyConnect
 */
export async function getTopTraders(req: Request, res: Response) {
  try {
    const { token, period = '24h', limit = '50' } = req.query;
    const maxLimit = Math.min(parseInt(limit as string) || 50, 100);

    let timeFilter = "t.timestamp > NOW() - INTERVAL '24 hours'";
    if (period === '7d') timeFilter = "t.timestamp > NOW() - INTERVAL '7 days'";
    if (period === '30d') timeFilter = "t.timestamp > NOW() - INTERVAL '30 days'";
    if (period === 'all') timeFilter = '1=1';

    const tokenFilter = token ? `AND t.token_name = $2` : '';
    const params = token ? [maxLimit, token] : [maxLimit];

    const query = `
      SELECT 
        t.trader,
        COUNT(*) as trade_count,
        SUM(CASE WHEN t.trade_type = 'BUY' THEN 1 ELSE 0 END) as buy_count,
        SUM(CASE WHEN t.trade_type = 'SELL' THEN 1 ELSE 0 END) as sell_count,
        SUM(t.total_value) as total_volume,
        AVG(t.total_value) as avg_trade_size,
        MAX(t.total_value) as biggest_trade,
        MAX(CASE WHEN h.is_whale THEN 1 ELSE 0 END) = 1 as is_whale
      FROM trades t
      LEFT JOIN holders h ON h.address = t.trader
      WHERE ${timeFilter}
      ${tokenFilter}
      GROUP BY t.trader
      ORDER BY total_volume DESC
      LIMIT $1
    `;

    const result = await db.query(query, params);

    // Calculate ranks and badges
    const leaderboard = result.rows.map((row, idx) => {
      const rank = idx + 1;
      let badge = '🎖️';
      let title = 'Trader';

      // Assign badges
      if (rank === 1) badge = '🥇';
      else if (rank === 2) badge = '🥈';
      else if (rank === 3) badge = '🥉';
      else if (rank <= 10) badge = '⭐';

      // Assign titles
      if (row.is_whale) {
        title = '🐋 Whale Master';
      } else if (Number(row.total_volume) > 1000000000000) {
        title = '💎 Diamond Hands';
      } else if (Number(row.trade_count) > 100) {
        title = '🔥 Volume King';
      } else if (Number(row.buy_count) > row.sell_count * 2) {
        title = '📈 Bull Champion';
      }

      return {
        rank,
        badge,
        title,
        address: row.trader,
        stats: {
          trade_count: parseInt(row.trade_count),
          buy_count: parseInt(row.buy_count),
          sell_count: parseInt(row.sell_count),
          total_volume: row.total_volume,
          avg_trade_size: row.avg_trade_size,
          biggest_trade: row.biggest_trade
        },
        portfolio: {
          is_whale: row.is_whale || false,
          current_balance: '0',
          portfolio_share: '0.00'
        }
      };
    });

    res.json({
      success: true,
      data: {
        leaderboard,
        period,
        token: token || 'all',
        total_traders: leaderboard.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Leaderboard API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/v1/leaderboard/whale-hunters
 * 
 * Traders who bought before whales (alpha hunters)
 */
export async function getWhaleHunters(req: Request, res: Response) {
  try {
    const { token, limit = '20' } = req.query;
    const maxLimit = Math.min(parseInt(limit as string) || 20, 50);

    // Find traders who bought before whale activity
    const tokenFilter = token ? `AND t.token_name = $2` : '';
    const params = token ? [maxLimit, token] : [maxLimit];

    const query = `
      SELECT 
        t.trader,
        COUNT(DISTINCT t.token_name) as tokens_hunted,
        COUNT(*) as early_positions,
        SUM(t.amount) as total_early_amount,
        MIN(t.timestamp) as first_alpha_move,
        MAX(t.timestamp) as last_alpha_move
      FROM trades t
      WHERE t.trade_type = 'BUY'
      ${tokenFilter}
      AND EXISTS (
        SELECT 1 FROM trades whale_trade
        INNER JOIN holders whale_holder ON (
          whale_holder.address = whale_trade.trader
          AND whale_holder.token_name = whale_trade.token_name
          AND whale_holder.is_whale = true
        )
        WHERE whale_trade.token_name = t.token_name
        AND whale_trade.trade_type = 'BUY'
        AND whale_trade.timestamp > t.timestamp
        AND whale_trade.timestamp < t.timestamp + INTERVAL '24 hours'
      )
      GROUP BY t.trader
      ORDER BY tokens_hunted DESC, total_early_amount DESC
      LIMIT $1
    `;

    const result = await db.query(query, params);

    const hunters = result.rows.map((row, idx) => ({
      rank: idx + 1,
      badge: idx < 3 ? '🎯' : '🏹',
      title: '🦅 Alpha Hunter',
      address: row.trader,
      stats: {
        tokens_hunted: parseInt(row.tokens_hunted),
        early_positions: parseInt(row.early_positions),
        total_early_amount: row.total_early_amount,
        first_alpha_move: row.first_alpha_move,
        last_alpha_move: row.last_alpha_move
      }
    }));

    res.json({
      success: true,
      data: {
        whale_hunters: hunters,
        token: token || 'all',
        total_hunters: hunters.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Whale Hunters API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
