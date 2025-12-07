import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config';
import {
  Trade,
  Holder,
  BalanceSnapshot,
  DBTrade,
  DBHolder,
  DBTokenMetrics,
} from '../types';

/**
 * DatabaseService - Handles all database operations
 * Uses PostgreSQL with connection pooling for performance
 */
export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: 20, // Maximum number of clients in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Get a client from the pool for transaction operations
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute a query
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    return await this.pool.query(text, params);
  }

  // ============================================================================
  // TICK MANAGEMENT
  // ============================================================================

  async getLastProcessedTick(): Promise<number> {
    const result = await this.query(
      'SELECT MAX(tick) as last_tick FROM indexed_ticks'
    );
    return result.rows[0]?.last_tick || 0;
  }

  async markTickAsProcessed(
    tick: number,
    timestamp: Date,
    transactionsCount: number,
    qxTransactionsCount: number
  ): Promise<void> {
    await this.query(
      `INSERT INTO indexed_ticks (tick, timestamp, transactions_count, qx_transactions_count)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tick) DO UPDATE SET
         transactions_count = $3,
         qx_transactions_count = $4,
         processed_at = CURRENT_TIMESTAMP`,
      [tick, timestamp, transactionsCount, qxTransactionsCount]
    );
  }

  async isTickProcessed(tick: number): Promise<boolean> {
    const result = await this.query(
      'SELECT 1 FROM indexed_ticks WHERE tick = $1',
      [tick]
    );
    return result.rows.length > 0;
  }

  // ============================================================================
  // TRADE OPERATIONS
  // ============================================================================

  async insertTrade(trade: Trade): Promise<void> {
    await this.query(
      `INSERT INTO trades (
        tx_id, tick, timestamp, token_issuer, token_name,
        trade_type, trader, price, amount, total_value, price_per_unit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (tx_id) DO NOTHING`,
      [
        trade.txId,
        trade.tick,
        trade.timestamp,
        trade.tokenIssuer,
        trade.tokenName,
        trade.tradeType,
        trade.trader,
        trade.price.toString(),
        trade.amount.toString(),
        trade.totalValue.toString(),
        trade.pricePerUnit,
      ]
    );
  }

  async insertTrades(trades: Trade[]): Promise<void> {
    if (trades.length === 0) return;

    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      
      for (const trade of trades) {
        await client.query(
          `INSERT INTO trades (
            tx_id, tick, timestamp, token_issuer, token_name,
            trade_type, trader, price, amount, total_value, price_per_unit
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (tx_id) DO NOTHING`,
          [
            trade.txId,
            trade.tick,
            trade.timestamp,
            trade.tokenIssuer,
            trade.tokenName,
            trade.tradeType,
            trade.trader,
            trade.price.toString(),
            trade.amount.toString(),
            trade.totalValue.toString(),
            trade.pricePerUnit,
          ]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getTradesByToken(
    tokenIssuer: string,
    tokenName: string,
    limit: number = 100
  ): Promise<Trade[]> {
    const result = await this.query(
      `SELECT * FROM trades 
       WHERE token_issuer = $1 AND token_name = $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      [tokenIssuer, tokenName, limit]
    );

    return result.rows.map(this.dbTradeToTrade);
  }

  async getTradesByAddress(address: string, limit: number = 100): Promise<Trade[]> {
    const result = await this.query(
      `SELECT * FROM trades 
       WHERE trader = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [address, limit]
    );

    return result.rows.map(this.dbTradeToTrade);
  }

  // ============================================================================
  // HOLDER OPERATIONS
  // ============================================================================

  async upsertHolder(holder: Holder): Promise<void> {
    await this.query(
      `INSERT INTO holders (
        address, token_issuer, token_name, balance, percentage,
        first_seen_tick, last_activity_tick, total_bought, total_sold,
        buy_count, sell_count, is_whale
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (address, token_issuer, token_name) DO UPDATE SET
        balance = holders.balance + $4,
        percentage = $5,
        last_activity_tick = $7,
        total_bought = holders.total_bought + $8,
        total_sold = holders.total_sold + $9,
        buy_count = holders.buy_count + $10,
        sell_count = holders.sell_count + $11,
        is_whale = $12`,
      [
        holder.address,
        holder.tokenIssuer,
        holder.tokenName,
        holder.balance.toString(),
        holder.percentage,
        holder.firstSeenTick,
        holder.lastActivityTick,
        holder.totalBought.toString(),
        holder.totalSold.toString(),
        holder.buyCount,
        holder.sellCount,
        holder.isWhale,
      ]
    );
  }

  async getHoldersByToken(
    tokenIssuer: string,
    tokenName: string,
    limit?: number
  ): Promise<Holder[]> {
    const query = limit
      ? `SELECT * FROM holders 
         WHERE token_issuer = $1 AND token_name = $2
         ORDER BY balance DESC
         LIMIT $3`
      : `SELECT * FROM holders 
         WHERE token_issuer = $1 AND token_name = $2
         ORDER BY balance DESC`;

    const params = limit
      ? [tokenIssuer, tokenName, limit]
      : [tokenIssuer, tokenName];

    const result = await this.query(query, params);
    return result.rows.map(this.dbHolderToHolder);
  }

  async getTopHolders(
    tokenIssuer: string,
    tokenName: string,
    limit: number = 100
  ): Promise<Holder[]> {
    return this.getHoldersByToken(tokenIssuer, tokenName, limit);
  }

  async getWhalesByToken(
    tokenIssuer: string,
    tokenName: string
  ): Promise<Holder[]> {
    const result = await this.query(
      `SELECT * FROM holders 
       WHERE token_issuer = $1 AND token_name = $2 AND is_whale = true
       ORDER BY balance DESC`,
      [tokenIssuer, tokenName]
    );

    return result.rows.map(this.dbHolderToHolder);
  }

  async getHolderCount(tokenIssuer: string, tokenName: string): Promise<number> {
    const result = await this.query(
      `SELECT COUNT(*) as count FROM holders 
       WHERE token_issuer = $1 AND token_name = $2 AND balance > 0`,
      [tokenIssuer, tokenName]
    );

    return parseInt(result.rows[0].count);
  }

  // ============================================================================
  // BALANCE SNAPSHOT OPERATIONS
  // ============================================================================

  async insertBalanceSnapshot(snapshot: BalanceSnapshot): Promise<void> {
    await this.query(
      `INSERT INTO balance_snapshots (
        address, token_issuer, token_name, balance, tick, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        snapshot.address,
        snapshot.tokenIssuer,
        snapshot.tokenName,
        snapshot.balance.toString(),
        snapshot.tick,
        snapshot.timestamp,
      ]
    );
  }

  async getBalanceHistory(
    address: string,
    tokenIssuer: string,
    tokenName: string,
    fromTimestamp?: Date,
    toTimestamp?: Date
  ): Promise<BalanceSnapshot[]> {
    let query = `SELECT * FROM balance_snapshots 
                 WHERE address = $1 AND token_issuer = $2 AND token_name = $3`;
    const params: any[] = [address, tokenIssuer, tokenName];

    if (fromTimestamp) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(fromTimestamp);
    }

    if (toTimestamp) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(toTimestamp);
    }

    query += ` ORDER BY timestamp ASC`;

    const result = await this.query(query, params);
    
    return result.rows.map((row) => ({
      id: row.id,
      address: row.address,
      tokenIssuer: row.token_issuer,
      tokenName: row.token_name,
      balance: BigInt(row.balance),
      tick: row.tick,
      timestamp: row.timestamp,
    }));
  }

  // ============================================================================
  // VOLUME & METRICS OPERATIONS
  // ============================================================================

  async getVolume24h(tokenIssuer: string, tokenName: string): Promise<bigint> {
    const result = await this.query(
      `SELECT COALESCE(SUM(total_value), 0) as volume
       FROM trades
       WHERE token_issuer = $1 AND token_name = $2
         AND timestamp >= NOW() - INTERVAL '24 hours'`,
      [tokenIssuer, tokenName]
    );

    return BigInt(result.rows[0].volume);
  }

  async getTradeCount24h(
    tokenIssuer: string,
    tokenName: string
  ): Promise<number> {
    const result = await this.query(
      `SELECT COUNT(*) as count
       FROM trades
       WHERE token_issuer = $1 AND token_name = $2
         AND timestamp >= NOW() - INTERVAL '24 hours'`,
      [tokenIssuer, tokenName]
    );

    return parseInt(result.rows[0].count);
  }

  async getUniqueTraders24h(
    tokenIssuer: string,
    tokenName: string
  ): Promise<number> {
    const result = await this.query(
      `SELECT COUNT(DISTINCT trader) as count
       FROM trades
       WHERE token_issuer = $1 AND token_name = $2
         AND timestamp >= NOW() - INTERVAL '24 hours'`,
      [tokenIssuer, tokenName]
    );

    return parseInt(result.rows[0].count);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private dbTradeToTrade(row: DBTrade): Trade {
    return {
      id: row.id,
      txId: row.tx_id,
      tick: row.tick,
      timestamp: row.timestamp,
      tokenIssuer: row.token_issuer,
      tokenName: row.token_name,
      tradeType: row.trade_type,
      trader: row.trader,
      price: row.price.toString(),
      amount: row.amount.toString(),
      totalValue: row.total_value.toString(),
      pricePerUnit: row.price_per_unit,
    };
  }

  private dbHolderToHolder(row: DBHolder): Holder {
    return {
      id: row.id,
      address: row.address,
      tokenIssuer: row.token_issuer,
      tokenName: row.token_name,
      balance: BigInt(row.balance),
      percentage: row.percentage,
      firstSeenTick: row.first_seen_tick,
      lastActivityTick: row.last_activity_tick,
      totalBought: BigInt(row.total_bought),
      totalSold: BigInt(row.total_sold),
      isWhale: row.is_whale,
      buyCount: row.buy_count,
      sellCount: row.sell_count,
    };
  }

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
}

// Export pool directly for simple queries
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
