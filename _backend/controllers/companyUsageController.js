const db = require('../config/db');

const getCompanyUsage = async (req, res) => {
    console.log("Fetching company usage data...");
    // Check if the user is authenticated and has the required role
    try {
        const [rows] = await db.query(`
        SELECT 
            c.company_name,
            ROUND(SUM(CASE WHEN m.meter_type = 1 THEN CAST(latest._VALUE AS DECIMAL(10,2)) - CAST(start._VALUE AS DECIMAL(10,2)) ELSE 0 END), 2) AS utility_consumption,
            ROUND(SUM(CASE WHEN m.meter_type = 4 THEN CAST(latest._VALUE AS DECIMAL(10,2)) - CAST(start._VALUE AS DECIMAL(10,2)) ELSE 0 END), 2) AS hvac_consumption,
            ROUND(SUM(CAST(latest._VALUE AS DECIMAL(10,2)) - CAST(start._VALUE AS DECIMAL(10,2))), 2) AS total_consumption
        FROM 
            meters m
        JOIN 
            companies c ON m.company_id = c.company_id
        JOIN (
            SELECT _NUMERICID, _VALUE
            FROM meter_readings_20min r1
            WHERE (_TIMESTAMP, _NUMERICID) IN (
            SELECT MAX(_TIMESTAMP), _NUMERICID
            FROM meter_readings_20min
            GROUP BY _NUMERICID
            )
            ) latest ON latest._NUMERICID = m.meter_id
        JOIN (
            SELECT _NUMERICID, _VALUE
            FROM meter_readings_20min r2
            WHERE (_TIMESTAMP, _NUMERICID) IN (
            SELECT MIN(_TIMESTAMP), _NUMERICID
            FROM meter_readings_20min
            WHERE _TIMESTAMP >= DATE_FORMAT(NOW(), '%Y-%m-01')
            GROUP BY _NUMERICID
        )
        ) start ON start._NUMERICID = m.meter_id
        WHERE 
            latest._VALUE REGEXP '^[0-9]+(\\.[0-9]+)?$'
            AND start._VALUE REGEXP '^[0-9]+(\\.[0-9]+)?$'
        GROUP BY c.company_name;

    `);

        res.json(rows);
    } catch (err) {
        console.error("Error fetching company usage data:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { getCompanyUsage };
