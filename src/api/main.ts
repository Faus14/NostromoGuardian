import { startAPIServer } from './server';
import { config } from '../config';

/**
 * API Server Main Entry Point
 * 
 * Run this to start the REST API server
 * Usage: npm run api
 */

console.log('='.repeat(70));
console.log('QUBIC TOKEN ANALYZER - API SERVER');
console.log('='.repeat(70));
console.log(`Host: ${config.api.host}`);
console.log(`Port: ${config.api.port}`);
console.log(`CORS Origin: ${config.api.corsOrigin}`);
console.log('='.repeat(70));

startAPIServer();
