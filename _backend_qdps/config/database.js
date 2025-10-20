const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'kepserver',
  host: process.env.DB_HOST || '182.180.69.171',
  database: process.env.DB_NAME || 'ems_db',
  password: process.env.DB_PASSWORD || 'P@ss.kep.786',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', (client) => {
  client.query(`SET TIME ZONE 'Asia/Karachi'`);
});

module.exports = pool;