import { SmartIndexer } from './smart-indexer';
import { config } from '../config';

/**
 * Smart Indexer Entry Point
 *
 * Optimized indexer that focuses on ticks with QX activity.
 * Runs continuously and auto-updates as new blocks arrive.
 *
 * Usage: npm run smart-index
 */

async function main() {
  console.log('='.repeat(80));
  console.log('🚀 NOSTROMO GUARDIAN - SMART INDEXER');
  console.log('='.repeat(80));
  console.log(`RPC: ${config.qubic.rpc.active}`);
  console.log(`QX Contract: ${config.qubic.qx.contractAddress}`);
  console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
  console.log(`Batch Size: ${config.indexer.batchSize} ticks`);
  console.log(`Poll Interval: ${config.indexer.pollIntervalMs}ms`);
  console.log(`Skip Empty: ${config.indexer.skipEmptyTicks ? 'YES' : 'NO'}`);
  console.log('='.repeat(80));
  console.log('');
  console.log('TIP: This indexer scans rapidly through empty ticks and focuses only on blocks with QX transactions. It runs continuously.');
  console.log('');
  console.log('Stats will be shown every 100 ticks scanned.');
  console.log('');
  console.log('Press Ctrl+C to stop gracefully.');

  const indexer = new SmartIndexer();

  process.on('SIGINT', () => {
    console.log('\n[SmartIndexer] Shutdown signal received, stopping...');
    indexer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[SmartIndexer] Termination signal received, stopping...');
    indexer.stop();
    process.exit(0);
  });

  await indexer.start(config.indexer.startTick);
}

main().catch((error) => {
  console.error('[SmartIndexer] Fatal error:', error);
  process.exit(1);
});
