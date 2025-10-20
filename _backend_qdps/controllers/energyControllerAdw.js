// controllers/energyController.js
const EnergyModel = require('../models/energyModel');

class EnergyController {
  constructor() {
    this.energyModel = new EnergyModel();
  }

  // Get combined energy data for a specific type (grid, solar, genset)
  async getCombinedEnergyData(req, res) {
    try {
      const { type } = req.params;
      
      // Validate type parameter
      if (!['grid', 'solar', 'genset'].includes(type.toLowerCase())) {
        return res.status(400).json({ 
          error: 'Invalid type. Must be one of: grid, solar, genset' 
        });
      }

      const devices = await this.energyModel.getDevicesByType(type);
      const combinedData = this.energyModel.calculateCombinedData(devices);
      
      res.json({
        success: true,
        type: type,
        deviceCount: devices.length,
        combined: {
          voltageA: combinedData.voltageA,
          voltageB: combinedData.voltageB,
          voltageC: combinedData.voltageC,
          currentA: combinedData.currentA,
          currentB: combinedData.currentB,
          currentC: combinedData.currentC,
          totalPower: combinedData.totalPower,
          totalEnergy: combinedData.totalEnergy
        },
        meters: combinedData.meters
      });

    } catch (error) {
      console.error('Error in getCombinedEnergyData:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Get all devices
  async getAllDevices(req, res) {
    try {
      const devices = await this.energyModel.getAllDevices();
      
      res.json({
        success: true,
        count: devices.length,
        devices: devices
      });

    } catch (error) {
      console.error('Error in getAllDevices:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Get historical data for charts
  async getHistoricalData(req, res) {
    try {
      const { type } = req.params;
      const { hours = 24 } = req.query;
      
      // Validate type parameter
      if (!['grid', 'solar', 'genset'].includes(type.toLowerCase())) {
        return res.status(400).json({ 
          error: 'Invalid type. Must be one of: grid, solar, genset' 
        });
      }

      // Validate hours parameter
      const hoursInt = parseInt(hours);
      if (isNaN(hoursInt) || hoursInt <= 0 || hoursInt > 168) {
        return res.status(400).json({ 
          error: 'Invalid hours parameter. Must be between 1 and 168 (1 week)' 
        });
      }

      const historicalData = await this.energyModel.getHistoricalData(type, hoursInt);
      
      res.json({
        success: true,
        type: type,
        hours: hoursInt,
        count: historicalData.length,
        data: historicalData
      });

    } catch (error) {
      console.error('Error in getHistoricalData:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Get latest data for a specific device
  async getDeviceLatestData(req, res) {
    try {
      const { devEui } = req.params;
      
      if (!devEui) {
        return res.status(400).json({ 
          error: 'Device EUI is required' 
        });
      }

      const deviceData = await this.energyModel.getDeviceLatestData(devEui);
      
      if (!deviceData) {
        return res.status(404).json({ 
          success: false,
          error: 'Device not found' 
        });
      }

      const detailedInfo = this.energyModel.getDetailedDeviceInfo(deviceData);
      
      res.json({
        success: true,
        device: detailedInfo
      });

    } catch (error) {
      console.error('Error in getDeviceLatestData:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Get summary statistics for all device types
  async getSummaryStatistics(req, res) {
    try {
      const gridDevices = await this.energyModel.getDevicesByType('grid');
      const solarDevices = await this.energyModel.getDevicesByType('solar');
      const gensetDevices = await this.energyModel.getDevicesByType('genset');

      const gridData = this.energyModel.calculateCombinedData(gridDevices);
      const solarData = this.energyModel.calculateCombinedData(solarDevices);
      const gensetData = this.energyModel.calculateCombinedData(gensetDevices);

      const summary = {
        grid: {
          deviceCount: gridDevices.length,
          totalPower: gridData.totalPower,
          totalEnergy: gridData.totalEnergy,
          avgVoltage: (gridData.voltageA + gridData.voltageB + gridData.voltageC) / 3
        },
        solar: {
          deviceCount: solarDevices.length,
          totalPower: solarData.totalPower,
          totalEnergy: solarData.totalEnergy,
          avgVoltage: (solarData.voltageA + solarData.voltageB + solarData.voltageC) / 3
        },
        genset: {
          deviceCount: gensetDevices.length,
          totalPower: gensetData.totalPower,
          totalEnergy: gensetData.totalEnergy,
          avgVoltage: (gensetData.voltageA + gensetData.voltageB + gensetData.voltageC) / 3
        },
        overall: {
          totalDevices: gridDevices.length + solarDevices.length + gensetDevices.length,
          totalPower: gridData.totalPower + solarData.totalPower + gensetData.totalPower,
          totalEnergy: gridData.totalEnergy + solarData.totalEnergy + gensetData.totalEnergy
        }
      };

      res.json({
        success: true,
        summary: summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in getSummaryStatistics:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Get devices by status (active/inactive based on power consumption)
  async getDevicesByStatus(req, res) {
    try {
      const { status = 'all' } = req.query;
      const allDevices = await this.energyModel.getAllDevices();
      
      let filteredDevices = [];
      
      for (const device of allDevices) {
        const latestData = await this.energyModel.getDeviceLatestData(device.dev_eui);
        if (latestData) {
          const processedData = this.energyModel.processDeviceData(latestData);
          const isActive = processedData.totalPower > 0.1; // Consider active if power > 0.1 kW
          
          if (status === 'all' || 
              (status === 'active' && isActive) || 
              (status === 'inactive' && !isActive)) {
            filteredDevices.push({
              ...device,
              isActive: isActive,
              currentPower: processedData.totalPower,
              lastUpdate: latestData.timestamp
            });
          }
        }
      }

      res.json({
        success: true,
        status: status,
        count: filteredDevices.length,
        devices: filteredDevices
      });

    } catch (error) {
      console.error('Error in getDevicesByStatus:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Health check method
  async healthCheck(req, res) {
    try {
      // Test database connection
      const result = await this.energyModel.pool.query('SELECT NOW()');
      
      res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        dbTime: result.rows[0].now
      });

    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        status: 'Service Unavailable',
        timestamp: new Date().toISOString(),
        database: 'Disconnected',
        error: error.message
      });
    }
  }
}

module.exports = EnergyController;