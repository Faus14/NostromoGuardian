/**
 * Calculate Holders from Existing Trades
 * 
 * This script processes all trades in the database and calculates
 * holder balances, updating the holders table.
 */

import { getDatabase } from '../services/database.service';
import { Holder } from '../types';

interface TradeRow {
  tick: string;
  token_issuer: string;
  token_name: string;
  trade_type: string;
  trader: string;
  amount: string;
  price: string;
}

async function calculateHolders() {
  const db = getDatabase();
  
  console.log('[HolderCalculator] Starting holder calculation from trades...');
  
  // Get all trades ordered by tick
  const result = await db.query(
    `SELECT tick, token_issuer, token_name, trade_type, trader, amount, price
     FROM trades
     ORDER BY tick ASC`
  ) as { rows: TradeRow[] };
  
  const trades = result.rows;
  console.log(`[HolderCalculator] Processing ${trades.length} trades...`);
  
  // Track holders: Map<address|token_issuer|token_name, HolderData>
  const holderMap = new Map<string, {
    address: string;
    tokenIssuer: string;
    tokenName: string;
    balance: bigint;
    firstSeenTick: bigint;
    lastActivityTick: bigint;
    totalBought: bigint;
    totalSold: bigint;
    buyCount: number;
    sellCount: number;
  }>();
  
  // Process each trade
  for (const trade of trades) {
    const key = `${trade.trader}|${trade.token_issuer}|${trade.token_name}`;
    const amount = BigInt(trade.amount);
    const tick = BigInt(trade.tick);
    
    // Get or create holder
    let holder = holderMap.get(key);
    if (!holder) {
      holder = {
        address: trade.trader,
        tokenIssuer: trade.token_issuer,
        tokenName: trade.token_name,
        balance: BigInt(0),
        firstSeenTick: tick,
        lastActivityTick: tick,
        totalBought: BigInt(0),
        totalSold: BigInt(0),
        buyCount: 0,
        sellCount: 0,
      };
      holderMap.set(key, holder);
    }
    
    // Update holder based on trade type
    if (trade.trade_type === 'BUY') {
      holder.balance += amount;
      holder.totalBought += amount;
      holder.buyCount++;
    } else if (trade.trade_type === 'SELL') {
      holder.balance -= amount;
      holder.totalSold += amount;
      holder.sellCount++;
    }
    
    holder.lastActivityTick = tick;
  }
  
  console.log(`[HolderCalculator] Calculated ${holderMap.size} unique holders`);
  console.log('[HolderCalculator] Updating database...');
  
  // Clear existing holders
  await db.query('DELETE FROM holders');
  console.log('[HolderCalculator] Cleared existing holders table');
  
  // Insert all holders
  let inserted = 0;
  for (const [, holder] of holderMap) {
    // Skip holders with zero balance
    if (holder.balance <= 0) {
      continue;
    }
    
    const holderObj: Holder = {
      address: holder.address,
      tokenIssuer: holder.tokenIssuer,
      tokenName: holder.tokenName,
      balance: holder.balance,
      percentage: 0, // Will be calculated later per token
      firstSeenTick: Number(holder.firstSeenTick),
      lastActivityTick: Number(holder.lastActivityTick),
      totalBought: holder.totalBought,
      totalSold: holder.totalSold,
      buyCount: holder.buyCount,
      sellCount: holder.sellCount,
      isWhale: false, // Will be determined later
    };
    
    await db.upsertHolder(holderObj);
    inserted++;
    
    if (inserted % 100 === 0) {
      console.log(`[HolderCalculator] Inserted ${inserted} holders...`);
    }
  }
  
  console.log(`[HolderCalculator] ✅ Successfully inserted ${inserted} holders`);
  
  // Now calculate percentages per token
  console.log('[HolderCalculator] Calculating holder percentages...');
  
  const tokensResult = await db.query(
    'SELECT DISTINCT token_issuer, token_name FROM holders'
  ) as { rows: { token_issuer: string; token_name: string }[] };
  
  for (const token of tokensResult.rows) {
    // Get total supply for this token
    const supplyResult = await db.query(
      `SELECT SUM(balance) as total 
       FROM holders 
       WHERE token_issuer = $1 AND token_name = $2`,
      [token.token_issuer, token.token_name]
    ) as { rows: { total: string }[] };
    
    const totalSupply = BigInt(supplyResult.rows[0]?.total || '0');
    if (totalSupply === BigInt(0)) continue;
    
    // Update percentages
    await db.query(
      `UPDATE holders
       SET percentage = (balance::numeric / $3::numeric * 100)::numeric(10,6),
           is_whale = (balance::numeric / $3::numeric >= 0.05)
       WHERE token_issuer = $1 AND token_name = $2`,
      [token.token_issuer, token.token_name, totalSupply.toString()]
    );
  }
  
  console.log('[HolderCalculator] ✅ All done! Holders calculated successfully');
  
  // Show summary
  const summary = await db.query(
    `SELECT token_name, COUNT(*) as holder_count
     FROM holders
     GROUP BY token_name
     ORDER BY holder_count DESC
     LIMIT 10`
  ) as { rows: { token_name: string; holder_count: string }[] };
  
  console.log('\n📊 Top tokens by holder count:');
  for (const row of summary.rows) {
    console.log(`  - ${row.token_name}: ${row.holder_count} holders`);
  }
  
  process.exit(0);
}

// Run
calculateHolders().catch(err => {
  console.error('[HolderCalculator] ❌ Error:', err);
  process.exit(1);
});
