// routes/energyRoutes.js
const express = require('express');
const EnergyController = require('../controllers/energyControllerAdw');

const router = express.Router();
const energyController = new EnergyController();

// Bind controller methods to maintain 'this' context
const getCombinedEnergyData = energyController.getCombinedEnergyData.bind(energyController);
const getAllDevices = energyController.getAllDevices.bind(energyController);
const getHistoricalData = energyController.getHistoricalData.bind(energyController);
const getDeviceLatestData = energyController.getDeviceLatestData.bind(energyController);
const getSummaryStatistics = energyController.getSummaryStatistics.bind(energyController);
const getDevicesByStatus = energyController.getDevicesByStatus.bind(energyController);
const healthCheck = energyController.healthCheck.bind(energyController);

// Energy data routes
router.get('/energy/:type', getCombinedEnergyData);
router.get('/energy/:type/history', getHistoricalData);

// Device routes
router.get('/devices', getAllDevices);
router.get('/devices/status', getDevicesByStatus);
router.get('/device/:devEui/latest', getDeviceLatestData);

// Statistics routes
router.get('/summary', getSummaryStatistics);

// Health check route
router.get('/health', healthCheck);

module.exports = router;