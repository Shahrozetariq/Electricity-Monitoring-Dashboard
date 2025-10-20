// controllers/BillingController.js
const pool = require('../config/database'); // Adjust path as needed

class BillingController {
  
  // Get all unique device names from all meter tables
  static async getDeviceNames(req, res) {
    try {
      const query = `
        SELECT DISTINCT device_name 
        FROM (
          SELECT device_name FROM lwn_adw300_data WHERE device_name IS NOT NULL
          UNION
          SELECT device_name FROM lwn_adw310_data WHERE device_name IS NOT NULL
          UNION
          SELECT device_name FROM lwn_dtsd4s_data WHERE device_name IS NOT NULL
          UNION
          SELECT device_name FROM lwn_dtsd12s_data WHERE device_name IS NOT NULL
        ) AS combined_devices
        ORDER BY device_name;
      `;
      
      const result = await pool.query(query);
      const deviceNames = result.rows.map(row => row.device_name);
      
      res.json(deviceNames);
    } catch (error) {
      console.error('Error fetching device names:', error);
      res.status(500).json({ 
        error: 'Failed to fetch device names', 
        details: error.message 
      });
    }
  }

  // Get all meters for a specific device name
  static async getMetersForDevice(req, res) {
    try {
      const { deviceName } = req.params;
      
      if (!deviceName) {
        return res.status(400).json({ error: 'Device name is required' });
      }

      const query = `
        SELECT dev_eui, device_name, 'ADW300' as meter_type, 'Three Phase' as meter_category,
               MAX(received_at) as last_reading
        FROM lwn_adw300_data 
        WHERE device_name = $1
        GROUP BY dev_eui, device_name
        
        UNION ALL
        
        SELECT dev_eui, device_name, 'ADW310' as meter_type, 'Single Phase' as meter_category,
               MAX(received_at) as last_reading
        FROM lwn_adw310_data 
        WHERE device_name = $1
        GROUP BY dev_eui, device_name
        
        UNION ALL
        
        SELECT dev_eui, device_name, 'DTSD4S' as meter_type, 'Three Phase RS485' as meter_category,
               MAX(received_at) as last_reading
        FROM lwn_dtsd4s_data 
        WHERE device_name = $1
        GROUP BY dev_eui, device_name
        
        UNION ALL
        
        SELECT dev_eui, device_name, 'DTSD12S' as meter_type, 'Single Phase RS485' as meter_category,
               MAX(received_at) as last_reading
        FROM lwn_dtsd12s_data 
        WHERE device_name = $1
        GROUP BY dev_eui, device_name
        
        ORDER BY last_reading DESC;
      `;
      
      const result = await pool.query(query, [deviceName]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching meters for device:', error);
      res.status(500).json({ 
        error: 'Failed to fetch meters for device', 
        details: error.message 
      });
    }
  }

  // Get meter data for specific meters and date range (unchanged)
  static async getMeterData(req, res) {
    try {
      const { meterIds } = req.body; // Array of dev_eui
      const { startDate, endDate } = req.query;
      
      if (!meterIds || !Array.isArray(meterIds) || meterIds.length === 0) {
        return res.status(400).json({ error: 'Meter IDs array is required' });
      }
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const placeholders = meterIds.map((_, index) => `$${index + 3}`).join(',');
      
      const queries = [
        `
        SELECT 
          dev_eui, 
          device_name, 
          'ADW300' as meter_type,
          received_at,
          DATE(received_at) as reading_date,
          voltage_a as voltage,
          current_a as current,
          power_a + power_b + power_c as power,
          total_power,
          energy_import,
          energy_export,
          max_demand,
          power_factor,
          frequency
        FROM lwn_adw300_data
        WHERE dev_eui IN (${placeholders})
        AND received_at BETWEEN $1 AND $2
        ORDER BY received_at DESC
        `,
        `
        SELECT 
          dev_eui,
          device_name,
          'ADW310' as meter_type,
          received_at,
          DATE(received_at) as reading_date,
          voltage,
          current,
          power,
          power as total_power,
          energy_import,
          energy_export,
          power as max_demand,
          NULL as power_factor,
          NULL as frequency
        FROM lwn_adw310_data
        WHERE dev_eui IN (${placeholders})
        AND received_at BETWEEN $1 AND $2
        ORDER BY received_at DESC
        `,
        `
        SELECT 
          dev_eui,
          device_name,
          'DTSD4S' as meter_type,
          received_at,
          DATE(received_at) as reading_date,
          voltage_a as voltage,
          current_a as current,
          power,
          power as total_power,
          energy_import,
          energy_export,
          power as max_demand,
          NULL as power_factor,
          NULL as frequency
        FROM lwn_dtsd4s_data
        WHERE dev_eui IN (${placeholders})
        AND received_at BETWEEN $1 AND $2
        ORDER BY received_at DESC
        `,
        `
        SELECT 
          dev_eui,
          device_name,
          'DTSD12S' as meter_type,
          received_at,
          DATE(received_at) as reading_date,
          voltage,
          current,
          power,
          power as total_power,
          energy_import,
          0 as energy_export,
          power as max_demand,
          NULL as power_factor,
          NULL as frequency
        FROM lwn_dtsd12s_data
        WHERE dev_eui IN (${placeholders})
        AND received_at BETWEEN $1 AND $2
        ORDER BY received_at DESC
        `
      ];

      const queryParams = [startDate, endDate, ...meterIds];
      const results = await Promise.all(
        queries.map(query => pool.query(query, queryParams))
      );
      
      const allData = results.reduce((acc, result) => acc.concat(result.rows), []);
      allData.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));
      
      res.json(allData);
    } catch (error) {
      console.error('Error fetching meter data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch meter data', 
        details: error.message 
      });
    }
  }

  // Get aggregated daily data for charts
  static async getDailyAggregatedData(req, res) {
    try {
      const { meterIds } = req.body;
      const { startDate, endDate } = req.query;
      
      if (!meterIds || !Array.isArray(meterIds) || meterIds.length === 0) {
        return res.status(400).json({ error: 'Meter IDs array is required' });
      }
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const placeholders = meterIds.map((_, index) => `$${index + 3}`).join(',');
      
      const query = `
        WITH daily_data AS (
          -- ADW300 daily aggregation
          SELECT 
            DATE(received_at) as reading_date,
            (MAX(energy_import) - MIN(energy_import)) as daily_consumption,
            (MAX(energy_export) - MIN(energy_export)) as daily_export,
            MAX(COALESCE(max_demand, total_power, 0)) as daily_max_demand,
            AVG(voltage_a) as avg_voltage,
            AVG(current_a) as avg_current,
            COUNT(*) as reading_count
          FROM lwn_adw300_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY DATE(received_at)
          
          UNION ALL
          
          -- ADW310 daily aggregation
          SELECT 
            DATE(received_at) as reading_date,
            (MAX(energy_import) - MIN(energy_import)) as daily_consumption,
            (MAX(energy_export) - MIN(energy_export)) as daily_export,
            MAX(power) as daily_max_demand,
            AVG(voltage) as avg_voltage,
            AVG(current) as avg_current,
            COUNT(*) as reading_count
          FROM lwn_adw310_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY DATE(received_at)
          
          UNION ALL
          
          -- DTSD4S daily aggregation
          SELECT 
            DATE(received_at) as reading_date,
            (MAX(energy_import) - MIN(energy_import)) as daily_consumption,
            (MAX(energy_export) - MIN(energy_export)) as daily_export,
            MAX(power) as daily_max_demand,
            AVG(voltage_a) as avg_voltage,
            AVG(current_a) as avg_current,
            COUNT(*) as reading_count
          FROM lwn_dtsd4s_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY DATE(received_at)
          
          UNION ALL
          
          -- DTSD12S daily aggregation
          SELECT 
            DATE(received_at) as reading_date,
            (MAX(energy_import) - MIN(energy_import)) as daily_consumption,
            0 as daily_export,
            MAX(power) as daily_max_demand,
            AVG(voltage) as avg_voltage,
            AVG(current) as avg_current,
            COUNT(*) as reading_count
          FROM lwn_dtsd12s_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY DATE(received_at)
        )
        SELECT 
          reading_date,
          SUM(daily_consumption) as total_consumption,
          SUM(daily_export) as total_export,
          MAX(daily_max_demand) as max_demand,
          AVG(avg_voltage) as avg_voltage,
          AVG(avg_current) as avg_current,
          SUM(reading_count) as total_readings
        FROM daily_data
        GROUP BY reading_date
        ORDER BY reading_date;
      `;
      
      const queryParams = [startDate, endDate, ...meterIds];
      const result = await pool.query(query, queryParams);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching daily aggregated data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch daily aggregated data', 
        details: error.message 
      });
    }
  }

  // Get meter summary for selected meters
  static async getMeterSummary(req, res) {
    try {
      const { meterIds } = req.body;
      const { startDate, endDate } = req.query;
      
      if (!meterIds || !Array.isArray(meterIds) || meterIds.length === 0) {
        return res.status(400).json({ error: 'Meter IDs array is required' });
      }
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const placeholders = meterIds.map((_, index) => `$${index + 3}`).join(',');
      
      const query = `
        WITH meter_summary AS (
          -- ADW300 summary
          SELECT 
            dev_eui,
            device_name,
            'ADW300' as meter_type,
            (MAX(energy_import) - MIN(energy_import)) as total_consumption,
            (MAX(energy_export) - MIN(energy_export)) as total_export,
            MAX(COALESCE(max_demand, total_power, 0)) as max_demand,
            AVG(voltage_a) as avg_voltage,
            AVG(current_a) as avg_current,
            COUNT(*) as reading_count,
            MIN(received_at) as first_reading,
            MAX(received_at) as last_reading
          FROM lwn_adw300_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY dev_eui, device_name
          
          UNION ALL
          
          -- ADW310 summary
          SELECT 
            dev_eui,
            device_name,
            'ADW310' as meter_type,
            (MAX(energy_import) - MIN(energy_import)) as total_consumption,
            (MAX(energy_export) - MIN(energy_export)) as total_export,
            MAX(power) as max_demand,
            AVG(voltage) as avg_voltage,
            AVG(current) as avg_current,
            COUNT(*) as reading_count,
            MIN(received_at) as first_reading,
            MAX(received_at) as last_reading
          FROM lwn_adw310_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY dev_eui, device_name
          
          UNION ALL
          
          -- DTSD4S summary
          SELECT 
            dev_eui,
            device_name,
            'DTSD4S' as meter_type,
            (MAX(energy_import) - MIN(energy_import)) as total_consumption,
            (MAX(energy_export) - MIN(energy_export)) as total_export,
            MAX(power) as max_demand,
            AVG(voltage_a) as avg_voltage,
            AVG(current_a) as avg_current,
            COUNT(*) as reading_count,
            MIN(received_at) as first_reading,
            MAX(received_at) as last_reading
          FROM lwn_dtsd4s_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY dev_eui, device_name
          
          UNION ALL
          
          -- DTSD12S summary
          SELECT 
            dev_eui,
            device_name,
            'DTSD12S' as meter_type,
            (MAX(energy_import) - MIN(energy_import)) as total_consumption,
            0 as total_export,
            MAX(power) as max_demand,
            AVG(voltage) as avg_voltage,
            AVG(current) as avg_current,
            COUNT(*) as reading_count,
            MIN(received_at) as first_reading,
            MAX(received_at) as last_reading
          FROM lwn_dtsd12s_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY dev_eui, device_name
        )
        SELECT * FROM meter_summary
        ORDER BY total_consumption DESC;
      `;
      
      const queryParams = [startDate, endDate, ...meterIds];
      const result = await pool.query(query, queryParams);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching meter summary:', error);
      res.status(500).json({ 
        error: 'Failed to fetch meter summary', 
        details: error.message 
      });
    }
  }

  // Get historical monthly data for last 6 months
  static async getMonthlyHistoricalData(req, res) {
    try {
      const { meterIds } = req.body;
      
      if (!meterIds || !Array.isArray(meterIds) || meterIds.length === 0) {
        return res.status(400).json({ error: 'Meter IDs array is required' });
      }

      const placeholders = meterIds.map((_, index) => `$${index + 1}`).join(',');
      
      const query = `
        WITH monthly_data AS (
          -- ADW300 monthly data
          SELECT 
            DATE_TRUNC('month', received_at) as month_start,
            TO_CHAR(received_at, 'Month YYYY') as month_name,
            (MAX(energy_import) - MIN(energy_import)) as monthly_consumption,
            (MAX(energy_export) - MIN(energy_export)) as monthly_export,
            MAX(COALESCE(max_demand, total_power, 0)) as monthly_max_demand
          FROM lwn_adw300_data
          WHERE dev_eui IN (${placeholders})
          AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
          
          UNION ALL
          
          -- ADW310 monthly data
          SELECT 
            DATE_TRUNC('month', received_at) as month_start,
            TO_CHAR(received_at, 'Month YYYY') as month_name,
            (MAX(energy_import) - MIN(energy_import)) as monthly_consumption,
            (MAX(energy_export) - MIN(energy_export)) as monthly_export,
            MAX(power) as monthly_max_demand
          FROM lwn_adw310_data
          WHERE dev_eui IN (${placeholders})
          AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
          
          UNION ALL
          
          -- DTSD4S monthly data
          SELECT 
            DATE_TRUNC('month', received_at) as month_start,
            TO_CHAR(received_at, 'Month YYYY') as month_name,
            (MAX(energy_import) - MIN(energy_import)) as monthly_consumption,
            (MAX(energy_export) - MIN(energy_export)) as monthly_export,
            MAX(power) as monthly_max_demand
          FROM lwn_dtsd4s_data
          WHERE dev_eui IN (${placeholders})
          AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
          
          UNION ALL
          
          -- DTSD12S monthly data
          SELECT 
            DATE_TRUNC('month', received_at) as month_start,
            TO_CHAR(received_at, 'Month YYYY') as month_name,
            (MAX(energy_import) - MIN(energy_import)) as monthly_consumption,
            0 as monthly_export,
            MAX(power) as monthly_max_demand
          FROM lwn_dtsd12s_data
          WHERE dev_eui IN (${placeholders})
          AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
        )
        SELECT 
          month_start,
          month_name,
          SUM(monthly_consumption) as total_consumption,
          SUM(monthly_export) as total_export,
          MAX(monthly_max_demand) as max_demand
        FROM monthly_data
        GROUP BY month_start, month_name
        ORDER BY month_start;
      `;
      
      const queryParams = [...meterIds];
      const result = await pool.query(query, queryParams);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching monthly historical data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch monthly historical data', 
        details: error.message 
      });
    }
  }
}

module.exports = BillingController;
