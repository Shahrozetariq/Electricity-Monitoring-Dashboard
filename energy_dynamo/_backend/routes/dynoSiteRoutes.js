const express = require('express');
const router = express.Router();
const {
    getSites,
    getCurrent,
    getConsumption,
    getTrend,
    getConsumptionSummary
} = require('../controllers/siteController');

/**
 * @route   GET /api/sites
 * @desc    Get all blocks/sites
 * @access  Public
 */
router.get('/', getSites);

/**
 * @route   GET /api/sites/:id/current
 * @desc    Get current power for a block or specific house
 * @query   house - Optional: specific house name
 * @access  Public
 */
router.get('/:id/current', getCurrent);

/**
 * @route   GET /api/sites/:id/summary
 * @desc    Get energy consumption summary (daily, weekly, monthly)
 * @query   house - Optional: specific house name
 * @access  Public
 */
router.get('/:id/summary', getConsumptionSummary);

/**
 * @route   GET /api/sites/:id/trend
 * @desc    Get trend data for charts
 * @query   view - daily, monthly, or yearly
 * @query   house - Optional: specific house name
 * @access  Public
 */
router.get('/:id/trend', getTrend);

/**
 * @route   GET /api/sites/:id/consumption
 * @desc    Get detailed consumption data within date range
 * @query   house - Optional: specific house name
 * @query   startDate - Optional: start date
 * @query   endDate - Optional: end date
 * @access  Public
 */
router.get('/:id/consumption', getConsumption);

module.exports = router;