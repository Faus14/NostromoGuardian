import { IndexerEngine } from './engine';
import { config } from '../config';

/**
 * Indexer Main Entry Point
 * 
 * Run this to start indexing QX trades from Qubic blockchain
 * Usage: npm run indexer
 */

async function main() {
  console.log('='.repeat(70));
  console.log('NOSTROMO GUARDIAN - INDEXER');
  console.log('='.repeat(70));
  console.log(`RPC Endpoint: ${config.qubic.rpc.active}`);
  console.log(`QX Contract: ${config.qubic.qx.contractAddress}`);
  console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
  console.log('='.repeat(70));

  const indexer = new IndexerEngine();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[Indexer] Received SIGINT, shutting down gracefully...');
    indexer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Indexer] Received SIGTERM, shutting down gracefully...');
    indexer.stop();
    process.exit(0);
  });

  // Start indexing
  try {
    await indexer.start(config.indexer.startTick || undefined);
  } catch (error) {
    console.error('[Indexer] Fatal error:', error);
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('[Indexer] Unhandled error:', error);
  process.exit(1);
});
