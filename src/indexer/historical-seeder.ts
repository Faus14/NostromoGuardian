import { QubicRPCService, getRPCService } from '../services/rpc.service';
import { QXTransactionDecoder, getQXDecoder } from '../services/decoder.service';
import { DatabaseService, getDatabase } from '../services/database.service';
import { Trade, DecodedQXTransaction, RawTransaction } from '../types';
import { config } from '../config';
import axios from 'axios';

/**
 * Historical Seeder - Seed database with known QX transactions
 * 
 * This script searches for transactions involving the QX contract
 * and populates the database with historical trade data.
 */
export class HistoricalSeeder {
  private rpc: QubicRPCService;
  private decoder: QXTransactionDecoder;
  private db: DatabaseService;
  
  private stats = {
    ticksChecked: 0,
    tradesFound: 0,
    startTime: Date.now(),
  };
  
  constructor() {
    this.rpc = getRPCService();
    this.decoder = getQXDecoder();
    this.db = getDatabase();
  }

  /**
   * Seed from a known range where QX has activity
   */
  async seedFromRange(startTick: number, endTick: number): Promise<void> {
    console.log('='.repeat(80));
    console.log('📦 HISTORICAL SEEDER - Populating database with QX trades');
    console.log('='.repeat(80));
    console.log(`📍 Range: ${startTick} → ${endTick}`);
    console.log(`🎯 Looking for QX contract transactions`);
    console.log('='.repeat(80));
    console.log('');

    this.stats.startTime = Date.now();

    // Process ticks in batches
    const batchSize = 10;
    for (let tick = startTick; tick <= endTick; tick += batchSize) {
      const batchEnd = Math.min(tick + batchSize - 1, endTick);
      await this.processBatch(tick, batchEnd);
      
      // Show progress
      if (this.stats.ticksChecked % 50 === 0) {
        this.showProgress();
      }
    }

    console.log('\n');
    this.showFinalStats();
  }

  /**
   * Seed from known QX token issuers (they likely have trades)
   */
  async seedFromKnownTokens(): Promise<void> {
    console.log('='.repeat(80));
    console.log('📦 SEEDING FROM KNOWN QX TOKENS');
    console.log('='.repeat(80));
    
    // Known QX tokens with activity
    const knownTokens = [
      {
        issuer: 'CFBMEMZOIDEXDYPVMHGCBQDTTMPRJHOXMZRFVWXYZJWYQVNLODVFAAFV',
        name: 'QX',
        description: 'QX Token (main exchange token)'
      },
      {
        issuer: 'QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB',
        name: 'CFB',
        description: 'CFB Token'
      },
      {
        issuer: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB',
        name: 'QUTIL',
        description: 'Qubic Utility Token'
      }
    ];

    console.log(`\n📋 Found ${knownTokens.length} known tokens:`);
    knownTokens.forEach((token, i) => {
      console.log(`  ${i + 1}. ${token.name} - ${token.description}`);
      console.log(`     Issuer: ${token.issuer}`);
    });

    console.log('\n🔍 Strategy: Search for transactions involving these issuers');
    console.log('   in recent ticks (last 1000 ticks)\n');

    // Get current tick
    const tickInfo = await this.rpc.getCurrentTick();
    const currentTick = tickInfo.tick;
    const startTick = currentTick - 1000;

    console.log(`📍 Current tick: ${currentTick}`);
    console.log(`📍 Scanning range: ${startTick} → ${currentTick}\n`);

    await this.seedFromRange(startTick, currentTick);
  }

  /**
   * Process a batch of ticks
   */
  private async processBatch(startTick: number, endTick: number): Promise<void> {
    const promises = [];
    
    for (let tick = startTick; tick <= endTick; tick++) {
      promises.push(this.processTick(tick));
    }

    await Promise.all(promises);
  }

  /**
   * Process single tick
   */
  private async processTick(tick: number): Promise<void> {
    try {
      // Check if already processed
      if (await this.db.isTickProcessed(tick)) {
        return;
      }

      this.stats.ticksChecked++;

      // Get transactions
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

      // Found QX activity! 🎯
      console.log(`\n🎯 Tick ${tick}: Found ${qxTransactions.length} QX transactions!`);

      // Convert to trades
      const trades = this.convertToTrades(qxTransactions, tick);
      this.stats.tradesFound += trades.length;

      // Store in database
      await this.db.insertTrades(trades);
      
      // Update holders
      await this.updateHolderBalances(trades);
      
      // Mark as processed
      await this.db.markTickAsProcessed(
        tick,
        new Date(),
        transactions.length,
        qxTransactions.length
      );

      console.log(`✅ Stored ${trades.length} trades from tick ${tick}`);

    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('404')) {
        await this.db.markTickAsProcessed(tick, new Date(), 0, 0);
        return;
      }
      
      console.error(`❌ Error processing tick ${tick}:`, error.message);
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
   * Convert to trades
   */
  private convertToTrades(transactions: DecodedQXTransaction[], tick: number): Trade[] {
    const trades: Trade[] = [];

    for (const tx of transactions) {
      if (tx.operation !== 'BUY' && tx.operation !== 'SELL') {
        continue;
      }

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
        price: tx.orderDetails?.price || BigInt(0),
        amount: tx.orderDetails?.shares || BigInt(0),
        totalValue: tx.orderDetails?.totalValue || BigInt(0),
        pricePerUnit: Number(tx.orderDetails?.price || BigInt(0)),
      };

      trades.push(trade);
    }

    return trades;
  }

  /**
   * Update holder balances
   */
  private async updateHolderBalances(trades: Trade[]): Promise<void> {
    for (const trade of trades) {
      const balanceChange = trade.tradeType === 'BUY' ? trade.amount : -trade.amount;
      const bought = trade.tradeType === 'BUY' ? trade.amount : BigInt(0);
      const sold = trade.tradeType === 'SELL' ? trade.amount : BigInt(0);
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
   * Show progress
   */
  private showProgress(): void {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const ticksPerSec = this.stats.ticksChecked / runtime;
    
    console.log(`\n📊 Progress: ${this.stats.ticksChecked} ticks checked | ${this.stats.tradesFound} trades found | ${ticksPerSec.toFixed(1)} ticks/s`);
  }

  /**
   * Show final stats
   */
  private showFinalStats(): void {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    
    console.log('='.repeat(80));
    console.log('📊 SEEDING COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Ticks checked: ${this.stats.ticksChecked}`);
    console.log(`🎯 Trades found: ${this.stats.tradesFound}`);
    console.log(`⏱️  Runtime: ${runtime.toFixed(0)}s`);
    console.log('='.repeat(80));
  }
}
