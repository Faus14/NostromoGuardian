-- ============================================================================
-- QUBIC TOKEN ANALYZER - DATABASE SCHEMA
-- ============================================================================
-- This schema stores all indexed data for on-chain analytics
-- Optimized for fast queries on holder distribution, volume, and risk metrics

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Tracks all processed ticks to avoid reprocessing
CREATE TABLE IF NOT EXISTS indexed_ticks (
  tick BIGINT PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  transactions_count INTEGER DEFAULT 0,
  qx_transactions_count INTEGER DEFAULT 0,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_indexed_ticks_timestamp (timestamp)
);

-- Stores all QX trades (BUY/SELL operations)
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  tx_id VARCHAR(128) UNIQUE NOT NULL,
  tick BIGINT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  
  -- Token information
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  
  -- Trade details
  trade_type VARCHAR(4) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  trader VARCHAR(128) NOT NULL,
  
  -- Amounts (stored as strings to preserve precision)
  price NUMERIC(40, 0) NOT NULL,
  amount NUMERIC(40, 0) NOT NULL,
  total_value NUMERIC(40, 0) NOT NULL,
  price_per_unit DECIMAL(20, 10) NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_trades_tick (tick),
  INDEX idx_trades_token (token_issuer, token_name),
  INDEX idx_trades_trader (trader),
  INDEX idx_trades_timestamp (timestamp),
  INDEX idx_trades_type (trade_type),
  INDEX idx_trades_composite (token_issuer, token_name, timestamp)
);

-- Stores current holder balances and statistics
CREATE TABLE IF NOT EXISTS holders (
  id SERIAL PRIMARY KEY,
  address VARCHAR(128) NOT NULL,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  
  -- Balance information
  balance NUMERIC(40, 0) NOT NULL DEFAULT 0,
  percentage DECIMAL(8, 4) NOT NULL DEFAULT 0,
  
  -- Activity tracking
  first_seen_tick BIGINT NOT NULL,
  last_activity_tick BIGINT NOT NULL,
  total_bought NUMERIC(40, 0) NOT NULL DEFAULT 0,
  total_sold NUMERIC(40, 0) NOT NULL DEFAULT 0,
  buy_count INTEGER NOT NULL DEFAULT 0,
  sell_count INTEGER NOT NULL DEFAULT 0,
  
  -- Classification
  is_whale BOOLEAN DEFAULT FALSE,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(address, token_issuer, token_name),
  INDEX idx_holders_token (token_issuer, token_name),
  INDEX idx_holders_address (address),
  INDEX idx_holders_balance (balance DESC),
  INDEX idx_holders_whale (is_whale),
  INDEX idx_holders_percentage (percentage DESC)
);

-- Historical snapshots of holder balances (for time-series analysis)
CREATE TABLE IF NOT EXISTS balance_snapshots (
  id SERIAL PRIMARY KEY,
  address VARCHAR(128) NOT NULL,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  balance NUMERIC(40, 0) NOT NULL,
  tick BIGINT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  
  INDEX idx_snapshots_token_time (token_issuer, token_name, timestamp),
  INDEX idx_snapshots_address (address),
  INDEX idx_snapshots_tick (tick)
);

-- Aggregated token metrics (updated periodically)
CREATE TABLE IF NOT EXISTS token_metrics (
  id SERIAL PRIMARY KEY,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  
  -- Volume metrics
  total_volume_24h NUMERIC(40, 0) DEFAULT 0,
  total_volume_7d NUMERIC(40, 0) DEFAULT 0,
  total_volume_30d NUMERIC(40, 0) DEFAULT 0,
  
  -- Trade metrics
  total_trades_24h INTEGER DEFAULT 0,
  total_trades_7d INTEGER DEFAULT 0,
  unique_traders_24h INTEGER DEFAULT 0,
  buy_count_24h INTEGER DEFAULT 0,
  sell_count_24h INTEGER DEFAULT 0,
  
  -- Holder metrics
  holder_count INTEGER DEFAULT 0,
  whale_count INTEGER DEFAULT 0,
  top_10_concentration DECIMAL(8, 4) DEFAULT 0,
  top_50_concentration DECIMAL(8, 4) DEFAULT 0,
  
  -- Price metrics
  current_price DECIMAL(20, 10) DEFAULT 0,
  high_24h DECIMAL(20, 10) DEFAULT 0,
  low_24h DECIMAL(20, 10) DEFAULT 0,
  price_change_24h DECIMAL(8, 4) DEFAULT 0,
  
  -- Supply metrics
  total_supply NUMERIC(40, 0) DEFAULT 0,
  circulating_supply NUMERIC(40, 0) DEFAULT 0,
  
  -- Scores
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  growth_score INTEGER DEFAULT 0 CHECK (growth_score >= 0 AND growth_score <= 100),
  
  -- Liquidity
  liquidity_depth NUMERIC(40, 0) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(token_issuer, token_name),
  INDEX idx_metrics_token (token_issuer, token_name),
  INDEX idx_metrics_volume (total_volume_24h DESC),
  INDEX idx_metrics_risk (risk_score),
  INDEX idx_metrics_growth (growth_score)
);

-- Hourly volume aggregation for charts
CREATE TABLE IF NOT EXISTS volume_hourly (
  id SERIAL PRIMARY KEY,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  hour_timestamp TIMESTAMP NOT NULL,
  tick_start BIGINT NOT NULL,
  tick_end BIGINT NOT NULL,
  
  volume NUMERIC(40, 0) NOT NULL DEFAULT 0,
  trade_count INTEGER NOT NULL DEFAULT 0,
  unique_buyers INTEGER NOT NULL DEFAULT 0,
  unique_sellers INTEGER NOT NULL DEFAULT 0,
  avg_price DECIMAL(20, 10) DEFAULT 0,
  high_price DECIMAL(20, 10) DEFAULT 0,
  low_price DECIMAL(20, 10) DEFAULT 0,
  
  UNIQUE(token_issuer, token_name, hour_timestamp),
  INDEX idx_volume_hourly_token_time (token_issuer, token_name, hour_timestamp DESC)
);

-- Daily volume aggregation
CREATE TABLE IF NOT EXISTS volume_daily (
  id SERIAL PRIMARY KEY,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  day_date DATE NOT NULL,
  tick_start BIGINT NOT NULL,
  tick_end BIGINT NOT NULL,
  
  volume NUMERIC(40, 0) NOT NULL DEFAULT 0,
  trade_count INTEGER NOT NULL DEFAULT 0,
  unique_buyers INTEGER NOT NULL DEFAULT 0,
  unique_sellers INTEGER NOT NULL DEFAULT 0,
  new_holders INTEGER NOT NULL DEFAULT 0,
  avg_price DECIMAL(20, 10) DEFAULT 0,
  high_price DECIMAL(20, 10) DEFAULT 0,
  low_price DECIMAL(20, 10) DEFAULT 0,
  
  UNIQUE(token_issuer, token_name, day_date),
  INDEX idx_volume_daily_token_date (token_issuer, token_name, day_date DESC)
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Tracks new holders per day (for growth analysis)
CREATE TABLE IF NOT EXISTS new_holders_daily (
  id SERIAL PRIMARY KEY,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  date DATE NOT NULL,
  new_holder_count INTEGER NOT NULL DEFAULT 0,
  
  UNIQUE(token_issuer, token_name, date),
  INDEX idx_new_holders_token_date (token_issuer, token_name, date DESC)
);

-- Tracks returning buyers (holders who buy again after selling)
CREATE TABLE IF NOT EXISTS returning_buyers (
  id SERIAL PRIMARY KEY,
  address VARCHAR(128) NOT NULL,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  last_buy_tick BIGINT NOT NULL,
  last_sell_tick BIGINT NOT NULL,
  return_count INTEGER DEFAULT 1,
  
  INDEX idx_returning_token (token_issuer, token_name),
  INDEX idx_returning_address (address)
);

-- Risk score calculation history
CREATE TABLE IF NOT EXISTS risk_score_history (
  id SERIAL PRIMARY KEY,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  
  risk_score INTEGER NOT NULL,
  liquidity_depth_score INTEGER NOT NULL,
  whale_concentration_score INTEGER NOT NULL,
  sell_pressure_score INTEGER NOT NULL,
  trade_imbalance_score INTEGER NOT NULL,
  
  INDEX idx_risk_history_token_time (token_issuer, token_name, timestamp DESC)
);

-- Growth score calculation history
CREATE TABLE IF NOT EXISTS growth_score_history (
  id SERIAL PRIMARY KEY,
  token_issuer VARCHAR(128) NOT NULL,
  token_name VARCHAR(16) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  
  growth_score INTEGER NOT NULL,
  new_holders_score INTEGER NOT NULL,
  returning_buyers_score INTEGER NOT NULL,
  volume_trend_score INTEGER NOT NULL,
  activity_streak_score INTEGER NOT NULL,
  
  INDEX idx_growth_history_token_time (token_issuer, token_name, timestamp DESC)
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_holders_updated_at BEFORE UPDATE ON holders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_metrics_updated_at BEFORE UPDATE ON token_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Top holders view with readable formatting
CREATE OR REPLACE VIEW v_top_holders AS
SELECT 
  h.address,
  h.token_issuer,
  h.token_name,
  h.balance,
  h.percentage,
  h.is_whale,
  h.buy_count,
  h.sell_count,
  h.total_bought,
  h.total_sold,
  (h.total_bought - h.total_sold) as net_bought,
  h.first_seen_tick,
  h.last_activity_tick
FROM holders h
ORDER BY h.balance DESC;

-- Recent trades view
CREATE OR REPLACE VIEW v_recent_trades AS
SELECT 
  t.tx_id,
  t.tick,
  t.timestamp,
  t.token_issuer,
  t.token_name,
  t.trade_type,
  t.trader,
  t.amount,
  t.price,
  t.price_per_unit
FROM trades t
ORDER BY t.timestamp DESC
LIMIT 1000;

-- Token summary view
CREATE OR REPLACE VIEW v_token_summary AS
SELECT 
  tm.token_issuer,
  tm.token_name,
  tm.holder_count,
  tm.whale_count,
  tm.total_volume_24h,
  tm.total_trades_24h,
  tm.current_price,
  tm.price_change_24h,
  tm.risk_score,
  tm.growth_score,
  tm.top_10_concentration,
  tm.updated_at
FROM token_metrics tm
ORDER BY tm.total_volume_24h DESC;
