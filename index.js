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
  const { marca, modelo, anio, color, estado, propietario, ubicacion, estado_proceso, precio, costo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehiculos (marca, modelo, anio, color, estado, propietario, ubicacion, estado_proceso, precio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [marca, modelo, anio, color, estado, propietario, ubicacion, estado_proceso, precio]
    );
    const vehiculo = result.rows[0];

    if (ubicacion === 'Taller' || ubicacion === 'Chapista') {
      await pool.query(
        'INSERT INTO revisiones (id_vehiculo, tipo, fecha_ingreso, ubicacion, costo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [vehiculo.id_vehiculo, 'Revisión inicial', new Date().toISOString(), ubicacion, costo || 0]
      );
    }

    res.json(vehiculo);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar vehículo');
  }
});

app.put('/vehiculos/:id', async (req, res) => {
  const { id } = req.params;
  const { ubicacion, estado_proceso, vendido, costo } = req.body;
  try {
    const oldVehiculo = await pool.query('SELECT * FROM vehiculos WHERE id_vehiculo = $1', [id]);
    const oldUbicacion = oldVehiculo.rows[0].ubicacion;

    const result = await pool.query(
      'UPDATE vehiculos SET ubicacion = $1, estado_proceso = $2, vendido = $3 WHERE id_vehiculo = $4 RETURNING *',
      [ubicacion, estado_proceso, vendido, id]
    );
    if (result.rows.length === 0) return res.status(404).send('Vehículo no encontrado');
    const vehiculo = result.rows[0];

    // Si la nueva ubicación es "Agencia" y estaba en "Taller" o "Chapista", finalizar revisiones activas
    if (ubicacion === 'Agencia' && (oldUbicacion === 'Taller' || oldUbicacion === 'Chapista')) {
      await pool.query(
        'UPDATE revisiones SET fecha_salida = $1 WHERE id_vehiculo = $2 AND fecha_salida IS NULL',
        [new Date().toISOString(), id]
      );
    }
    // Si la nueva ubicación es "Taller" o "Chapista" y no lo era antes, crear una revisión
    else if ((ubicacion === 'Taller' || ubicacion === 'Chapista') && oldUbicacion !== ubicacion) {
      await pool.query(
        'INSERT INTO revisiones (id_vehiculo, tipo, fecha_ingreso, ubicacion, costo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, 'Revisión inicial', new Date().toISOString(), ubicacion, costo || 0]
      );
    }

    res.json(vehiculo);
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
  const { fecha_salida, nuevaUbicacion, costo } = req.body;
  try {
    const revision = await pool.query('SELECT * FROM revisiones WHERE id_revision = $1', [id]);
    const vehiculoId = revision.rows[0].id_vehiculo;

    const result = await pool.query(
      'UPDATE revisiones SET fecha_salida = $1 WHERE id_revision = $2 RETURNING *',
      [fecha_salida, id]
    );
    if (result.rows.length === 0) return res.status(404).send('Revisión no encontrada');

    if (nuevaUbicacion) {
      const estadoProceso = nuevaUbicacion === 'Agencia' ? 'Listo para entrega' : `En ${nuevaUbicacion.toLowerCase()}`;
      await pool.query(
        'UPDATE vehiculos SET ubicacion = $1, estado_proceso = $2 WHERE id_vehiculo = $3 RETURNING *',
        [nuevaUbicacion, estadoProceso, vehiculoId]
      );
      if (nuevaUbicacion === 'Taller' || nuevaUbicacion === 'Chapista') {
        await pool.query(
          'INSERT INTO revisiones (id_vehiculo, tipo, fecha_ingreso, ubicacion, costo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [vehiculoId, 'Revisión inicial', new Date().toISOString(), nuevaUbicacion, costo || 0]
        );
      }
    }

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

// Fallback para el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});