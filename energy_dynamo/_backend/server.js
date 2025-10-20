const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
const {
  getSites,
  getCurrent,
  getConsumption,
  getTrend,
  getConsumptionSummary
} =  require("./controllers/siteController.js");

const billingRoutes = require('./routes/billing');
// const energyRoutes = require('./routes/energyRoutesAdw'); 
const adwEnergyRoutes = require('./routes/adwEnergyRoutes');
const { hospitalUplinkHandler } = require('./controllers/hospitalController');
const blockUnitRoutes = require('./routes/blockUnitRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
// add the route


// Add after your existing middleware setup


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
// const logsDir = path.join(__dirname, 'logs');
// if (!fs.existsSync(logsDir)) {
//     fs.mkdirSync(logsDir, { recursive: true });
// }

// Updated meter type handlers with new profile names
const meterHandlers = {
    'ADW300-923': processADW300,
    'ADW310-923': processADW310,
    'DTSD1352_4S-923': processDTSD,
    'DTSD1352_12S-923': processDTSD
};

// Main uplink handler
app.post('/uplink', async (req, res) => {
    const uplink = req.body;
    const { deviceInfo, time, object = {}, level, code, description } = uplink;
    const { devEui, deviceName, deviceProfileName } = deviceInfo || {};

    if (!deviceInfo || !devEui) {
        return res.status(400).send('Invalid payload: missing device information');
    }

    // Use deviceProfileName for meter type recognition
    const meterType = getMeterType(deviceProfileName);
    const timestamp = new Date(time || Date.now()).toISOString().replace(/[:.]/g, '-');
    const fileName = `${deviceProfileName || deviceName}_${devEui}_${timestamp}.json`;
    // const filePath = path.join(logsDir, fileName);

    try {
        // Save raw payload
        // fs.writeFileSync(filePath, JSON.stringify(uplink, null, 2));

        // Handle error messages separately
        if (level === 'ERROR') {
            await handleErrorMessage(uplink);
            return res.status(200).send('Error logged');
        }

        // Process based on meter type using deviceProfileName
        const handler = meterHandlers[meterType];
        if (handler) {
            console.log(`Processed ${meterType} data for device ${devEui}`);
            await handler(uplink);
            
        } else {
            console.warn(`No handler found for meter type: ${meterType} (deviceProfileName: ${deviceProfileName})`);
            // Default to ADW300 handler if no specific handler found
            // await processADW300(uplink);
        }

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

    // Merge new data into cache
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
            cachedData.data[key] = value;
            cachedData.parameters.add(key);
        }
    }

    // Update timestamp to latest packet
    cachedData.received_at = time || new Date();
    adw300Cache.set(devEui, cachedData);

    // Check completeness
    const hasRequiredData = checkADW300DataCompleteness(cachedData.data);

    if (hasRequiredData) {
        await insertCompleteADW300Data(cachedData, uplink);
        adw300Cache.delete(devEui);
    } else {
        console.log(`Partial ADW300 data cached for ${devEui}`);
    }
}

function checkADW300DataCompleteness(data) {
    // Require ALL mandatory fields
    // return (
    //     data.Ua !== undefined &&
    //     data.Ub !== undefined &&
    //     data.Uc !== undefined &&
    //     data.Ia !== undefined &&
    //     data.Ib !== undefined &&
    //     data.Ic !== undefined &&
    //     data.Pa !== undefined &&
    //     data.Pb !== undefined &&
    //     data.Pc !== undefined &&
    //     data.P !== undefined &&
    //     data.Pf !== undefined &&
    //     data.DI1 !== undefined &&
    //     data.DI2 !== undefined &&
    //     data.DI3 !== undefined &&
    //     data.DI4 !== undefined &&
    //     data.EPI !== undefined &&
    //     data.EPE !== undefined &&
    //     data.MD !== undefined &&
    //     data.MDTimeStamp !== undefined &&
    //     data.RD !== undefined &&
    //     data.VUB !== undefined &&
    //     data.CUB !== undefined &&
    //     data.Hz !== undefined &&
    //     data.TempA !== undefined &&
    //     data.TempB !== undefined &&
    //     data.TempC !== undefined &&
    //     data.deviceName !== undefined
    // );


    // Require all 8 key parameters to be defined (not null/undefined)
    return (
        data.Ua !== undefined &&
        data.Ub !== undefined &&
        data.Uc !== undefined &&
        data.Pa !== undefined &&
        data.Pb !== undefined &&
        data.Pc !== undefined &&
        data.P !== undefined &&
        data.EPI !== undefined &&
        data.EPE !== undefined
    );

}

async function insertCompleteADW300Data(cachedData, uplink) {
    const { dev_eui, received_at, data } = cachedData;
    const { deviceInfo } = uplink;

    console.log("org_id is :",deviceInfo.tenantId)

    const fields = {
        dev_eui,
        device_name:            deviceInfo.deviceName || null,
        received_at,        
        voltage_a:              data.Ua     || null,
        voltage_b:              data.Ub     || null,
        voltage_c:              data.Uc     || null,
        current_a:              data.Ia     || null,
        current_b:              data.Ib     || null,
        current_c:              data.Ic     || null,
        power_a:                data.Pa     || null,
        power_b:                data.Pb     || null,
        power_c:                data.Pc     || null,
        total_power:            data.P      || null,
        power_factor:           data.Pf     || null,
        di1:                    data.DI1    || null,
        di2:                    data.DI2    || null,
        di3:                    data.DI3    || null,
        di4:                    data.DI4    || null,
        energy_import:          data.EPI    || null,
        energy_export:          data.EPE    || null,
        max_demand:             data.MD     || null,
        md_timestamp:           data.MDTimeStamp || null,
        forward_active_demand:  data.RD || null,
        voltage_imbalance:      data.VUB || null,
        current_imbalance:      data.CUB || null,
        frequency:              data.Hz || null,
        temp_a:                 data.TempA || null,
        temp_b:                 data.TempB || null,
        temp_c:                 data.TempC || null,
        raw_payload: uplink,
        org_id:                deviceInfo.tenantId || null,
    };

    const columns = Object.keys(fields).join(', ');
    const values = Object.values(fields);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    await pool.query(
        `INSERT INTO lwn_adw300_data (${columns}) VALUES (${placeholders})`,
        values
    );

    console.log(`✅ Complete ADW300 data inserted for ${dev_eui}`);
}



// ADW310 Processor
async function processADW310(uplink) {
    const { deviceInfo, time, object = {} } = uplink;
    const data = object.data || object;

    const fields = {
        dev_eui: deviceInfo.devEui,
        device_name: deviceInfo.deviceName || null,
        received_at: time || new Date(),
        voltage: data.U || null,
        current: data.I || null,
        power: data.P || null,
        energy_import: data.EPI || null,
        energy_export: data.EPE || null,
        raw_payload: uplink,
        org_id: deviceInfo.tenantId || null,

    };

    await pool.query(
        `INSERT INTO lwn_adw310_data 
        (dev_eui, device_name, received_at, voltage, current, power, energy_import, energy_export, raw_payload, org_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        Object.values(fields)
    );
}


// DTSD Processor with improved channel handling
async function processDTSD(uplink) {
    const { deviceInfo, time, deviceName, object = {} } = uplink;
    const { devEui, deviceProfileName } = deviceInfo;
    const is12S = deviceProfileName === 'DTSD1352_12S-923';
    const tableName = is12S ? 'lwn_dtsd12s_data' : 'lwn_dtsd4s_data';
    const timestamp = time || new Date();
    const addr = object.addr || null; // Modbus address of DTSD meter

    if (!addr) {
        console.warn(`Skipping DTSD data: missing 'addr' in payload`);
        return;
    }
    
    console.log("IS 12S", is12S, deviceProfileName, addr);
    
    // Create composite identifier for dev_eui column
    const compositeDevEui = devEui + "_" + addr;
    // console.log("Processing meter with composite ID:", compositeDevEui);
    
    if (!is12S) {
        // DTSD-4S (3-phase meter)
        // console.log('→ DTSD-4S', object);
        
        const voltage_a = object.Ua || null;
        const voltage_b = object.Ub || null;
        const voltage_c = object.Uc || null;
        const current_a = object.Ia || null;
        const current_b = object.Ib || null;
        const current_c = object.Ic || null;
        const power = object.P || null;
        const energy_import = object.EPI || null;
        const energy_export = object.EPE || null;

        const fields = {
            dev_eui: compositeDevEui, // dev_eui + addr as composite identifier
            addr: addr, // Keep original addr for reference
            channel: 1, // DTSD-4S typically uses channel 1 or you can set based on your logic
            received_at: timestamp,
            voltage_a,
            voltage_b,
            voltage_c,
            current_a,
            current_b,
            current_c,
            power,
            energy_import,
            energy_export,
            raw_payload: uplink,
            device_name: deviceName || null,
        };

        const columns = Object.keys(fields).join(', ');
        const placeholders = Object.keys(fields).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(fields);

        await pool.query(
            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
            values
        );

        // console.log(`DTSD-4S data inserted for composite meter ID: ${compositeDevEui}`);

    } else {
        // DTSD-12S (single-phase meter with multiple channels)
        console.log('→ DTSD-12S', object);
        
        const voltage = object.U || null;
        const current = object.I || null;
        const power = object.P || null;
        const energy_import = object.EPI || null;

        // Extract channel from addr (e.g., "36_5" -> channel 5)
        const addrParts = addr.split('_');
        const baseAddr = addrParts[0]; // e.g., "36"
        const channel = addrParts[1] ? parseInt(addrParts[1]) : 1; // e.g., 5, default to 1 if not found

        // Create composite identifier using base address (without channel suffix)
        // const compositeDevEuiBase = devEui + "_" + baseAddr;

        // Only insert if we have some meaningful data
        // if (voltage !== null || current !== null || power !== null || energy_import !== null) {
            const fields = {
                dev_eui: compositeDevEui, // dev_eui + base_addr as composite identifier
                addr: addr, // Keep full addr (e.g., "36_5")
                channel: channel, // Channel within this meter
                received_at: timestamp,
                voltage,
                current,
                power,
                energy_import,
                raw_payload: uplink,
                device_name: deviceName || null,
            };

            const columns = Object.keys(fields).join(', ');
            const placeholders = Object.keys(fields).map((_, i) => `$${i + 1}`).join(', ');
            const values = Object.values(fields);

            await pool.query(
                `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
                values
            );
            
            console.log(`DTSD-12S data inserted for composite meter ID: ${compositeDevEui}, channel: ${channel}`);
        // } else {
        //     console.log(`Skipping DTSD-12S data for meter ${compositeDevEui} channel ${channel} - all values are null/zero`);
        // }
    }
}

// Updated helper function to use deviceProfileName
function getMeterType(deviceProfileName) {
    if (!deviceProfileName) {
        console.warn('deviceProfileName is missing, no default');
        return 'ADW300-923'; // default
    }

    // Direct mapping based on exact profile names
    const profileToType = {
        'ADW300-923': 'ADW300-923',
        'ADW310-923': 'ADW310-923',
        'DTSD1352_4S-923': 'DTSD1352_4S-923',
        'DTSD1352_12S-923': 'DTSD1352_12S-923'
    };

    const meterType = profileToType[deviceProfileName];
    
    if (!meterType) {
        console.warn(`Unknown deviceProfileName: ${deviceProfileName}, defaulting to ADW300-923`);
        return 'ADW300-923'; // default
    }

    console.log(`Detected meter type: ${meterType} from deviceProfileName: ${deviceProfileName}`);
    return meterType;
}

function extractChannelData(object, channel, is12S) {
    const suffix = is12S ? ` (${channel})` : '';

    const voltage = object[`U${suffix}`] //|| object[`Ua${suffix}`]|| object[`Ua${suffix}`] || null;
    const current = object[`I${suffix}`] || object[`Ia${suffix}`] || null;
    const power = object[`P${suffix}`] || null;
    const energy_import = object[`EPI${suffix}`] || null;
    const energy_export = object[`EPE${suffix}`] || null;

    if (voltage === null && current === null && power === null) {
        return null;
    }

    return { voltage, current, power, energy_import, energy_export };
}

// Add near the top with other requires
const energyController = require('./controllers/energyController');

app.use('/api/billing', billingRoutes);
// app.use('/api/adw', energyRoutes);
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

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Energy Monitoring API'
  });
});
app.post('/uplink/hospital', hospitalUplinkHandler);
// Mount energy-related routes under /api/adw
app.use('/api/adw', adwEnergyRoutes);

//settings page
app.use('/api/structure', blockUnitRoutes);
app.use('/api/devices', deviceRoutes);
// Get sites data for hospital
app.get("/api/sites", getSites);
app.get("/api/sites/:id/current", getCurrent);
app.get("/api/sites/:id/consumption", getConsumption);
app.get("/api/sites/:id/trend", getTrend);
app.get("/api/sites/:id/summary", getConsumptionSummary);
// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // console.log(`Logs directory: ${logsDir}`);
    console.log('Supported deviceProfileNames:');
    console.log('- ADW300-923');
    console.log('- ADW310-923'); 
    console.log('- DTSD1352_4S-923');
    console.log('- DTSD1352_12S-923');
});