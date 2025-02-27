const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'juandualibe',
  host: process.env.DB_HOST || 'dpg-cuv8rea3esus73bmp970-a.oregon-postgres.render.com',
  database: process.env.DB_DATABASE || 'autoalem_y4oq',
  password: process.env.DB_PASSWORD || 'DmtN2NvvZaOgpEcIwq9a8Kq1mBEm16Zy',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : true, // Render requiere SSL
});

module.exports = pool;
