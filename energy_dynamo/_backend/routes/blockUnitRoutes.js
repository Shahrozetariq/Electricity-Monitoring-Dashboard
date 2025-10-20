// routes/blockUnitRoutes.js
const express = require('express');
const router = express.Router();
const {
  createBlock,
  getBlocks,
  updateBlock,
  deleteBlock,
  createUnit,
  getUnits,
  updateUnit,
  deleteUnit,
} = require('../controllers/blockUnitController');

// BLOCKS
router.post('/blocks', createBlock);
router.get('/blocks', getBlocks);
router.put('/blocks/:id', updateBlock);
router.delete('/blocks/:id', deleteBlock);

// UNITS
router.post('/units', createUnit);
router.get('/units', getUnits);
router.put('/units/:id', updateUnit);
router.delete('/units/:id', deleteUnit);

module.exports = router;
