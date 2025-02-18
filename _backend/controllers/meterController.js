// controllers/meterController.js
const db = require('../db/connection');

// Fetch the most recent meter readings
const getMeterReadings = (req, res) => {
  db.query('SELECT * FROM Meter_readings ORDER BY _TIMESTAMP DESC LIMIT 10', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results); // Send the most recent meter readings
  });
};

// Add more functions as needed for other meter-related operations

module.exports = {
  getMeterReadings
};
