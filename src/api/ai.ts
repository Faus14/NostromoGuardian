import { Router } from 'express';
import { analyzeTradeWithAI, generateAnnouncement } from '../services/ai.service';
import { getDatabase } from '../services/database.service';

const db = getDatabase();

const router = Router();

/**
 * POST /api/v1/ai/analyze-trade
 * Analyze a trade with AI insights
 */
router.post('/analyze-trade', async (req, res) => {
  try {
    const { trade, context } = req.body;

    if (!trade || !trade.amount || !trade.token_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: trade.amount, trade.token_name',
      });
    }

    const insights = await analyzeTradeWithAI({ trade, context: context || {} });

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Trade Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze trade',
    });
  }
});

/**
 * POST /api/v1/ai/generate-announcement
 * Generate announcement message for event
 */
router.post('/generate-announcement', async (req, res) => {
  try {
    const { event_type, data } = req.body;

    if (!event_type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: event_type, data',
      });
    }

    const validEvents = ['whale.buy', 'whale.sell', 'volume.spike', 'holder.surge', 'achievement.unlocked'];
    if (!validEvents.includes(event_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid event_type. Must be one of: ${validEvents.join(', ')}`,
      });
    }

    const announcement = await generateAnnouncement({ event_type, data });

    res.json({
      success: true,
      data: announcement,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Announcement Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate announcement',
    });
  }
});

/**
 * GET /api/v1/ai/analyze-address/:address
 * Comprehensive AI analysis of a trader address
 */
router.get('/analyze-address/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Get trader stats
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as trade_count,
        SUM(CASE WHEN source_address = $1 THEN amount ELSE 0 END) as total_sold,
        SUM(CASE WHEN dest_address = $1 THEN amount ELSE 0 END) as total_bought,
        AVG(amount) as avg_trade_size,
        MAX(timestamp) as last_trade,
        MIN(timestamp) as first_trade
      FROM trades
      WHERE source_address = $1 OR dest_address = $1`,
      [address]
    );

    const stats = statsResult.rows[0];

    // Get recent trades
    const tradesResult = await db.query(
      `SELECT t.*, tk.name as token_name
      FROM trades t
      LEFT JOIN tokens tk ON t.token_id = tk.token_id
      WHERE t.source_address = $1 OR t.dest_address = $1
      ORDER BY t.timestamp DESC
      LIMIT 10`,
      [address]
    );

    // Generate AI analysis
    const prompt = {
      event_type: 'whale.buy' as const,
      data: {
        address,
        trade_count: parseInt(stats.trade_count),
        total_bought: parseInt(stats.total_bought),
        total_sold: parseInt(stats.total_sold),
        avg_trade_size: parseInt(stats.avg_trade_size),
        first_trade: stats.first_trade,
        last_trade: stats.last_trade,
        recent_trades: tradesResult.rows.slice(0, 5),
      },
    };

    const announcement = await generateAnnouncement(prompt);

    res.json({
      success: true,
      data: {
        address,
        stats: {
          trade_count: parseInt(stats.trade_count),
          total_bought: parseInt(stats.total_bought),
          total_sold: parseInt(stats.total_sold),
          net_position: parseInt(stats.total_bought) - parseInt(stats.total_sold),
          avg_trade_size: parseInt(stats.avg_trade_size),
          first_trade: stats.first_trade,
          last_trade: stats.last_trade,
          trading_days: Math.ceil((new Date(stats.last_trade).getTime() - new Date(stats.first_trade).getTime()) / (1000 * 60 * 60 * 24)),
        },
        recent_trades: tradesResult.rows,
        ai_analysis: announcement.discord_message,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Address Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze address',
    });
  }
});

/**
 * GET /api/v1/ai/market-summary
 * AI-generated market summary
 */
router.get('/market-summary', async (req, res) => {
  try {
    // Get market stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT token_id) as total_tokens,
        COUNT(*) as total_trades_24h,
        SUM(amount) as total_volume_24h,
        COUNT(DISTINCT source_address) + COUNT(DISTINCT dest_address) as active_traders
      FROM trades
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    `);

    const stats = statsResult.rows[0];

    // Get top tokens
    const tokensResult = await db.query(`
      SELECT 
        tk.name,
        tk.token_id,
        COUNT(*) as trade_count,
        SUM(t.amount) as volume
      FROM trades t
      JOIN tokens tk ON t.token_id = tk.token_id
      WHERE t.timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY tk.token_id, tk.name
      ORDER BY volume DESC
      LIMIT 5
    `);

    // Generate AI summary
    const announcement = await generateAnnouncement({
      event_type: 'volume.spike',
      data: {
        total_tokens: parseInt(stats.total_tokens),
        total_trades: parseInt(stats.total_trades_24h),
        total_volume: parseInt(stats.total_volume_24h),
        active_traders: parseInt(stats.active_traders),
        top_tokens: tokensResult.rows,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      data: {
        market_stats: {
          total_tokens: parseInt(stats.total_tokens),
          total_trades_24h: parseInt(stats.total_trades_24h),
          total_volume_24h: parseInt(stats.total_volume_24h),
          active_traders: parseInt(stats.active_traders),
        },
        top_tokens: tokensResult.rows,
        ai_summary: {
          discord: announcement.discord_message,
          telegram: announcement.telegram_message,
          twitter: announcement.twitter_post,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Market Summary Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate market summary',
    });
  }
});

export default router;
