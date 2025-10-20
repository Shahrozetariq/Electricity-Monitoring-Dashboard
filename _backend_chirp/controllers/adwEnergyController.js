const pool = require('../config/database');

// Helper to classify device type
const getDeviceType = (deviceName = '') => {
    const name = deviceName.toLowerCase();
    if (name.includes('grid')) return 'grid';
    if (name.includes('solar')) return 'solar';
    if (name.includes('genset')) return 'genset';
    return 'unknown';
};

// Helper to aggregate meter data
const aggregateMetersData = (meters) => {
    if (!meters || meters.length === 0) {
        return {
            voltageA: 0, voltageB: 0, voltageC: 0,
            currentA: 0, currentB: 0, currentC: 0,
            totalPower: 0, totalImport: 0, totalExport: 0
        };
    }

    const totals = meters.reduce((acc, meter) => {
        acc.voltageA += parseFloat(meter.voltageA) || 0;
        acc.voltageB += parseFloat(meter.voltageB) || 0;
        acc.voltageC += parseFloat(meter.voltageC) || 0;
        acc.currentA += parseFloat(meter.currentA) || 0;
        acc.currentB += parseFloat(meter.currentB) || 0;
        acc.currentC += parseFloat(meter.currentC) || 0;
        acc.totalPower += parseFloat(meter.totalPower) || 0;
        acc.totalImport += parseFloat(meter.energyImport) || 0;
        acc.totalExport += parseFloat(meter.energyExport) || 0;
        return acc;
    }, {
        voltageA: 0, voltageB: 0, voltageC: 0,
        currentA: 0, currentB: 0, currentC: 0,
        totalPower: 0, totalImport: 0, totalExport : 0
    });

    const count = meters.length;
    return {
        voltageA: totals.voltageA / count,
        voltageB: totals.voltageB / count,
        voltageC: totals.voltageC / count,
        currentA: totals.currentA,
        currentB: totals.currentB,
        currentC: totals.currentC,
        totalPower: totals.totalPower,
        totalImport: totals.totalImport,
        totalExport: totals.totalExport
    };
};

// Get energy data by type
exports.getEnergyByType = async (req, res) => {
    try {
        const { type } = req.params;

        if (!['grid', 'solar', 'genset'].includes(type.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid type. Must be grid, solar, or genset' });
        }

        const query = `
      WITH latest_readings AS (
        SELECT DISTINCT ON (dev_eui)
          id, dev_eui, received_at, voltage_a, voltage_b, voltage_c,
          current_a, current_b, current_c, power_a, power_b, power_c,
          total_power, power_factor, energy_import, energy_export,
          max_demand, frequency, temp_a, temp_b, temp_c,
          created_at, device_name
        FROM lwn_adw300_data
        WHERE LOWER(device_name) LIKE $1
        ORDER BY dev_eui, received_at DESC
      )
      SELECT * FROM latest_readings
      ORDER BY received_at DESC;
    `;

        const result = await pool.query(query, [`%${type.toLowerCase()}%`]);

        const meters = result.rows.map(row => ({
            id: row.dev_eui,
            name: row.device_name,
            voltageA: parseFloat(row.voltage_a) || 0,
            voltageB: parseFloat(row.voltage_b) || 0,
            voltageC: parseFloat(row.voltage_c) || 0,
            currentA: parseFloat(row.current_a) || 0,
            currentB: parseFloat(row.current_b) || 0,
            currentC: parseFloat(row.current_c) || 0,
            powerA: parseFloat(row.power_a) || 0,
            powerB: parseFloat(row.power_b) || 0,
            powerC: parseFloat(row.power_c) || 0,
            totalPower: parseFloat(row.total_power) || 0,
            powerFactor: parseFloat(row.power_factor) || 0,
            energyImport: parseFloat(row.energy_import) || 0,
            energyExport: parseFloat(row.energy_export) || 0,
            frequency: parseFloat(row.frequency) || 0,
            receivedAt: row.received_at,
            createdAt: row.created_at
        }));

        const combined = aggregateMetersData(meters);

        res.json({
            success: true,
            type,
            timestamp: new Date().toISOString(),
            combined,
            meters,
            totalMeters: meters.length
        });

    } catch (error) {
        console.error('Error in getEnergyByType:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// Get all latest readings
exports.getAllEnergy = async (req, res) => {
    try {
        const query = `
      WITH latest_readings AS (
        SELECT DISTINCT ON (dev_eui) *
        FROM lwn_adw300_data
        ORDER BY dev_eui, received_at DESC
      )
      SELECT * FROM latest_readings
      ORDER BY device_name, received_at DESC;
    `;

        const result = await pool.query(query);
        const grouped = { grid: [], solar: [], genset: [], unknown: [] };

        result.rows.forEach(row => {
            const type = getDeviceType(row.device_name);
            grouped[type].push({
                id: row.dev_eui,
                name: row.device_name,
                voltageA: parseFloat(row.voltage_a) || 0,
                voltageB: parseFloat(row.voltage_b) || 0,
                voltageC: parseFloat(row.voltage_c) || 0,
                currentA: parseFloat(row.current_a) || 0,
                currentB: parseFloat(row.current_b) || 0,
                currentC: parseFloat(row.current_c) || 0,
                totalPower: parseFloat(row.total_power) || 0,
                energyImport: parseFloat(row.energy_import) || 0,
                receivedAt: row.received_at
            });
        });

        const response = {};
        Object.keys(grouped).forEach(type => {
            if (grouped[type].length) {
                response[type] = {
                    combined: aggregateMetersData(grouped[type]),
                    meters: grouped[type]
                };
            }
        });

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: response
        });

    } catch (error) {
        console.error('Error in getAllEnergy:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// Historical data
exports.getEnergyHistory = async (req, res) => {
    try {
        const { type } = req.params;
        const hours = parseInt(req.query.hours || 24);
        const query = `
      SELECT 
        DATE_TRUNC('hour', received_at) as time_bucket,
        AVG(voltage_a) as avg_voltage_a,
        AVG(voltage_b) as avg_voltage_b,
        AVG(voltage_c) as avg_voltage_c,
        AVG(current_a) as avg_current_a,
        AVG(current_b) as avg_current_b,
        AVG(current_c) as avg_current_c,
        AVG(total_power) as avg_total_power,
        MAX(energy_import) as max_energy_import
      FROM lwn_adw300_data
      WHERE LOWER(device_name) LIKE $1
        AND received_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY time_bucket
      ORDER BY time_bucket DESC
      LIMIT 100;
    `;

        const result = await pool.query(query, [`%${type.toLowerCase()}%`]);
        const data = result.rows.map(row => ({
            timestamp: row.time_bucket,
            voltageA: parseFloat(row.avg_voltage_a) || 0,
            voltageB: parseFloat(row.avg_voltage_b) || 0,
            voltageC: parseFloat(row.avg_voltage_c) || 0,
            currentA: parseFloat(row.avg_current_a) || 0,
            currentB: parseFloat(row.avg_current_b) || 0,
            currentC: parseFloat(row.avg_current_c) || 0,
            totalPower: parseFloat(row.avg_total_power) || 0,
            energyImport: parseFloat(row.max_energy_import) || 0
        }));

        res.json({
            success: true,
            type,
            period: `${hours} hours`,
            data
        });

    } catch (error) {
        console.error('Error in getEnergyHistory:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// API endpoint to get daily energy import/export data

// ✅ Daily energy by type
exports.getDailyEnergyType = async (req, res) => {
  try {
    const { type } = req.params;
    const { days = 7, startDate, endDate } = req.query;

    let dateCondition = '';
    let queryParams = [`%${type.toLowerCase()}%`];

    if (startDate && endDate) {
      dateCondition = 'AND DATE(received_at) BETWEEN $2 AND $3';
      queryParams.push(startDate, endDate);
    } else {
      // ❌ WRONG: INTERVAL $2
      // ✅ FIX: build interval string directly
      const intervalDays = parseInt(days) || 7;
      dateCondition = `AND received_at >= NOW() - INTERVAL '${intervalDays} days'`;
    }

    const query = `
      WITH daily_energy AS (
        SELECT 
          DATE(received_at) as date,
          dev_eui,
          device_name,
          MAX(energy_import) as max_energy_import,
          MIN(energy_import) as min_energy_import,
          MAX(energy_export) as max_energy_export,
          MIN(energy_export) as min_energy_export
        FROM lwn_adw300_data 
        WHERE LOWER(device_name) LIKE $1 ${dateCondition}
        GROUP BY DATE(received_at), dev_eui, device_name
      ),
      daily_totals AS (
        SELECT 
          date,
          SUM(GREATEST(max_energy_import - min_energy_import, 0)) as daily_import,
          SUM(GREATEST(max_energy_export - min_energy_export, 0)) as daily_export,
          COUNT(*) as meter_count
        FROM daily_energy
        GROUP BY date
      )
      SELECT 
        date,
        daily_import,
        daily_export,
        (daily_import - daily_export) as net_energy,
        meter_count
      FROM daily_totals
      ORDER BY date ASC;
    `;

    const result = await pool.query(query, queryParams);

    const dailyEnergyData = result.rows.map(row => ({
      date: row.date,
      dateString: new Date(row.date).toLocaleDateString(),
      energyImport: parseFloat(row.daily_import) || 0,
      energyExport: parseFloat(row.daily_export) || 0,
      netEnergy: parseFloat(row.net_energy) || 0,
      meterCount: parseInt(row.meter_count) || 0
    }));

    res.json({
      success: true,
      type: type,
      period: startDate && endDate ? `${startDate} to ${endDate}` : `Last ${days} days`,
      data: dailyEnergyData,
      summary: {
        totalDays: dailyEnergyData.length,
        totalImport: dailyEnergyData.reduce((sum, day) => sum + day.energyImport, 0),
        totalExport: dailyEnergyData.reduce((sum, day) => sum + day.energyExport, 0),
        totalNet: dailyEnergyData.reduce((sum, day) => sum + day.netEnergy, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching daily energy data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};


// ✅ Daily energy for all types
exports.getDailyEnergyAll = async (req, res) => {
  try {
    const { days = 7, startDate, endDate } = req.query;

    let dateCondition = '';
    let queryParams = [];

    if (startDate && endDate) {
      dateCondition = 'WHERE DATE(received_at) BETWEEN $1 AND $2';
      queryParams.push(startDate, endDate);
    } else {
      const intervalDays = parseInt(days) || 7;
      dateCondition = `WHERE received_at >= NOW() - INTERVAL '${intervalDays} days'`;
    }

    const query = `
      WITH daily_energy AS (
        SELECT 
          DATE(received_at) as date,
          dev_eui,
          device_name,
          CASE 
            WHEN LOWER(device_name) LIKE '%grid%' THEN 'grid'
            WHEN LOWER(device_name) LIKE '%solar%' THEN 'solar'
            WHEN LOWER(device_name) LIKE '%genset%' THEN 'genset'
            ELSE 'unknown'
          END as device_type,
          MAX(energy_import) as max_energy_import,
          MIN(energy_import) as min_energy_import,
          MAX(energy_export) as max_energy_export,
          MIN(energy_export) as min_energy_export
        FROM lwn_adw300_data 
        ${dateCondition}
        GROUP BY DATE(received_at), dev_eui, device_name
      ),
      daily_totals AS (
        SELECT 
          date,
          device_type,
          SUM(GREATEST(max_energy_import - min_energy_import, 0)) as daily_import,
          SUM(GREATEST(max_energy_export - min_energy_export, 0)) as daily_export
        FROM daily_energy
        WHERE device_type != 'unknown'
        GROUP BY date, device_type
      )
      SELECT 
        date,
        device_type,
        daily_import,
        daily_export,
        (daily_import - daily_export) as net_energy
      FROM daily_totals
      ORDER BY date ASC, device_type;
    `;

    const result = await pool.query(query, queryParams);

    // Group data by date for easier frontend consumption
    const groupedData = {};
    result.rows.forEach(row => {
      const dateKey = row.date.toISOString().split('T')[0];
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          dateString: new Date(row.date).toLocaleDateString(),
          grid: { import: 0, export: 0, net: 0 },
          solar: { import: 0, export: 0, net: 0 },
          genset: { import: 0, export: 0, net: 0 }
        };
      }

      const deviceType = row.device_type;
      groupedData[dateKey][deviceType] = {
        import: parseFloat(row.daily_import) || 0,
        export: parseFloat(row.daily_export) || 0,
        net: parseFloat(row.net_energy) || 0
      };
    });

    const dailyEnergyData = Object.values(groupedData);

    res.json({
      success: true,
      period: startDate && endDate ? `${startDate} to ${endDate}` : `Last ${days} days`,
      data: dailyEnergyData
    });

  } catch (error) {
    console.error('Error fetching all daily energy data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
