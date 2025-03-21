const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Database connection

// API Endpoint: Get combined consumption for all energy sources in the last hour
router.get("/", async (req, res) => {
    const query = `
    SELECT 
      energy_source,
      SUM(energy_value) AS total_consumption
    FROM 
      hourly_consumption_source
    WHERE 
      hour >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    GROUP BY 
      energy_source
    ORDER BY 
      total_consumption DESC;
  `;

    try {
        const [rows] = await db.query(query); // Execute the query
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching combined energy source consumption:", error.message);
        res.status(500).json({ message: "Error fetching combined energy source consumption" });
    }
});

module.exports = router;
