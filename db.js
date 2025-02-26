const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'juandualibe',  // Nombre de usuario de la base de datos
  host: process.env.DB_HOST || 'dpg-cuv8rea3esus73bmp970-a.oregon-postgres.render.com',  // Host de la base de datos en Render
  database: process.env.DB_DATABASE || 'autoalem_y4oq',  // Nombre de la base de datos
  password: process.env.DB_PASSWORD || 'DmtN2NvvZaOgpEcIwq9a8Kq1mBEm16Zy',  // Contraseña de la base de datos
  port: process.env.DB_PORT || 5432,  // Puerto de conexión (5432 es el predeterminado de PostgreSQL)
  ssl: {
    rejectUnauthorized: false,  // Desactivar la verificación del certificado (si es necesario)
  },
});

module.exports = pool;
