CREATE TABLE vehiculos (
  id_vehiculo SERIAL PRIMARY KEY,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(50) NOT NULL,
  anio INT NOT NULL,
  color VARCHAR(20) NOT NULL,
  estado VARCHAR(10) CHECK (estado IN ('Nuevo', 'Usado')),
  propietario VARCHAR(10) CHECK (propietario IN ('Agencia', 'Otros')),
  ubicacion VARCHAR(20) CHECK (ubicacion IN ('Agencia', 'Taller', 'Chapista')),
  estado_proceso VARCHAR(20) CHECK (estado_proceso IN ('Listo para entrega', 'En taller', 'En chapista')),
  vendido BOOLEAN DEFAULT FALSE,
  precio DECIMAL(15, 2) NOT NULL
);

CREATE TABLE historial_vendidos (
  id_historial SERIAL PRIMARY KEY,
  id_vehiculo INT REFERENCES vehiculos(id_vehiculo),
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(50) NOT NULL,
  anio INT NOT NULL,
  color VARCHAR(20) NOT NULL,
  estado VARCHAR(10) CHECK (estado IN ('Nuevo', 'Usado')),
  propietario VARCHAR(10) CHECK (propietario IN ('Agencia', 'Otros')),
  fecha_venta TIMESTAMP NOT NULL,
  precio DECIMAL(15, 2) NOT NULL
);

CREATE TABLE revisiones (
  id_revision SERIAL PRIMARY KEY,
  id_vehiculo INT REFERENCES vehiculos(id_vehiculo),
  tipo VARCHAR(100) NOT NULL,
  fecha_ingreso TIMESTAMP NOT NULL,
  fecha_salida TIMESTAMP,
  ubicacion VARCHAR(20) CHECK (ubicacion IN ('Taller', 'Chapista')),
  costo DECIMAL(15, 2) NOT NULL
);

CREATE TABLE turnos (
  id_turno SERIAL PRIMARY KEY,
  id_vehiculo INT REFERENCES vehiculos(id_vehiculo),
  tipo VARCHAR(100) NOT NULL,
  fecha TIMESTAMP NOT NULL,
  ubicacion VARCHAR(20) CHECK (ubicacion IN ('Taller', 'Chapista'))
);

INSERT INTO vehiculos (marca, modelo, anio, color, estado, propietario, ubicacion, estado_proceso, precio) VALUES
('Ford', 'Fiesta', 2019, 'Azul', 'Usado', 'Otros', 'Taller', 'En taller', 12000.00),
('Toyota', 'Corolla', 2020, 'Rojo', 'Usado', 'Agencia', 'Agencia', 'Listo para entrega', 18000.00);

INSERT INTO revisiones (id_vehiculo, tipo, fecha_ingreso, fecha_salida, ubicacion, costo) VALUES
(1, 'Service completo', '2025-02-01 10:00:00', '2025-02-03 14:00:00', 'Taller', 500.00);

INSERT INTO turnos (id_vehiculo, tipo, fecha, ubicacion) VALUES
(1, 'Service básico', '2025-02-07 10:00:00', 'Taller');

