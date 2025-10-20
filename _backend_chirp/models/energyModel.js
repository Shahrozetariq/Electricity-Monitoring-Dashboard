// models/energyModel.js
const pool = require('../config/database'); // Adjust path as needed


class EnergyModel {
  constructor() {
    
  }

  // Helper function to parse JSON data from the database
  parseDeviceData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      return data.object?.data || {};
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      return {};
    }
  }

  // Get the latest data for devices of a specific type
  async getDevicesByType(type) {
    const query = `
      SELECT DISTINCT ON (dev_eui) 
        dev_eui,
        timestamp,
        ua, ub, uc,
        ia, ib, ic,
        p, q, s,
        ep, epi, epe,
        data,
        device_name
      FROM public.lwn_adw300_data 
      WHERE LOWER(device_name) LIKE $1
      ORDER BY dev_eui, timestamp DESC
    `;
    
    const typePattern = `%${type}%`;
    const result = await pool.query(query, [typePattern]);
    return result.rows;
  }

  // Get all devices with their types
  async getAllDevices() {
    const query = `
      SELECT DISTINCT dev_eui, device_name, 
        CASE 
          WHEN LOWER(device_name) LIKE '%grid%' THEN 'grid'
          WHEN LOWER(device_name) LIKE '%solar%' THEN 'solar'
          WHEN LOWER(device_name) LIKE '%genset%' OR LOWER(device_name) LIKE '%generator%' THEN 'genset'
          ELSE 'unknown'
        END as device_type
      FROM public.lwn_adw300_data 
      ORDER BY device_name
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get historical data for charts
  async getHistoricalData(type, hours = 24) {
    const query = `
      SELECT 
        timestamp,
        AVG(ua) as avg_ua, AVG(ub) as avg_ub, AVG(uc) as avg_uc,
        SUM(ia) as sum_ia, SUM(ib) as sum_ib, SUM(ic) as sum_ic,
        SUM(p) as sum_p,
        device_name
      FROM public.lwn_adw300_data 
      WHERE LOWER(device_name) LIKE $1
        AND timestamp >= NOW() - INTERVAL '${parseInt(hours)} hours'
      GROUP BY timestamp, device_name
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    
    const typePattern = `%${type}%`;
    const result = await pool.query(query, [typePattern]);
    return result.rows;
  }

  // Get latest data for a specific device
  async getDeviceLatestData(devEui) {
    const query = `
      SELECT * FROM public.lwn_adw300_data 
      WHERE dev_eui = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [devEui]);
    return result.rows[0] || null;
  }

  // Process raw device data into formatted structure
  processDeviceData(row) {
    const parsedData = this.parseDeviceData(row.data);
    
    return {
      id: row.dev_eui,
      name: row.device_name,
      voltageA: parsedData.Ua || row.ua || 0,
      voltageB: parsedData.Ub || row.ub || 0,
      voltageC: parsedData.Uc || row.uc || 0,
      currentA: parsedData.Ia || row.ia || 0,
      currentB: parsedData.Ib || row.ib || 0,
      currentC: parsedData.Ic || row.ic || 0,
      totalPower: parsedData.P || row.p || 0,
      reactivePower: parsedData.Q || row.q || 0,
      apparentPower: parsedData.S || row.s || 0,
      totalEnergy: parsedData.EP || row.ep || 0,
      importedEnergy: parsedData.EPI || row.epi || 0,
      exportedEnergy: parsedData.EPE || row.epe || 0,
      powerFactor: parsedData.Pf || 0,
      timestamp: row.timestamp
    };
  }

  // Calculate combined data for multiple devices
  calculateCombinedData(devices) {
    if (devices.length === 0) {
      return {
        voltageA: 0, voltageB: 0, voltageC: 0,
        currentA: 0, currentB: 0, currentC: 0,
        totalPower: 0, totalEnergy: 0
      };
    }

    const processedDevices = devices.map(device => this.processDeviceData(device));
    
    let totalVoltageA = 0, totalVoltageB = 0, totalVoltageC = 0;
    let totalCurrentA = 0, totalCurrentB = 0, totalCurrentC = 0;
    let totalPower = 0, totalEnergy = 0;

    processedDevices.forEach(device => {
      totalVoltageA += device.voltageA;
      totalVoltageB += device.voltageB;
      totalVoltageC += device.voltageC;
      totalCurrentA += device.currentA;
      totalCurrentB += device.currentB;
      totalCurrentC += device.currentC;
      totalPower += device.totalPower;
      totalEnergy += device.totalEnergy;
    });

    const deviceCount = processedDevices.length;
    
    return {
      voltageA: deviceCount > 0 ? totalVoltageA / deviceCount : 0,
      voltageB: deviceCount > 0 ? totalVoltageB / deviceCount : 0,
      voltageC: deviceCount > 0 ? totalVoltageC / deviceCount : 0,
      currentA: totalCurrentA,
      currentB: totalCurrentB,
      currentC: totalCurrentC,
      totalPower: totalPower,
      totalEnergy: totalEnergy,
      meters: processedDevices
    };
  }

  // Get detailed device information
  getDetailedDeviceInfo(row) {
    const parsedData = this.parseDeviceData(row.data);
    
    return {
      devEui: row.dev_eui,
      deviceName: row.device_name,
      timestamp: row.timestamp,
      voltage: {
        phaseA: parsedData.Ua || row.ua || 0,
        phaseB: parsedData.Ub || row.ub || 0,
        phaseC: parsedData.Uc || row.uc || 0,
        lineToLine: {
          ab: parsedData.Uab || 0,
          bc: parsedData.Ubc || 0,
          ca: parsedData.Uca || 0
        }
      },
      current: {
        phaseA: parsedData.Ia || row.ia || 0,
        phaseB: parsedData.Ib || row.ib || 0,
        phaseC: parsedData.Ic || row.ic || 0
      },
      power: {
        active: {
          total: parsedData.P || row.p || 0,
          phaseA: parsedData.Pa || 0,
          phaseB: parsedData.Pb || 0,
          phaseC: parsedData.Pc || 0
        },
        reactive: {
          total: parsedData.Q || row.q || 0,
          phaseA: parsedData.Qa || 0,
          phaseB: parsedData.Qb || 0,
          phaseC: parsedData.Qc || 0
        },
        apparent: {
          total: parsedData.S || row.s || 0,
          phaseA: parsedData.Sa || 0,
          phaseB: parsedData.Sb || 0,
          phaseC: parsedData.Sc || 0
        }
      },
      energy: {
        total: parsedData.EP || row.ep || 0,
        imported: parsedData.EPI || row.epi || 0,
        exported: parsedData.EPE || row.epe || 0,
        phaseA: {
          imported: parsedData.EPIa || 0,
          exported: parsedData.EPEa || 0
        },
        phaseB: {
          imported: parsedData.EPIb || 0,
          exported: parsedData.EPEb || 0
        }
      },
      powerFactor: {
        total: parsedData.Pf || 0,
        phaseA: parsedData.Pfa || 0,
        phaseB: parsedData.Pfb || 0,
        phaseC: parsedData.Pfc || 0
      },
      frequency: parsedData.F || 0,
      temperature: parsedData.TempN || 0,
      digitalInputs: {
        DI1: parsedData.DI1 || 0,
        DI2: parsedData.DI2 || 0,
        DI3: parsedData.DI3 || 0,
        DI4: parsedData.DI4 || 0
      },
      rawData: parsedData
    };
  }

  // Close database connection
  async close() {
    await pool.end();
  }
}

module.exports = EnergyModel;