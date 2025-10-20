const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 5000;
const adw300Cache = new Map();

// Cache cleanup every 10 minutes
setInterval(() => {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [devEui, entry] of adw300Cache.entries()) {
        if (now - entry.received_at > staleThreshold) {
            console.log(`Clearing stale cache for ${devEui}`);
            adw300Cache.delete(devEui);
        }
    }
}, 10 * 60 * 1000);

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'kepserver',
    host: process.env.DB_HOST || '182.180.69.171',
    database: process.env.DB_NAME || 'ems_db',
    password: process.env.DB_PASSWORD || 'P@ss.kep.786',
    port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Meter type handlers
const meterHandlers = {
    ADW300: processADW300,
    ADW310: processADW310,
    'DTSD-4S': processDTSD,
    'DTSD-12S': processDTSD,
    'DTSD1352_4S-923': processDTSD
};

// Main uplink handler
app.post('/uplink', async (req, res) => {
    const uplink = req.body;
    const { deviceInfo, time, object = {}, level, code, description } = uplink;
    const { devEui, deviceName } = deviceInfo || {};
    
    if (!deviceInfo || !devEui) {
        return res.status(400).send('Invalid payload: missing device information');
    }

    const meterType = getMeterType(deviceName);
    const timestamp = new Date(time || Date.now()).toISOString().replace(/[:.]/g, '-');
    const fileName = `${deviceName}_${devEui}_${timestamp}.json`;
    const filePath = path.join(logsDir, fileName);

    try {
        // Save raw payload
        fs.writeFileSync(filePath, JSON.stringify(uplink, null, 2));

        // Handle error messages separately
        if (level === 'ERROR') {
            await handleErrorMessage(uplink);
            return res.status(200).send('Error logged');
        }

        // Process based on meter type
        const handler = meterHandlers[meterType] || meterHandlers.ADW300;
        await handler(uplink);

        res.status(200).send('OK');
    } catch (err) {
        console.error('Processing Error:', err);
        res.status(500).json({ 
            error: 'Processing failed',
            details: err.message 
        });
    }
});

// Error message handler
async function handleErrorMessage(uplink) {
    const { deviceInfo, time, code, description, context } = uplink;
    
    await pool.query(
        `INSERT INTO lwn_device_errors 
        (dev_eui, error_time, error_code, description, context) 
        VALUES ($1, $2, $3, $4, $5)`,
        [
            deviceInfo.devEui,
            time || new Date(),
            code,
            description,
            JSON.stringify(context || {})
        ]
    );
}

// ADW300 Processor with improved parameter mapping
async function processADW300(uplink) {
    const { deviceInfo, time, object = {} } = uplink;
    const { devEui } = deviceInfo;
    const data = object.data || object;
    
    // Get or create cache entry
    const cachedData = adw300Cache.get(devEui) || {
        dev_eui: devEui,
        received_at: time || new Date(),
        parameters: new Set(),
        data: {}
    };

    // Update cached data with new values using improved mapping
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
            cachedData.data[key] = value;
            cachedData.parameters.add(key);
        }
    }

    // Check if we have enough parameters to save
    const hasRequiredData = checkADW300DataCompleteness(cachedData.data);

    if (hasRequiredData) {
        await insertCompleteADW300Data(cachedData, uplink);
        adw300Cache.delete(devEui);
    } else {
        cachedData.received_at = time || new Date();
        adw300Cache.set(devEui, cachedData);
        console.log(`Partial data cached for ${devEui}`);
    }
}

function checkADW300DataCompleteness(data) {
    // Require either basic measurements or energy data
    const hasBasicMeasurements = (
        (data.Ua !== undefined || data.UaTHD !== undefined) &&
        (data.Ia !== undefined || data.IaTHD !== undefined)
    );
    
    const hasEnergyData = (
        data.EPI !== undefined || 
        data.EPIc !== undefined || 
        data.EPc !== undefined
    );

    return hasBasicMeasurements || hasEnergyData;
}

async function insertCompleteADW300Data(cachedData, uplink) {
    const { dev_eui, received_at, data } = cachedData;
    
    const fields = {
        dev_eui,
        received_at,
        // Voltage mappings (including THD variants)
        voltage_a: data.Ua || data.UaTHD || null,
        voltage_b: data.Ub || data.UbTHD || null,
        voltage_c: data.Uc || data.UcTHD || null,
        // Current mappings (including THD variants)
        current_a: data.Ia || data.IaTHD || null,
        current_b: data.Ib || data.IbTHD || null,
        current_c: data.Ic || data.IcTHD || null,
        // Power mappings
        power_a: data.Pa || null,
        power_b: data.Pb || null,
        power_c: data.Pc || null,
        total_power: data.P || null,
        power_factor: data.Pf || null,
        // Digital inputs
        di1: data.DI1 || null,
        di2: data.DI2 || null,
        di3: data.DI3 || null,
        di4: data.DI4 || null,
        // Energy mappings (multiple possible fields)
        energy_import: data.EPI || data.EPIc || data.EPc || null,
        energy_export: data.EPE || data.EPEc || null,
        // Demand data
        max_demand: data.MD || null,
        md_timestamp: data.MDTimeStamp || null,
        forward_active_demand: data.RD || null,
        // Quality measurements
        voltage_imbalance: data.VUB || null,
        current_imbalance: data.CUB || null,
        frequency: data.Hz || null,
        // Additional fields
        temp_a: data.TempA || null,
        temp_b: data.TempB || null,
        temp_c: data.TempC || null,
        // Raw payload
        raw_payload: uplink
    };

    const columns = Object.keys(fields).join(', ');
    const values = Object.values(fields);
    const placeholders = values.map((_, i) => `$${i+1}`).join(', ');

    await pool.query(
        `INSERT INTO lwn_adw300_data (${columns}) VALUES (${placeholders})`,
        values
    );
    
    console.log(`Complete data inserted for ${dev_eui}`);
}

// ADW310 Processor
async function processADW310(uplink) {
    const { deviceInfo, time, object = {} } = uplink;
    const data = object.data || object;
    
    const fields = {
        dev_eui: deviceInfo.devEui,
        received_at: time || new Date(),
        voltage: data.U || null,
        current: data.I || null,
        power: data.P || null,
        energy_import: data.EPI || null,
        energy_export: data.EPE || null,
        raw_payload: uplink
    };

    await pool.query(
        `INSERT INTO lwn_adw310_data 
        (dev_eui, received_at, voltage, current, power, energy_import, energy_export, raw_payload) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        Object.values(fields)
    );
}

// DTSD Processor with improved channel handling
async function processDTSD(uplink) {
    const { deviceInfo, time, object = {} } = uplink;
    const { devEui, deviceName } = deviceInfo;
    const is12S = deviceName.includes('12S');
    const channelCount = is12S ? 12 : 4;
    
    // Extract channel from addr if present (format "35_2" means channel 2)
    let baseChannel = 1;
    if (object.addr) {
        const parts = object.addr.split('_');   
        if (parts.length > 1) {
         }
    }

    for (let channel = baseChannel; channel <= baseChannel + channelCount - 1; channel++) {
        const channelData = extractChannelData(object, channel, is12S);
        if (!channelData) continue;

        console.log("DTSD Data",object )

        await pool.query(
            `INSERT INTO lwn_dtsd_data 
            (dev_eui, channel, received_at, voltage, current, power, energy_import, energy_export, raw_payload, addr) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                `${devEui}_${channel}`,
                channel,
                time || new Date(),
                channelData.voltage,
                channelData.current,
                channelData.power,
                channelData.energy_import,
                channelData.energy_export,
                uplink,
                object.addr
            ]
        );
    }
}

// Helper functions
function getMeterType(deviceName) {
    if (!deviceName) return 'ADW300'; // default
    
    if (deviceName.includes('ADW300')) return 'ADW300';
    if (deviceName.includes('ADW310')) return 'ADW310';
    if (deviceName.includes('12S')) return 'DTSD-12S';
    if (deviceName.includes('4S') || deviceName.includes('DTSD1352')) return 'DTSD-4S';
    return 'ADW300'; // default
}

function extractChannelData(object, channel, is12S) {
    const suffix = is12S ? ` (${channel})` : '';
    
    const voltage = object[`U${suffix}`] || object[`Ua${suffix}`] || null;
    const current = object[`I${suffix}`] || object[`Ia${suffix}`] || null;
    const power = object[`P${suffix}`] || object[`Pa${suffix}`] || null;
    const energy_import = object[`EPI${suffix}`] || null;
    const energy_export = object[`EPE${suffix}`] || null;
    
    if (voltage === null && current === null && power === null) {
        return null;
    }
    
    return { voltage, current, power, energy_import, energy_export };
}


// Add near the top with other requires
const energyController = require('./controllers/energyController');

// Add these routes before app.listen()
app.get('/api/energy/adw300', async (req, res) => {
    try {
        const data = await energyController.getLatestADW300Energy();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/energy/adw310', async (req, res) => {
    try {
        const data = await energyController.getLatestADW310Energy();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/energy/dtsd', async (req, res) => {
    try {
        const data = await energyController.getLatestDTSDEnergy();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/energy/all', async (req, res) => {
    try {
        const data = await energyController.getAllLatestEnergy();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Logs directory: ${logsDir}`);
});