import { QubicRPCService, getRPCService } from '../services/rpc.service';
import { QXTransactionDecoder, getQXDecoder } from '../services/decoder.service';
import { DatabaseService, getDatabase } from '../services/database.service';
import { Trade, DecodedQXTransaction, RawTransaction } from '../types';
import { config } from '../config';

/**
 * SmartIndexer - Optimized indexer that focuses on ticks with QX activity
 * 
 * Key features:
 * - Scans rapidly through empty ticks
 * - Deep indexes only ticks with QX transactions
 * - Runs continuously in background
 * - Auto-updates as new blocks arrive
 * - Shows progress stats
 */
export class SmartIndexer {
  private rpc: QubicRPCService;
  private decoder: QXTransactionDecoder;
  private db: DatabaseService;
  
  private isRunning: boolean = false;
  private currentNetworkTick: number = 0;
  private lastProcessedTick: number = 0;
  
  // Stats
  private stats = {
    ticksScanned: 0,
    ticksWithQX: 0,
    tradesFound: 0,
    startTime: Date.now(),
  };
  
  constructor() {
    this.rpc = getRPCService();
    this.decoder = getQXDecoder();
    this.db = getDatabase();
  }

  /**
   * Start smart indexing
   */
  async start(startFromTick?: number): Promise<void> {
    if (this.isRunning) {
      console.log('[SmartIndexer] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[SmartIndexer] 🚀 Starting optimized indexer...');

    // Determine starting point
    if (startFromTick) {
      this.lastProcessedTick = startFromTick;
    } else {
      const lastProcessed = await this.db.getLastProcessedTick();
      if (lastProcessed === 0) {
        // No previous progress - start from current tick minus 1000 (last ~15 minutes)
        const currentTick = await this.rpc.getCurrentTick();
        this.lastProcessedTick = Math.max(0, currentTick.tick - 1000);
        console.log(`[SmartIndexer] 📍 No previous progress found, starting from recent tick`);
      } else {
        this.lastProcessedTick = lastProcessed;
      }
    }

    console.log(`[SmartIndexer] 📍 Starting from tick ${this.lastProcessedTick}`);
    this.stats.startTime = Date.now();

    // Main loop
    while (this.isRunning) {
      try {
        await this.scanAndIndex();
        
        // Show stats every 100 ticks
        if (this.stats.ticksScanned % 100 === 0 && this.stats.ticksScanned > 0) {
          this.showStats();
        }
        
        // Brief pause
        await this.sleep(50);
      } catch (error) {
        console.error('[SmartIndexer] Error:', error);
        await this.sleep(2000);
      }
    }
  }

  /**
   * Stop indexer
   */
  stop(): void {
    console.log('[SmartIndexer] 🛑 Stopping...');
    this.isRunning = false;
    this.showStats();
  }

  /**
   * Scan and index next batch
   */
  private async scanAndIndex(): Promise<void> {
    // Get current network tick
    const tickInfo = await this.rpc.getCurrentTick();
    this.currentNetworkTick = tickInfo.tick;

    const ticksBehind = this.currentNetworkTick - this.lastProcessedTick;

    if (ticksBehind <= 0) {
      // Fully synced, wait for new blocks
      if (this.stats.ticksScanned % 50 === 0) {
        console.log(`[SmartIndexer] ✅ Synced at tick ${this.currentNetworkTick} | Waiting for new blocks...`);
      }
      await this.sleep(config.indexer.pollIntervalMs);
      return;
    }

    // Process batch (limit to avoid memory issues)
    const batchSize = Math.min(config.indexer.batchSize, ticksBehind, 50);
    const startTick = this.lastProcessedTick + 1;
    const endTick = this.lastProcessedTick + batchSize;

    // Quick scan mode: check multiple ticks in parallel
    const ticksToCheck = [];
    for (let tick = startTick; tick <= endTick; tick++) {
      ticksToCheck.push(tick);
    }

    // Process ticks
    await this.processBatch(ticksToCheck);
    
    this.lastProcessedTick = endTick;
  }

  /**
   * Process batch of ticks efficiently
   */
  private async processBatch(ticks: number[]): Promise<void> {
    // Process sequentially but with fast skip logic
    for (const tick of ticks) {
      // Check if already processed
      if (await this.db.isTickProcessed(tick)) {
        continue;
      }

      this.stats.ticksScanned++;

      try {
        // Fetch transactions
        const transactions = await this.rpc.getTransactionsByTick(tick);
        
        if (transactions.length === 0) {
          // Empty tick - mark and skip quickly
          await this.db.markTickAsProcessed(tick, new Date(), 0, 0);
          continue;
        }

        // Filter QX transactions
        const qxTransactions = this.filterQXTransactions(transactions);
        
        if (qxTransactions.length === 0) {
          // No QX activity - mark and skip
          await this.db.markTickAsProcessed(tick, new Date(), transactions.length, 0);
          continue;
        }

        // 🎯 Found QX activity!
        this.stats.ticksWithQX++;
        console.log(`[SmartIndexer] 🎯 Tick ${tick}: ${qxTransactions.length} QX transactions`);

        // Convert to trades
        const trades = this.convertToTrades(qxTransactions, tick);
        this.stats.tradesFound += trades.length;

        // Store in database
        await this.db.insertTrades(trades);
        
        // Update holder balances
        await this.updateHolderBalances(trades);
        
        // Mark as processed
        await this.db.markTickAsProcessed(
          tick,
          new Date(),
          transactions.length,
          qxTransactions.length
        );

        console.log(`[SmartIndexer] ✅ Tick ${tick}: Stored ${trades.length} trades`);

      } catch (error: any) {
        // Handle 404 (tick doesn't exist yet)
        if (error.response?.status === 404 || error.message?.includes('404')) {
          await this.db.markTickAsProcessed(tick, new Date(), 0, 0);
          continue;
        }
        
        console.error(`[SmartIndexer] Error processing tick ${tick}:`, error);
      }
    }
  }

  /**
   * Filter QX transactions
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
  private convertToTrades(transactions: DecodedQXTransaction[], tick: number): Trade[] {
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

      const price = tx.orderDetails?.price ?? 0n;
      const shares = tx.orderDetails?.shares ?? 0n;
      const totalValue = tx.orderDetails?.totalValue ?? 0n;

      const trade: Trade = {
        txId: tx.txId,
        tick: tick,
        timestamp: new Date(),
        tokenIssuer: tx.asset.issuer,
        tokenName: tx.asset.name,
        tradeType: tx.operation,
        trader: tx.sourceId,
        price: price.toString(),
        amount: shares.toString(),
        totalValue: totalValue.toString(),
        pricePerUnit: Number(price),
      };

      trades.push(trade);
    }

    return trades;
  }

  /**
   * Update holder balances based on trades
   * Uses PostgreSQL UPSERT to efficiently handle new and existing holders
   */
  private async updateHolderBalances(trades: Trade[]): Promise<void> {
    // Simply insert/update holders - let DB handle aggregation via UPSERT
    for (const trade of trades) {
      const amount = BigInt(trade.amount);
      const balanceChange = trade.tradeType === 'BUY' ? amount : -amount;
      const bought = trade.tradeType === 'BUY' ? amount : 0n;
      const sold = trade.tradeType === 'SELL' ? amount : 0n;
      const buyCount = trade.tradeType === 'BUY' ? 1 : 0;
      const sellCount = trade.tradeType === 'SELL' ? 1 : 0;

      // Upsert holder - DB will merge with existing data
      await this.db.upsertHolder({
        address: trade.trader,
        tokenIssuer: trade.tokenIssuer,
        tokenName: trade.tokenName,
        balance: balanceChange, // DB will add to existing balance
        percentage: 0, // Calculated later in analytics
        firstSeenTick: trade.tick,
        lastActivityTick: trade.tick,
        totalBought: bought,
        totalSold: sold,
        buyCount: buyCount,
        sellCount: sellCount,
        isWhale: false, // Calculated later in analytics
      });
    }
  }

  /**
   * Show statistics
   */
  private showStats(): void {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const ticksPerSec = this.stats.ticksScanned / runtime;
    const hitRate = this.stats.ticksScanned > 0 
      ? ((this.stats.ticksWithQX / this.stats.ticksScanned) * 100).toFixed(2)
      : '0.00';

    console.log('─'.repeat(80));
    console.log(`[SmartIndexer] 📊 STATS`);
    console.log(`  Current Tick: ${this.currentNetworkTick} | Last Processed: ${this.lastProcessedTick}`);
    console.log(`  Ticks Scanned: ${this.stats.ticksScanned} (${ticksPerSec.toFixed(1)}/s)`);
    console.log(`  Ticks with QX: ${this.stats.ticksWithQX} (${hitRate}% hit rate)`);
    console.log(`  Trades Found: ${this.stats.tradesFound}`);
    console.log(`  Runtime: ${runtime.toFixed(0)}s`);
    console.log('─'.repeat(80));
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
