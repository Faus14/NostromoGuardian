import { startAPIServer } from './server';
import { config } from '../config';
import { QueryAPISeeder } from '../indexer/query-api-seeder';

/**
 * API Server Main Entry Point
 * 
 * Run this to start the REST API server
 * Usage: npm run api
 */

console.log('='.repeat(70));
console.log('NOSTROMO GUARDIAN - API SERVER');
console.log('='.repeat(70));
console.log(`Host: ${config.api.host}`);
console.log(`Port: ${config.api.port}`);
console.log(`CORS Origin: ${config.api.corsOrigin}`);
console.log('='.repeat(70));

startAPIServer();

// Optional background seeding loop (pulls trades periodically from Query API)
const seedEnabled = process.env.SEED_CRON_ENABLED === 'true';
if (seedEnabled) {
  const intervalMs = parseInt(process.env.SEED_CRON_INTERVAL_MS || '60000', 10); // default 1 min
  const targetPerRun = parseInt(process.env.SEED_CRON_TARGET_TRADES || '100', 10);

  console.log('[SeedCron] Enabled');
  console.log(`[SeedCron] Interval: ${intervalMs} ms`);
  console.log(`[SeedCron] Target trades per run: ${targetPerRun}`);

  const seeder = new QueryAPISeeder();
  let isRunning = false;

  const runSeed = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await seeder.seed(targetPerRun);
    } catch (error) {
      console.error('[SeedCron] Error during seed run:', error);
    } finally {
      isRunning = false;
    }
  };

  // Kick off immediately, then on interval
  runSeed();
  const timer = setInterval(runSeed, intervalMs);

  // Clean shutdown
  const stop = () => {
    console.log('\n[SeedCron] Stopping cron loop...');
    clearInterval(timer);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
