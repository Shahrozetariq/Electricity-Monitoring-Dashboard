// controllers/commonAreaUsageController.js
const db = require('../config/db'); // your mysql2 pool

exports.getAllUsage = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM common_area_usage');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching common area usage:', err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};
