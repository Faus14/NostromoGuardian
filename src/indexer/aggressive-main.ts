import { AggressiveHistoricalSeeder, getAggressiveSeeder } from './aggressive-seeder';

/**
 * Entry point for aggressive historical data seeder
 * 
 * Usage: npm run aggressive-seed
 */

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║        QUBIC TOKEN ANALYZER - DEMO SEEDER         ║');
  console.log('║              Hackathon Edition 🏆                 ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log();

  const seeder = getAggressiveSeeder();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Shutdown signal received...');
    console.log('📊 Final statistics will be shown');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n⚠️  Termination signal received...');
    process.exit(0);
  });

  try {
    // Seed database with 100 trades minimum for demo
    await seeder.seed(100);
    
    console.log('\n✅ Seeding complete!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Start API: npm run api');
    console.log('   2. Start frontend: cd frontend && npm run dev');
    console.log('   3. Open: http://localhost:5173');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeder failed:', error);
    process.exit(1);
  }
}

main();
