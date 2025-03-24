// routes/metertypeRoutes.js
const express = require('express');
const router = express.Router();
const { getAllMeterTypes, getMeterTypeById, addMeterType, updateMeterType, deleteMeterType } = require('../controllers/metertypeController');

// CRUD Routes
router.get('/', getAllMeterTypes);                 // Get all meter types
router.get('/:id', getMeterTypeById);              // Get meter type by ID
router.post('/', addMeterType);                    // Add a new meter type
router.put('/:id', updateMeterType);               // Update a meter type by ID
router.delete('/:id', deleteMeterType);            // Delete a meter type by ID

module.exports = router;
