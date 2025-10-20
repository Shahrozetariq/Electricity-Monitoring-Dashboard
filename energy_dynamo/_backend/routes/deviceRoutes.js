// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const { getAllDevices } = require('../controllers/deviceController');

// GET /api/devices
router.get('/', getAllDevices);

module.exports = router;
