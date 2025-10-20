// controllers/deviceController.js
const pool = require('../config/database'); // using your shared PostgreSQL pool

/**
 * Fetch all devices (dev_eui) with optional block/unit mapping
 */
exports.getAllDevices = async (req, res) => {
  try {
    const query = `
      SELECT 
        d.dev_eui,
        COALESCE(b.block_name, '') AS block_name,
        COALESCE(u.unit_name, '') AS unit_name,
        u.id AS unit_id,
        b.id AS block_id
      FROM public.devices d
      LEFT JOIN public.lwn_units u ON d.dev_eui = u.dev_eui
      LEFT JOIN public.lwn_blocks b ON u.block_id = b.id
      WHERE d.dev_eui IS NOT NULL
      ORDER BY d.dev_eui;
    `;

    const result = await pool.query(query);

    res.json(
      result.rows.map((row) => ({
        meter_id: row.dev_eui,
        block_name: row.block_name,
        block_id: row.block_id,
        unit_name: row.unit_name,
        unit_id: row.unit_id,
      }))
    );
  } catch (err) {
    console.error('❌ Error fetching devices with mapping:', err);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};
