// controllers/meterController.js
const db = require('../db/connection');




// Get all meters
const getAllMeterReadings = async (req, res) => {
  console.log("all meters");
  try {
      const [rows] = await db.execute('SELECT * FROM meters');
      
          
      // Send only the rows as the response
      res.json(rows);  // Send only the meter readings as JSON
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

// Get a single meter by ID
const getMeterReadingsByID = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM meters WHERE meter_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Meter not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new meter
const addMeter = async (req, res) => {
    try {
        const { meter_name, meter_type, energy_source_id, company_id, block_id } = req.body;
        const [result] = await db.execute(
            'INSERT INTO meters (meter_name, meter_type, energy_source_id, company_id, block_id) VALUES (?, ?, ?, ?, ?)',
            [meter_name, meter_type, energy_source_id, company_id, block_id]
        );
        res.status(201).json({ meter_id: result.insertId, meter_name, meter_type, energy_source_id, company_id, block_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a meter by ID
const updateMeterByID = async (req, res) => {
    try {
        const { meter_name, meter_type, energy_source_id, company_id, block_id } = req.body;
        const [result] = await db.execute(
            'UPDATE meters SET meter_name = ?, meter_type = ?, energy_source_id = ?, company_id = ?, block_id = ? WHERE meter_id = ?',
            [meter_name, meter_type, energy_source_id, company_id, block_id, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Meter not found' });
        res.json({ meter_id: req.params.id, meter_name, meter_type, energy_source_id, company_id, block_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a meter by ID
const deleteMeterByID = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM meters WHERE meter_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Meter not found' });
        res.json({ message: 'Meter deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// Add more functions as needed for other meter-related operations

module.exports = {
  // getMeterReadings,
  getAllMeterReadings,
  getMeterReadingsByID,
  addMeter,
  updateMeterByID,
  deleteMeterByID
};
