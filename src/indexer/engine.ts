import { QubicRPCService, getRPCService } from '../services/rpc.service';
import { QXTransactionDecoder, getQXDecoder } from '../services/decoder.service';
import { DatabaseService, getDatabase } from '../services/database.service';
import { Trade, DecodedQXTransaction, RawTransaction } from '../types';
import { config } from '../config';

/**
 * IndexerEngine - Core indexing system for QX trades
 * 
 * This engine:
 * 1. Polls Qubic network for new ticks
 * 2. Fetches all transactions per tick
 * 3. Filters QX contract transactions
 * 4. Decodes BUY/SELL operations
 * 5. Stores in database for analytics
 * 
 * Strategy:
 * - Processes ticks sequentially to avoid gaps
 * - Batches transactions for performance
 * - Handles retries on failures
 * - Updates holder balances in real-time
 */
export class IndexerEngine {
  private rpc: QubicRPCService;
  private decoder: QXTransactionDecoder;
  private db: DatabaseService;
  
  private isRunning: boolean = false;
  private currentTick: number = 0;
  private lastProcessedTick: number = 0;
  
  constructor() {
    this.rpc = getRPCService();
    this.decoder = getQXDecoder();
    this.db = getDatabase();
  }

  /**
   * Start the indexer
   * Will run continuously until stopped
   */
  async start(startFromTick?: number): Promise<void> {
    if (this.isRunning) {
      console.log('[Indexer] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Indexer] Starting...');

    // Determine starting point
    if (startFromTick) {
      this.lastProcessedTick = startFromTick;
    } else {
      this.lastProcessedTick = await this.db.getLastProcessedTick();
    }

    console.log(`[Indexer] Resuming from tick ${this.lastProcessedTick}`);

    // Main indexing loop
    while (this.isRunning) {
      try {
        await this.indexNextBatch();
        
        // Wait before next poll
        await this.sleep(config.indexer.pollIntervalMs);
      } catch (error) {
        console.error('[Indexer] Error in main loop:', error);
        await this.sleep(5000); // Wait longer on error
      }
    }
  }

  /**
   * Stop the indexer
   */
  stop(): void {
    console.log('[Indexer] Stopping...');
    this.isRunning = false;
  }

  /**
   * Index a batch of ticks
   */
  private async indexNextBatch(): Promise<void> {
    // Get current network tick
    const tickInfo = await this.rpc.getCurrentTick();
    this.currentTick = tickInfo.tick;

    // Calculate how many ticks behind we are
    const ticksBehind = this.currentTick - this.lastProcessedTick;
    const ticksToProcess = Math.min(ticksBehind, config.indexer.batchSize);

    if (ticksToProcess <= 0) {
      // Up to date, just show progress periodically
      if (this.lastProcessedTick % 100 === 0) {
        console.log(`[Indexer] 🔄 Synced at tick ${this.currentTick} (checking for new ticks...)`);
      }
      return;
    }

    // Show batch info only if processing significant amount
    if (ticksToProcess > 5) {
      console.log(
        `[Indexer] 📦 Batch: ${ticksToProcess} ticks (${this.lastProcessedTick + 1} → ${
          this.lastProcessedTick + ticksToProcess
        }) | Behind: ${ticksBehind}`
      );
    }

    // Process each tick in the batch
    for (let i = 1; i <= ticksToProcess; i++) {
      const tick = this.lastProcessedTick + i;
      
      try {
        await this.indexTick(tick);
        this.lastProcessedTick = tick;
      } catch (error) {
        console.error(`[Indexer] Failed to index tick ${tick}:`, error);
        
        // Retry logic
        let retries = 0;
        while (retries < config.indexer.maxRetries) {
          retries++;
          console.log(`[Indexer] Retry ${retries}/${config.indexer.maxRetries} for tick ${tick}`);
          
          try {
            await this.sleep(2000 * retries); // Exponential backoff
            await this.indexTick(tick);
            this.lastProcessedTick = tick;
            break;
          } catch (retryError) {
            if (retries >= config.indexer.maxRetries) {
              console.error(`[Indexer] Failed after ${retries} retries for tick ${tick}`);
              throw retryError;
            }
          }
        }
      }
    }
  }

  /**
   * Index a single tick
   */
  private async indexTick(tick: number): Promise<void> {
    // Check if already processed
    if (await this.db.isTickProcessed(tick)) {
      return; // Skip silently
    }

    try {
      // Fetch all transactions for this tick
      const transactions = await this.rpc.getTransactionsByTick(tick);
      
      if (transactions.length === 0) {
        // Mark as processed even if no transactions (skip silently)
        await this.db.markTickAsProcessed(tick, new Date(), 0, 0);
        return;
      }

      // Filter and decode QX transactions
      const qxTransactions = this.filterQXTransactions(transactions);
      
      if (qxTransactions.length === 0) {
        // Skip ticks without QX activity if configured
        if (config.indexer.skipEmptyTicks) {
          await this.db.markTickAsProcessed(tick, new Date(), transactions.length, 0);
          return; // Skip silently
        }
      }

      // Only log when we find QX transactions
      if (qxTransactions.length > 0) {
        console.log(`[Indexer] 🎯 Tick ${tick}: ${qxTransactions.length} QX transactions found!`);
        
        // Convert to Trade records
        const trades = this.convertToTrades(qxTransactions, tick);
        
        // Store in database
        await this.db.insertTrades(trades);
        
        // Update holder balances
        await this.updateHolderBalances(trades);
        
        console.log(`[Indexer] ✅ Tick ${tick}: Stored ${trades.length} trades`);
      }

      // Mark tick as processed
      await this.db.markTickAsProcessed(
        tick,
        new Date(),
        transactions.length,
        qxTransactions.length
      );
    } catch (error: any) {
      // Handle 404 errors (tick doesn't exist yet or no data)
      if (error.response?.status === 404 || error.message?.includes('404')) {
        await this.db.markTickAsProcessed(tick, new Date(), 0, 0);
        return; // Skip silently
      }
      throw error;
    }
  }

  /**
   * Filter transactions to only QX contract interactions
   */
  private filterQXTransactions(transactions: RawTransaction[]): DecodedQXTransaction[] {
    const decoded: DecodedQXTransaction[] = [];

    for (const tx of transactions) {
      const decodedTx = this.decoder.decode(tx);
      if (decodedTx) {
        decoded.push(decodedTx);
      }
    }

    return decoded;
  }

  /**
   * Convert decoded transactions to Trade records
   */
  private convertToTrades(
    transactions: DecodedQXTransaction[],
    tick: number
  ): Trade[] {
    const trades: Trade[] = [];

    for (const tx of transactions) {
      // Only process BUY and SELL operations
      if (tx.operation !== 'BUY' && tx.operation !== 'SELL') {
        continue;
      }

      // Skip if missing essential data
      if (!tx.asset.issuer || !tx.asset.name) {
        continue;
      }

      const trade: Trade = {
        txId: tx.txId,
        tick: tick,
        timestamp: new Date(), // Would ideally convert tick to actual timestamp
        tokenIssuer: tx.asset.issuer,
        tokenName: tx.asset.name,
        tradeType: tx.operation,
        trader: tx.sourceId,
        price: tx.orderDetails?.price || BigInt(0),
        amount: tx.orderDetails?.shares || BigInt(0),
        totalValue: tx.orderDetails?.totalValue || tx.amount,
        pricePerUnit: tx.orderDetails
          ? Number(tx.orderDetails.price) / Number(tx.orderDetails.shares)
          : 0,
      };

      trades.push(trade);
    }

    return trades;
  }

  /**
   * Update holder balances based on new trades
   */
  private async updateHolderBalances(trades: Trade[]): Promise<void> {
    // Group trades by (address, token)
    const holderMap = new Map<string, { 
      address: string;
      tokenIssuer: string;
      tokenName: string;
      bought: bigint;
      sold: bigint;
      buyCount: number;
      sellCount: number;
      lastTick: number;
    }>();

    for (const trade of trades) {
      const key = `${trade.trader}-${trade.tokenIssuer}-${trade.tokenName}`;
      
      if (!holderMap.has(key)) {
        holderMap.set(key, {
          address: trade.trader,
          tokenIssuer: trade.tokenIssuer,
          tokenName: trade.tokenName,
          bought: BigInt(0),
          sold: BigInt(0),
          buyCount: 0,
          sellCount: 0,
          lastTick: trade.tick,
        });
      }

      const holder = holderMap.get(key)!;

      if (trade.tradeType === 'BUY') {
        holder.bought += trade.amount;
        holder.buyCount++;
      } else {
        holder.sold += trade.amount;
        holder.sellCount++;
      }

      holder.lastTick = Math.max(holder.lastTick, trade.tick);
    }

    // Update each holder in database
    for (const holder of holderMap.values()) {
      // Get existing holder data
      const existing = await this.getOrCreateHolder(
        holder.address,
        holder.tokenIssuer,
        holder.tokenName,
        holder.lastTick
      );

      // Update balances
      const newBalance = existing.balance + holder.bought - holder.sold;

      await this.db.upsertHolder({
        address: holder.address,
        tokenIssuer: holder.tokenIssuer,
        tokenName: holder.tokenName,
        balance: newBalance,
        percentage: 0, // Will be calculated in analytics
        firstSeenTick: existing.firstSeenTick,
        lastActivityTick: holder.lastTick,
        totalBought: existing.totalBought + holder.bought,
        totalSold: existing.totalSold + holder.sold,
        buyCount: existing.buyCount + holder.buyCount,
        sellCount: existing.sellCount + holder.sellCount,
        isWhale: false, // Will be calculated in analytics
      });
    }
  }

  /**
   * Get existing holder or create new one
   */
  private async getOrCreateHolder(
    address: string,
    tokenIssuer: string,
    tokenName: string,
    firstSeenTick: number
  ): Promise<{
    balance: bigint;
    firstSeenTick: number;
    totalBought: bigint;
    totalSold: bigint;
    buyCount: number;
    sellCount: number;
  }> {
    const holders = await this.db.getHoldersByToken(tokenIssuer, tokenName);
    const existing = holders.find((h) => h.address === address);

    if (existing) {
      return {
        balance: existing.balance,
        firstSeenTick: existing.firstSeenTick,
        totalBought: existing.totalBought,
        totalSold: existing.totalSold,
        buyCount: existing.buyCount,
        sellCount: existing.sellCount,
      };
    }

    return {
      balance: BigInt(0),
      firstSeenTick,
      totalBought: BigInt(0),
      totalSold: BigInt(0),
      buyCount: 0,
      sellCount: 0,
    };
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current indexer status
   */
  getStatus(): {
    isRunning: boolean;
    currentTick: number;
    lastProcessedTick: number;
    ticksBehind: number;
  } {
    return {
      isRunning: this.isRunning,
      currentTick: this.currentTick,
      lastProcessedTick: this.lastProcessedTick,
      ticksBehind: this.currentTick - this.lastProcessedTick,
    };
  }
}
