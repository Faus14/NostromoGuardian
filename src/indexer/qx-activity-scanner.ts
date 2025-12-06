import axios from 'axios';
import { config } from '../config';

/**
 * QX Activity Scanner - Finds real QX transactions on mainnet
 * 
 * Strategy:
 * 1. Use RPC v2 API to scan recent epochs for QX contract transactions
 * 2. QX contract address: BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID
 * 3. Filter transactions where destId = QX contract
 * 4. Return list of ticks with confirmed QX activity
 */

const QX_CONTRACT_ADDRESS = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';

interface TransactionResponse {
  transactions: Array<{
    transaction: {
      sourceId: string;
      destId: string;
      amount: string;
      tickNumber: number;
      inputType: number;
      inputSize: number;
      txId: string;
    };
    timestamp: string;
    moneyFlew: boolean;
  }>;
}

export async function findQXActivityTicks(
  startTick: number,
  endTick: number,
  maxResults: number = 50
): Promise<number[]> {
  console.log(`🔍 Scanning ticks ${startTick} to ${endTick} for QX activity...`);
  
  const qxTicks: Set<number> = new Set();
  const rpcUrl = config.qubic.rpc.active === 'testnet' 
    ? config.qubic.rpc.testnet 
    : config.qubic.rpc.mainnet;
  
  // Scan backwards from end to start (recent first)
  // Use larger steps to reduce API calls
  for (let tick = endTick; tick >= startTick && qxTicks.size < maxResults; tick -= 1000) {
    try {
      const response = await axios.get<TransactionResponse>(
        `${rpcUrl}/v2/ticks/${tick}/transactions`,
        { timeout: 10000 }
      );
      
      if (response.data.transactions && response.data.transactions.length > 0) {
        // Filter QX transactions
        const qxTransactions = response.data.transactions.filter(
          tx => tx.transaction.destId === QX_CONTRACT_ADDRESS
        );
        
        if (qxTransactions.length > 0) {
          console.log(`   ✓ Tick ${tick}: ${qxTransactions.length} QX transactions`);
          qxTicks.add(tick);
        }
      }
      
      // Longer delay to respect rate limits (2 seconds between requests)
      await sleep(2000);
      
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        // Tick doesn't exist or bad request (future tick), continue
        continue;
      }
      
      if (error.response?.status === 429) {
        console.log('   ⚠️  Rate limited, waiting 15s...');
        await sleep(15000); // Wait longer when rate limited
        tick += 1000; // Retry this tick
        continue;
      }
      
      // Other errors - log but continue
      if (qxTicks.size === 0) {
        console.error(`   ✗ Error at tick ${tick}:`, error.message);
      }
    }
  }
  
  const results = Array.from(qxTicks).sort((a, b) => a - b);
  console.log(`\n✅ Found ${results.length} ticks with QX activity`);
  
  return results;
}

/**
 * Find QX activity in recent epochs
 */
export async function findRecentQXActivity(): Promise<number[]> {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║      QX ACTIVITY SCANNER - REAL DATA FINDER      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  // Get current tick
  const rpcUrl = config.qubic.rpc.active === 'testnet' 
    ? config.qubic.rpc.testnet 
    : config.qubic.rpc.mainnet;
  const tickInfo = await axios.get(`${rpcUrl}/v1/tick-info`);
  const currentTick = tickInfo.data.tickInfo.tick;
  const currentEpoch = tickInfo.data.tickInfo.epoch;
  
  console.log(`📍 Current: Tick ${currentTick}, Epoch ${currentEpoch}\n`);
  
  // Search strategies (sampled time periods to respect rate limits)
  // Sample ticks every 1000 to find active periods
  const strategies = [
    { name: 'Epoch 189 sample', start: 38430000, end: 38480000 },
    { name: 'Epoch 188 sample', start: 38220000, end: 38270000 },
    { name: 'Recent activity sample', start: currentTick - 10000, end: currentTick - 100 },
  ];
  
  let allTicks: number[] = [];
  
  for (const strategy of strategies) {
    console.log(`\n📊 Strategy: ${strategy.name}`);
    console.log(`   Range: ${strategy.start} → ${strategy.end}`);
    
    const ticks = await findQXActivityTicks(strategy.start, strategy.end, 20);
    allTicks = allTicks.concat(ticks);
    
    if (allTicks.length >= 50) {
      console.log('\n🎯 Found enough data! Stopping search.');
      break;
    }
    
    // Pause between strategies
    await sleep(2000);
  }
  
  // Remove duplicates and sort
  allTicks = Array.from(new Set(allTicks)).sort((a, b) => a - b);
  
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                 SCAN COMPLETE                    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n✅ Total QX ticks found: ${allTicks.length}`);
  
  if (allTicks.length > 0) {
    console.log(`📌 Range: ${allTicks[0]} → ${allTicks[allTicks.length - 1]}`);
  } else {
    console.log('\n⚠️  WARNING: No QX activity found in searched ranges');
    console.log('💡 QX exchange may have very low activity currently');
  }
  
  return allTicks;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
