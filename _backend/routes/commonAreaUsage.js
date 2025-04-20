// routes/commonAreaUsage.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/commonAreaUsageController');

console.log('commonAreaUsage.js');
router.get('/', controller.getAllUsage);

module.exports = router;
