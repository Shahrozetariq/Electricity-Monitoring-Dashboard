const express = require('express');
const router = express.Router();
const energySourcesController = require('../controllers/energySourcesController');

router.get('/', energySourcesController.getAllEnergySources);
router.get('/:id', energySourcesController.getEnergySourceById);
router.post('/', energySourcesController.createEnergySource);
router.put('/:id', energySourcesController.updateEnergySource);
router.delete('/:id', energySourcesController.deleteEnergySource);

module.exports = router;
