-- Database schema for bus delay observations (PostgreSQL)
-- This stores real-time vs scheduled arrival data for analyzing delays
-- Partitioned by month for optimal performance with large datasets

CREATE TABLE IF NOT EXISTS delay_observations (
    id BIGSERIAL NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    stop_code INTEGER NOT NULL,
    line VARCHAR(10) NOT NULL,
    route VARCHAR(100) NOT NULL,
    service_id VARCHAR(50) NOT NULL,
    trip_id VARCHAR(50) NOT NULL,
    running BOOLEAN NOT NULL,
    scheduled_minutes SMALLINT NOT NULL,
    real_time_minutes SMALLINT NOT NULL,
    delay_minutes SMALLINT GENERATED ALWAYS AS (real_time_minutes - scheduled_minutes) STORED,
    PRIMARY KEY (id, observed_at)
) PARTITION BY RANGE (observed_at);

-- Create initial partitions (monthly)
-- You should create new partitions before each month starts
CREATE TABLE IF NOT EXISTS delay_observations_2025_11 PARTITION OF delay_observations
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS delay_observations_2025_12 PARTITION OF delay_observations
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS delay_observations_2026_01 PARTITION OF delay_observations
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Indexes for efficient querying (created on parent table, applied to all partitions)
CREATE INDEX IF NOT EXISTS idx_observed_at ON delay_observations(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stop_code ON delay_observations(stop_code);
CREATE INDEX IF NOT EXISTS idx_line ON delay_observations(line);
CREATE INDEX IF NOT EXISTS idx_trip_id ON delay_observations(trip_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stop_line ON delay_observations(stop_code, line);
CREATE INDEX IF NOT EXISTS idx_running ON delay_observations(running) WHERE running = true;

-- Partitioning by date for better performance (optional, uncomment if needed)
-- This requires converting to a partitioned table
-- ALTER TABLE delay_observations PARTITION BY RANGE (observation_date);
