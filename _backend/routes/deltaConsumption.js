const express = require('express');
const router = express.Router();
const db = require("../config/db"); // Database connection

// API: Get combined consumption of each block for the respective time period
router.get('/', async (req, res) => {
    const hours = req.query.hours || 1; // Default to 1 hour if not provided

    try {
        // SQL query to fetch combined consumption grouped by block_id
        const query = `
            SELECT 
                m.block_id,
                SUM(hc.energy_value) AS total_consumption
            FROM 
                meters m
            JOIN 
                hourly_consumption_source hc ON m.meter_id = hc.meter_id
            WHERE 
                m.meter_type = 2
            AND 
                hc.hour >= NOW() - INTERVAL ? HOUR
            GROUP BY 
                m.block_id
            ORDER BY 
                m.block_id ASC;
        `;

        const [rows] = await db.query(query, [hours]); // Execute the query
        res.status(200).json(rows); // Return the result as JSON
    } catch (error) {
        console.error('Error fetching combined block consumption:', error);
        res.status(500).json({ message: 'Failed to fetch combined block consumption', error });
    }
});

module.exports = router;