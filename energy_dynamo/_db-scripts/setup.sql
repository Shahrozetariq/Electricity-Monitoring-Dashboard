-- ============================================
-- Energy Monitoring System - Database Setup
-- ============================================

-- Create blocks table (if not exists)
CREATE TABLE IF NOT EXISTS dyno_blocks (
    id SERIAL PRIMARY KEY,
    block_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create units table (houses)
CREATE TABLE IF NOT EXISTS dyno_units (
    id SERIAL PRIMARY KEY,
    unit_name VARCHAR(100) NOT NULL,
    dev_eui VARCHAR(50) NOT NULL,
    block_id INTEGER REFERENCES dyno_blocks(id) ON DELETE CASCADE,
    unit_type VARCHAR(50) DEFAULT 'residential', -- residential, commercial, etc.
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, maintenance
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(unit_name, block_id)
);

-- Create devices table
CREATE TABLE IF NOT EXISTS dyno_devices (
    id SERIAL PRIMARY KEY,
    dev_eui VARCHAR(50) UNIQUE NOT NULL,
    device_name VARCHAR(100),
    meter_type VARCHAR(20) NOT NULL CHECK (meter_type IN ('ADW300', 'ADW310', 'DTSD4S', 'DTSD12S')),
    device_model VARCHAR(100),
    installation_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_units_block_id ON dyno_units(block_id);
CREATE INDEX IF NOT EXISTS idx_units_dev_eui ON dyno_units(dev_eui);
CREATE INDEX IF NOT EXISTS idx_devices_dev_eui ON dyno_devices(dev_eui);
CREATE INDEX IF NOT EXISTS idx_devices_meter_type ON dyno_devices(meter_type);

-- Add indexes on meter data tables for better query performance
CREATE INDEX IF NOT EXISTS idx_adw300_deveui_time ON lwn_adw300_data(dev_eui, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_adw310_deveui_time ON lwn_adw310_data(dev_eui, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_dtsd4s_deveui_time ON lwn_dtsd4s_data(dev_eui, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_dtsd12s_deveui_time ON lwn_dtsd12s_data(dev_eui, received_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_blocks_updated_at ON blocks;
CREATE TRIGGER update_blocks_updated_at
    BEFORE UPDATE ON dyno_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_units_updated_at ON units;
CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON dyno_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON dyno_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data Insertion
-- ============================================

-- Insert sample blocks
INSERT INTO dyno_blocks (block_name, description) VALUES 
    ('Alpha', 'Block Alpha - Residential Area'),
    ('Beta', 'Block Beta - Commercial Area'),
    ('Gamma', 'Block Gamma - Mixed Use Area')
ON CONFLICT (block_name) DO NOTHING;

-- Insert sample devices
-- Note: Replace these with your actual device IDs
INSERT INTO dyno_devices (dev_eui, device_name, meter_type, status) VALUES 
    ('0095690600026d91', 'ADW300-House1-Alpha', 'ADW300', 'active'),
    ('009569060003009b', 'ADW310-House1b-Beta', 'ADW310', 'active'),
    ('009569060003009c', 'DTSD4S-House2-Alpha', 'DTSD4S', 'active'),
    ('009569060003009d', 'DTSD12S-House3-Alpha', 'DTSD12S', 'active')
ON CONFLICT (dev_eui) DO UPDATE SET
    device_name = EXCLUDED.device_name,
    meter_type = EXCLUDED.meter_type,
    status = EXCLUDED.status;

-- Insert sample units (houses)
-- Make sure dev_eui matches devices table
INSERT INTO dyno_units (unit_name, dev_eui, block_id, unit_type) VALUES 
    ('House 1', '0095690600026d91', 1, 'residential'),
    ('House 2', '009569060003009c', 1, 'residential'),
    ('House 3', '009569060003009d', 1, 'residential'),
    ('House 1-b', '009569060003009b', 2, 'commercial')
ON CONFLICT (unit_name, block_id) DO UPDATE SET
    dev_eui = EXCLUDED.dev_eui,
    unit_type = EXCLUDED.unit_type;

-- ============================================
-- Verification Queries
-- ============================================

-- Verify blocks
SELECT * FROM dyno_blocks ORDER BY id;

-- Verify devices
SELECT * FROM dyno_devices ORDER BY id;

-- Verify units with block names
SELECT 
    u.id,
    u.unit_name,
    u.dev_eui,
    b.block_name,
    u.block_id,
    d.meter_type,
    d.device_name
FROM dyno_units u
JOIN dyno_blocks b ON u.block_id = b.id
LEFT JOIN dyno_devices d ON u.dev_eui = d.dev_eui
ORDER BY b.block_name, u.unit_name;

-- Check for units without matching devices
SELECT 
    u.unit_name,
    u.dev_eui,
    b.block_name
FROM dyno_units u
JOIN dyno_blocks b ON u.block_id = b.id
LEFT JOIN dyno_devices d ON u.dev_eui = d.dev_eui
WHERE d.dev_eui IS NULL;

-- Check for devices without units
SELECT 
    d.dev_eui,
    d.device_name,
    d.meter_type
FROM dyno_devices d
LEFT JOIN dyno_units u ON d.dev_eui = u.dev_eui
WHERE u.dev_eui IS NULL;

-- ============================================
-- Useful Maintenance Queries
-- ============================================

-- Get all houses in a specific block
SELECT u.*, d.meter_type, d.device_name
FROM dyno_units u
JOIN dyno_devices d ON u.dev_eui = d.dev_eui
WHERE u.block_id = 1
ORDER BY u.unit_name;

-- Get device count by meter type
SELECT 
    d.meter_type,
    COUNT(*) as device_count,
    COUNT(DISTINCT u.block_id) as blocks_count
FROM dyno_devices d
LEFT JOIN dyno_units u ON d.dev_eui = u.dev_eui
GROUP BY d.meter_type;

-- Get latest data timestamp for each device
SELECT 
    d.dev_eui,
    d.device_name,
    d.meter_type,
    CASE 
        WHEN d.meter_type = 'ADW300' THEN (
            SELECT MAX(received_at) FROM lwn_adw300_data WHERE dev_eui = d.dev_eui
        )
        WHEN d.meter_type = 'ADW310' THEN (
            SELECT MAX(received_at) FROM lwn_adw310_data WHERE dev_eui = d.dev_eui
        )
        WHEN d.meter_type = 'DTSD4S' THEN (
            SELECT MAX(received_at) FROM lwn_dtsd4s_data WHERE dev_eui = d.dev_eui
        )
        WHEN d.meter_type = 'DTSD12S' THEN (
            SELECT MAX(received_at) FROM lwn_dtsd12s_data WHERE dev_eui LIKE d.dev_eui || '%'
        )
    END as last_data_timestamp
FROM devices d
ORDER BY d.meter_type, d.device_name;

-- ============================================
-- Cleanup Queries (Use with caution!)
-- ============================================

-- Remove test data (uncomment to use)
-- DELETE FROM units WHERE unit_name LIKE 'Test%';
-- DELETE FROM devices WHERE device_name LIKE 'Test%';
-- DELETE FROM blocks WHERE block_name LIKE 'Test%';

-- Reset sequences (uncomment to use)
-- SELECT setval('blocks_id_seq', (SELECT MAX(id) FROM blocks));
-- SELECT setval('units_id_seq', (SELECT MAX(id) FROM units));
-- SELECT setval('devices_id_seq', (SELECT MAX(id) FROM devices));

-- ============================================
-- Performance Monitoring Queries
-- ============================================

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('blocks', 'units', 'devices', 'lwn_adw300_data', 'lwn_adw310_data', 'lwn_dtsd4s_data', 'lwn_dtsd12s_data')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('blocks', 'units', 'devices', 'lwn_adw300_data', 'lwn_adw310_data', 'lwn_dtsd4s_data', 'lwn_dtsd12s_data')
ORDER BY idx_scan DESC;

-- ============================================
-- End of Setup Script
-- ============================================