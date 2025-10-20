const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'your_username',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'your_database',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Helper function to get device type based on device name
const getDeviceType = (deviceName) => {
  const name = deviceName.toLowerCase();
  if (name.includes('grid')) return 'grid';
  if (name.includes('solar')) return 'solar';
  if (name.includes('genset')) return 'genset';
  return 'unknown';
};

// Helper function to aggregate meter data
const aggregateMetersData = (meters) => {
  if (!meters || meters.length === 0) {
    return {
      voltageA: 0,
      voltageB: 0,
      voltageC: 0,
      currentA: 0,
      currentB: 0,
      currentC: 0,
      totalPower: 0,
      totalEnergy: 0
    };
  }

  const totals = meters.reduce((acc, meter) => {
    acc.voltageA += parseFloat(meter.voltage_a) || 0;
    acc.voltageB += parseFloat(meter.voltage_b) || 0;
    acc.voltageC += parseFloat(meter.voltage_c) || 0;
    acc.currentA += parseFloat(meter.current_a) || 0;
    acc.currentB += parseFloat(meter.current_b) || 0;
    acc.currentC += parseFloat(meter.current_c) || 0;
    acc.totalPower += parseFloat(meter.total_power) || 0;
    acc.totalEnergy += parseFloat(meter.energy_import) || 0;
    return acc;
  }, {
    voltageA: 0,
    voltageB: 0,
    voltageC: 0,
    currentA: 0,
    currentB: 0,
    currentC: 0,
    totalPower: 0,
    totalEnergy: 0
  });

  // Calculate averages for voltages (they shouldn't be summed)
  const meterCount = meters.length;
  return {
    voltageA: totals.voltageA / meterCount,
    voltageB: totals.voltageB / meterCount,
    voltageC: totals.voltageC / meterCount,
    currentA: totals.currentA,
    currentB: totals.currentB,
    currentC: totals.currentC,
    totalPower: totals.totalPower,
    totalEnergy: totals.totalEnergy
  };
};

// API endpoint to get energy data by type
app.get('/api/adw/energy/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate type parameter
    if (!['grid', 'solar', 'genset'].includes(type.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be grid, solar, or genset' 
      });
    }

    // Query to get latest data for each device of the specified type
    const query = `
      WITH latest_readings AS (
        SELECT DISTINCT ON (dev_eui) 
          id,
          dev_eui,
          received_at,
          voltage_a,
          voltage_b,
          voltage_c,
          current_a,
          current_b,
          current_c,
          power_a,
          power_b,
          power_c,
          total_power,
          power_factor,
          energy_import,
          energy_export,
          max_demand,
          frequency,
          temp_a,
          temp_b,
          temp_c,
          created_at,
          device_name
        FROM lwn_datass 
        WHERE LOWER(device_name) LIKE $1
        ORDER BY dev_eui, received_at DESC
      )
      SELECT * FROM latest_readings
      ORDER BY received_at DESC;
    `;

    const result = await pool.query(query, [`%${type.toLowerCase()}%`]);
    
    // Transform data for frontend
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

    // Calculate combined data
    const combined = aggregateMetersData(meters);

    res.json({
      success: true,
      type: type,
      timestamp: new Date().toISOString(),
      combined: combined,
      meters: meters,
      totalMeters: meters.length
    });

  } catch (error) {
    console.error('Error fetching energy data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// API endpoint to get all latest readings
app.get('/api/adw/energy/all', async (req, res) => {
  try {
    const query = `
      WITH latest_readings AS (
        SELECT DISTINCT ON (dev_eui) 
          *
        FROM lwn_datass 
        ORDER BY dev_eui, received_at DESC
      )
      SELECT * FROM latest_readings
      ORDER BY device_name, received_at DESC;
    `;

    const result = await pool.query(query);
    
    // Group by device type
    const groupedData = {
      grid: [],
      solar: [],
      genset: [],
      unknown: []
    };

    result.rows.forEach(row => {
      const deviceType = getDeviceType(row.device_name);
      const meterData = {
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
      };
      
      groupedData[deviceType].push(meterData);
    });

    // Calculate combined data for each type
    const response = {};
    Object.keys(groupedData).forEach(type => {
      if (groupedData[type].length > 0) {
        response[type] = {
          combined: aggregateMetersData(groupedData[type]),
          meters: groupedData[type]
        };
      }
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: response
    });

  } catch (error) {
    console.error('Error fetching all energy data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// API endpoint to get historical data
app.get('/api/adw/energy/:type/history', async (req, res) => {
  try {
    const { type } = req.params;
    const { hours = 24, interval = 1 } = req.query;
    
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
      FROM lwn_datass 
      WHERE LOWER(device_name) LIKE $1
        AND received_at >= NOW() - INTERVAL '${parseInt(hours)} hours'
      GROUP BY time_bucket
      ORDER BY time_bucket DESC
      LIMIT 100;
    `;

    const result = await pool.query(query, [`%${type.toLowerCase()}%`]);
    
    const historicalData = result.rows.map(row => ({
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
      type: type,
      period: `${hours} hours`,
      data: historicalData
    });

  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// API endpoint to get daily energy import/export data
app.get('/api/adw/energy/:type/daily-energy', async (req, res) => {
  try {
    const { type } = req.params;
    const { days = 7, startDate, endDate } = req.query;
    
    let dateCondition = '';
    let queryParams = [`%${type.toLowerCase()}%`];
    
    if (startDate && endDate) {
      dateCondition = 'AND DATE(received_at) BETWEEN $2 AND $3';
      queryParams.push(startDate, endDate);
    } else {
      dateCondition = 'AND received_at >= NOW() - INTERVAL $2';
      queryParams.push(`${parseInt(days)} days`);
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
        FROM lwn_datass 
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
});

// API endpoint to get energy data for all types (for comparison)
app.get('/api/adw/energy/daily-energy/all', async (req, res) => {
  try {
    const { days = 7, startDate, endDate } = req.query;
    
    let dateCondition = '';
    let queryParams = [];
    
    if (startDate && endDate) {
      dateCondition = 'WHERE DATE(received_at) BETWEEN $1 AND $2';
      queryParams.push(startDate, endDate);
    } else {
      dateCondition = 'WHERE received_at >= NOW() - INTERVAL $1';
      queryParams.push(`${parseInt(days)} days`);
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
        FROM lwn_datass 
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
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Energy Monitoring API'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Energy Monitoring API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/adw/energy/grid - Get grid meter data`);
  console.log(`  GET /api/adw/energy/solar - Get solar meter data`);
  console.log(`  GET /api/adw/energy/genset - Get genset meter data`);
  console.log(`  GET /api/adw/energy/all - Get all meter data`);
  console.log(`  GET /api/adw/energy/:type/history - Get historical data`);
});

module.exports = app;