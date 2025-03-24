const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Database connection

// API Endpoint: Get combined consumption for all energy sources, including zeros if no data is found
router.get("/", async (req, res) => {
  // Get the 'hours' query parameter from the request, defaulting to 1 hour if not provided
  const hours = req.query.hours || 1;

  // Validate that the 'hours' parameter is a valid number
  if (isNaN(hours)) {
    return res.status(400).json({ message: "Invalid 'hours' parameter. Must be a number." });
  }

  // Construct the SQL query with a dynamic interval based on the 'hours' parameter
  const query = `
        SELECT 
            es.energy_source_name AS energy_source,
            IFNULL(SUM(hcs.energy_value), 0) AS total_consumption
        FROM 
            energy_sources es
        LEFT JOIN 
            hourly_consumption_source hcs ON es.energy_source_name = hcs.energy_source 
            AND hcs.hour >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        GROUP BY 
            es.energy_source_name
        ORDER BY 
            total_consumption DESC;
    `;
  console.log("Combined energy source consumption fetched successfully");
  try {
    // Execute the query with the dynamic interval
    const [rows] = await db.query(query, [hours]);


    res.status(200).json(rows); // Return combined results
  } catch (error) {
    console.error("Error fetching combined energy source consumption:", error.message);
    res.status(500).json({ message: "Error fetching combined energy source consumption" });
  }
});

module.exports = router;