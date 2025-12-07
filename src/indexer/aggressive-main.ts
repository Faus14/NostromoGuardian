import { AggressiveHistoricalSeeder, getAggressiveSeeder } from './aggressive-seeder';

/**
 * Entry point for aggressive historical data seeder
 *
 * Usage: npm run aggressive-seed
 */

async function main() {
  console.log('='.repeat(70));
  console.log('NOSTROMO GUARDIAN - DEMO SEEDER');
  console.log('Hackathon Edition');
  console.log('='.repeat(70));
  console.log();

  const seeder = getAggressiveSeeder();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n[Seeder] Shutdown signal received...');
    console.log('[Seeder] Final statistics will be shown');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n[Seeder] Termination signal received...');
    process.exit(0);
  });

  try {
    // Seed database with 100 trades minimum for demo
    await seeder.seed(100);

    console.log('\n[Seeder] Seeding complete!');
    console.log('\n[Seeder] Next steps:');
    console.log('   1. Start API: npm run api');
    console.log('   2. Start frontend: cd frontend && npm run dev');
    console.log('   3. Open: http://localhost:5173');

    process.exit(0);
  } catch (error) {
    console.error('\n[Seeder] Seeder failed:', error);
    process.exit(1);
  }
}

main();
