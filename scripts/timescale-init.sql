-- TimescaleDB Initialization Script

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create transactions time-series table
CREATE TABLE IF NOT EXISTS transactions_timeseries (
    time TIMESTAMPTZ NOT NULL,
    user_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    merchant TEXT,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score NUMERIC
);

-- Convert to hypertable
SELECT create_hypertable('transactions_timeseries', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON transactions_timeseries (user_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions_timeseries (user_id, category, time DESC);

-- Create prediction models table
CREATE TABLE IF NOT EXISTS prediction_models (
    user_id TEXT PRIMARY KEY,
    model_version TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    accuracy NUMERIC,
    mae NUMERIC,
    rmse NUMERIC,
    training_data_size INTEGER,
    last_trained_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spending patterns table
CREATE TABLE IF NOT EXISTS spending_patterns (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    frequency TEXT NOT NULL,
    average_amount NUMERIC NOT NULL,
    time_of_day TEXT,
    day_of_week INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spending_patterns_user ON spending_patterns (user_id);

-- Create continuous aggregates for daily spending
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_spending
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS day,
    user_id,
    category,
    SUM(amount) AS total_amount,
    COUNT(*) AS transaction_count,
    AVG(amount) AS avg_amount
FROM transactions_timeseries
WHERE type = 'expense'
GROUP BY day, user_id, category
WITH NO DATA;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('daily_spending',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Create retention policy (keep data for 2 years)
SELECT add_retention_policy('transactions_timeseries', INTERVAL '2 years', if_not_exists => TRUE);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
