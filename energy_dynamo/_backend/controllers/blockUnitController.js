// controllers/blockUnitController.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'kepserver',
  host: process.env.DB_HOST || '182.180.69.171',
  database: process.env.DB_NAME || 'ems_db',
  password: process.env.DB_PASSWORD || 'P@ss.kep.786',
  port: process.env.DB_PORT || 5432,
});

//
// 🧱 BLOCKS CRUD
//

// Create block
exports.createBlock = async (req, res) => {
  const { block_name } = req.body;
  if (!block_name) return res.status(400).json({ error: 'block_name required' });

  try {
    const result = await pool.query(
      `INSERT INTO lwn_blocks (block_name)
       VALUES ($1)
       ON CONFLICT (block_name) DO NOTHING
       RETURNING *`,
      [block_name]
    );
    if (result.rowCount === 0) return res.json({ message: 'Block already exists' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating block:', err);
    res.status(500).json({ error: 'Failed to create block' });
  }
};

// Get all blocks
exports.getBlocks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lwn_blocks ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching blocks:', err);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
};

// Update block name
exports.updateBlock = async (req, res) => {
  const { id } = req.params;
  const { block_name } = req.body;
  if (!block_name) return res.status(400).json({ error: 'block_name required' });

  try {
    const result = await pool.query(
      `UPDATE lwn_blocks SET block_name=$1 WHERE id=$2 RETURNING *`,
      [block_name, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Block not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating block:', err);
    res.status(500).json({ error: 'Failed to update block' });
  }
};

// Delete block
exports.deleteBlock = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lwn_blocks WHERE id=$1', [id]);
    res.json({ message: 'Block deleted' });
  } catch (err) {
    console.error('Error deleting block:', err);
    res.status(500).json({ error: 'Failed to delete block' });
  }
};

//
// 🏠 UNITS CRUD
//

// Create or update unit
exports.createUnit = async (req, res) => {
  const { unit_name, block_id, dev_eui } = req.body;
  if (!unit_name || !block_id || !dev_eui)
    return res.status(400).json({ error: 'unit_name, block_id, dev_eui required' });

  try {
    const result = await pool.query(
      `INSERT INTO lwn_units (unit_name, block_id, dev_eui)
       VALUES ($1, $2, $3)
       ON CONFLICT (unit_name, block_id) DO UPDATE SET dev_eui = EXCLUDED.dev_eui
       RETURNING *`,
      [unit_name, block_id, dev_eui]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating/updating unit:', err);
    res.status(500).json({ error: 'Failed to save unit' });
  }
};

// Get all units
exports.getUnits = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.unit_name, u.dev_eui, b.block_name, b.id AS block_id
      FROM lwn_units u
      JOIN lwn_blocks b ON u.block_id = b.id
      ORDER BY b.block_name, u.unit_name;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching units:', err);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
};

// Update unit (rename or change meter)
exports.updateUnit = async (req, res) => {
  const { id } = req.params;
  const { unit_name, dev_eui } = req.body;
  try {
    const result = await pool.query(
      `UPDATE lwn_units SET unit_name=$1, dev_eui=$2 WHERE id=$3 RETURNING *`,
      [unit_name, dev_eui, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Unit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating unit:', err);
    res.status(500).json({ error: 'Failed to update unit' });
  }
};

// Delete unit
exports.deleteUnit = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lwn_units WHERE id=$1', [id]);
    res.json({ message: 'Unit deleted' });
  } catch (err) {
    console.error('Error deleting unit:', err);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
};
