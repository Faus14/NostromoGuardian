import { QueryAPISeeder } from './query-api-seeder';

// Simple loop runner to execute QueryAPISeeder on an interval.
// Interval and per-run target are configurable via env vars.

const intervalMs = parseInt(process.env.SEED_LOOP_INTERVAL_MS || '60000', 10); // default 1 minute
const targetPerRun = parseInt(process.env.SEED_LOOP_TARGET_TRADES || '100', 10);

let running = true;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
console.log('='.repeat(80));
console.log('NOSTROMO GUARDIAN - QUERY SEED LOOP');
console.log('='.repeat(80));
  console.log(`Interval: ${intervalMs} ms`);
  console.log(`Target trades per run: ${targetPerRun}`);
  console.log('Ctrl+C to stop');
  console.log('='.repeat(80));

  const seeder = new QueryAPISeeder();

  while (running) {
    try {
      await seeder.seed(targetPerRun);
    } catch (error) {
      console.error('[SeedLoop] Error running seeder:', error);
    }

    if (!running) break;
    await sleep(intervalMs);
  }
}

process.on('SIGINT', () => {
  console.log('\n[SeedLoop] Received SIGINT, exiting...');
  running = false;
});

process.on('SIGTERM', () => {
  console.log('\n[SeedLoop] Received SIGTERM, exiting...');
  running = false;
});

main().catch((error) => {
  console.error('[SeedLoop] Unhandled error:', error);
  process.exit(1);
});
