import { IntelligentSeeder } from './intelligent-seeder';

/**
 * Entry point for intelligent seeder
 * Uses activity scanner to find REAL QX data (no mocks!)
 *
 * Usage: npm run intelligent-seed
 */

async function main() {
  console.log('='.repeat(70));
  console.log('NOSTROMO GUARDIAN - INTELLIGENT SEEDER');
  console.log('Real Data Only - No Mocks!');
  console.log('='.repeat(70));
  console.log();

  const seeder = new IntelligentSeeder();

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
    await seeder.seed();
    process.exit(0);
  } catch (error) {
    console.error('\n[Seeder] Seeder failed:', error);
    process.exit(1);
  }
}

main();
