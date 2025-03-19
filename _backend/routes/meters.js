const express = require('express');
const router = express.Router();
const metersController = require('../controllers/metersController');


console.log('meters.js');
router.get('/', metersController.getAllMeters);
router.get('/:id', metersController.getMeterById);
router.post('/', metersController.createMeter);
router.put('/:id', metersController.updateMeter);
router.delete('/:id', metersController.deleteMeter);
router.post("/update-from-readings", metersController.updateFromReadings);


module.exports = router;
