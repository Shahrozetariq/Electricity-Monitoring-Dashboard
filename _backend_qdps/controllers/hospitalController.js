// controllers/hospitalUplinkController.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'kepserver',
  host: process.env.DB_HOST || '182.180.69.171',
  database: process.env.DB_NAME || 'ems_db',
  password: process.env.DB_PASSWORD || 'P@ss.kep.786',
  port: process.env.DB_PORT || 5432,
});

// ---- Cache for ADW300 (hospital) ----
const hspAdw300Cache = new Map();

// Cleanup every 10 minutes; drop entries older than 5 minutes
setInterval(() => {
  const now = new Date();
  const staleThreshold = 5 * 60 * 1000;
  for (const [devEui, entry] of hspAdw300Cache.entries()) {
    if (now - entry.received_at > staleThreshold) {
      console.log(`(HSP) Clearing stale cache for ${devEui}`);
      hspAdw300Cache.delete(devEui);
    }
  }
}, 10 * 60 * 1000);

// -------------------- Error messages --------------------
async function handleHospitalErrorMessage(uplink) {
  const { deviceInfo, time, code, description, context } = uplink;
  await pool.query(
    `INSERT INTO hsp_device_errors
     (dev_eui, error_time, error_code, description, context)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      deviceInfo?.devEui || null,
      time || new Date(),
      code || null,
      description || null,
      JSON.stringify(context || {}),
    ]
  );
}

// -------------------- ADW300 --------------------
function checkHSP_ADW300DataCompleteness(data) {
  // Same keys as your existing simplified check in server.js
  return (
    data.Ua !== undefined &&
    data.Ub !== undefined &&
    data.Uc !== undefined &&
    data.Pa !== undefined &&
    data.Pb !== undefined &&
    data.Pc !== undefined &&
    data.P   !== undefined &&
    data.EPI !== undefined &&
    data.EPE !== undefined
  );
}

async function insertHospitalADW300Data(cachedData, uplink) {
  const { dev_eui, received_at, data } = cachedData;
  const { deviceInfo } = uplink;

  const fields = {
    dev_eui,
    device_name:            deviceInfo?.deviceName || null,
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
    org_id:                 deviceInfo?.tenantId || null,
  };

  const columns = Object.keys(fields).join(', ');
  const values = Object.values(fields);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  await pool.query(
    `INSERT INTO hsp_adw300_data (${columns}) VALUES (${placeholders})`,
    values
  );

  console.log(`🏥 (HSP) Complete ADW300 data inserted for ${dev_eui}`);
}

async function processHospitalADW300(uplink) {
  const { deviceInfo, time, object = {} } = uplink;
  const { devEui } = deviceInfo || {};
  const data = object.data || object;

  if (!devEui) return;

  // Get or init cache entry
  const cachedData = hspAdw300Cache.get(devEui) || {
    dev_eui: devEui,
    received_at: time || new Date(),
    parameters: new Set(),
    data: {},
  };

  // Merge new data into cache
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      cachedData.data[key] = value;
      cachedData.parameters.add(key);
    }
  }

  cachedData.received_at = time || new Date();
  hspAdw300Cache.set(devEui, cachedData);

  // Check completeness
  const hasRequiredData = checkHSP_ADW300DataCompleteness(cachedData.data);
  if (hasRequiredData) {
    await insertHospitalADW300Data(cachedData, uplink);
    hspAdw300Cache.delete(devEui);
  } else {
    console.log(`(HSP) Partial ADW300 data cached for ${devEui}`);
  }
}

// -------------------- ADW310 --------------------
async function processHospitalADW310(uplink) {
  const { deviceInfo, time, object = {} } = uplink;
  const data = object.data || object;

  const fields = {
    dev_eui: deviceInfo?.devEui || null,
    device_name: deviceInfo?.deviceName || null,
    received_at: time || new Date(),
    voltage: data.U || null,
    current: data.I || null,
    power: data.P || null,
    energy_import: data.EPI || null,
    energy_export: data.EPE || null,
    raw_payload: uplink,
    org_id: deviceInfo?.tenantId || null,
  };

  await pool.query(
    `INSERT INTO hsp_adw310_data
     (dev_eui, device_name, received_at, voltage, current, power, energy_import, energy_export, raw_payload, org_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    Object.values(fields)
  );

  console.log(`🏥 (HSP) ADW310 data inserted for ${fields.dev_eui}`);
}

// -------------------- DTSD (4S / 12S) --------------------
async function processHospitalDTSD(uplink) {
  const { deviceInfo, time, deviceName, object = {} } = uplink;
  const { devEui, deviceProfileName } = deviceInfo || {};
  const is12S = deviceProfileName === 'DTSD1352_12S-923';
  const tableName = is12S ? 'hsp_dtsd12s_data' : 'hsp_dtsd4s_data';
  const timestamp = time || new Date();
  const addr = object.addr || null;

  if (!addr || !devEui) {
    console.warn(`(HSP) Skipping DTSD: missing addr/devEui`);
    return;
  }

  const compositeDevEui = devEui + "_" + addr;

  if (!is12S) {
    const fields = {
      dev_eui: compositeDevEui,
      addr,
      channel: 1,
      received_at: timestamp,
      voltage_a: object.Ua || null,
      voltage_b: object.Ub || null,
      voltage_c: object.Uc || null,
      current_a: object.Ia || null,
      current_b: object.Ib || null,
      current_c: object.Ic || null,
      power: object.P || null,
      energy_import: object.EPI || null,
      energy_export: object.EPE || null,
      raw_payload: uplink,
      device_name: deviceName || deviceInfo?.deviceName || null,
    };

    const cols = Object.keys(fields).join(', ');
    const vals = Object.values(fields);
    const ph = vals.map((_, i) => `$${i + 1}`).join(', ');

    await pool.query(`INSERT INTO ${tableName} (${cols}) VALUES (${ph})`, vals);
  } else {
    const addrParts = addr.split('_');
    const channel = addrParts[1] ? parseInt(addrParts[1]) : 1;

    const fields = {
      dev_eui: compositeDevEui,
      addr,
      channel,
      received_at: timestamp,
      voltage: object.U || null,
      current: object.I || null,
      power: object.P || null,
      energy_import: object.EPI || null,
      raw_payload: uplink,
      device_name: deviceName || deviceInfo?.deviceName || null,
    };

    const cols = Object.keys(fields).join(', ');
    const vals = Object.values(fields);
    const ph = vals.map((_, i) => `$${i + 1}`).join(', ');

    await pool.query(`INSERT INTO ${tableName} (${cols}) VALUES (${ph})`, vals);
  }

  console.log(`🏥 (HSP) DTSD data inserted for ${compositeDevEui}`);
}

// -------------------- Meter type helper --------------------
function getMeterType(deviceProfileName) {
  if (!deviceProfileName) {
    console.warn('(HSP) deviceProfileName missing; default to ADW300-923');
    return 'ADW300-923';
  }
  const profileToType = {
    'ADW300-923': 'ADW300-923',
    'ADW310-923': 'ADW310-923',
    'DTSD1352_4S-923': 'DTSD1352_4S-923',
    'DTSD1352_12S-923': 'DTSD1352_12S-923',
  };
  return profileToType[deviceProfileName] || 'ADW300-923';
}

// -------------------- Route handler --------------------
async function hospitalUplinkHandler(req, res) {
  const uplink = req.body;
  const { deviceInfo, level } = uplink || {};
  const { devEui, deviceProfileName } = deviceInfo || {};

  if (!deviceInfo || !devEui) {
    return res.status(400).send('Invalid payload: missing device information');
  }

  try {
    if (level === 'ERROR') {
      await handleHospitalErrorMessage(uplink);
      return res.status(200).send('Error logged (hospital)');
    }

    const meterType = getMeterType(deviceProfileName);
    if (meterType === 'ADW300-923') {
      await processHospitalADW300(uplink);
    } else if (meterType === 'ADW310-923') {
      await processHospitalADW310(uplink);
    } else if (meterType === 'DTSD1352_4S-923' || meterType === 'DTSD1352_12S-923') {
      await processHospitalDTSD(uplink);
    } else {
      console.warn(`(HSP) Unknown meter type ${meterType}`);
    }

    res.status(200).send('OK (hospital)');
  } catch (err) {
    console.error('(HSP) Processing Error:', err);
    res.status(500).json({ error: 'Processing failed', details: err.message });
  }
}

module.exports = {
  hospitalUplinkHandler,
  // exporting for testing/reuse if needed
  processHospitalADW300,
  checkHSP_ADW300DataCompleteness,
  insertHospitalADW300Data,
  processHospitalADW310,
  processHospitalDTSD,
  handleHospitalErrorMessage,
};
