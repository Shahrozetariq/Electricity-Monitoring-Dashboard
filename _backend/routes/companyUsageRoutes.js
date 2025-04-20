// routes/companyUsageRoutes.js
const express = require('express');
const router = express.Router();
const { getCompanyUsage } = require('../controllers/companyUsageController');

// Define the route for fetching company usage
router.get('/', getCompanyUsage);

module.exports = router;
