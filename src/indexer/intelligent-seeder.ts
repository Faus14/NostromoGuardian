import { findRecentQXActivity } from './qx-activity-scanner';
import { DatabaseService, getDatabase } from '../services/database.service';
import { QubicRPCService, getRPCService } from '../services/rpc.service';
import { QXTransactionDecoder, getQXDecoder } from '../services/decoder.service';
import { Trade, DecodedQXTransaction, RawTransaction } from '../types';

/**
 * Intelligent Seeder - Uses activity scanner to find and index real QX data
 * 
 * This is NOT mock data. This scanner:
 * 1. Finds real ticks with QX contract transactions
 * 2. Fetches and decodes those transactions
 * 3. Stores them in database
 */
export class IntelligentSeeder {
  private db: DatabaseService;
  private rpc: QubicRPCService;
  private decoder: QXTransactionDecoder;
  
  constructor() {
    this.db = getDatabase();
    this.rpc = getRPCService();
    this.decoder = getQXDecoder();
  }

  async seed(): Promise<void> {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║      INTELLIGENT SEEDER - REAL DATA ONLY         ║');
    console.log('║          Finding actual QX transactions          ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // Step 1: Find ticks with QX activity
    const qxTicks = await findRecentQXActivity();
    
    if (qxTicks.length === 0) {
      console.log('\n❌ No QX activity found in searched ranges');
      console.log('💡 Options:');
      console.log('   1. QX exchange may be inactive currently');
      console.log('   2. Try searching older epochs (2024 data)');
      console.log('   3. Wait for new QX transactions');
      return;
    }

    // Step 2: Process each tick with QX activity
    console.log(`\n🔧 Processing ${qxTicks.length} ticks with QX activity...\n`);
    
    let totalTrades = 0;
    let processed = 0;
    
    for (const tick of qxTicks) {
      try {
        const trades = await this.processTick(tick);
        totalTrades += trades;
        processed++;
        
        console.log(`   ✓ Tick ${tick}: ${trades} trades stored (${processed}/${qxTicks.length})`);
        
        // Respectful delay
        await this.sleep(500);
        
      } catch (error: any) {
        console.error(`   ✗ Tick ${tick}: ${error.message}`);
      }
    }

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║               SEEDING COMPLETE                   ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`\n📊 Results:`);
    console.log(`   Ticks processed: ${processed}/${qxTicks.length}`);
    console.log(`   Total trades: ${totalTrades}`);
    
    if (totalTrades > 0) {
      console.log('\n✅ Database populated with REAL QX data!');
      console.log('\n🚀 Next steps:');
      console.log('   1. Start API: npm run api');
      console.log('   2. Start frontend: cd frontend && npm run dev');
      console.log('   3. Open: http://localhost:5173');
    } else {
      console.log('\n⚠️  No trades extracted from found ticks');
      console.log('💡 Transactions may not be QX trades (transfers, etc)');
    }
  }

  /**
   * Process a single tick
   */
  private async processTick(tick: number): Promise<number> {
    // Check if already processed
    if (await this.db.isTickProcessed(tick)) {
      return 0;
    }

    // Fetch transactions
    const transactions = await this.rpc.getTransactionsByTick(tick);
    
    if (transactions.length === 0) {
      await this.db.markTickAsProcessed(tick, new Date(), 0, 0);
      return 0;
    }

    // Filter QX transactions
    const qxTransactions = this.filterQXTransactions(transactions);
    
    if (qxTransactions.length === 0) {
      await this.db.markTickAsProcessed(tick, new Date(), transactions.length, 0);
      return 0;
    }

    // Convert to trades
    const trades = this.convertToTrades(qxTransactions, tick);
    
    if (trades.length === 0) {
      await this.db.markTickAsProcessed(tick, new Date(), transactions.length, qxTransactions.length);
      return 0;
    }

    // Store in database
    await this.db.insertTrades(trades);
    await this.updateHolderBalances(trades);
    await this.db.markTickAsProcessed(tick, new Date(), transactions.length, qxTransactions.length);

    return trades.length;
  }

  /**
   * Filter QX transactions
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
