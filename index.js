const express = require('express');
const cors = require('cors');
const pool = require('./db');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (carpeta build)
app.use(express.static(path.join(__dirname, 'build')));

// Rutas para vehiculos
app.get('/vehiculos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehiculos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

app.post('/vehiculos', async (req, res) => {
  const { marca, modelo, anio, color, estado, propietario, ubicacion, estado_proceso, precio } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehiculos (marca, modelo, anio, color, estado, propietario, ubicacion, estado_proceso, precio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [marca, modelo, anio, color, estado, propietario, ubicacion, estado_proceso, precio]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar vehículo');
  }
});

app.put('/vehiculos/:id', async (req, res) => {
  const { id } = req.params;
  const { ubicacion, estado_proceso, vendido } = req.body;
  try {
    const result = await pool.query(
      'UPDATE vehiculos SET ubicacion = $1, estado_proceso = $2, vendido = $3 WHERE id_vehiculo = $4 RETURNING *',
      [ubicacion, estado_proceso, vendido, id]
    );
    if (result.rows.length === 0) return res.status(404).send('Vehículo no encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar vehículo');
  }
});

// Rutas para revisiones
app.get('/revisiones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM revisiones');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

app.post('/revisiones', async (req, res) => {
  const { id_vehiculo, tipo, fecha_ingreso, fecha_salida, ubicacion, costo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO revisiones (id_vehiculo, tipo, fecha_ingreso, fecha_salida, ubicacion, costo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id_vehiculo, tipo, fecha_ingreso, fecha_salida, ubicacion, costo]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar revisión');
  }
});

app.put('/revisiones/:id', async (req, res) => {
  const { id } = req.params;
  const { fecha_salida } = req.body;
  try {
    const result = await pool.query(
      'UPDATE revisiones SET fecha_salida = $1 WHERE id_revision = $2 RETURNING *',
      [fecha_salida, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar revisión');
  }
});

// Rutas para turnos
app.get('/turnos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM turnos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

app.post('/turnos', async (req, res) => {
  const { id_vehiculo, tipo, fecha, ubicacion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO turnos (id_vehiculo, tipo, fecha, ubicacion) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_vehiculo, tipo, fecha, ubicacion]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar turno');
  }
});

app.delete('/turnos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM turnos WHERE id_turno = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).send('Turno no encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar turno');
  }
});

// Fallback para el frontend (después de todas las rutas de la API)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});