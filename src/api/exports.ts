import { Request, Response } from 'express';
import { pool } from '../services/database.service';

// ============================================================================
// EXPORT ENDPOINTS FOR EASYCONNECT INTEGRATIONS
// ============================================================================
// Generate CSV/JSON exports for Google Sheets, Excel, Airtable integrations

/**
 * Export holders data
 * GET /api/v1/exports/holders
 * 
 * Query params:
 * - token: QMINE (required)
 * - format: csv|json (default: json)
 * - min_balance: minimum balance filter
 * - whales_only: true|false
 * - limit: max rows (default: 1000)
 */
export async function exportHolders(req: Request, res: Response) {
  try {
    const { token, format = 'json', min_balance, whales_only, limit = '1000' } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Missing required parameter: token',
        example: '/api/v1/exports/holders?token=QMINE&format=csv'
      });
    }

    // Build query
    const conditions: string[] = ['h.token_name = $1'];
    const params: any[] = [token];
    let paramCount = 2;

    if (min_balance) {
      conditions.push(`h.balance::NUMERIC >= \$${paramCount}::NUMERIC`);
      params.push(min_balance);
      paramCount++;
    }

    if (whales_only === 'true') {
      conditions.push('h.is_whale = true');
    }

    const query = `
      SELECT 
        h.address,
        h.balance,
        h.percentage,
        h.is_whale,
        h.buy_count,
        h.sell_count,
        h.total_bought,
        h.total_sold,
        (CAST(h.total_bought AS NUMERIC) - CAST(h.total_sold AS NUMERIC)) as net_position,
        h.first_trade_tick,
        h.last_trade_tick,
        h.updated_at
      FROM holders h
      WHERE ${conditions.join(' AND ')}
      ORDER BY CAST(h.balance AS NUMERIC) DESC
      LIMIT \$${paramCount}
    `;

    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Address',
        'Balance',
        'Percentage',
        'Is Whale',
        'Buy Count',
        'Sell Count',
        'Total Bought',
        'Total Sold',
        'Net Position',
        'First Trade Tick',
        'Last Trade Tick',
        'Updated At'
      ];

      const csvRows = [
        headers.join(','),
        ...result.rows.map(row => [
          row.address,
          row.balance,
          row.percentage,
          row.is_whale,
          row.buy_count,
          row.sell_count,
          row.total_bought,
          row.total_sold,
          row.net_position,
          row.first_trade_tick,
          row.last_trade_tick,
          row.updated_at?.toISOString() || ''
        ].join(','))
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="holders_${token}_${Date.now()}.csv"`);
      res.send(csvRows.join('\n'));

    } else {
      // JSON format
      const holders = result.rows.map(row => ({
        address: row.address,
        balance: row.balance,
        percentage: row.percentage,
        is_whale: row.is_whale,
        trades: {
          buy_count: row.buy_count,
          sell_count: row.sell_count,
          total_bought: row.total_bought,
          total_sold: row.total_sold,
          net_position: row.net_position
        },
        first_trade_tick: row.first_trade_tick,
        last_trade_tick: row.last_trade_tick,
        updated_at: row.updated_at
      }));

      res.json({
        success: true,
        token,
        count: holders.length,
        exported_at: new Date().toISOString(),
        data: holders
      });
    }

  } catch (error) {
    console.error('Error exporting holders:', error);
    res.status(500).json({ 
      error: 'Failed to export holders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Export trades data
 * GET /api/v1/exports/trades
 * 
 * Query params:
 * - token: QMINE (optional)
 * - address: filter by trader address (optional)
 * - format: csv|json (default: json)
 * - period: 24h|7d|30d|all (default: 7d)
 * - trade_type: BUY|SELL (optional)
 * - min_amount: minimum trade amount filter
 * - limit: max rows (default: 1000)
 */
export async function exportTrades(req: Request, res: Response) {
  try {
    const { 
      token, 
      address, 
      format = 'json', 
      period = '7d',
      trade_type,
      min_amount,
      limit = '1000' 
    } = req.query;

    // Build time filter
    let timeFilter = '';
    if (period !== 'all') {
      const intervals: Record<string, string> = {
        '24h': "timestamp > NOW() - INTERVAL '24 hours'",
        '7d': "timestamp > NOW() - INTERVAL '7 days'",
        '30d': "timestamp > NOW() - INTERVAL '30 days'"
      };
      timeFilter = intervals[period as string] || intervals['7d'];
    }

    // Build query
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (timeFilter) {
      conditions.push(timeFilter);
    }

    if (token) {
      conditions.push(`token_name = \$${paramCount}`);
      params.push(token);
      paramCount++;
    }

    if (address) {
      conditions.push(`trader = \$${paramCount}`);
      params.push(address);
      paramCount++;
    }

    if (trade_type) {
      conditions.push(`trade_type = \$${paramCount}`);
      params.push(trade_type);
      paramCount++;
    }

    if (min_amount) {
      conditions.push(`amount::NUMERIC >= \$${paramCount}::NUMERIC`);
      params.push(min_amount);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        tx_id,
        tick,
        timestamp,
        token_issuer,
        token_name,
        trade_type,
        trader,
        price,
        amount,
        total_value,
        price_per_unit
      FROM trades
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT \$${paramCount}
    `;

    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'TX ID',
        'Tick',
        'Timestamp',
        'Token Issuer',
        'Token',
        'Type',
        'Trader',
        'Price',
        'Amount',
        'Total Value',
        'Price Per Unit'
      ];

      const csvRows = [
        headers.join(','),
        ...result.rows.map(row => [
          row.tx_id,
          row.tick,
          row.timestamp.toISOString(),
          row.token_issuer,
          row.token_name,
          row.trade_type,
          row.trader,
          row.price,
          row.amount,
          row.total_value,
          row.price_per_unit
        ].join(','))
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="trades_${period}_${Date.now()}.csv"`);
      res.send(csvRows.join('\n'));

    } else {
      // JSON format
      const trades = result.rows.map(row => ({
        tx_id: row.tx_id,
        tick: row.tick,
        timestamp: row.timestamp,
        token: {
          issuer: row.token_issuer,
          name: row.token_name
        },
        trade_type: row.trade_type,
        trader: row.trader,
        price: row.price,
        amount: row.amount,
        total_value: row.total_value,
        price_per_unit: parseFloat(row.price_per_unit)
      }));

      res.json({
        success: true,
        filters: {
          token: token || 'all',
          address: address || 'all',
          period,
          trade_type: trade_type || 'all'
        },
        count: trades.length,
        exported_at: new Date().toISOString(),
        data: trades
      });
    }

  } catch (error) {
    console.error('Error exporting trades:', error);
    res.status(500).json({ 
      error: 'Failed to export trades',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Export leaderboard data
 * GET /api/v1/exports/leaderboard
 * 
 * Query params:
 * - format: csv|json (default: json)
 * - period: 24h|7d|30d|all (default: all)
 * - limit: max rows (default: 100)
 */
export async function exportLeaderboard(req: Request, res: Response) {
  try {
    const { format = 'json', period = 'all', limit = '100' } = req.query;

    // Build time filter
    let timeFilter = '1=1';
    if (period !== 'all') {
      const intervals: Record<string, string> = {
        '24h': "t.timestamp > NOW() - INTERVAL '24 hours'",
        '7d': "t.timestamp > NOW() - INTERVAL '7 days'",
        '30d': "t.timestamp > NOW() - INTERVAL '30 days'"
      };
      timeFilter = intervals[period as string] || '1=1';
    }

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
      GROUP BY t.trader
      ORDER BY total_volume DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [parseInt(limit as string)]);

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Rank',
        'Trader',
        'Total Volume',
        'Trade Count',
        'Buy Count',
        'Sell Count',
        'Avg Trade Size',
        'Biggest Trade',
        'Is Whale'
      ];

      const csvRows = [
        headers.join(','),
        ...result.rows.map((row, index) => [
          index + 1,
          row.trader,
          row.total_volume,
          row.trade_count,
          row.buy_count,
          row.sell_count,
          row.avg_trade_size,
          row.biggest_trade,
          row.is_whale
        ].join(','))
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="leaderboard_${period}_${Date.now()}.csv"`);
      res.send(csvRows.join('\n'));

    } else {
      // JSON format
      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        trader: row.trader,
        stats: {
          total_volume: row.total_volume,
          trade_count: parseInt(row.trade_count),
          buy_count: parseInt(row.buy_count),
          sell_count: parseInt(row.sell_count),
          avg_trade_size: row.avg_trade_size,
          biggest_trade: row.biggest_trade
        },
        is_whale: row.is_whale
      }));

      res.json({
        success: true,
        period,
        count: leaderboard.length,
        exported_at: new Date().toISOString(),
        data: leaderboard
      });
    }

  } catch (error) {
    console.error('Error exporting leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to export leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
