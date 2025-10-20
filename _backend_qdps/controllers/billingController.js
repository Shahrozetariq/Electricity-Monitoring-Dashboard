// controllers/BillingController.js
const pool = require('../config/database'); // Adjust path as needed

class BillingController {

  // Get all unique device names from all meter tables
  static async getDeviceNames(req, res) {
    try {
            const query = `
        SELECT device_name
        FROM lwn_devices
        WHERE device_name IS NOT NULL
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

  // Get meter data for specific meters and date range
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

      // Create placeholders for IN clause
      const placeholders = meterIds.map((_, index) => `$${index + 3}`).join(',');

      const queries = [
        // ADW300 data
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

        // ADW310 data  
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

        // DTSD4S data
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

        // DTSD12S data
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

      // Combine all results
      const allData = results.reduce((acc, result) => {
        return acc.concat(result.rows);
      }, []);

      // Sort by received_at
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
           SUM(COALESCE(energy_import, 0))::float as daily_consumption,
SUM(COALESCE(energy_export, 0))::float as daily_export,
MAX(COALESCE(max_demand, total_power, 0))::float as daily_max_demand,
AVG(COALESCE(voltage_a, 0))::float as avg_voltage,
AVG(COALESCE(current_a, 0))::float as avg_current,
            COUNT(*) as reading_count
          FROM lwn_adw300_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY DATE(received_at)
          
          UNION ALL
          
          -- ADW310 daily aggregation
          SELECT 
            DATE(received_at) as reading_date,
            SUM(COALESCE(energy_import, 0)) as daily_consumption,
            SUM(COALESCE(energy_export, 0)) as daily_export,
            MAX(COALESCE(power, 0)) as daily_max_demand,
            AVG(COALESCE(voltage, 0)) as avg_voltage,
            AVG(COALESCE(current, 0)) as avg_current,
            COUNT(*) as reading_count
          FROM lwn_adw310_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY DATE(received_at)
          
          UNION ALL
          
          -- DTSD4S daily aggregation
          SELECT 
            DATE(received_at) as reading_date,
            SUM(COALESCE(energy_import, 0)) as daily_consumption,
            SUM(COALESCE(energy_export, 0)) as daily_export,
            MAX(COALESCE(power, 0)) as daily_max_demand,
            AVG(COALESCE(voltage_a, 0)) as avg_voltage,
            AVG(COALESCE(current_a, 0)) as avg_current,
            COUNT(*) as reading_count
          FROM lwn_dtsd4s_data
          WHERE dev_eui IN (${placeholders})
          AND received_at BETWEEN $1 AND $2
          GROUP BY DATE(received_at)
          
          UNION ALL
          
          -- DTSD12S daily aggregation
          SELECT 
            DATE(received_at) as reading_date,
            SUM(COALESCE(energy_import, 0)) as daily_consumption,
            0 as daily_export,
            MAX(COALESCE(power, 0)) as daily_max_demand,
            AVG(COALESCE(voltage, 0)) as avg_voltage,
            AVG(COALESCE(current, 0)) as avg_current,
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
            SUM(COALESCE(energy_import, 0))::float as total_consumption,
            SUM(COALESCE(energy_export, 0))::float as total_export,
            MAX(COALESCE(max_demand, total_power, 0))::float as max_demand,
            AVG(COALESCE(voltage_a, 0))::float as avg_voltage,
            AVG(COALESCE(current_a, 0))::float as avg_current,
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
            SUM(COALESCE(energy_import, 0)) as total_consumption,
            SUM(COALESCE(energy_export, 0)) as total_export,
            MAX(COALESCE(power, 0)) as max_demand,
            AVG(COALESCE(voltage, 0)) as avg_voltage,
            AVG(COALESCE(current, 0)) as avg_current,
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
            SUM(COALESCE(energy_import, 0)) as total_consumption,
            SUM(COALESCE(energy_export, 0)) as total_export,
            MAX(COALESCE(power, 0)) as max_demand,
            AVG(COALESCE(voltage_a, 0)) as avg_voltage,
            AVG(COALESCE(current_a, 0)) as avg_current,
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
            SUM(COALESCE(energy_import, 0)) as total_consumption,
            0 as total_export,
            MAX(COALESCE(power, 0)) as max_demand,
            AVG(COALESCE(voltage, 0)) as avg_voltage,
            AVG(COALESCE(current, 0)) as avg_current,
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
            SUM(COALESCE(energy_import, 0))::float as monthly_consumption,
            SUM(COALESCE(energy_export, 0))::float as monthly_export,
            MAX(COALESCE(max_demand, total_power, 0))::float as monthly_max_demand
          FROM lwn_adw300_data
          WHERE dev_eui IN (${placeholders})
          AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
          
          UNION ALL
          
          -- ADW310 monthly data
          SELECT 
            DATE_TRUNC('month', received_at) as month_start,
            TO_CHAR(received_at, 'Month YYYY') as month_name,
            SUM(COALESCE(energy_import, 0)) as monthly_consumption,
            SUM(COALESCE(energy_export, 0)) as monthly_export,
            MAX(COALESCE(power, 0)) as monthly_max_demand
          FROM lwn_adw310_data
          WHERE dev_eui IN (${placeholders})
          AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
          
          UNION ALL
          
          -- DTSD4S monthly data
          SELECT 
            DATE_TRUNC('month', received_at) as month_start,
            TO_CHAR(received_at, 'Month YYYY') as month_name,
            SUM(COALESCE(energy_import, 0)) as monthly_consumption,
            SUM(COALESCE(energy_export, 0)) as monthly_export,
            MAX(COALESCE(power, 0)) as monthly_max_demand
          FROM lwn_dtsd4s_data
          WHERE dev_eui IN (${placeholders})
          AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
          
          UNION ALL
          
          -- DTSD12S monthly data
          SELECT 
            DATE_TRUNC('month', received_at) as month_start,
            TO_CHAR(received_at, 'Month YYYY') as month_name,
            SUM(COALESCE(energy_import, 0)) as monthly_consumption,
            0 as monthly_export,
            MAX(COALESCE(power, 0)) as monthly_max_demand
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

      const result = await pool.query(query, meterIds);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching monthly historical data:', error);
      res.status(500).json({
        error: 'Failed to fetch monthly historical data',
        details: error.message
      });
    }
  }

  // Generate bill calculation data
  static async generateBillData(req, res) {
    try {
      const { meterIds, billingPeriodStart, billingPeriodEnd, customerInfo, rates } = req.body;

      if (!meterIds || !Array.isArray(meterIds) || meterIds.length === 0) {
        return res.status(400).json({ error: 'Meter IDs array is required' });
      }

      if (!billingPeriodStart || !billingPeriodEnd) {
        return res.status(400).json({ error: 'Billing period dates are required' });
      }

      // Get current period data
      const currentPeriodData = await BillingController.getMeterSummaryData(
        meterIds, billingPeriodStart, billingPeriodEnd
      );

      // Get historical data
      const historicalData = await BillingController.getMonthlyHistoricalDataInternal(meterIds);

      // Calculate costs
      const defaultRates = {
        baseRate: 0.12,
        peakRate: 0.18,
        offPeakRate: 0.08,
        demandCharge: 15.0,
        fixedCharge: 25.0,
        ...rates
      };

      const totalConsumption = currentPeriodData.reduce((sum, meter) => sum + meter.total_consumption, 0);
      const maxDemand = Math.max(...currentPeriodData.map(meter => meter.max_demand));

      const energyCost = totalConsumption * defaultRates.baseRate;
      const demandCost = maxDemand * defaultRates.demandCharge;
      const totalCost = energyCost + demandCost + defaultRates.fixedCharge;

      const billData = {
        customerInfo: customerInfo || {
          name: 'Customer Name',
          address: 'Customer Address',
          accountNumber: 'ACC-' + Math.random().toString(36).substring(7).toUpperCase()
        },
        billingPeriod: {
          startDate: billingPeriodStart,
          endDate: billingPeriodEnd,
          current: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        },
        currentPeriodSummary: {
          totalConsumption: totalConsumption,
          totalExport: currentPeriodData.reduce((sum, meter) => sum + meter.total_export, 0),
          maxDemand: maxDemand,
          energyCost: energyCost,
          demandCost: demandCost,
          fixedCost: defaultRates.fixedCharge,
          totalCost: totalCost
        },
        meterDetails: currentPeriodData,
        historicalData: historicalData,
        rates: defaultRates,
        generatedAt: new Date().toISOString()
      };

      res.json(billData);
    } catch (error) {
      console.error('Error generating bill data:', error);
      res.status(500).json({
        error: 'Failed to generate bill data',
        details: error.message
      });
    }
  }

  // Helper method to get meter summary data
  static async getMeterSummaryData(meterIds, startDate, endDate) {
    const placeholders = meterIds.map((_, index) => `$${index + 3}`).join(',');

    const query = `
      WITH meter_summary AS (
        SELECT 
          dev_eui, device_name, 'ADW300' as meter_type,
          SUM(COALESCE(energy_import, 0)) as total_consumption,
          SUM(COALESCE(energy_export, 0)) as total_export,
          MAX(COALESCE(max_demand, total_power, 0)) as max_demand
        FROM lwn_adw300_data
        WHERE dev_eui IN (${placeholders}) AND received_at BETWEEN $1 AND $2
        GROUP BY dev_eui, device_name
        
        UNION ALL
        
        SELECT 
          dev_eui, device_name, 'ADW310' as meter_type,
          SUM(COALESCE(energy_import, 0)) as total_consumption,
          SUM(COALESCE(energy_export, 0)) as total_export,
          MAX(COALESCE(power, 0)) as max_demand
        FROM lwn_adw310_data
        WHERE dev_eui IN (${placeholders}) AND received_at BETWEEN $1 AND $2
        GROUP BY dev_eui, device_name
        
        UNION ALL
        
        SELECT 
          dev_eui, device_name, 'DTSD4S' as meter_type,
          SUM(COALESCE(energy_import, 0)) as total_consumption,
          SUM(COALESCE(energy_export, 0)) as total_export,
          MAX(COALESCE(power, 0)) as max_demand
        FROM lwn_dtsd4s_data
        WHERE dev_eui IN (${placeholders}) AND received_at BETWEEN $1 AND $2
        GROUP BY dev_eui, device_name
        
        UNION ALL
        
        SELECT 
          dev_eui, device_name, 'DTSD12S' as meter_type,
          SUM(COALESCE(energy_import, 0)) as total_consumption,
          0 as total_export,
          MAX(COALESCE(power, 0)) as max_demand
        FROM lwn_dtsd12s_data
        WHERE dev_eui IN (${placeholders}) AND received_at BETWEEN $1 AND $2
        GROUP BY dev_eui, device_name
      )
      SELECT * FROM meter_summary ORDER BY total_consumption DESC;
    `;

    const result = await pool.query(query, [startDate, endDate, ...meterIds]);
    return result.rows;
  }

  // Helper method to get monthly historical data
  static async getMonthlyHistoricalDataInternal(meterIds) {
    const placeholders = meterIds.map((_, index) => `$${index + 1}`).join(',');

    const query = `
      WITH monthly_data AS (
        SELECT 
          DATE_TRUNC('month', received_at) as month_start,
          TO_CHAR(received_at, 'Month YYYY') as month_name,
          SUM(COALESCE(energy_import, 0)) as monthly_consumption,
          MAX(COALESCE(max_demand, total_power, 0)) as monthly_max_demand
        FROM lwn_adw300_data
        WHERE dev_eui IN (${placeholders})
        AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
        
        UNION ALL
        
        SELECT 
          DATE_TRUNC('month', received_at) as month_start,
          TO_CHAR(received_at, 'Month YYYY') as month_name,
          SUM(COALESCE(energy_import, 0)) as monthly_consumption,
          MAX(COALESCE(power, 0)) as monthly_max_demand
        FROM lwn_adw310_data
        WHERE dev_eui IN (${placeholders})
        AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
        
        UNION ALL
        
        SELECT 
          DATE_TRUNC('month', received_at) as month_start,
          TO_CHAR(received_at, 'Month YYYY') as month_name,
          SUM(COALESCE(energy_import, 0)) as monthly_consumption,
          MAX(COALESCE(power, 0)) as monthly_max_demand
        FROM lwn_dtsd4s_data
        WHERE dev_eui IN (${placeholders})
        AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
        
        UNION ALL
        
        SELECT 
          DATE_TRUNC('month', received_at) as month_start,
          TO_CHAR(received_at, 'Month YYYY') as month_name,
          SUM(COALESCE(energy_import, 0)) as monthly_consumption,
          MAX(COALESCE(power, 0)) as monthly_max_demand
        FROM lwn_dtsd12s_data
        WHERE dev_eui IN (${placeholders})
        AND received_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        GROUP BY DATE_TRUNC('month', received_at), TO_CHAR(received_at, 'Month YYYY')
      )
      SELECT 
        month_start,
        month_name,
        SUM(monthly_consumption) as total_consumption,
        MAX(monthly_max_demand) as max_demand
      FROM monthly_data
      GROUP BY month_start, month_name
      ORDER BY month_start;
    `;

    const result = await pool.query(query, meterIds);
    return result.rows;
  }
}

module.exports = BillingController;