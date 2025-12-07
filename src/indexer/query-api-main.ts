import { QueryAPISeeder } from './query-api-seeder';

/**
 * Entry point for Query API seeder
 * Uses the CORRECT Qubic Query API endpoint to fetch REAL data
 *
 * Usage: npm run query-seed
 */

async function main() {
  console.log('='.repeat(70));
  console.log('NOSTROMO GUARDIAN - QUERY API SEEDER');
  console.log('Fetching REAL data from Query API!');
  console.log('='.repeat(70));
  console.log();

  const seeder = new QueryAPISeeder();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n[Seeder] Shutdown signal received...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n[Seeder] Termination signal received...');
    process.exit(0);
  });

  try {
    // Fetch 1000 trades for a comprehensive demo dataset
    await seeder.seed(1000);
    process.exit(0);
  } catch (error) {
    console.error('\n[Seeder] Seeder failed:', error);
    process.exit(1);
  }
}

main();
