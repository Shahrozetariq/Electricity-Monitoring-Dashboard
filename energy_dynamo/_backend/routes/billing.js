// routes/billing.js
const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');

// Get all unique device names
router.get('/device-names', BillingController.getDeviceNames);

// Get meters for a specific device
router.get('/devices/:deviceName/meters', BillingController.getMetersForDevice);

// Get meter data for specific meters and date range
router.post('/meters/data', BillingController.getMeterData);

// Get daily aggregated data for charts
router.post('/meters/daily-data', BillingController.getDailyAggregatedData);

// Get meter summary for selected meters
router.post('/meters/summary', BillingController.getMeterSummary);

// Get historical monthly data for last 6 months
router.post('/meters/monthly-history', BillingController.getMonthlyHistoricalData);

// Generate bill calculation data
router.post('/generate-bill', BillingController.generateBillData);

module.exports = router;