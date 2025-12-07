import { QubicRPCService, getRPCService } from '../services/rpc.service';
import { QXTransactionDecoder, getQXDecoder } from '../services/decoder.service';
import { DatabaseService, getDatabase } from '../services/database.service';
import { Trade, DecodedQXTransaction, RawTransaction } from '../types';

/**
 * AggressiveHistoricalSeeder - Finds and stores QX data from historical periods
 * 
 * Strategy:
 * 1. Scans multiple historical ranges where QX had activity
 * 2. Uses exponential backoff to respect rate limits
 * 3. Targets specific epochs known to have QX trading
 * 4. Continues until we have sufficient demo data (100+ trades)
 */
export class AggressiveHistoricalSeeder {
  private rpc: QubicRPCService;
  private decoder: QXTransactionDecoder;
  private db: DatabaseService;
  
  // Historical ranges known to have QX activity (epoch 165-170)
  private historicalRanges = [
    { start: 17500000, end: 17510000, name: 'Epoch 168 early' },
    { start: 17800000, end: 17810000, name: 'Epoch 169 early' },
    { start: 18100000, end: 18110000, name: 'Epoch 170 early' },
    { start: 18400000, end: 18410000, name: 'Epoch 170 mid' },
    { start: 18700000, end: 18710000, name: 'Epoch 170 late' },
  ];
  
  private stats = {
    rangesScanned: 0,
    ticksChecked: 0,
    tradesFound: 0,
    errors: 0,
    rateLimitHits: 0,
  };
  
  constructor() {
    this.rpc = getRPCService();
    this.decoder = getQXDecoder();
    this.db = getDatabase();
  }

  /**
   * Seed database with historical data until we have enough for demo
   */
  async seed(targetTradeCount: number = 100): Promise<void> {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   AGGRESSIVE HISTORICAL SEEDER - DEMO MODE    ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log();
    console.log(`🎯 Target: ${targetTradeCount} trades for hackathon demo`);
    console.log(`📊 Scanning ${this.historicalRanges.length} historical ranges`);
    console.log();

    for (const range of this.historicalRanges) {
      if (this.stats.tradesFound >= targetTradeCount) {
        console.log(`\n✅ Target reached! Found ${this.stats.tradesFound} trades`);
        break;
      }

      console.log(`\n📍 Scanning ${range.name} (ticks ${range.start}-${range.end})...`);
      this.stats.rangesScanned++;
      
      await this.scanRange(range.start, range.end);
      
      // Show progress
      this.showStats();
      
      // Pause between ranges to avoid rate limits
      console.log('⏸️  Pausing 3 seconds before next range...');
      await this.sleep(3000);
    }

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              SEEDING COMPLETE                  ║');
    console.log('╚════════════════════════════════════════════════╝');
    this.showStats();
    
    if (this.stats.tradesFound < 10) {
      console.log('\n⚠️  WARNING: Very few trades found!');
      console.log('💡 QX exchange has minimal historical activity');
      console.log('💡 Consider using mock data for demo purposes');
    } else {
      console.log(`\n✅ Database ready! Found ${this.stats.tradesFound} trades`);
      console.log('🚀 You can now test the frontend:');
      console.log('   cd frontend && npm run dev');
    }
  }

  /**
   * Scan a specific tick range
   */
  private async scanRange(startTick: number, endTick: number): Promise<void> {
    const batchSize = 5; // Small batches to avoid rate limits
    
    for (let tick = startTick; tick <= endTick; tick += batchSize) {
      const batchEnd = Math.min(tick + batchSize - 1, endTick);
      
      // Process batch with retry logic
      await this.processBatchWithRetry(tick, batchEnd);
      
      // Longer pause between batches (respect rate limits)
      await this.sleep(1000);
    }
  }

  /**
   * Process batch with exponential backoff on rate limits
   */
  private async processBatchWithRetry(
    startTick: number, 
    endTick: number, 
    retryCount: number = 0
  ): Promise<void> {
    try {
      for (let tick = startTick; tick <= endTick; tick++) {
        await this.processTick(tick);
        this.stats.ticksChecked++;
        
        // Brief pause between individual ticks
        await this.sleep(200);
      }
    } catch (error: any) {
      // Handle rate limits with exponential backoff
      if (error.response?.status === 429 || error.message?.includes('429')) {
        this.stats.rateLimitHits++;
        
        if (retryCount < 5) {
          const backoffMs = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s, 16s, 32s
          console.log(`⚠️  Rate limit hit! Waiting ${backoffMs}ms before retry ${retryCount + 1}/5...`);
          await this.sleep(backoffMs);
          return this.processBatchWithRetry(startTick, endTick, retryCount + 1);
        } else {
          console.log('❌ Max retries reached for this batch, skipping...');
          this.stats.errors++;
        }
      } else {
        console.error(`Error processing batch ${startTick}-${endTick}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  /**
   * Process individual tick
   */
  private async processTick(tick: number): Promise<void> {
    try {
      // Check if already processed
      if (await this.db.isTickProcessed(tick)) {
        return;
      }

      // Fetch transactions
      const transactions = await this.rpc.getTransactionsByTick(tick);
      
      if (transactions.length === 0) {
        await this.db.markTickAsProcessed(tick, new Date(), 0, 0);
        return;
      }

      // Filter QX transactions
      const qxTransactions = this.filterQXTransactions(transactions);
      
      if (qxTransactions.length === 0) {
        await this.db.markTickAsProcessed(tick, new Date(), transactions.length, 0);
        return;
      }

      // Found QX activity!
      console.log(`   🎯 Tick ${tick}: ${qxTransactions.length} QX transactions`);

      // Convert to trades
      const trades = this.convertToTrades(qxTransactions, tick);
      this.stats.tradesFound += trades.length;

      // Store in database
      await this.db.insertTrades(trades);
      await this.updateHolderBalances(trades);
      await this.db.markTickAsProcessed(tick, new Date(), transactions.length, qxTransactions.length);

      console.log(`   ✅ Stored ${trades.length} trades | Total: ${this.stats.tradesFound}`);

    } catch (error: any) {
      // Silently handle 404s (tick doesn't exist)
      if (error.response?.status === 404 || error.message?.includes('404')) {
        await this.db.markTickAsProcessed(tick, new Date(), 0, 0);
        return;
      }
      throw error; // Re-throw other errors for retry logic
    }
  }

  /**
   * Filter QX transactions from raw transactions
   */
  private filterQXTransactions(transactions: RawTransaction[]): DecodedQXTransaction[] {
    const decoded: DecodedQXTransaction[] = [];

    for (const tx of transactions) {
      try {
        const decodedTx = this.decoder.decode(tx);
        if (decodedTx) {
          decoded.push(decodedTx);
        }
      } catch (error) {
        // Skip invalid transactions
      }
    }

    return decoded;
  }

  /**
   * Convert decoded QX transactions to trades
   */
  private convertToTrades(qxTransactions: DecodedQXTransaction[], tick: number): Trade[] {
    const trades: Trade[] = [];

    for (const tx of qxTransactions) {
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
        timestamp: new Date(),
        tokenIssuer: tx.asset.issuer,
        tokenName: tx.asset.name,
        tradeType: tx.operation,
        trader: tx.sourceId,
        price: (tx.orderDetails?.price || BigInt(0)).toString(),
        amount: (tx.orderDetails?.shares || BigInt(0)).toString(),
        totalValue: (tx.orderDetails?.totalValue || BigInt(0)).toString(),
        pricePerUnit: (() => {
          const price = tx.orderDetails?.price || BigInt(0);
          const shares = tx.orderDetails?.shares || BigInt(0);
          return shares !== BigInt(0) ? Number(price) / Number(shares) : 0;
        })(),
      };

      trades.push(trade);
    }

    return trades;
  }

  /**
   * Update token holder balances
   */
  private async updateHolderBalances(trades: Trade[]): Promise<void> {
    for (const trade of trades) {
      const amount = BigInt(trade.amount);
      const balanceChange = trade.tradeType === 'BUY' ? amount : -amount;
      const bought = trade.tradeType === 'BUY' ? amount : BigInt(0);
      const sold = trade.tradeType === 'SELL' ? amount : BigInt(0);
      const buyCount = trade.tradeType === 'BUY' ? 1 : 0;
      const sellCount = trade.tradeType === 'SELL' ? 1 : 0;

      await this.db.upsertHolder({
        address: trade.trader,
        tokenIssuer: trade.tokenIssuer,
        tokenName: trade.tokenName,
        balance: balanceChange,
        percentage: 0,
        firstSeenTick: trade.tick,
        lastActivityTick: trade.tick,
        totalBought: bought,
        totalSold: sold,
        buyCount: buyCount,
        sellCount: sellCount,
        isWhale: false,
      });
    }
  }

  /**
   * Show statistics
   */
  private showStats(): void {
    const elapsed = Math.round((Date.now() - this.stats.rangesScanned * 1000) / 1000);
    
    console.log('\n📊 Statistics:');
    console.log(`   Ranges scanned: ${this.stats.rangesScanned}/${this.historicalRanges.length}`);
    console.log(`   Ticks checked: ${this.stats.ticksChecked}`);
    console.log(`   Trades found: ${this.stats.tradesFound}`);
    console.log(`   Rate limit hits: ${this.stats.rateLimitHits}`);
    console.log(`   Errors: ${this.stats.errors}`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton
let seederInstance: AggressiveHistoricalSeeder | null = null;

export function getAggressiveSeeder(): AggressiveHistoricalSeeder {
  if (!seederInstance) {
    seederInstance = new AggressiveHistoricalSeeder();
  }
  return seederInstance;
}
