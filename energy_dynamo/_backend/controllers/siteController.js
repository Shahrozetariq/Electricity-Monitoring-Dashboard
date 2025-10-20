const pool = require("../config/database");

// 1) Get all sites
async function getSites(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, dev_eui FROM hsp_sites ORDER BY id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sites" });
  }
}

// 2) Latest snapshot
async function getCurrent(req, res) {
  try {
    const siteId = req.params.id;
    const site = await pool.query(`SELECT dev_eui FROM hsp_sites WHERE id=$1`, [siteId]);
    if (site.rowCount === 0) return res.status(404).json({ error: "Site not found" });

    const devEui = site.rows[0].dev_eui;
    const { rows } = await pool.query(
      `SELECT * FROM hsp_adw300_data WHERE dev_eui=$1 ORDER BY received_at DESC LIMIT 1`,
      [devEui]
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch current data" });
  }
}

// 3) Aggregated consumption
async function getConsumption(req, res) {
    console.log(req)
    console.log(res)
  const { id } = req.params;
  const { period, from, to } = req.query;

  try {
    const site = await pool.query(`SELECT dev_eui FROM hsp_sites WHERE id=$1`, [id]);
    if (site.rowCount === 0) return res.status(404).json({ error: "Site not found" });

    const devEui = site.rows[0].dev_eui;
    let sql, params;

    if (from && to) {
      sql = `
        SELECT date_trunc('day', received_at) as ts, 
               MAX(energy_import)-MIN(energy_import) as kwh
        FROM hsp_adw300_data
        WHERE dev_eui = $1 AND received_at BETWEEN $2 AND $3
        GROUP BY 1 ORDER BY 1`;
      params = [devEui, from, to];
    } else if (period === "daily") {
      sql = `
        SELECT date_trunc('hour', received_at) as ts, 
               MAX(energy_import)-MIN(energy_import) as kwh
        FROM hsp_adw300_data
        WHERE dev_eui=$1 AND received_at::date = CURRENT_DATE
        GROUP BY 1 ORDER BY 1`;
      params = [devEui];
    } else if (period === "weekly") {
      sql = `
        SELECT date_trunc('day', received_at) as ts, 
               MAX(energy_import)-MIN(energy_import) as kwh
        FROM hsp_adw300_data
        WHERE dev_eui=$1 AND received_at >= date_trunc('week', CURRENT_DATE)
        GROUP BY 1 ORDER BY 1`;
      params = [devEui];
    } else if (period === "monthly") {
      sql = `
        SELECT date_trunc('day', received_at) as ts, 
               MAX(energy_import)-MIN(energy_import) as kwh
        FROM hsp_adw300_data
        WHERE dev_eui=$1 AND received_at >= date_trunc('month', CURRENT_DATE)
        GROUP BY 1 ORDER BY 1`;
      params = [devEui];
    } else {
      return res.status(400).json({ error: "Invalid period or missing date range" });
    }

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch consumption" });
  }
}


// 4) Trend data
async function getTrend(req, res) {
  const { id } = req.params;
  const { view, from, to } = req.query;

  try {
    const site = await pool.query(`SELECT dev_eui FROM hsp_sites WHERE id=$1`, [id]);
    if (site.rowCount === 0) return res.status(404).json({ error: "Site not found" });

    const devEui = site.rows[0].dev_eui;
    let sql, params;

    if (from && to) {
      sql = `
        SELECT date_trunc('day', received_at) as label, 
               MAX(energy_import)-MIN(energy_import) as value
        FROM hsp_adw300_data
        WHERE dev_eui=$1 AND received_at BETWEEN $2 AND $3
        GROUP BY 1 ORDER BY 1`;
      params = [devEui, from, to];
    } else if (view === "daily") {
      sql = `WITH hours AS (
    SELECT generate_series(
        date_trunc('day', now()),                -- today 00:00
        date_trunc('day', now()) + interval '23 hour',  -- today 23:00
        interval '1 hour'
    ) AS label
),
energy AS (
    SELECT date_trunc('hour', received_at) AS label,
           MAX(energy_import) - MIN(energy_import) AS value
    FROM hsp_adw300_data
    WHERE dev_eui = $1
      AND received_at::date = CURRENT_DATE
    GROUP BY 1
)
SELECT h.label, e.value
FROM hours h
LEFT JOIN energy e ON h.label = e.label
ORDER BY h.label`;
        
      params = [devEui];
    } else if (view === "monthly") {
      sql = `
        SELECT date_trunc('day', received_at) as label, 
               MAX(energy_import)-MIN(energy_import) as value
        FROM hsp_adw300_data
        WHERE dev_eui=$1 AND received_at >= date_trunc('month', CURRENT_DATE)
        GROUP BY 1 ORDER BY 1`;
      params = [devEui];
    } else if (view === "yearly") {
      sql = `
        SELECT date_trunc('month', received_at) as label, 
               MAX(energy_import)-MIN(energy_import) as value
        FROM hsp_adw300_data
        WHERE dev_eui=$1 AND received_at >= date_trunc('year', CURRENT_DATE)
        GROUP BY 1 ORDER BY 1`;
      params = [devEui];
    } else {
      return res.status(400).json({ error: "Invalid view or missing date range" });
    }

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trend data" });
  }
}

async function getConsumptionSummary(req, res) {
  const { id } = req.params;

  try {
    let devEuis = [];

    if (id.toLowerCase() === "all") {
      // Fetch all device EUIs
      const result = await pool.query(`SELECT dev_eui FROM hsp_sites`);
      devEuis = result.rows.map(r => r.dev_eui);
      if (devEuis.length === 0) return res.status(404).json({ error: "No sites found" });
    } else {
      // Single site
      const site = await pool.query(`SELECT dev_eui FROM hsp_sites WHERE id=$1`, [id]);
      if (site.rowCount === 0) return res.status(404).json({ error: "Site not found" });
      devEuis = [site.rows[0].dev_eui];
    }

    const [daily, weekly, monthly] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(value::numeric), 0) as total
         FROM hourly_energy_import
         WHERE dev_eui = ANY($1)
           AND (label::timestamp)::date = CURRENT_DATE`,
        [devEuis]
      ),
      pool.query(
        `SELECT COALESCE(SUM(value::numeric), 0) as total
         FROM hourly_energy_import
         WHERE dev_eui = ANY($1)
           AND (label::timestamp)::date >= date_trunc('week', CURRENT_DATE)`,
        [devEuis]
      ),
      pool.query(
        `SELECT COALESCE(SUM(value::numeric), 0) as total
         FROM hourly_energy_import
         WHERE dev_eui = ANY($1)
           AND (label::timestamp)::date >= date_trunc('month', CURRENT_DATE)`,
        [devEuis]
      )
    ]);

    res.json({
      daily: daily.rows[0].total,
      weekly: weekly.rows[0].total,
      monthly: monthly.rows[0].total
    });
  } catch (err) {
    console.error("Error in getConsumptionSummary:", err);
    res.status(500).json({ error: "Failed to fetch consumption summary" });
  }
}

module.exports = { getSites, getCurrent, getConsumption, getTrend, getConsumptionSummary };
