const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 5000;

// PostgreSQL connection
const pool = new Pool({
    user: 'kepserver',
    host: '182.180.69.171',
    database: 'ems_db',
    password: 'P@ss.kep.786',
    port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json()); // This parses JSON request bodies


// Receive uplinks
app.post('/uplink', async (req, res) => {
    console.log("called", req, res)
    const uplink = req.body;
    console.log('Received:', uplink);

    const devEUI = uplink.deviceInfo.devEui;
    const deviceName = uplink.deviceInfo.deviceName;
    const timestamp = uplink.time || new Date();
    const obj = uplink.object || {};


    const dir = path.join(__dirname, 'uplinks');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    // Construct file name
    const fileName = `${deviceName}_${devEUI}_${Date.now()}.json`;
    const filePath = path.join(dir, fileName);

    // Save the raw uplink as JSON
    fs.writeFile(filePath, JSON.stringify(uplink, null, 2), (err) => {
        if (err) console.error('File Save Error:', err);
        else console.log(`Saved uplink to ${filePath}`);
    });

    try {
        await pool.query(
            `INSERT INTO energy_data 
        (dev_eui, device_name, received_at, voltage_a, current_a, active_power_a, total_energy)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                devEUI,
                deviceName,
                timestamp,
                obj.Ua || null,
                obj.Ia || null,
                obj.Pa || null,
                obj.EPI || null,
            ]
        );

        res.status(200).send('OK');
    } catch (err) {
        console.error('DB Insert Error:', err);
        res.status(500).send('DB Error');
    }
});

app.get('/latest-energy/adw300', async (req, res) => {
    try {
        const result = await pool.query(`
       SELECT device_name, total_energy
FROM (
  SELECT device_name, total_energy,
         ROW_NUMBER() OVER (PARTITION BY device_name ORDER BY id DESC) as rn
  FROM energy_data
  WHERE device_name IN ('ADW300', 'DTSD-4S') AND total_energy IS NOT NULL
) sub
WHERE rn = 1;
    `);

        if (result.rows.length > 0) {
            res.status(200).json([{ device_name: result.rows[0].device_name, total_energy: result.rows[0].total_energy.toFixed(2) }, { device_name: result.rows[1].device_name, total_energy: result.rows[1].total_energy.toFixed(2) }]);
        } else {
            res.status(404).json({ message: 'No valid total_energy found for ADW300' });
        }
    } catch (err) {
        console.error('DB Query Error:', err);
        res.status(500).send('DB Error');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
