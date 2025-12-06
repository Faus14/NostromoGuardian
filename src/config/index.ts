import dotenv from 'dotenv';

dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'qubic_analytics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  
  qubic: {
    rpc: {
      mainnet: process.env.QUBIC_RPC_MAINNET || 'https://rpc.qubic.org',
      testnet: process.env.QUBIC_RPC_TESTNET || 'https://testnet-rpc.qubicdev.com',
      active: process.env.QUBIC_RPC_ACTIVE || 'mainnet',
    },
    qx: {
      contractIndex: parseInt(process.env.QX_CONTRACT_INDEX || '1'),
      contractAddress: process.env.QX_CONTRACT_ADDRESS || 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID',
    },
  },
  
  indexer: {
    startTick: parseInt(process.env.INDEXER_START_TICK || '0'),
    batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '100'),
    pollIntervalMs: parseInt(process.env.INDEXER_POLL_INTERVAL_MS || '5000'),
    maxRetries: parseInt(process.env.INDEXER_MAX_RETRIES || '3'),
  },
  
  api: {
    port: parseInt(process.env.API_PORT || '3000'),
    host: process.env.API_HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  
  websocket: {
    port: parseInt(process.env.WS_PORT || '3001'),
  },
  
  analytics: {
    whaleThresholdPercentage: parseFloat(process.env.WHALE_THRESHOLD_PERCENTAGE || '5.0'),
    topHoldersLimit: parseInt(process.env.TOP_HOLDERS_LIMIT || '100'),
    snapshotIntervalHours: parseInt(process.env.SNAPSHOT_INTERVAL_HOURS || '24'),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export function getRpcUrl(): string {
  return config.qubic.rpc.active === 'mainnet' 
    ? config.qubic.rpc.mainnet 
    : config.qubic.rpc.testnet;
}
