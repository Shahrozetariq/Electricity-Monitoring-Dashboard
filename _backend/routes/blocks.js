const express = require('express');
const router = express.Router();
const blocksController = require('../controllers/blocksController');

router.get('/', blocksController.getAllBlocks);
router.get('/:id', blocksController.getBlockById);
router.post('/', blocksController.createBlock);
router.put('/:id', blocksController.updateBlock);
router.delete('/:id', blocksController.deleteBlock);

module.exports = router;
