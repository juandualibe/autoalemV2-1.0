const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: 'localhost',
  database: 'autoalem',
  password: process.env.DB_PASSWORD || 'root',
  port: 5432,
});

module.exports = pool;