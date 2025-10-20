const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'kepserver',
    host: process.env.DB_HOST || '182.180.69.171',
    database: process.env.DB_NAME || 'ems_db',
    password: process.env.DB_PASSWORD || 'P@ss.kep.786',
    port: process.env.DB_PORT || 5432,
});

// ADW300 - dev_eui is the meter_id
const getLatestADW300Energy = async () => {
    try {
        const query = `
            WITH ranked_data AS (
                SELECT 
                    dev_eui,
                    dev_eui as meter_id,
                    received_at,
                    voltage_a,
                    voltage_b,
                    voltage_c,
                    current_a,
                    current_b,
                    current_c,
                    energy_import,
                    'ADW300' as device_type,
                    ROW_NUMBER() OVER (PARTITION BY dev_eui ORDER BY received_at DESC) as rank
                FROM lwn_adw300_data
            )
            SELECT 
                dev_eui,
                meter_id,
                received_at,
                voltage_a,
                voltage_b,
                voltage_c,
                current_a,
                current_b,
                current_c,
                energy_import,
                device_type
            FROM ranked_data
            WHERE rank = 1
            ORDER BY dev_eui;
        `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching ADW300 energy data:', error);
        throw error;
    }
};

// ADW310 - dev_eui is the meter_id
const getLatestADW310Energy = async () => {
    try {
        const query = `
            WITH ranked_data AS (
                SELECT 
                    dev_eui,
                    dev_eui as meter_id,
                    received_at,
                    voltage,
                    current,
                    energy_import,
                    'ADW310' as device_type,
                    ROW_NUMBER() OVER (PARTITION BY dev_eui ORDER BY received_at DESC) as rank
                FROM lwn_adw310_data
            )
            SELECT 
                dev_eui,
                meter_id,
                received_at,
                voltage,
                current,
                energy_import,
                device_type
            FROM ranked_data
            WHERE rank = 1
            ORDER BY dev_eui;
        `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching ADW310 energy data:', error);
        throw error;
    }
};

// DTSD 4S + 12S - meter_id is dev_eui + addr combination
const getLatestDTSDEnergy = async () => {
    try {
        const queries = [
            // DTSD-4S
            `
            WITH ranked_data AS (
                SELECT 
                    dev_eui,
                    addr,
                    channel,
                    CONCAT(dev_eui, '_', addr) AS meter_id,
                    received_at,
                    voltage_a,
                    voltage_b,
                    voltage_c,
                    current_a,
                    current_b,
                    current_c,
                    energy_import,
                    'DTSD-4S' AS device_type,
                    ROW_NUMBER() OVER (PARTITION BY dev_eui, addr ORDER BY received_at DESC) as rank
                FROM lwn_dtsd4s_data
            )
            SELECT 
                dev_eui,
                addr,
                channel,
                meter_id,
                received_at,
                voltage_a,
                voltage_b,
                voltage_c,
                current_a,
                current_b,
                current_c,
                energy_import,
                device_type
            FROM ranked_data
            WHERE rank = 1
            `,
            // DTSD-12S
            `
            WITH ranked_data AS (
                SELECT 
                    dev_eui,
                    addr,
                    channel,
                    CONCAT(dev_eui, '_', addr) AS meter_id,
                    received_at,
                    voltage,
                    current,
                    energy_import,
                    'DTSD-12S' AS device_type,
                    ROW_NUMBER() OVER (PARTITION BY dev_eui, addr, channel ORDER BY received_at DESC) as rank
                FROM lwn_dtsd12s_data
            )
            SELECT 
                dev_eui,
                addr,
                channel,
                meter_id,
                received_at,
                voltage,
                current,
                energy_import,
                device_type
            FROM ranked_data
            WHERE rank = 1
            `
        ];

        const [dtsd4s, dtsd12s] = await Promise.all([
            pool.query(queries[0]),
            pool.query(queries[1])
        ]);

        return [...dtsd4s.rows, ...dtsd12s.rows];
    } catch (error) {
        console.error('Error fetching DTSD energy data:', error);
        throw error;
    }
};

// ALL Combined - with proper meter_id mapping
const getAllLatestEnergy = async () => {
    try {
        const [adw300, adw310, dtsd] = await Promise.all([
            getLatestADW300Energy(),
            getLatestADW310Energy(),
            getLatestDTSDEnergy()
        ]);

        return {
            // ADW300: dev_eui IS the meter_id (already set in query)
            adw300: adw300, // meter_id already correctly set to dev_eui
            
            // ADW310: dev_eui IS the meter_id (already set in query)
            adw310: adw310, // meter_id already correctly set to dev_eui
            
            // DTSD: meter_id is dev_eui + addr combination (already set in query)
            dtsd: dtsd // meter_id already correctly set to dev_eui_addr
        };
    } catch (error) {
        console.error('Error fetching all energy data:', error);
        throw error;
    }
};

// Helper function to get specific meter data by meter_id
const getMeterById = async (meterId) => {
    try {
        // Check if it's an ADW300 meter (dev_eui format)
        if (!meterId.includes('_')) {
            // Try ADW300 first
            const adw300Query = `
                SELECT 
                    dev_eui,
                    dev_eui as meter_id,
                    received_at,
                    voltage_a,
                    voltage_b,
                    voltage_c,
                    current_a,
                    current_b,
                    current_c,
                    energy_import,
                    'ADW300' as device_type
                FROM lwn_adw300_data 
                WHERE dev_eui = $1 
                ORDER BY received_at DESC 
                LIMIT 1
            `;
            
            const adw300Result = await pool.query(adw300Query, [meterId]);
            if (adw300Result.rows.length > 0) {
                return adw300Result.rows[0];
            }

            // Try ADW310 if not found in ADW300
            const adw310Query = `
                SELECT 
                    dev_eui,
                    dev_eui as meter_id,
                    received_at,
                    voltage,
                    current,
                    energy_import,
                    'ADW310' as device_type
                FROM lwn_adw310_data 
                WHERE dev_eui = $1 
                ORDER BY received_at DESC 
                LIMIT 1
            `;
            
            const adw310Result = await pool.query(adw310Query, [meterId]);
            if (adw310Result.rows.length > 0) {
                return adw310Result.rows[0];
            }
        } else {
            // DTSD meter format (dev_eui_addr)
            const [devEui, addr] = meterId.split('_');
            
            // Try DTSD-4S first
            const dtsd4sQuery = `
                SELECT 
                    dev_eui,
                    addr,
                    channel,
                    CONCAT(dev_eui, '_', addr) AS meter_id,
                    received_at,
                    voltage_a,
                    voltage_b,
                    voltage_c,
                    current_a,
                    current_b,
                    current_c,
                    energy_import,
                    'DTSD-4S' AS device_type
                FROM lwn_dtsd4s_data 
                WHERE dev_eui = $1 AND addr = $2
                ORDER BY received_at DESC 
                LIMIT 1
            `;
            
            const dtsd4sResult = await pool.query(dtsd4sQuery, [devEui, addr]);
            if (dtsd4sResult.rows.length > 0) {
                return dtsd4sResult.rows[0];
            }

            // Try DTSD-12S if not found in DTSD-4S
            const dtsd12sQuery = `
                SELECT 
                    dev_eui,
                    addr,
                    channel,
                    CONCAT(dev_eui, '_', addr) AS meter_id,
                    received_at,
                    voltage,
                    current,
                    energy_import,
                    'DTSD-12S' AS device_type
                FROM lwn_dtsd12s_data 
                WHERE dev_eui = $1 AND addr = $2
                ORDER BY received_at DESC 
                LIMIT 1
            `;
            
            const dtsd12sResult = await pool.query(dtsd12sQuery, [devEui, addr]);
            if (dtsd12sResult.rows.length > 0) {
                return dtsd12sResult.rows[0];
            }
        }

        return null; // Meter not found
    } catch (error) {
        console.error('Error fetching meter by ID:', error);
        throw error;
    }
};

// Helper function to get historical data for a specific meter
const getHistoricalDataByMeterId = async (meterId, hours = 24) => {
    try {
        const timeThreshold = new Date();
        timeThreshold.setHours(timeThreshold.getHours() - hours);

        if (!meterId.includes('_')) {
            // ADW300 or ADW310 meter
            const adw300Query = `
                SELECT 
                    dev_eui,
                    dev_eui as meter_id,
                    received_at,
                    voltage_a,
                    voltage_b,
                    voltage_c,
                    current_a,
                    current_b,
                    current_c,
                    energy_import,
                    'ADW300' as device_type
                FROM lwn_adw300_data 
                WHERE dev_eui = $1 AND received_at >= $2
                ORDER BY received_at ASC
            `;

            const adw300Result = await pool.query(adw300Query, [meterId, timeThreshold]);
            if (adw300Result.rows.length > 0) {
                return adw300Result.rows;
            }

            const adw310Query = `
                SELECT 
                    dev_eui,
                    dev_eui as meter_id,
                    received_at,
                    voltage,
                    current,
                    energy_import,
                    'ADW310' as device_type
                FROM lwn_adw310_data 
                WHERE dev_eui = $1 AND received_at >= $2
                ORDER BY received_at ASC
            `;

            const adw310Result = await pool.query(adw310Query, [meterId, timeThreshold]);
            return adw310Result.rows;
        } else {
            // DTSD meter
            const [devEui, addr] = meterId.split('_');

            const dtsd4sQuery = `
                SELECT 
                    dev_eui,
                    addr,
                    channel,
                    CONCAT(dev_eui, '_', addr) AS meter_id,
                    received_at,
                    voltage_a,
                    voltage_b,
                    voltage_c,
                    current_a,
                    current_b,
                    current_c,
                    energy_import,
                    'DTSD-4S' AS device_type
                FROM lwn_dtsd4s_data 
                WHERE dev_eui = $1 AND addr = $2 AND received_at >= $3
                ORDER BY received_at ASC
            `;

            const dtsd4sResult = await pool.query(dtsd4sQuery, [devEui, addr, timeThreshold]);
            if (dtsd4sResult.rows.length > 0) {
                return dtsd4sResult.rows;
            }

            const dtsd12sQuery = `
                SELECT 
                    dev_eui,
                    addr,
                    channel,
                    CONCAT(dev_eui, '_', addr) AS meter_id,
                    received_at,
                    voltage,
                    current,
                    energy_import,
                    'DTSD-12S' AS device_type
                FROM lwn_dtsd12s_data 
                WHERE dev_eui = $1 AND addr = $2 AND received_at >= $3
                ORDER BY received_at ASC
            `;

            const dtsd12sResult = await pool.query(dtsd12sQuery, [devEui, addr, timeThreshold]);
            return dtsd12sResult.rows;
        }
    } catch (error) {
        console.error('Error fetching historical data by meter ID:', error);
        throw error;
    }
};

module.exports = {
    getLatestADW300Energy,
    getLatestADW310Energy,
    getLatestDTSDEnergy,
    getAllLatestEnergy,
    getMeterById,
    getHistoricalDataByMeterId
};