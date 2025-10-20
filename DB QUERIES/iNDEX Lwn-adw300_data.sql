

-- Database indexes for optimal performance of Energy Monitoring Dashboard
-- Run these SQL commands on your PostgreSQL database

-- Index for device name filtering (most important for API queries)
CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_device_name_lower 
ON lwn_adw300_data (LOWER(device_name));

-- Index for received_at timestamp (for time-based queries)
CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_received_at 
ON lwn_adw300_data (received_at DESC);

-- Index for dev_eui (for getting latest readings per device)
CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_dev_eui 
ON lwn_adw300_data (dev_eui);

-- Composite index for the most common query pattern (device type + time)
CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_device_time 
ON lwn_adw300_data (LOWER(device_name), received_at DESC);

-- Composite index for dev_eui + received_at (for DISTINCT ON queries)
CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_dev_eui_received_at 
ON lwn_adw300_data (dev_eui, received_at DESC);

-- Index for date-based energy queries
CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_date_received_at 
ON lwn_adw300_data (DATE(received_at));

-- Composite index for daily energy aggregation queries
CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_daily_energy 
ON lwn_adw300_data (DATE(received_at), dev_eui, LOWER(device_name));

-- Optional: Create partial indexes for each device type if you have large amounts of data
CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_grid_received_at 
ON lwn_adw300_data (received_at DESC) 
WHERE LOWER(device_name) LIKE '%grid%';

CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_solar_received_at 
ON lwn_adw300_data (received_at DESC) 
WHERE LOWER(device_name) LIKE '%solar%';

CREATE INDEX IF NOT EXISTS idx_lwn_adw300_data_genset_received_at 
ON lwn_adw300_data (received_at DESC) 
WHERE LOWER(device_name) LIKE '%genset%';

-- Analyze table to update statistics after creating indexes
ANALYZE lwn_adw300_data;

-- View current indexes on the table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'lwn_adw300_data'
ORDER BY indexname;