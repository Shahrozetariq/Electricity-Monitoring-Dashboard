const express = require('express');
const router = express.Router();
const metersController = require('../controllers/metersController');

router.get('/', metersController.getAllMeters);
router.get('/:id', metersController.getMeterById);
router.post('/', metersController.createMeter);
router.put('/:id', metersController.updateMeter);
router.delete('/:id', metersController.deleteMeter);

module.exports = router;
