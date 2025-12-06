import { QueryAPISeeder } from './query-api-seeder';

/**
 * Entry point for Query API seeder
 * Uses the CORRECT Qubic Query API endpoint to fetch REAL data
 * 
 * Usage: npm run query-seed
 */

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   QUBIC TOKEN ANALYZER - QUERY API SEEDER         ║');
  console.log('║   Fetching REAL data from Query API! 🎯           ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const seeder = new QueryAPISeeder();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Shutdown signal received...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n⚠️  Termination signal received...');
    process.exit(0);
  });

  try {
    // Fetch 200 trades for a good demo dataset
    await seeder.seed(200);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeder failed:', error);
    process.exit(1);
  }
}

main();
