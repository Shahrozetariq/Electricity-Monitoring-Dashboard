// controllers/metertypeController.js
const db = require('../config/db');// Database connection

// Get all meter types
exports.getAllMeterTypes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM code_metertype');
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching meter types:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get meter type by ID
exports.getMeterTypeById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM code_metertype WHERE type_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Meter type not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error fetching meter type:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add a new meter type
exports.addMeterType = async (req, res) => {
    const { type } = req.body;
    try {
        const result = await db.query('INSERT INTO code_metertype (type) VALUES (?)', [type]);
        res.status(201).json({ message: 'Meter type added successfully', type_id: result.insertId });
    } catch (err) {
        console.error('Error adding meter type:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update a meter type by ID
exports.updateMeterType = async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;
    try {
        const result = await db.query('UPDATE code_metertype SET type = ? WHERE type_id = ?', [type, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Meter type not found' });
        }
        res.status(200).json({ message: 'Meter type updated successfully' });
    } catch (err) {
        console.error('Error updating meter type:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a meter type by ID
exports.deleteMeterType = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM code_metertype WHERE type_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Meter type not found' });
        }
        res.status(200).json({ message: 'Meter type deleted successfully' });
    } catch (err) {
        console.error('Error deleting meter type:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
