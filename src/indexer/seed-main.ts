import { HistoricalSeeder } from './historical-seeder';
import { config } from '../config';

/**
 * Seed Script - Populate database with historical QX data
 * 
 * This script quickly populates the database by:
 * 1. Scanning recent ticks (last 1000) for QX activity
 * 2. Targeting known tokens that have trades
 * 
 * Run: npm run seed
 */

async function main() {
  console.log('\n');
  
  const seeder = new HistoricalSeeder();

  try {
    // Seed from known tokens (recommended - fastest way to get data)
    await seeder.seedFromKnownTokens();
    
    console.log('\n✅ Database seeded successfully!');
    console.log('💡 Now you can:');
    console.log('   1. Open http://localhost:5173 in your browser');
    console.log('   2. Go to "Token Analyzer"');
    console.log('   3. Search for token QX (issuer: CFBMEMZOIDEXDYPVMHGCBQDTTMPRJHOXMZRFVWXYZJWYQVNLODVFAAFV)');
    console.log('   4. See real data! 🎉\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
