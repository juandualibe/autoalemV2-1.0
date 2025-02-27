const express = require('express');
const cors = require('cors');
const pool = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'x7K9pQ2mW8rT5vY3nJ6bL4zA1cF0eH';

app.use(cors());
app.use(express.json());

// Middleware para verificar token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

// Ruta de login con bcrypt
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Intento de login:', { username, password });
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign({ id: user.id_usuario, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Rutas protegidas
app.get('/vehiculos', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehiculos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/vehiculos', authenticateToken, async (req, res) => {
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
    res.status(500).json({ error: 'Error al agregar vehículo' });
  }
});

app.put('/vehiculos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { ubicacion, estado_proceso, vendido, costo } = req.body;
  try {
    const oldVehiculo = await pool.query('SELECT * FROM vehiculos WHERE id_vehiculo = $1', [id]);
    const oldUbicacion = oldVehiculo.rows[0].ubicacion;

    const result = await pool.query(
      'UPDATE vehiculos SET ubicacion = $1, estado_proceso = $2, vendido = $3 WHERE id_vehiculo = $4 RETURNING *',
      [ubicacion, estado_proceso, vendido, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });
    const vehiculo = result.rows[0];

    if (ubicacion === 'Agencia' && (oldUbicacion === 'Taller' || oldUbicacion === 'Chapista')) {
      await pool.query(
        'UPDATE revisiones SET fecha_salida = $1 WHERE id_vehiculo = $2 AND fecha_salida IS NULL',
        [new Date().toISOString(), id]
      );
    } else if ((ubicacion === 'Taller' || ubicacion === 'Chapista') && oldUbicacion !== ubicacion) {
      await pool.query(
        'INSERT INTO revisiones (id_vehiculo, tipo, fecha_ingreso, ubicacion, costo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, 'Revisión inicial', new Date().toISOString(), ubicacion, costo || 0]
      );
    }

    res.json(vehiculo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar vehículo' });
  }
});

app.get('/revisiones', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM revisiones');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/revisiones', authenticateToken, async (req, res) => {
  const { id_vehiculo, tipo, fecha_ingreso, fecha_salida, ubicacion, costo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO revisiones (id_vehiculo, tipo, fecha_ingreso, fecha_salida, ubicacion, costo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id_vehiculo, tipo, fecha_ingreso, fecha_salida, ubicacion, costo]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar revisión' });
  }
});

app.put('/revisiones/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { fecha_salida, nuevaUbicacion, costo } = req.body;
  try {
    const revision = await pool.query('SELECT * FROM revisiones WHERE id_revision = $1', [id]);
    const vehiculoId = revision.rows[0].id_vehiculo;

    const result = await pool.query(
      'UPDATE revisiones SET fecha_salida = $1 WHERE id_revision = $2 RETURNING *',
      [fecha_salida, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Revisión no encontrada' });

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
    res.status(500).json({ error: 'Error al actualizar revisión' });
  }
});

app.get('/turnos', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM turnos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/turnos', authenticateToken, async (req, res) => {
  const { id_vehiculo, tipo, fecha, ubicacion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO turnos (id_vehiculo, tipo, fecha, ubicacion) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_vehiculo, tipo, fecha, ubicacion]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar turno' });
  }
});

app.delete('/turnos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM turnos WHERE id_turno = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
});

// Servir frontend estático desde la carpeta build
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'), (err) => {
    if (err) {
      res.status(500).json({ error: 'Error al servir el frontend' });
    }
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});