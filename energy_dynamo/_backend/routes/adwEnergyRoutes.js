const express = require('express');
const router = express.Router();
const adwEnergyController = require('../controllers/adwEnergyController');

// GET /api/adw/energy/:type (grid | solar | genset)
router.get('/energy/:type', adwEnergyController.getEnergyByType);

// GET /api/adw/energy/all
router.get('/energy/all', adwEnergyController.getAllEnergy);

// GET /api/adw/energy/:type/history
router.get('/energy/:type/history', adwEnergyController.getEnergyHistory);

router.get('/energy/:type/daily-energy', adwEnergyController.getDailyEnergyType);
router.get('/energy/daily-energy/all', adwEnergyController.getDailyEnergyAll );

module.exports = router;
